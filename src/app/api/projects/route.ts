import { type NextRequest } from "next/server";
import { jsonWithGuest, requireGuest } from "@/lib/auth";

export const maxDuration = 30;

function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function headers(key: string, extra?: HeadersInit) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
}

export async function POST(request: NextRequest) {
  const guest = requireGuest(request);
  const config = getSupabaseConfig();
  if (!config.url || !config.key) return jsonWithGuest({ ok: false, error: "persistence_not_configured" }, guest, { status: 503 });
  try {
    const body = await request.json();
    if (!body?.snapshot?.project) return jsonWithGuest({ ok: false, error: "missing_snapshot" }, guest, { status: 400 });
    const id = typeof body.id === "string" ? body.id : crypto.randomUUID();
    if (body.id) {
      const ownership = await fetch(`${config.url}/rest/v1/projects?select=id&id=eq.${encodeURIComponent(id)}&owner_guest_id=eq.${encodeURIComponent(guest.guestId)}&limit=1`, { headers: headers(config.key), cache: "no-store" });
      if (!ownership.ok || !(await ownership.json()).length) return jsonWithGuest({ ok: false, error: "project_not_owned" }, guest, { status: 403 });
    }
    const payload = { id, owner_guest_id: guest.guestId, share_token: body.shareToken || crypto.randomUUID().replaceAll("-", ""), title: String(body.snapshot.project.projectName || "未命名节目"), snapshot: body.snapshot, updated_at: new Date().toISOString() };
    const response = await fetch(`${config.url}/rest/v1/projects?on_conflict=id`, { method: "POST", headers: headers(config.key, { Prefer: "resolution=merge-duplicates,return=representation" }), body: JSON.stringify(payload), cache: "no-store" });
    if (!response.ok) {
      console.error("[api/projects] Supabase write failed", response.status, await response.text());
      return jsonWithGuest({ ok: false, error: "project_save_failed" }, guest, { status: 502 });
    }
    return jsonWithGuest({ ok: true, id, shareToken: payload.share_token, shareUrl: `${new URL(request.url).origin}/?share=${payload.share_token}` }, guest);
  } catch (error) {
    console.error("[api/projects]", error);
    return jsonWithGuest({ ok: false, error: "invalid_body" }, guest, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const guest = requireGuest(request);
  const config = getSupabaseConfig();
  if (!config.url || !config.key) return jsonWithGuest({ ok: false, error: "persistence_not_configured" }, guest, { status: 503 });
  const share = new URL(request.url).searchParams.get("share");
  if (!share) return jsonWithGuest({ ok: false, error: "missing_share" }, guest, { status: 400 });
  const response = await fetch(`${config.url}/rest/v1/projects?select=id,title,snapshot,updated_at&share_token=eq.${encodeURIComponent(share)}&limit=1`, { headers: headers(config.key), cache: "no-store" });
  if (!response.ok) return jsonWithGuest({ ok: false, error: "project_load_failed" }, guest, { status: 502 });
  const rows = await response.json() as Array<{ id: string; title: string; snapshot: unknown; updated_at: string }>;
  if (!rows[0]) return jsonWithGuest({ ok: false, error: "project_not_found" }, guest, { status: 404 });
  return jsonWithGuest({ ok: true, project: rows[0] }, guest);
}

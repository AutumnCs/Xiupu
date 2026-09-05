import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const GUEST_COOKIE = "xiupu_guest_id";
const GUEST_ID = /^guest_[a-zA-Z0-9_-]{16,}$/;

export type GuestAuthResult = { guestId: string; response?: NextResponse };

export function requireGuest(request: NextRequest): GuestAuthResult {
  const existing = request.cookies.get(GUEST_COOKIE)?.value;
  if (existing && GUEST_ID.test(existing)) return { guestId: existing };
  const guestId = `guest_${crypto.randomUUID().replaceAll("-", "")}`;
  const response = NextResponse.next();
  response.cookies.set(GUEST_COOKIE, guestId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return { guestId, response };
}

export function jsonWithGuest<T>(body: T, guest: GuestAuthResult, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  const setCookie = guest.response?.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}

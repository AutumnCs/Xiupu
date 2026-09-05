import type { ReqTone } from "@/lib/agents/types";

export type RequirementItem = {
  id: string;
  tone: ReqTone;
  text: string;
  locked: boolean;
};

export function createRequirementItem(tone: ReqTone, text: string): RequirementItem {
  return {
    id: `req_${crypto.randomUUID().replaceAll("-", "")}`,
    tone,
    text: text.trim(),
    locked: false,
  };
}

export function toggleRequirementLock(item: RequirementItem): RequirementItem {
  return { ...item, locked: !item.locked };
}

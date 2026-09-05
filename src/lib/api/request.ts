"use client";

import { getResolvedLocale } from "@/i18n";
import { appAIRequest } from "@/lib/api/app-ai-request";

/**
 * Drop-in replacement for API requests that sends the user's selected locale.
 */
export async function request(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("x-app-locale", getResolvedLocale());

  return appAIRequest(input, {
    ...init,
    headers,
  });
}

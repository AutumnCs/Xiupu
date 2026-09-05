"use client";

import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

export function UserBadge() {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium shadow-sm">
      <UserRound className="h-4 w-4 text-muted-foreground" />
      {t("common.guestMode")}
    </div>
  );
}

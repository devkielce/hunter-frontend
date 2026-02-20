"use client";

import nextDynamic from "next/dynamic";

export const RefreshScrapersButton = nextDynamic(
  () =>
    import("@/components/RefreshScrapersButton").then((m) => ({
      default: m.RefreshScrapersButton,
    })),
  { ssr: false }
);

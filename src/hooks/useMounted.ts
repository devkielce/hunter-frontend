"use client";

import { useEffect, useState } from "react";

/** True only after mount. Use to defer time/locale-dependent UI and avoid hydration mismatch. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

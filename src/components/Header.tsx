"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { RefreshScrapersButton } from "./RefreshScrapersButtonDynamic";

interface HeaderProps {
  /** Optional second row (e.g. breadcrumb). */
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="hunter-header">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {/* Row 1: logo, nav, theme, refresh */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
              <Link href="/" className="hover:opacity-90 transition-opacity">
                Hunter
              </Link>
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Okazje nieruchomościowe
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
            >
              Dashboard
            </Link>
            <ThemeToggle />
            <RefreshScrapersButton />
          </div>
        </div>
        {children != null && children}
      </div>
    </header>
  );
}

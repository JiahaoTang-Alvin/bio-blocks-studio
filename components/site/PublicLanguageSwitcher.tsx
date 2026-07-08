"use client";

import { useState } from "react";
import { Languages, X } from "lucide-react";
import type { SiteLanguage } from "@/types/site-config";
import { cn } from "@/lib/utils";

type PublicLanguageSwitcherProps = {
  currentLocale: string;
  languages: SiteLanguage[];
  className?: string;
  buttonClassName?: string;
};

export function PublicLanguageSwitcher({ currentLocale, languages, className, buttonClassName }: PublicLanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleLanguages = languages.filter((language) => language.isEnabled).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentLanguage = visibleLanguages.find((language) => language.code === currentLocale) ?? visibleLanguages[0];

  if (visibleLanguages.length <= 1 || !currentLanguage) return null;

  async function selectLanguage(locale: string) {
    await fetch("/api/public/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale })
    });
    window.location.reload();
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="选择语言"
        title="选择语言"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-white/90 text-[var(--site-text)] shadow-soft transition hover:border-[var(--site-primary)] hover:text-[var(--site-primary)]",
          buttonClassName
        )}
      >
        <Languages className="h-[18px] w-[18px]" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/24 px-5 py-8" onClick={() => setIsOpen(false)}>
          <div
            className="w-full max-w-[320px] rounded-[22px] border border-[#E5EAF2] bg-white p-4 text-[#111827] shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                  <Languages className="h-4 w-4" />
                </span>
                选择语言
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="关闭"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#64748B] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-2">
              {visibleLanguages.map((language) => {
                const isActive = language.code === currentLanguage.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => selectLanguage(language.code)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm font-medium transition",
                      isActive
                        ? "border-[#B7D8FF] bg-[#EFF6FF] text-[#1D4ED8]"
                        : "border-[#E5EAF2] bg-white text-[#334155] hover:border-[#BFDBFE] hover:bg-[#F8FBFF]"
                    )}
                  >
                    <span>{language.label}</span>
                    <span className={cn("text-xs", isActive ? "text-[#2563EB]" : "text-[#94A3B8]")}>{language.code}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

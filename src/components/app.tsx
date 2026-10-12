"use client";

import clsx from "clsx";
import { CalendarCheck, ClipboardList, NotebookPen } from "lucide-react";
import { useState } from "react";
import { Journal } from "./journal";
import { Plan } from "./plan";
import { Today } from "./today";

const tabs = [
  { id: "today", label: "Сегодня", icon: CalendarCheck },
  { id: "journal", label: "Дневник", icon: NotebookPen },
  { id: "plan", label: "План", icon: ClipboardList },
] as const;
type Tab = (typeof tabs)[number]["id"];

export function App() {
  const [tab, setTab] = useState<Tab>("today");

  return (
    <>
      <main key={tab} className="rise mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-32 sm:pt-12">
        {tab === "today" && <Today />}
        {tab === "journal" && <Journal />}
        {tab === "plan" && <Plan />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-1 rounded-full bg-ink p-1.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                window.scrollTo({ top: 0 });
              }}
              aria-current={tab === t.id ? "page" : undefined}
              className={clsx(
                "flex h-12 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-bold transition-[background-color,color] duration-300 sm:px-5",
                tab === t.id ? "bg-accent text-accent-foreground" : "text-bone-white/70 hover:text-bone-white",
              )}
            >
              <t.icon className="size-5" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

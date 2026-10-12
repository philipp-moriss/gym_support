"use client";

import dynamic from "next/dynamic";

/** Всё живёт в localStorage и зависит от «сегодня», поэтому рендерим только в браузере. */
export const AppClient = dynamic(() => import("./app").then((m) => m.App), {
  ssr: false,
});

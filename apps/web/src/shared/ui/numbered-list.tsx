/** Список с номерами в чернильных кружках: нюансы техники, правила. */
export function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li
          key={`${i}-${item}`}
          className="flex gap-3 text-[15px] leading-snug"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-ink-foreground">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  )
}

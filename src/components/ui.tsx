import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...c: ClassValue[]) => twMerge(clsx(c));
import type { ComponentProps } from "react";

/**
 * Pill-кнопки как в FAS. Жёлтый — только контур, не заливка.
 * На сцене: default (кремовая) и highlight (жёлтый контур).
 * В карточках: ink (чернильная) и outline.
 */
const variants = {
  default: "bg-primary text-primary-foreground",
  highlight: "border-2 border-accent text-accent hover:bg-accent/15",
  ink: "bg-ink text-ink-foreground hover:bg-ink/85",
  outline: "border-2 border-ink text-ink hover:bg-ink/5",
  ghost: "hover:translate-y-0 hover:bg-current/10",
  destructive: "bg-destructive text-bone-white hover:bg-destructive/90",
};

const sizes = {
  default: "h-11 px-[17px] text-base",
  sm: "h-9 px-3.5 text-sm",
  icon: "size-10",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof variants; size?: keyof typeof sizes }) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold tracking-[0.04em] outline-none transition-[transform,background-color,color,opacity] duration-200 hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring active:translate-y-0 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

/** Кремовая карточка 6px на фиолетовой сцене: плоская, без теней и рамки. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-4 rounded-md bg-card p-[17px] text-card-foreground", className)}
      {...props}
    />
  );
}

const field =
  "w-full min-w-0 rounded-md border-2 border-input bg-card px-3 text-[16px] text-card-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ink focus-visible:ring-4 focus-visible:ring-ring/20";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("h-11", field, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("min-h-20 py-2", field, className)} {...props} />;
}

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="mono-label text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/** Большой степпер «− 30 кг +»: вес и повторы меняются пальцем, без клавиатуры. */
export function Stepper({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  unit?: string;
}) {
  const fmt = (n: number) => n.toLocaleString("ru-RU", { maximumFractionDigits: 1 });
  const round = (n: number) => Math.round(n * 100) / 100;
  return (
    <div className="flex flex-col gap-2">
      <span className="mono-label text-muted-foreground">{label}</span>
      <div className="flex h-12 items-center rounded-full bg-muted p-1">
        <button
          type="button"
          aria-label={`${label}: меньше`}
          onClick={() => onChange(Math.max(min, round(value - step)))}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-xl font-bold transition-transform hover:bg-ink/5 active:scale-90"
        >
          −
        </button>
        <span className="flex-1 truncate text-center font-mono text-lg font-bold tabular-nums">
          {fmt(value)}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </span>
        <button
          type="button"
          aria-label={`${label}: больше`}
          onClick={() => onChange(round(value + step))}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-ink text-xl font-bold text-ink-foreground transition-transform active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Chip({
  active,
  className,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "h-10 cursor-pointer rounded-full border-2 px-4 text-sm font-bold transition-[background-color,color,transform] active:scale-95",
        active ? "border-ink bg-ink text-ink-foreground" : "border-input text-card-foreground hover:border-ink",
        className,
      )}
      {...props}
    />
  );
}

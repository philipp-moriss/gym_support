import { Check, ChevronDown, Pencil, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useUpdateSettings } from '@/features/update-settings'
import { cn } from '@/shared/lib'
import { Button, Card, Collapse, NumberedList, Textarea } from '@/shared/ui'

/** Правила безопасности: аккордеон, редактируются списком по строке. */
export function RulesCard({
  rules,
  defaultOpen = false,
}: {
  rules: string[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [draft, setDraft] = useState<string | null>(null)
  const update = useUpdateSettings()

  return (
    <Card className="gap-0 p-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-3 p-[17px] text-left"
      >
        <ShieldCheck className="size-6 shrink-0" />
        <h2 className="display flex-1 text-xl sm:text-2xl">
          Правила безопасности
        </h2>
        <ChevronDown
          className={cn(
            'size-5 transition-transform duration-300',
            open && 'rotate-180',
          )}
        />
      </button>
      <Collapse open={open}>
        <div className="flex flex-col gap-3 px-[17px] pb-[17px]">
          {draft !== null ? (
            <>
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={8}
                aria-label="Правила, по одному на строку"
              />
              <div className="flex gap-2">
                <Button
                  variant="ink"
                  size="sm"
                  onClick={() => {
                    update.mutate({
                      rules: draft
                        .split('\n')
                        .map((r) => r.trim())
                        .filter(Boolean),
                    })
                    setDraft(null)
                  }}
                >
                  <Check strokeWidth={3} />
                  Сохранить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDraft(null)}
                >
                  Отмена
                </Button>
              </div>
            </>
          ) : (
            <>
              {rules.length ? (
                <NumberedList items={rules} />
              ) : (
                <p className="text-[15px] text-muted-foreground">
                  Правил пока нет.
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setDraft(rules.join('\n'))}
              >
                <Pencil />
                Изменить
              </Button>
            </>
          )}
        </div>
      </Collapse>
    </Card>
  )
}

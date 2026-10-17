import { RotateCcw, Save } from 'lucide-react'
import { useState } from 'react'
import { PROMPT_MAX, PROMPT_MIN, type PromptInfo } from '@/entities/prompt'
import { errorText } from '@/shared/api'
import { attempt, cn, formatDateTime } from '@/shared/lib'
import {
  Badge,
  Button,
  Card,
  ConfirmButton,
  ErrorText,
  Textarea,
} from '@/shared/ui'
import { useResetPrompt, useSavePrompt } from '../model/use-prompt-mutations'

/**
 * Редактор одного промпта. Черновик живёт локально, пока не сохранён;
 * после сохранения или сброса родитель пересоздаёт редактор по key.
 */
export function PromptEditor({
  prompt,
  step,
}: {
  prompt: PromptInfo
  step: number
}) {
  const [text, setText] = useState(prompt.text)
  const save = useSavePrompt(prompt.slot)
  const reset = useResetPrompt(prompt.slot)

  const dirty = text !== prompt.text
  const length = text.trim().length
  const tooShort = length < PROMPT_MIN
  const tooLong = text.length > PROMPT_MAX
  const pending = save.isPending || reset.isPending

  return (
    <Card className="gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="mono-label text-muted-foreground">Шаг {step}</span>
        <h2 className="text-xl font-bold">{prompt.title}</h2>
        {prompt.isDefault ? (
          <Badge>По умолчанию</Badge>
        ) : (
          <Badge tone="warn">Изменён</Badge>
        )}
        {dirty && <Badge tone="accent">Не сохранено</Badge>}
        <span className="font-mono text-xs text-muted-foreground sm:ml-auto">
          {prompt.slot}
        </span>
      </div>

      <Textarea
        aria-label={`Промпт: ${prompt.title}`}
        spellCheck={false}
        value={text}
        disabled={pending}
        onChange={(e) => setText(e.target.value)}
        className={cn(
          'min-h-[55vh] resize-y font-mono text-[13px] leading-relaxed',
          dirty && 'border-ink',
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span
          className={cn(
            'font-mono tabular-nums',
            (tooShort || tooLong) && 'text-destructive',
          )}
        >
          {text.length.toLocaleString('ru-RU')} /{' '}
          {PROMPT_MAX.toLocaleString('ru-RU')}
          {tooShort && ` · минимум ${PROMPT_MIN} символов`}
        </span>
        {prompt.updatedAt && (
          <span>Изменён {formatDateTime(prompt.updatedAt)}</span>
        )}
      </div>

      <ErrorText>
        {save.isError
          ? errorText(save.error)
          : reset.isError
            ? errorText(reset.error)
            : null}
      </ErrorText>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="ink"
          disabled={!dirty || tooShort || tooLong || pending}
          onClick={() => {
            reset.reset()
            save.mutate(text)
          }}
        >
          <Save />
          {save.isPending ? 'Сохраняем…' : 'Сохранить'}
        </Button>
        {dirty && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setText(prompt.text)}
          >
            Отменить правки
          </Button>
        )}
        <ConfirmButton
          variant="outline"
          disabled={prompt.isDefault || pending}
          title="Вернуть промпт по умолчанию?"
          text={
            <>
              Текст «{prompt.title}» заменится встроенным
              {dirty ? ', несохранённые правки пропадут' : ''}. Отменить это
              нельзя.
            </>
          }
          confirmLabel="Вернуть по умолчанию"
          danger
          pending={reset.isPending}
          error={reset.isError ? errorText(reset.error) : null}
          onOpen={() => {
            save.reset()
            reset.reset()
          }}
          onConfirm={() => attempt(() => reset.mutateAsync())}
        >
          <RotateCcw />
          Вернуть по умолчанию
        </ConfirmButton>
      </div>
    </Card>
  )
}

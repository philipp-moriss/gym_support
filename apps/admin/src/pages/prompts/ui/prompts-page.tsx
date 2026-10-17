import { useQuery } from '@tanstack/react-query'
import { promptsQuery } from '@/entities/prompt'
import { PromptEditor } from '@/features/edit-prompt'
import { errorText } from '@/shared/api'
import { PageHeader, PageState } from '@/shared/ui'

/** Порядок шагов анализа: сначала дневник, потом правки программы. */
const ORDER = ['journal_analysis', 'program_review']

export function PromptsPage() {
  const { data, isPending, isError, error, refetch } = useQuery(promptsQuery())
  const prompts = [...(data ?? [])].sort(
    (a, b) => ORDER.indexOf(a.slot) - ORDER.indexOf(b.slot),
  )

  return (
    <>
      <PageHeader
        label="ИИ"
        title="Промпты"
        description={
          <div className="flex flex-col gap-2">
            <p>
              Текст промпта уходит в раздел{' '}
              <code className="rounded-sm bg-block px-1.5 py-0.5 font-mono text-[13px] text-bone-white">
                {'<<<SYSTEM_PROMPT>>>'}
              </code>{' '}
              сообщения агенту ultra-ai. Агент должен ответить JSON в формате,
              который описан в самом промпте, — меняя формат, держи его в
              согласии с бэкендом.
            </p>
            <p>
              Анализ идёт в два шага: шаг 1 «Анализ дневника» → шаг 2 «Правки
              программы».
            </p>
          </div>
        }
      />
      {isPending ? (
        <PageState />
      ) : isError ? (
        <PageState
          error
          message={errorText(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        prompts.map((p, i) => (
          <PromptEditor
            // Сохранили или сбросили — редактор начинает с нового текста.
            key={`${p.slot}:${p.updatedAt ?? 'default'}:${p.text.length}`}
            prompt={p}
            step={i + 1}
          />
        ))
      )}
    </>
  )
}

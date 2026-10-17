import { PageHeader } from '@/shared/ui'
import { AiStatsView } from '@/widgets/ai-stats'

export function AiPage() {
  return (
    <>
      <PageHeader
        label="За 30 дней"
        title="ИИ"
        description="Сколько анализов запускали тренеры и какие из них упали."
      />
      <AiStatsView />
    </>
  )
}

import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { AiStats } from '../model/types'

export const aiStatsQuery = () =>
  queryOptions({
    queryKey: ['ai-stats'],
    queryFn: () => api.get<AiStats>('/ai/stats'),
  })

import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { PromptInfo } from '../model/types'

export const promptsQuery = () =>
  queryOptions({
    queryKey: ['prompts'],
    queryFn: () => api.get<PromptInfo[]>('/prompts'),
  })

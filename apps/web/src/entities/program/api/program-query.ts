import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Program } from '../model/types'

export const programKey = ['program'] as const

export const programQuery = () =>
  queryOptions({
    queryKey: programKey,
    queryFn: () => api.get<Program>('/program'),
  })

export const useProgram = () => useQuery(programQuery())

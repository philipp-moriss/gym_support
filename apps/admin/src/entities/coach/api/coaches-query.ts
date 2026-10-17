import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Coach } from '../model/types'

export const coachesQuery = () =>
  queryOptions({
    queryKey: ['coaches'],
    queryFn: () => api.get<Coach[]>('/coaches'),
  })

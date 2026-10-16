import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Me } from '../model/types'

export const meQuery = () =>
  queryOptions({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/auth/me'),
    staleTime: Infinity,
  })

export const useMe = () => useQuery(meQuery())

import { queryOptions } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Client } from '../model/types'

export const clientsQuery = () =>
  queryOptions({
    queryKey: ['clients'],
    queryFn: () => api.get<Client[]>('/clients'),
  })

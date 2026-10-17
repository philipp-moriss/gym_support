import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Admin } from '../model/types'

export const meQuery = () =>
  queryOptions({
    queryKey: ['me'],
    queryFn: () => api.get<Pick<Admin, 'id' | 'login'>>('/auth/me'),
    staleTime: Infinity,
  })

export const useMe = () => useQuery(meQuery())

export const adminsQuery = () =>
  queryOptions({
    queryKey: ['admins'],
    queryFn: () => api.get<Admin[]>('/admins'),
  })

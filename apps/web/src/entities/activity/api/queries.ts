import { queryOptions, useQuery } from '@tanstack/react-query'
import { api } from '@/shared/api'
import type { Activity } from '../model/types'

export const activitiesKey = ['journal', 'activities'] as const

export const activitiesQuery = () =>
  queryOptions({
    queryKey: activitiesKey,
    queryFn: () => api.get<Activity[]>('/journal/activities'),
  })

export const useActivities = () => useQuery(activitiesQuery())

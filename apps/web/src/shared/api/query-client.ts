import { QueryClient } from '@tanstack/react-query'

/** Сколько живёт сохранённый на телефоне кэш (программа, дневник). */
export const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      // Данные из сохранённого кэша не выбрасываем, пока он действует.
      gcTime: CACHE_MAX_AGE,
    },
  },
})

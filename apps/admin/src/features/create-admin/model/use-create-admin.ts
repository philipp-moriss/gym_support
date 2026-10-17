import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminsQuery, type Admin } from '@/entities/admin'
import { api } from '@/shared/api'

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: { login: string; password: string }) =>
      api.post<Admin>('/admins', dto),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: adminsQuery().queryKey }),
  })
}

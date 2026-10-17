import type { Client } from '@/entities/client'
import { errorText } from '@/shared/api'
import { attempt } from '@/shared/lib'
import { InlineEdit } from '@/shared/ui'
import { useUpdateClient } from '../model/use-update-client'

export function ClientNameEdit({ client }: { client: Client }) {
  const mutation = useUpdateClient(client.id)
  return (
    <InlineEdit
      label="имя клиента"
      value={client.name ?? ''}
      display={
        <span className="flex flex-col">
          <span className="font-bold">
            {client.name ?? (
              <span className="font-normal text-muted-foreground">
                без имени
              </span>
            )}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {client.login}
          </span>
        </span>
      }
      pending={mutation.isPending}
      error={mutation.isError ? errorText(mutation.error) : null}
      inputProps={{ maxLength: 80, placeholder: 'без имени' }}
      onSave={(name) => {
        mutation.reset()
        return attempt(() => mutation.mutateAsync({ name: name || null }))
      }}
    />
  )
}

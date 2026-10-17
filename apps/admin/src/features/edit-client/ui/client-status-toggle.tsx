import { Ban, CircleCheck } from 'lucide-react'
import type { Client } from '@/entities/client'
import { errorText } from '@/shared/api'
import { attempt } from '@/shared/lib'
import { Badge, ConfirmButton } from '@/shared/ui'
import { useUpdateClient } from '../model/use-update-client'

export function ClientStatusToggle({ client }: { client: Client }) {
  const mutation = useUpdateClient(client.id)
  const name = client.name ?? client.login
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {client.disabled ? (
        <Badge tone="danger">Заблокирован</Badge>
      ) : (
        <Badge tone="success">Активен</Badge>
      )}
      <ConfirmButton
        variant="ghost"
        size="sm"
        className="h-8 px-2.5"
        title={
          client.disabled ? 'Разблокировать клиента?' : 'Заблокировать клиента?'
        }
        text={
          client.disabled
            ? `${name} снова сможет входить в журнал.`
            : `${name} не сможет войти, пока его не разблокируют. Записи сохранятся.`
        }
        confirmLabel={client.disabled ? 'Разблокировать' : 'Заблокировать'}
        danger={!client.disabled}
        pending={mutation.isPending}
        error={mutation.isError ? errorText(mutation.error) : null}
        onOpen={mutation.reset}
        onConfirm={() =>
          attempt(() => mutation.mutateAsync({ disabled: !client.disabled }))
        }
      >
        {client.disabled ? <CircleCheck /> : <Ban />}
        {client.disabled ? 'Разблокировать' : 'Заблокировать'}
      </ConfirmButton>
    </span>
  )
}

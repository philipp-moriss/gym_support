import { Ban, CircleCheck } from 'lucide-react'
import { coachName, type Coach } from '@/entities/coach'
import { errorText } from '@/shared/api'
import { attempt } from '@/shared/lib'
import { Badge, ConfirmButton } from '@/shared/ui'
import { useUpdateCoach } from '../model/use-update-coach'

/** Статус тренера и кнопка «заблокировать / разблокировать» с подтверждением. */
export function CoachStatusToggle({ coach }: { coach: Coach }) {
  const mutation = useUpdateCoach(coach.id)
  const name = coachName(coach)
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {coach.disabled ? (
        <Badge tone="danger">Заблокирован</Badge>
      ) : (
        <Badge tone="success">Активен</Badge>
      )}
      <ConfirmButton
        variant="ghost"
        size="sm"
        className="h-8 px-2.5"
        title={
          coach.disabled ? 'Разблокировать тренера?' : 'Заблокировать тренера?'
        }
        text={
          coach.disabled
            ? `${name} снова сможет входить и видеть своих клиентов.`
            : `${name} не сможет войти, пока его не разблокируют. Клиенты останутся закреплены.`
        }
        confirmLabel={coach.disabled ? 'Разблокировать' : 'Заблокировать'}
        danger={!coach.disabled}
        pending={mutation.isPending}
        error={mutation.isError ? errorText(mutation.error) : null}
        onOpen={mutation.reset}
        onConfirm={() =>
          attempt(() => mutation.mutateAsync({ disabled: !coach.disabled }))
        }
      >
        {coach.disabled ? <CircleCheck /> : <Ban />}
        {coach.disabled ? 'Разблокировать' : 'Заблокировать'}
      </ConfirmButton>
    </span>
  )
}

import { coachName, type Coach } from '@/entities/coach'
import { errorText } from '@/shared/api'
import { attempt } from '@/shared/lib'
import { InlineEdit } from '@/shared/ui'
import { useUpdateCoach } from '../model/use-update-coach'

export function CoachNameEdit({ coach }: { coach: Coach }) {
  const mutation = useUpdateCoach(coach.id)
  return (
    <InlineEdit
      label="имя тренера"
      value={coach.name ?? ''}
      display={<span className="font-bold">{coachName(coach)}</span>}
      pending={mutation.isPending}
      error={mutation.isError ? errorText(mutation.error) : null}
      inputProps={{ maxLength: 80 }}
      onSave={(name) => {
        mutation.reset()
        return attempt(() => mutation.mutateAsync({ name }))
      }}
    />
  )
}

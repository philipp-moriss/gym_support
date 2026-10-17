import { Ticket, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { InviteCard, NewClientFlow } from '@/features/manage-clients'
import { Button, PageHeader } from '@/shared/ui'
import { ClientList } from '@/widgets/client-list'

/** Кабинет тренера: клиенты, новый клиент, приглашение по коду. */
export function CoachClientsPage() {
  const [panel, setPanel] = useState<'new' | 'invite' | null>(null)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader label="Кабинет тренера" title="Клиенты" />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setPanel('new')}>
          <UserPlus />
          Новый клиент
        </Button>
        <Button variant="highlight" onClick={() => setPanel('invite')}>
          <Ticket />
          Пригласить
        </Button>
      </div>
      {panel === 'new' && <NewClientFlow onClose={() => setPanel(null)} />}
      {panel === 'invite' && <InviteCard onClose={() => setPanel(null)} />}
      <ClientList />
    </div>
  )
}

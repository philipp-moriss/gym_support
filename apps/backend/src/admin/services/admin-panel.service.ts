import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  ACCOUNTS,
  COACHING_ADMIN,
  JOURNAL,
  type AccountPatch,
  type AccountRecord,
  type Accounts,
  type CoachingAdmin,
  type JournalReader,
} from '../../shared';

const todayIso = () => new Date().toISOString().slice(0, 10);

const accountView = ({
  id,
  login,
  name,
  disabled,
  createdAt,
}: AccountRecord) => ({
  id,
  login,
  name,
  disabled,
  createdAt,
});

/** Сводки админки поверх контрактов аккаунтов, тренерства и дневника. */
@Injectable()
export class AdminPanelService {
  constructor(
    @Inject(ACCOUNTS) private accounts: Accounts,
    @Inject(COACHING_ADMIN) private coaching: CoachingAdmin,
    @Inject(JOURNAL) private journal: JournalReader,
  ) {}

  async coaches() {
    const [coaches, links, ai] = await Promise.all([
      this.accounts.list('coach'),
      this.coaching.activeLinks(),
      this.coaching.aiStats(30),
    ]);
    return coaches.map((c) => ({
      ...accountView(c),
      aiDailyLimit: c.aiDailyLimit,
      clients: links.filter((l) => l.coachId === c.id).length,
      analyses30d: ai.byCoach.find((s) => s.coachId === c.id)?.total ?? 0,
    }));
  }

  async createCoach(name: string) {
    const { account, code } = await this.accounts.create({
      role: 'coach',
      name,
    });
    return { coach: accountView(account), code };
  }

  async updateCoach(id: string, patch: AccountPatch) {
    await this.assertRole(id, 'coach');
    return accountView(await this.accounts.update(id, patch));
  }

  async resetCode(id: string) {
    await this.assertRole(id, 'coach');
    const { code } = await this.accounts.resetCode(id);
    return { code };
  }

  async clients() {
    const [clients, coaches, links] = await Promise.all([
      this.accounts.list('client'),
      this.accounts.list('coach'),
      this.coaching.activeLinks(),
    ]);
    const stats = await this.journal.stats(
      clients.map((c) => c.id),
      todayIso(),
    );
    return clients.map((c, i) => {
      const link = links.find((l) => l.clientId === c.id);
      const coach = link && coaches.find((k) => k.id === link.coachId);
      return {
        ...accountView(c),
        coach: coach ? { id: coach.id, name: coach.name ?? coach.login } : null,
        lastWorkout: stats[i].lastWorkout,
        workouts7d: stats[i].workouts7d,
      };
    });
  }

  async updateClient(id: string, patch: AccountPatch) {
    await this.assertRole(id, 'client');
    return accountView(await this.accounts.update(id, patch));
  }

  assign(clientId: string, coachId: string | null) {
    return this.coaching.assign(clientId, coachId);
  }

  async aiStats() {
    const [ai, coaches] = await Promise.all([
      this.coaching.aiStats(30),
      this.accounts.list('coach'),
    ]);
    const name = (id: string) => {
      const c = coaches.find((k) => k.id === id);
      return c ? (c.name ?? c.login) : '—';
    };
    const clients = await this.accounts.findByIds([
      ...new Set(ai.failures.map((f) => f.clientId)),
    ]);
    return {
      byCoach: ai.byCoach.map((s) => ({ ...s, coachName: name(s.coachId) })),
      failures: ai.failures.map((f) => {
        const client = clients.find((c) => c.id === f.clientId);
        return {
          ...f,
          coachName: name(f.coachId),
          clientName: client ? (client.name ?? client.login) : '—',
        };
      }),
    };
  }

  private async assertRole(id: string, role: 'coach' | 'client') {
    const account = await this.accounts.findById(id);
    if (!account || account.role !== role) throw new NotFoundException();
  }
}

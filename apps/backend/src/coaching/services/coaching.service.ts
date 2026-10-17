import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { createHmac, randomInt } from 'crypto';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import {
  ACCOUNTS,
  JOURNAL,
  PROGRAM,
  PROGRAM_SEEDER,
  type Accounts,
  type CoachingAdmin,
  type CoachLinks,
  type JournalReader,
  type ProgramAccess,
  type ProgramSeeder,
  type ProgramTemplate,
} from '../../shared';
import { AiAnalysis } from '../entities/ai-analysis.entity';
import { ClientNote } from '../entities/client-note.entity';
import { CoachClient } from '../entities/coach-client.entity';
import { CoachInvite } from '../entities/coach-invite.entity';
import { cycleWeek } from './analysis-data';

/** Без похожих символов (0/O, 1/I/L): код диктуют и переписывают руками. */
const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_LENGTH = 6;
const INVITE_DAYS = 7;

export const generateInviteCode = () =>
  Array.from(
    { length: INVITE_LENGTH },
    () => INVITE_ALPHABET[randomInt(0, INVITE_ALPHABET.length)],
  ).join('');

export const normalizeInviteCode = (code: string) =>
  code.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const todayIso = () => new Date().toISOString().slice(0, 10);

/** Тренер, клиенты, приглашения и карточки клиентов. */
@Injectable()
export class CoachingService implements CoachLinks, CoachingAdmin {
  private readonly pepper: string;

  constructor(
    @InjectRepository(CoachClient) private links: Repository<CoachClient>,
    @InjectRepository(CoachInvite) private invites: Repository<CoachInvite>,
    @InjectRepository(ClientNote) private notes: Repository<ClientNote>,
    @InjectRepository(AiAnalysis) private analyses: Repository<AiAnalysis>,
    @Inject(ACCOUNTS) private accounts: Accounts,
    @Inject(PROGRAM_SEEDER) private seeder: ProgramSeeder,
    @Inject(PROGRAM) private program: ProgramAccess,
    @Inject(JOURNAL) private journal: JournalReader,
    @InjectDataSource() private db: DataSource,
    config: ConfigService,
  ) {
    this.pepper = config.getOrThrow<string>('CODE_PEPPER');
  }

  async isLinked(coachId: string, clientId: string) {
    return this.links.existsBy({ coachId, clientId, unlinkedAt: IsNull() });
  }

  /** Клиенты тренера со сводкой для списка: последняя тренировка, неделя, боль. */
  async clients(coachId: string) {
    const links = await this.links.find({
      where: { coachId, unlinkedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
    const ids = links.map((l) => l.clientId);
    const today = todayIso();
    const [accounts, stats, programs] = await Promise.all([
      this.accounts.findByIds(ids),
      this.journal.stats(ids, today),
      Promise.all(ids.map((id) => this.program.get(id))),
    ]);
    const byId = new Map(accounts.map((a) => [a.id, a]));
    return links.map((link, i) => {
      const account = byId.get(link.clientId);
      return {
        id: link.clientId,
        login: account?.login ?? '',
        name: account?.name ?? null,
        alias: link.alias,
        linkedAt: link.createdAt,
        week: cycleWeek(programs[i].settings.startDate, today),
        lastWorkout: stats[i].lastWorkout,
        workouts7d: stats[i].workouts7d,
        maxPain14d: stats[i].maxPain14d,
      };
    });
  }

  async client(coachId: string, clientId: string) {
    const found = (await this.clients(coachId)).find((c) => c.id === clientId);
    if (!found) throw new NotFoundException();
    return found;
  }

  /** Тренер заводит клиента сам: аккаунт с программой по шаблону, код показывается тренеру. */
  async createClient(coachId: string, name: string, template: ProgramTemplate) {
    const { account, code } = await this.accounts.create({
      role: 'client',
      name,
    });
    await this.seeder.seed(account.id, template);
    await this.links.save(
      this.links.create({
        coachId,
        clientId: account.id,
        alias: name.trim() || null,
      }),
    );
    return { client: await this.client(coachId, account.id), code };
  }

  async rename(coachId: string, clientId: string, alias: string | null) {
    const link = await this.activeLink(coachId, clientId);
    link.alias = alias?.trim() || null;
    await this.links.save(link);
    return this.client(coachId, clientId);
  }

  async unlink(coachId: string, clientId: string) {
    const link = await this.activeLink(coachId, clientId);
    link.unlinkedAt = new Date();
    await this.links.save(link);
  }

  async createInvite(coachId: string) {
    for (let attempt = 0; ; attempt++) {
      const code = generateInviteCode();
      try {
        const invite = await this.invites.save(
          this.invites.create({
            coachId,
            codeLookup: this.lookup(code),
            expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
          }),
        );
        return { code, expiresAt: invite.expiresAt };
      } catch (e) {
        if (attempt >= 9) throw e;
      }
    }
  }

  async activeInvites(coachId: string) {
    const rows = await this.invites.find({
      where: { coachId, usedAt: IsNull(), expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    // Сам код не храним — показываем только сроки.
    return rows.map(({ id, expiresAt, createdAt }) => ({
      id,
      expiresAt,
      createdAt,
    }));
  }

  /** Клиент вводит код приглашения: прежний тренер, если был, отвязывается. */
  async acceptInvite(clientId: string, code: string) {
    const invite = await this.invites.findOneBy({
      codeLookup: this.lookup(normalizeInviteCode(code)),
    });
    if (!invite || invite.usedAt || invite.expiresAt.getTime() <= Date.now())
      throw new BadRequestException('Invalid invite code');
    const coach = await this.accounts.findById(invite.coachId);
    if (!coach || coach.role !== 'coach' || coach.disabled)
      throw new BadRequestException('Invalid invite code');
    await this.db.transaction(async (m) => {
      await m.update(
        CoachClient,
        { clientId, unlinkedAt: IsNull() },
        { unlinkedAt: new Date() },
      );
      await m.insert(CoachClient, { coachId: invite.coachId, clientId });
      await m.update(
        CoachInvite,
        { id: invite.id },
        { usedAt: new Date(), usedBy: clientId },
      );
    });
    return this.coachOf(clientId);
  }

  async coachOf(clientId: string) {
    const link = await this.links.findOneBy({ clientId, unlinkedAt: IsNull() });
    const coach = link ? await this.accounts.findById(link.coachId) : null;
    return {
      coach: coach
        ? { name: coach.name ?? coach.login, since: link!.createdAt }
        : null,
    };
  }

  async leaveCoach(clientId: string) {
    await this.links.update(
      { clientId, unlinkedAt: IsNull() },
      { unlinkedAt: new Date() },
    );
  }

  async getNotes(coachId: string, clientId: string) {
    await this.activeLink(coachId, clientId);
    const note = await this.notes.findOneBy({ clientId });
    return { text: note?.text ?? '', updatedAt: note?.updatedAt ?? null };
  }

  async saveNotes(coachId: string, clientId: string, text: string) {
    await this.activeLink(coachId, clientId);
    const saved = await this.notes.save({
      clientId,
      coachId,
      text: text.trim(),
    });
    return { text: saved.text, updatedAt: saved.updatedAt };
  }

  async changes(coachId: string, clientId: string) {
    await this.activeLink(coachId, clientId);
    return this.program.listChanges(clientId);
  }

  // --- админка ---

  async activeLinks() {
    const rows = await this.links.find({ where: { unlinkedAt: IsNull() } });
    return rows.map(({ coachId, clientId, alias, createdAt }) => ({
      coachId,
      clientId,
      alias,
      createdAt,
    }));
  }

  async assign(clientId: string, coachId: string | null) {
    const client = await this.accounts.findById(clientId);
    if (!client || client.role !== 'client') throw new NotFoundException();
    if (coachId) {
      const coach = await this.accounts.findById(coachId);
      if (!coach || coach.role !== 'coach')
        throw new BadRequestException('Not a coach');
    }
    await this.db.transaction(async (m) => {
      await m.update(
        CoachClient,
        { clientId, unlinkedAt: IsNull() },
        { unlinkedAt: new Date() },
      );
      if (coachId) await m.insert(CoachClient, { coachId, clientId });
    });
  }

  async aiStats(days: number) {
    const since = new Date(Date.now() - days * 86_400_000);
    const byCoach: {
      coachId: string;
      total: string;
      ready: string;
      failed: string;
    }[] = await this.analyses
      .createQueryBuilder('a')
      .select('a.coachId', 'coachId')
      .addSelect('COUNT(*)', 'total')
      .addSelect(`COUNT(*) FILTER (WHERE a.status = 'ready')`, 'ready')
      .addSelect(`COUNT(*) FILTER (WHERE a.status = 'failed')`, 'failed')
      .where('a.createdAt > :since', { since })
      .groupBy('a.coachId')
      .getRawMany();
    const failures = await this.analyses.find({
      where: { status: 'failed', createdAt: MoreThan(since) },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return {
      byCoach: byCoach.map((r) => ({
        coachId: r.coachId,
        total: Number(r.total),
        ready: Number(r.ready),
        failed: Number(r.failed),
      })),
      failures: failures.map(({ id, coachId, clientId, error, createdAt }) => ({
        id,
        coachId,
        clientId,
        error,
        createdAt,
      })),
    };
  }

  /** Связь обязательна: чужой клиент для тренера не существует. */
  async activeLink(coachId: string, clientId: string) {
    const link = await this.links.findOneBy({
      coachId,
      clientId,
      unlinkedAt: IsNull(),
    });
    if (!link) throw new ForbiddenException('Not your client');
    return link;
  }

  private lookup(code: string) {
    return createHmac('sha256', this.pepper)
      .update(`invite:${code}`)
      .digest('hex');
  }
}

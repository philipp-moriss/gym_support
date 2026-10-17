import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  ACCOUNTS,
  AI_AGENT,
  JOURNAL,
  PROGRAM,
  type Accounts,
  type AiAgent,
  type ExerciseChange,
  type JournalReader,
  type ProgramAccess,
} from '../../shared';
import { AiAnalysis } from '../entities/ai-analysis.entity';
import { ClientNote } from '../entities/client-note.entity';
import {
  cycleWeek,
  HISTORY_WEEKS,
  journalAnalysisData,
  programReviewData,
} from './analysis-data';
import {
  normalizeJournalAnalysis,
  normalizeProgramReview,
} from './analysis-result';
import { CoachingService, todayIso } from './coaching.service';

const DAY_MS = 86_400_000;
/** Анализ дольше этого считается прерванным (перезапуск сервера посреди вызова). */
const STALE_MS = 10 * 60_000;

const listView = ({ result: _r, ...rest }: AiAnalysis) => rest;

/**
 * ИИ-анализ клиента: дневник → прогресс, затем программа → правки. Идёт в фоне
 * после ответа 202; web опрашивает статус. Правки применяет тренер сам.
 */
@Injectable()
export class AnalysesService {
  private readonly logger = new Logger(AnalysesService.name);
  private readonly defaultLimit: number;

  constructor(
    @InjectRepository(AiAnalysis) private analyses: Repository<AiAnalysis>,
    @InjectRepository(ClientNote) private notes: Repository<ClientNote>,
    private coaching: CoachingService,
    @Inject(ACCOUNTS) private accounts: Accounts,
    @Inject(PROGRAM) private program: ProgramAccess,
    @Inject(JOURNAL) private journal: JournalReader,
    @Inject(AI_AGENT) private agent: AiAgent,
    config: ConfigService,
  ) {
    this.defaultLimit = Number(config.get('AI_DAILY_LIMIT', 20));
  }

  async list(coachId: string, clientId: string) {
    await this.coaching.activeLink(coachId, clientId);
    const rows = await this.analyses.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
    return (await Promise.all(rows.map((r) => this.expire(r)))).map(listView);
  }

  async get(coachId: string, clientId: string, id: string) {
    await this.coaching.activeLink(coachId, clientId);
    const row = await this.analyses.findOneBy({ id, clientId });
    if (!row) throw new NotFoundException();
    return this.expire(row);
  }

  /** Новый анализ. Уже идёт анализ этого клиента — возвращаем его, второй не запускаем. */
  async start(coachId: string, clientId: string) {
    await this.coaching.activeLink(coachId, clientId);
    const running = await this.analyses.findOneBy({
      clientId,
      status: 'pending',
      createdAt: MoreThan(new Date(Date.now() - STALE_MS)),
    });
    if (running) return running;

    await this.assertLimit(coachId);
    const row = await this.analyses.save(
      this.analyses.create({ coachId, clientId, status: 'pending' }),
    );
    void this.execute(row.id, clientId);
    return row;
  }

  /** Тренер выбрал правки (может поправить числа) — применяем все разом. */
  async apply(
    coachId: string,
    clientId: string,
    id: string,
    changes: ExerciseChange[],
  ) {
    const row = await this.get(coachId, clientId, id);
    if (row.status !== 'ready')
      throw new ConflictException('Analysis is not ready');
    const program = await this.program.applyExerciseChanges(clientId, changes, {
      id: coachId,
      source: 'ai',
    });
    await this.analyses.update(row.id, { appliedAt: new Date() });
    return program;
  }

  /** Лимит на сутки (скользящие 24 часа): 429 со сроком до освобождения. */
  private async assertLimit(coachId: string) {
    const coach = await this.accounts.findById(coachId);
    const limit = coach?.aiDailyLimit ?? this.defaultLimit;
    const recent = await this.analyses.find({
      where: { coachId, createdAt: MoreThan(new Date(Date.now() - DAY_MS)) },
      order: { createdAt: 'ASC' },
      select: { id: true, createdAt: true },
    });
    if (recent.length < limit) return;
    const freeAt = recent[recent.length - limit].createdAt.getTime() + DAY_MS;
    throw new HttpException(
      {
        statusCode: 429,
        message: 'AI daily limit reached',
        retryAfterSec: Math.max(1, Math.ceil((freeAt - Date.now()) / 1000)),
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private async execute(id: string, clientId: string) {
    try {
      const today = todayIso();
      const since = new Date(
        Date.parse(`${today}T00:00:00Z`) - HISTORY_WEEKS * 7 * DAY_MS,
      )
        .toISOString()
        .slice(0, 10);
      const [program, entries, note] = await Promise.all([
        this.program.get(clientId),
        this.journal.history(clientId, since),
        this.notes.findOneBy({ clientId }),
      ]);
      const notes = note?.text ?? '';
      const week = cycleWeek(program.settings.startDate, today);

      const journal = normalizeJournalAnalysis(
        await this.agent.run(
          'journal_analysis',
          journalAnalysisData({ notes, today, week, entries }),
        ),
      );
      const review = normalizeProgramReview(
        await this.agent.run(
          'program_review',
          programReviewData({ notes, today, week, program, journal }),
        ),
        program.exercises,
      );
      if (review.dropped)
        this.logger.warn(
          `analysis ${id}: dropped ${review.dropped} invalid changes`,
        );
      await this.analyses.update(id, {
        status: 'ready',
        result: { journal, program: review },
      });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      this.logger.error(`analysis ${id} failed: ${error}`);
      await this.analyses
        .update(id, { status: 'failed', error: error.slice(0, 2000) })
        .catch(() => undefined);
    }
  }

  private async expire(row: AiAnalysis) {
    if (
      row.status !== 'pending' ||
      Date.now() - row.createdAt.getTime() < STALE_MS
    )
      return row;
    const patch = {
      status: 'failed' as const,
      error: 'Analysis was interrupted',
    };
    await this.analyses.update(row.id, patch);
    return { ...row, ...patch };
  }
}

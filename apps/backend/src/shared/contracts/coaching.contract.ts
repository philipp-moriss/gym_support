/** Связь тренер → клиент для guard'а: можно ли тренеру работать от имени клиента. */
export const COACH_LINKS = Symbol('COACH_LINKS');

export interface CoachLinks {
  isLinked(coachId: string, clientId: string): Promise<boolean>;
}

export interface CoachLinkView {
  coachId: string;
  clientId: string;
  alias: string | null;
  createdAt: Date;
}

export interface AiCoachStats {
  coachId: string;
  total: number;
  ready: number;
  failed: number;
}

export interface AiFailure {
  id: string;
  coachId: string;
  clientId: string;
  error: string | null;
  createdAt: Date;
}

/** Операции админки над привязками и анализами. */
export const COACHING_ADMIN = Symbol('COACHING_ADMIN');

export interface CoachingAdmin {
  activeLinks(): Promise<CoachLinkView[]>;
  /** Назначить клиенту тренера (прежняя связь закрывается) или отвязать (null). */
  assign(clientId: string, coachId: string | null): Promise<void>;
  aiStats(
    days: number,
  ): Promise<{ byCoach: AiCoachStats[]; failures: AiFailure[] }>;
}

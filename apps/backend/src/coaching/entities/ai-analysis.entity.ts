import { Column, Entity, ForeignKey, Index } from 'typeorm';
import { BaseEntity } from '../../shared';
import type { AnalysisResult } from '../services/analysis-result';

/** ИИ-анализ клиента по кнопке тренера: идёт в фоне, статус опрашивает web. */
@Entity('ai_analyses')
@Index(['clientId', 'createdAt'])
@Index(['coachId', 'createdAt'])
export class AiAnalysis extends BaseEntity {
  @ForeignKey('accounts', {
    name: 'FK_ai_analyses_client',
    onDelete: 'CASCADE',
  })
  @Column('uuid')
  clientId: string;

  @ForeignKey('accounts', { name: 'FK_ai_analyses_coach', onDelete: 'CASCADE' })
  @Column('uuid')
  coachId: string;

  @Column({ type: 'varchar', length: 10, default: 'pending' })
  status: 'pending' | 'ready' | 'failed';

  @Column({ type: 'jsonb', nullable: true })
  result: AnalysisResult | null;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  /** Когда тренер применил правки. */
  @Column({ type: 'timestamptz', nullable: true })
  appliedAt: Date | null;
}

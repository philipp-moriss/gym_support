import {
  Column,
  Entity,
  ForeignKey,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Несохранённые правки формы упражнения; живут только в свой день. */
export interface Draft {
  weight: number;
  sets: number;
  reps: number;
  pain: number;
  effort: number;
  notes: string;
  /** Отмеченные подходы: повторы каждого, по порядку. */
  setsDone?: number[];
}

@Entity('drafts')
export class Drafts {
  @PrimaryColumn('uuid')
  @ForeignKey('accounts', { name: 'FK_drafts_account', onDelete: 'CASCADE' })
  userId: string;

  @Column({ type: 'date' })
  date: string;

  /** exerciseId → черновик. */
  @Column({ type: 'jsonb', default: () => "'{}'" })
  items: Record<string, Draft>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

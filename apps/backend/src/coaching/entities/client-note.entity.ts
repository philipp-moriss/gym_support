import {
  Column,
  Entity,
  ForeignKey,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Карточка клиента у тренера: болезни, травмы, ограничения, цели — свободным
 * текстом. ИИ учитывает её в анализе. Одна на клиента, переживает смену тренера.
 */
@Entity('client_notes')
export class ClientNote {
  @PrimaryColumn('uuid')
  @ForeignKey('accounts', {
    name: 'FK_client_notes_client',
    onDelete: 'CASCADE',
  })
  clientId: string;

  /** Кто писал последним. */
  @Column('uuid')
  coachId: string;

  @Column({ type: 'text', default: '' })
  text: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

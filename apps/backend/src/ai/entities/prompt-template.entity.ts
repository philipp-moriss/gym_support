import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { AiSlot } from '../../shared';

/** Промпт слота, изменённый в админке. Нет строки — действует встроенный из кода. */
@Entity('prompt_templates')
export class PromptTemplate {
  @PrimaryColumn({ type: 'varchar', length: 40 })
  slot: AiSlot;

  @Column({ type: 'text' })
  text: string;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AI_SLOTS,
  type AiSlot,
  type PromptInfo,
  type Prompts,
} from '../../shared';
import { PromptTemplate } from '../entities/prompt-template.entity';
import { DEFAULT_PROMPTS } from '../prompts';

/** Промпты слотов: изменённые в админке лежат в базе, иначе — встроенные. */
@Injectable()
export class PromptsService implements Prompts {
  constructor(
    @InjectRepository(PromptTemplate)
    private templates: Repository<PromptTemplate>,
  ) {}

  async resolve(slot: AiSlot) {
    const row = await this.templates.findOneBy({ slot });
    return row?.text ?? DEFAULT_PROMPTS[slot].text;
  }

  async list() {
    const rows = await this.templates.find();
    const bySlot = new Map(rows.map((r) => [r.slot, r]));
    return AI_SLOTS.map((slot) => this.info(slot, bySlot.get(slot)));
  }

  async update(slot: AiSlot, text: string) {
    this.assertSlot(slot);
    const saved = await this.templates.save({ slot, text: text.trim() });
    return this.info(slot, saved);
  }

  async reset(slot: AiSlot) {
    this.assertSlot(slot);
    await this.templates.delete({ slot });
    return this.info(slot);
  }

  private info(slot: AiSlot, row?: PromptTemplate | null): PromptInfo {
    const { title, text } = DEFAULT_PROMPTS[slot];
    return {
      slot,
      title,
      text: row?.text ?? text,
      isDefault: !row,
      defaultText: text,
      updatedAt: row?.updatedAt ?? null,
    };
  }

  private assertSlot(slot: string): asserts slot is AiSlot {
    if (!(AI_SLOTS as readonly string[]).includes(slot))
      throw new BadRequestException('Unknown prompt slot');
  }
}

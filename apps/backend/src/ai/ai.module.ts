import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AI_AGENT, PROMPTS } from '../shared';
import { PromptTemplate } from './entities/prompt-template.entity';
import { AgentClient } from './services/agent-client.service';
import { PromptsService } from './services/prompts.service';

/**
 * Инфраструктура ИИ: вызов внешнего агента и промпты слотов. О тренерах и
 * программах не знает — данные приходят готовым текстом.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PromptTemplate])],
  providers: [
    PromptsService,
    AgentClient,
    { provide: AI_AGENT, useExisting: AgentClient },
    { provide: PROMPTS, useExisting: PromptsService },
  ],
  exports: [AI_AGENT, PROMPTS],
})
export class AiModule {}

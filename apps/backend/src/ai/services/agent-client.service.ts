import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiAgent, AiSlot } from '../../shared';
import { buildEnvelope, parseAgentResponse } from './envelope';
import { PromptsService } from './prompts.service';

/** Переменная с URL агента для слота; без неё — общий AI_AGENT_INVOKE_URL. */
const SLOT_URL_ENV: Record<AiSlot, string> = {
  journal_analysis: 'AI_AGENT_INVOKE_JOURNAL_URL',
  program_review: 'AI_AGENT_INVOKE_PROGRAM_URL',
};

/** Ответ модели на большой дневник бывает долгим, но не дольше этого. */
const TIMEOUT_MS = 90_000;

export class AgentError extends Error {}

/**
 * HTTP-клиент внешнего агента (платформа ultra-ai): `POST <url>`, ключ в
 * `x-api-key`, тело `{ message }` с конвертом SYSTEM_PROMPT + DATA.
 */
@Injectable()
export class AgentClient implements AiAgent {
  private readonly logger = new Logger(AgentClient.name);

  constructor(
    private config: ConfigService,
    private prompts: PromptsService,
  ) {}

  async run(slot: AiSlot, data: string) {
    const url =
      this.config.get<string>(SLOT_URL_ENV[slot]) ||
      this.config.get<string>('AI_AGENT_INVOKE_URL');
    const key = this.config
      .get<string>('AI_AGENT_API_KEY')
      ?.replace(/^["']|["']$/g, '');
    if (!url || !key) throw new AgentError('AI agent is not configured');

    const message = buildEnvelope(await this.prompts.resolve(slot), data);
    const started = Date.now();
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      throw new AgentError(
        `AI agent unreachable: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    const text = await res.text();
    this.logger.log(`${slot}: ${res.status} in ${Date.now() - started} ms`);
    if (!res.ok)
      throw new AgentError(
        `AI agent responded ${res.status}: ${text.slice(0, 300)}`,
      );

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      body = { reply: text };
    }
    const parsed = parseAgentResponse(body);
    if (!parsed)
      throw new AgentError(`AI agent reply is not JSON: ${text.slice(0, 300)}`);
    return parsed;
  }
}

/**
 * Платформа агента принимает одно поле `message`, поэтому инструкция и данные
 * едут одним текстом между маркерами. Маркеры вырезаются из данных: заметка
 * клиента не может закрыть секцию DATA и объявить себя инструкцией.
 * Контракт агента — docs/ai-agent-contract.md.
 */
const MARKER = /<<<[A-Z_]+>>>/g;

export function buildEnvelope(system: string, data: string) {
  return [
    '<<<SYSTEM_PROMPT>>>',
    system.trim(),
    '<<<END_SYSTEM_PROMPT>>>',
    '',
    '<<<DATA>>>',
    data.replace(MARKER, '').trim(),
    '<<<END_DATA>>>',
  ].join('\n');
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** JSON-объект из текста ответа: допускаем ```json-блок и мусор вокруг скобок. */
export function extractJson(text: string): Record<string, unknown> | null {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)?.[1] ?? text;
  const start = fenced.indexOf('{');
  const end = fenced.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(fenced.slice(start, end + 1));
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Две формы ответа: поля верхнего уровня или `{ reply: "<json>" }` (так
 * отвечают агенты-чатботы ultra-ai).
 */
export function parseAgentResponse(
  body: unknown,
): Record<string, unknown> | null {
  if (!isObject(body)) return null;
  if (typeof body.reply === 'string') return extractJson(body.reply);
  if (isObject(body.reply)) return body.reply;
  return body;
}

import type { AiSlot } from '../../shared';
import { journalAnalysisPrompt } from './journal-analysis.prompt';
import { programReviewPrompt } from './program-review.prompt';

/** Встроенные промпты: действуют, пока админ не изменил текст. */
export const DEFAULT_PROMPTS: Record<AiSlot, { title: string; text: string }> =
  {
    journal_analysis: {
      title: 'Анализ дневника',
      text: journalAnalysisPrompt,
    },
    program_review: {
      title: 'Правки программы',
      text: programReviewPrompt,
    },
  };

import type { ValueTransformer } from 'typeorm';

/** Postgres отдаёт numeric строкой — в сущностях держим число. */
export const numeric: ValueTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};

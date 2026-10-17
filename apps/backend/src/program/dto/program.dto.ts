import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ISO_DATE } from '../../shared';
import {
  GROUPS,
  GYM_DAYS,
  MUSCLES,
  UNITS,
  type DayPlan,
  type WorkoutType,
  type Group,
  type Muscle,
  type Unit,
} from '../program.types';

/** id тренировки сплита: латиница, цифры, дефис. */
const WORKOUT_ID = /^[a-z0-9-]{1,20}$/;

export class WeekPlanDto {
  @IsInt() @Min(1) @Max(20) sets: number;
  @IsInt() @Min(1) @Max(1000) reps: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000) repsMax?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1000) weight?: number;
  @IsOptional() @IsString() @MaxLength(60) label?: string;
}

export class CreateExerciseDto {
  @ApiProperty() @IsString() @Length(1, 120) name: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  short?: string;
  @ApiProperty({ enum: MUSCLES }) @IsIn(MUSCLES) muscle: Muscle;
  @ApiProperty({ enum: GROUPS }) @IsIn(GROUPS) group: Group;
  @ApiProperty({ enum: UNITS }) @IsIn(UNITS) unit: Unit;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() perSide?: boolean;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Последний рабочий вес; null — план по неделям',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  base?: number | null;

  @ApiProperty() @IsNumber() @Min(0) @Max(50) step: number;

  @ApiPropertyOptional({
    default: 3,
    description: 'Подходов (с рабочим весом)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  targetSets?: number;

  @ApiPropertyOptional({ default: 12, description: 'Нижняя граница повторов' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  repsMin?: number;

  @ApiPropertyOptional({ default: 15, description: 'Верхняя граница повторов' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  repsMax?: number;

  @ApiPropertyOptional({ type: [WeekPlanDto], nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => WeekPlanDto)
  weeks?: WeekPlanDto[] | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  alternativeOf?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  tips?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Тренировки сплита (id); пусто — во всех',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @Matches(WORKOUT_ID, { each: true })
  workouts?: string[];

  @ApiPropertyOptional({
    type: [Number],
    description: 'Дни недели 0–6 (0 — пн); пусто — все дни тренировок',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  days?: number[];
}

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}

export class ReorderDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  ids: string[];
}

export class BasesDto {
  @ApiProperty({ example: { bench: 55 } })
  @IsObject()
  bases: Record<string, number>;
}

export class DayPlanDto implements DayPlan {
  @IsIn(GYM_DAYS) gym: DayPlan['gym'];
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(WORKOUT_ID)
  workout?: string | null;
  @IsString() @MaxLength(40) title: string;
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  extras: string[];
}

export class WorkoutTypeDto implements WorkoutType {
  @Matches(WORKOUT_ID) id: string;
  @IsString() @Length(1, 30) title: string;
}

export class UpdateSettingsDto {
  @ApiPropertyOptional({ type: [WorkoutTypeDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WorkoutTypeDto)
  workouts?: WorkoutTypeDto[];

  @ApiPropertyOptional({ example: '2026-10-12' })
  @IsOptional()
  @Matches(ISO_DATE)
  startDate?: string;

  @ApiPropertyOptional({ example: { bridge: 'bridge1' } })
  @IsOptional()
  @IsObject()
  swaps?: Record<string, string>;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(ISO_DATE)
  resetAt?: string | null;

  @ApiPropertyOptional({ type: [DayPlanDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => DayPlanDto)
  schedule?: DayPlanDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  rules?: string[];
}

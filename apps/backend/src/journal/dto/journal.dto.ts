import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
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
  ValidateNested,
} from 'class-validator';
import { ISO_DATE } from '../../shared';
import { ACTIVITY_KINDS, type ActivityKind } from '../entities/activity.entity';

export class CreateEntryDto {
  @ApiProperty({ example: '2026-10-12' }) @Matches(ISO_DATE) date: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(520) week?:
    number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) exerciseId?:
    string | null;
  @ApiProperty() @IsString() @Length(1, 160) exercise: string;
  @ApiProperty() @IsInt() @Min(0) @Max(100) sets: number;
  @ApiProperty() @IsInt() @Min(0) @Max(10_000) reps: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(2000) weight: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10) pain?:
    number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Max(10) effort?:
    number | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ type: [Number], description: 'Повторы по подходам' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(10_000, { each: true })
  setReps?: number[] | null;
}

export class UpdateEntryDto extends PartialType(CreateEntryDto) {}

export class ImportEntriesDto {
  @ApiProperty({ type: [CreateEntryDto] })
  @IsArray()
  @ArrayMaxSize(20_000)
  @ValidateNested({ each: true })
  @Type(() => CreateEntryDto)
  entries: CreateEntryDto[];
}

export class DraftsDto {
  @ApiProperty({ example: '2026-10-12' }) @Matches(ISO_DATE) date: string;
  @ApiProperty({
    description: 'exerciseId → { weight, sets, reps, pain, effort, notes }',
  })
  @IsObject()
  items: Record<string, unknown>;
}

export class CreateActivityDto {
  @ApiProperty({ example: '2026-11-17' }) @Matches(ISO_DATE) date: string;

  @ApiProperty({ enum: ACTIVITY_KINDS })
  @IsIn(ACTIVITY_KINDS)
  kind: ActivityKind;

  @ApiPropertyOptional({ description: 'Бассейн: длина дорожки, м' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  poolLength?: number;

  @ApiPropertyOptional({ description: 'Бассейн: сколько раз проплыл дорожку' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  laps?: number;

  @ApiPropertyOptional({ description: 'Велосипед: дистанция, м' })
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(500_000)
  distanceM?: number;

  @ApiProperty({ description: 'Время, с' })
  @IsInt()
  @Min(1)
  @Max(86_400)
  durationSec: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

/** Вид не меняется: `kind` в правке отбрасывается (whitelist). */
export class UpdateActivityDto extends PartialType(
  OmitType(CreateActivityDto, ['kind'] as const),
) {}

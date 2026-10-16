import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
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
}

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

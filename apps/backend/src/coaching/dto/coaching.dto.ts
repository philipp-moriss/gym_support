import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PROGRAM_TEMPLATES, type ProgramTemplate } from '../../shared';

export class CreateClientDto {
  @ApiProperty({ example: 'Анна' }) @IsString() @Length(1, 80) name: string;

  @ApiPropertyOptional({ enum: PROGRAM_TEMPLATES, default: 'back' })
  @IsOptional()
  @IsIn(PROGRAM_TEMPLATES)
  template?: ProgramTemplate;
}

export class RenameClientDto {
  @ApiProperty({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  alias: string | null;
}

export class NotesDto {
  @ApiProperty({ description: 'Болезни, травмы, ограничения, цели' })
  @IsString()
  @MaxLength(4000)
  text: string;
}

export class AcceptInviteDto {
  @ApiProperty({ example: 'K7MX2P' }) @IsString() @Length(4, 20) code: string;
}

export class WeekPlanChangeDto {
  @IsInt() @Min(1) @Max(20) sets: number;
  @IsInt() @Min(1) @Max(1000) reps: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000) repsMax?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1000) weight?: number;
  @IsOptional() @IsString() @MaxLength(60) label?: string;
}

export class ExerciseChangeDto {
  @ApiProperty() @IsString() @Length(1, 40) exerciseId: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  base?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  step?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  targetSets?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  repsMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  repsMax?: number;

  @ApiPropertyOptional({ type: [WeekPlanChangeDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => WeekPlanChangeDto)
  weeks?: WeekPlanChangeDto[];

  @ApiProperty() @IsString() @MaxLength(500) reason: string;
}

export class ApplyChangesDto {
  @ApiProperty({ type: [ExerciseChangeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ExerciseChangeDto)
  changes: ExerciseChangeDto[];
}

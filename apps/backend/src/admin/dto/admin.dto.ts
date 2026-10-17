import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class AdminLoginDto {
  @ApiProperty() @IsString() @Length(1, 40) login: string;
  @ApiProperty() @IsString() @Length(1, 200) password: string;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'anna' })
  @Matches(/^[a-zA-Z0-9._-]{3,40}$/)
  login: string;

  @ApiProperty({ minLength: 10 }) @IsString() @Length(10, 200) password: string;
}

export class CreateCoachDto {
  @ApiProperty({ example: 'Иван Петров' })
  @IsString()
  @Length(1, 80)
  name: string;
}

export class UpdateCoachDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 80) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() disabled?: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'null — по умолчанию' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsInt()
  @Min(0)
  @Max(1000)
  aiDailyLimit?: number | null;
}

export class AssignCoachDto {
  @ApiProperty({ nullable: true })
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  coachId: string | null;
}

export class UpdateClientDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() disabled?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(80)
  name?: string | null;
}

export class PromptDto {
  @ApiProperty() @IsString() @Length(20, 20000) text: string;
}

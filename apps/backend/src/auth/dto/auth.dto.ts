import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { PROGRAM_TEMPLATES, type ProgramTemplate } from '../../shared';

export class RegisterDto {
  @ApiProperty({ enum: PROGRAM_TEMPLATES, required: false, default: 'back' })
  @IsOptional()
  @IsIn(PROGRAM_TEMPLATES)
  template?: ProgramTemplate;
}

export class CodeLoginDto {
  @ApiProperty({ example: 'otter-4821' })
  @IsString()
  @Length(1, 40)
  login: string;

  @ApiProperty({ example: '042917' })
  @Matches(/^\d{6}$/)
  code: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @Length(1, 200)
  refreshToken: string;
}

export class ChangeCodeDto {
  @ApiProperty({ example: '042917' })
  @Matches(/^\d{6}$/)
  currentCode: string;
}

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

  /** 6 цифр у старых аккаунтов, 8 — у новых. */
  @ApiProperty({ example: '04291735' })
  @Matches(/^(\d{6}|\d{8})$/)
  code: string;
}

export class CodeOnlyLoginDto {
  @ApiProperty({ example: '04291735' })
  @Matches(/^\d{8}$/)
  code: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  @Length(1, 200)
  refreshToken: string;
}

export class ChangeCodeDto {
  @ApiProperty({ example: '04291735' })
  @Matches(/^(\d{6}|\d{8})$/)
  currentCode: string;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../shared';
import {
  BasesDto,
  CreateExerciseDto,
  ReorderDto,
  UpdateExerciseDto,
  UpdateSettingsDto,
} from '../dto/program.dto';
import { ProgramService } from '../services/program.service';

@ApiTags('program')
@ApiBearerAuth()
@Controller('program')
export class ProgramController {
  constructor(private program: ProgramService) {}

  /** Упражнения (по порядку) и настройки цикла. */
  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.program.get(user.id);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.program.updateSettings(user.id, dto);
  }

  @Post('exercises')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExerciseDto) {
    return this.program.createExercise(user.id, dto);
  }

  @Put('exercises/order')
  reorder(@CurrentUser() user: AuthUser, @Body() dto: ReorderDto) {
    return this.program.reorder(user.id, dto.ids);
  }

  @Patch('exercises/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExerciseDto,
  ) {
    return this.program.updateExercise(user.id, id, dto);
  }

  @Delete('exercises/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.program.deleteExercise(user.id, id);
  }

  @Post('bases')
  @HttpCode(200)
  setBases(@CurrentUser() user: AuthUser, @Body() dto: BasesDto) {
    return this.program.setBases(user.id, dto.bases);
  }
}

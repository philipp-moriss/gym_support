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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  CoachAccess,
  CurrentUser,
  type AuthUser,
  type ProgramActor,
} from '../../shared';
import {
  BasesDto,
  CreateExerciseDto,
  ReorderDto,
  UpdateExerciseDto,
  UpdateSettingsDto,
} from '../dto/program.dto';
import { ProgramService } from '../services/program.service';

/** Тренер от имени клиента: его правки попадают в журнал правок клиента. */
const actorOf = (user: AuthUser): ProgramActor | undefined =>
  user.actorId ? { id: user.actorId, source: 'manual' } : undefined;

@ApiTags('program')
@ApiBearerAuth()
@CoachAccess('write')
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
    return this.program.updateSettings(user.id, dto, actorOf(user));
  }

  @Post('exercises')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExerciseDto) {
    return this.program.createExercise(user.id, dto, actorOf(user));
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
    return this.program.updateExercise(user.id, id, dto, actorOf(user));
  }

  @Delete('exercises/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.program.deleteExercise(user.id, id, actorOf(user));
  }

  @Post('bases')
  @HttpCode(200)
  setBases(@CurrentUser() user: AuthUser, @Body() dto: BasesDto) {
    return this.program.setBases(user.id, dto.bases, actorOf(user));
  }
}

/**
 * Правки программы тренером — для самого клиента. Тренеру от имени клиента
 * недоступно: «просмотрено» отмечает только клиент.
 */
@ApiTags('program')
@ApiBearerAuth()
@Controller('program/changes')
export class ProgramChangesController {
  constructor(private program: ProgramService) {}

  @ApiQuery({ name: 'unseen', required: false, type: Boolean })
  @Get()
  list(@CurrentUser() user: AuthUser, @Query('unseen') unseen?: string) {
    return unseen === 'true'
      ? this.program.unseenChanges(user.id)
      : this.program.listChanges(user.id);
  }

  @Post('seen')
  @HttpCode(204)
  seen(@CurrentUser() user: AuthUser) {
    return this.program.markChangesSeen(user.id);
  }
}

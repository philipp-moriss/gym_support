import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthUser } from '../../shared';
import {
  AcceptInviteDto,
  ApplyChangesDto,
  CreateClientDto,
  NotesDto,
  RenameClientDto,
} from '../dto/coaching.dto';
import { AnalysesService } from '../services/analyses.service';
import { CoachingService } from '../services/coaching.service';

/**
 * Кабинет тренера. Программа и дневник клиента — обычные `/program`,
 * `/journal/entries` с заголовком `X-Client-Id`.
 */
@ApiTags('coach')
@ApiBearerAuth()
@Roles('coach')
@Controller('coach')
export class CoachController {
  constructor(
    private coaching: CoachingService,
    private analyses: AnalysesService,
  ) {}

  @Get('clients')
  clients(@CurrentUser() coach: AuthUser) {
    return this.coaching.clients(coach.id);
  }

  /** Новый клиент: код входа в ответе один раз — передать клиенту. */
  @Post('clients')
  createClient(@CurrentUser() coach: AuthUser, @Body() dto: CreateClientDto) {
    return this.coaching.createClient(
      coach.id,
      dto.name,
      dto.template ?? 'back',
    );
  }

  @Get('clients/:id')
  client(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coaching.client(coach.id, id);
  }

  @Patch('clients/:id')
  rename(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameClientDto,
  ) {
    return this.coaching.rename(coach.id, id, dto.alias);
  }

  @Delete('clients/:id')
  @HttpCode(204)
  unlink(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coaching.unlink(coach.id, id);
  }

  @Post('invites')
  createInvite(@CurrentUser() coach: AuthUser) {
    return this.coaching.createInvite(coach.id);
  }

  @Get('invites')
  invites(@CurrentUser() coach: AuthUser) {
    return this.coaching.activeInvites(coach.id);
  }

  @Get('clients/:id/notes')
  notes(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coaching.getNotes(coach.id, id);
  }

  @Put('clients/:id/notes')
  saveNotes(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: NotesDto,
  ) {
    return this.coaching.saveNotes(coach.id, id, dto.text);
  }

  /** История правок программы клиента (тренером и ИИ). */
  @Get('clients/:id/changes')
  changes(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.coaching.changes(coach.id, id);
  }

  @Get('clients/:id/analyses')
  analysesList(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.analyses.list(coach.id, id);
  }

  /** Запуск анализа: ответ сразу (status pending), результат — опросом. 429 — лимит на сутки. */
  @Post('clients/:id/analyses')
  @HttpCode(202)
  startAnalysis(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.analyses.start(coach.id, id);
  }

  @Get('clients/:id/analyses/:aid')
  analysis(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('aid', ParseUUIDPipe) aid: string,
  ) {
    return this.analyses.get(coach.id, id, aid);
  }

  /** Применить выбранные правки ИИ. Всё или ничего; в ответе — программа клиента. */
  @Post('clients/:id/analyses/:aid/apply')
  @HttpCode(200)
  apply(
    @CurrentUser() coach: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('aid', ParseUUIDPipe) aid: string,
    @Body() dto: ApplyChangesDto,
  ) {
    return this.analyses.apply(coach.id, id, aid, dto.changes);
  }
}

/** Тренер глазами клиента: кто ведёт, привязка по коду, отвязка. */
@ApiTags('coaching')
@ApiBearerAuth()
@Controller('coaching')
export class ClientCoachingController {
  constructor(private coaching: CoachingService) {}

  @Get('coach')
  coach(@CurrentUser() user: AuthUser) {
    return this.coaching.coachOf(user.id);
  }

  @Post('link')
  @HttpCode(200)
  link(@CurrentUser() user: AuthUser, @Body() dto: AcceptInviteDto) {
    return this.coaching.acceptInvite(user.id, dto.code);
  }

  @Delete('link')
  @HttpCode(204)
  leave(@CurrentUser() user: AuthUser) {
    return this.coaching.leaveCoach(user.id);
  }
}

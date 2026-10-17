import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { AdminOnly, PROMPTS, type AiSlot, type Prompts } from '../../shared';
import {
  AdminLoginDto,
  AssignCoachDto,
  CreateAdminDto,
  CreateCoachDto,
  PromptDto,
  UpdateClientDto,
  UpdateCoachDto,
} from '../dto/admin.dto';
import { AdminRoute, type AdminUser } from '../guards/admin.guard';
import { AdminPanelService } from '../services/admin-panel.service';
import { AdminsService } from '../services/admins.service';

@ApiTags('admin')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private admins: AdminsService) {}

  /** 5 неверных паролей подряд — блокировка на 15 минут; плюс лимит по IP. */
  @AdminOnly()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: AdminLoginDto) {
    return this.admins.login(dto.login, dto.password);
  }

  @AdminRoute()
  @Get('me')
  me(@Req() req: Request & { admin: AdminUser }) {
    return req.admin;
  }
}

@ApiTags('admin')
@AdminRoute()
@Controller('admin')
export class AdminController {
  constructor(
    private panel: AdminPanelService,
    private admins: AdminsService,
    @Inject(PROMPTS) private prompts: Prompts,
  ) {}

  @Get('coaches')
  coaches() {
    return this.panel.coaches();
  }

  /** Новый тренер: код входа в ответе один раз. */
  @Post('coaches')
  createCoach(@Body() dto: CreateCoachDto) {
    return this.panel.createCoach(dto.name);
  }

  @Patch('coaches/:id')
  updateCoach(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCoachDto,
  ) {
    return this.panel.updateCoach(id, dto);
  }

  /** Новый код тренеру: старый перестаёт работать, все его сессии закрываются. */
  @Post('coaches/:id/code')
  @HttpCode(200)
  resetCode(@Param('id', ParseUUIDPipe) id: string) {
    return this.panel.resetCode(id);
  }

  @Get('clients')
  clients() {
    return this.panel.clients();
  }

  @Patch('clients/:id')
  updateClient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.panel.updateClient(id, dto);
  }

  @Put('clients/:id/coach')
  @HttpCode(204)
  assign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignCoachDto) {
    return this.panel.assign(id, dto.coachId);
  }

  @Get('prompts')
  promptList() {
    return this.prompts.list();
  }

  @Put('prompts/:slot')
  updatePrompt(@Param('slot') slot: AiSlot, @Body() dto: PromptDto) {
    return this.prompts.update(slot, dto.text);
  }

  /** Вернуть встроенный текст промпта. */
  @Delete('prompts/:slot')
  resetPrompt(@Param('slot') slot: AiSlot) {
    return this.prompts.reset(slot);
  }

  @Get('ai/stats')
  aiStats() {
    return this.panel.aiStats();
  }

  @Get('admins')
  adminList() {
    return this.admins.list();
  }

  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.admins.create(dto.login, dto.password);
  }
}

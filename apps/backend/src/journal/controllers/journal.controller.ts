import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthUser } from '../../shared';
import {
  CreateEntryDto,
  DraftsDto,
  ImportEntriesDto,
  UpdateEntryDto,
} from '../dto/journal.dto';
import { DraftsService } from '../services/drafts.service';
import { EntriesService } from '../services/entries.service';

@ApiTags('journal')
@ApiBearerAuth()
@Controller('journal')
export class JournalController {
  constructor(
    private entries: EntriesService,
    private drafts: DraftsService,
  ) {}

  /** Все записи, новые сверху. */
  @Get('entries')
  list(@CurrentUser() user: AuthUser) {
    return this.entries.list(user.id);
  }

  @Post('entries')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEntryDto) {
    return this.entries.create(user.id, dto);
  }

  /** Загрузка из Excel или старой версии: `{ added, skipped }`. */
  @Post('entries/import')
  @HttpCode(200)
  import(@CurrentUser() user: AuthUser, @Body() dto: ImportEntriesDto) {
    return this.entries.import(user.id, dto.entries);
  }

  /** Исправить запись. */
  @Patch('entries/:id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEntryDto,
  ) {
    return this.entries.update(user.id, id, dto);
  }

  @Delete('entries/:id')
  @HttpCode(204)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.entries.remove(user.id, id);
  }

  /** Полный сброс дневника: записи и черновики. */
  @Delete()
  @HttpCode(204)
  async clear(@CurrentUser() user: AuthUser) {
    await this.entries.removeAll(user.id);
    await this.drafts.clear(user.id);
  }

  @Get('drafts')
  getDrafts(@CurrentUser() user: AuthUser) {
    return this.drafts.get(user.id);
  }

  @Put('drafts')
  putDrafts(@CurrentUser() user: AuthUser, @Body() dto: DraftsDto) {
    return this.drafts.put(user.id, dto.date, dto.items);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JOURNAL } from '../shared';
import { JournalController } from './controllers/journal.controller';
import { Drafts } from './entities/drafts.entity';
import { Entry } from './entities/entry.entity';
import { DraftsService } from './services/drafts.service';
import { EntriesService } from './services/entries.service';

/** Дневник: записи тренировок, импорт и черновики правок. */
@Module({
  imports: [TypeOrmModule.forFeature([Entry, Drafts])],
  controllers: [JournalController],
  providers: [
    EntriesService,
    DraftsService,
    { provide: JOURNAL, useExisting: EntriesService },
  ],
  exports: [JOURNAL],
})
export class JournalModule {}

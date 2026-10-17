import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts';
import { AiModule } from '../ai';
import { JournalModule } from '../journal';
import { ProgramModule } from '../program';
import { COACH_LINKS, COACHING_ADMIN } from '../shared';
import {
  ClientCoachingController,
  CoachController,
} from './controllers/coach.controller';
import { AiAnalysis } from './entities/ai-analysis.entity';
import { ClientNote } from './entities/client-note.entity';
import { CoachClient } from './entities/coach-client.entity';
import { CoachInvite } from './entities/coach-invite.entity';
import { AnalysesService } from './services/analyses.service';
import { CoachingService } from './services/coaching.service';

/** Тренеры и их клиенты: привязки, приглашения, карточки, ИИ-анализ прогресса. */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      CoachClient,
      CoachInvite,
      ClientNote,
      AiAnalysis,
    ]),
    AccountsModule,
    ProgramModule,
    JournalModule,
    AiModule,
  ],
  controllers: [CoachController, ClientCoachingController],
  providers: [
    CoachingService,
    AnalysesService,
    { provide: COACH_LINKS, useExisting: CoachingService },
    { provide: COACHING_ADMIN, useExisting: CoachingService },
  ],
  exports: [COACH_LINKS, COACHING_ADMIN],
})
export class CoachingModule {}

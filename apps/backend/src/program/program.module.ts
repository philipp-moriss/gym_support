import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROGRAM, PROGRAM_SEEDER } from '../shared';
import {
  ProgramChangesController,
  ProgramController,
} from './controllers/program.controller';
import { Exercise } from './entities/exercise.entity';
import { ProgramChange } from './entities/program-change.entity';
import { ProgramSettings } from './entities/program-settings.entity';
import { ProgramService } from './services/program.service';

/** Программа тренировок пользователя: свои упражнения, веса, расписание, журнал правок тренера. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Exercise, ProgramSettings, ProgramChange]),
  ],
  controllers: [ProgramChangesController, ProgramController],
  providers: [
    ProgramService,
    { provide: PROGRAM_SEEDER, useExisting: ProgramService },
    { provide: PROGRAM, useExisting: ProgramService },
  ],
  exports: [PROGRAM_SEEDER, PROGRAM],
})
export class ProgramModule {}

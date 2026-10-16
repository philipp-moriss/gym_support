import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PROGRAM_SEEDER } from '../shared';
import { ProgramController } from './controllers/program.controller';
import { Exercise } from './entities/exercise.entity';
import { ProgramSettings } from './entities/program-settings.entity';
import { ProgramService } from './services/program.service';

/** Программа тренировок пользователя: свои упражнения, веса, расписание. */
@Module({
  imports: [TypeOrmModule.forFeature([Exercise, ProgramSettings])],
  controllers: [ProgramController],
  providers: [
    ProgramService,
    { provide: PROGRAM_SEEDER, useExisting: ProgramService },
  ],
  exports: [PROGRAM_SEEDER],
})
export class ProgramModule {}

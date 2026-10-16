import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCOUNTS } from '../shared';
import { Account } from './entities/account.entity';
import { AccountsService } from './services/accounts.service';

/** Аккаунты: выдача логина и кода, проверка кода с лимитом попыток. */
@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [
    AccountsService,
    { provide: ACCOUNTS, useExisting: AccountsService },
  ],
  exports: [ACCOUNTS],
})
export class AccountsModule {}

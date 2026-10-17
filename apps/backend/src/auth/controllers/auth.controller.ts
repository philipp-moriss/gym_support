import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public, Roles, type AuthUser } from '../../shared';
import {
  ChangeCodeDto,
  CodeLoginDto,
  CodeOnlyLoginDto,
  RefreshDto,
  RegisterDto,
} from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Roles('client', 'coach')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  /** Новый аккаунт: логин и код показываются один раз. */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.auth.register(dto.template, userAgent);
  }

  /**
   * Вход одним 8-значным кодом. Код ни к чему не привязан до проверки, поэтому
   * подбор режется по IP: 5 попыток в минуту и общий дневной лимит.
   */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login/code')
  @HttpCode(200)
  loginByCode(
    @Body() dto: CodeOnlyLoginDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.auth.loginByCode(dto.code, userAgent);
  }

  /** Вход по логину и коду (старые аккаунты). После 5 ошибок подряд — блокировка на 15 минут. */
  @Public()
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: CodeLoginDto, @Headers('user-agent') userAgent?: string) {
    return this.auth.loginWithCode(dto.login, dto.code, userAgent);
  }

  /** Обмен refresh-токена на новую пару. Старый refresh больше не работает. */
  @Public()
  @UseGuards(ThrottlerGuard)
  // Обновление идёт каждые 15 минут у каждого устройства: дневной лимит входа к нему не относится.
  @SkipThrottle({ daily: true })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto, @Headers('user-agent') userAgent?: string) {
    return this.auth.refresh(dto.refreshToken, userAgent);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  /**
   * Новый код вместо текущего: тот же лимит попыток, что и при входе. Все
   * прежние сессии закрываются; в ответе новая пара токенов и код (один раз).
   */
  @ApiBearerAuth()
  @UseGuards(ThrottlerGuard)
  @Post('code')
  @HttpCode(200)
  changeCode(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeCodeDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.auth.changeCode(user, dto.currentCode, userAgent);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}

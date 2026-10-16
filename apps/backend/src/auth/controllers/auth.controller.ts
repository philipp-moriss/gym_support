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
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser, Public, type AuthUser } from '../../shared';
import { CodeLoginDto, RefreshDto, RegisterDto } from '../dto/auth.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
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

  /** Вход по логину и 6-значному коду. После 5 ошибок подряд — блокировка на 15 минут. */
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

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }
}

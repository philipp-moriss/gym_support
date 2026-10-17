import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AdminOnly } from '../../shared';
import { AdminsService } from '../services/admins.service';

export interface AdminUser {
  id: string;
  login: string;
}

/** Токен админки (`aud: admin`); пользовательские токены сюда не подходят. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private admins: AdminsService) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<Request & { admin?: AdminUser }>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();
    const admin = await this.admins.verify(token);
    if (!admin) throw new UnauthorizedException();
    request.admin = admin;
    return true;
  }
}

/** Маршрут админки: глобальный guard пропускает, проверяет AdminGuard. */
export const AdminRoute = () =>
  applyDecorators(AdminOnly(), UseGuards(AdminGuard), ApiBearerAuth());

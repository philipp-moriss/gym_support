import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // За прокси (Railway, nginx) лимит попыток считается по IP клиента.
  app.set('trust proxy', 1);
  app.enableCors({ origin: true });
  // Импорт из Excel может быть большим: тысячи записей.
  app.useBodyParser('json', { limit: '5mb' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Журнал тренировок API')
    .setDescription('Аккаунты по коду, программа пользователя, дневник')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'docs',
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = process.env.PORT ?? 3020;
  await app.listen(port);
  console.log(`Backend running at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}
void bootstrap();

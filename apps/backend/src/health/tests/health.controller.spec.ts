import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthController } from '../controllers/health.controller';

describe('HealthController', () => {
  it('reports ok when DB answers', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: { query: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();
    await expect(moduleRef.get(HealthController).check()).resolves.toEqual({
      status: 'ok',
      db: 'up',
    });
  });
});

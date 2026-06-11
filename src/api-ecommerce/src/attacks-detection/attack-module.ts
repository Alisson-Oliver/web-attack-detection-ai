import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AttackMiddleware } from './attack.middleware';
import { AttackCacheService } from './attack-cache.service';

@Module({
  imports: [HttpModule],
  providers: [AttackCacheService], 
  exports: [AttackCacheService] 
})
export class AttackModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AttackMiddleware)
      .forRoutes('*');
  }
}
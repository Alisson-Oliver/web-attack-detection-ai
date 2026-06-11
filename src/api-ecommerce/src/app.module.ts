import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import { AttackModule } from './attacks-detection/attack-module';

@Module({
  imports: [
    HttpModule,
    AttackModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

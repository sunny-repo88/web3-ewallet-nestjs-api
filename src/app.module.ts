import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { TransactionService } from './transaction.service';

@Module({
  imports: [ConfigModule.forRoot({ envFilePath: '.env' })],
  controllers: [AppController],
  providers: [AppService, TransactionService, PrismaService],
})
export class AppModule { }

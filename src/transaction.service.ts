import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async createTransactions(walletAddress, transactions) {
    await this.prisma.$transaction([
      this.prisma.transaction.deleteMany({
        where: {
          wallet_id: walletAddress,
        },
      }),
      this.prisma.transaction.createMany({ data: transactions }),
    ]);
  }
}

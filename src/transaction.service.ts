import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) { }

  async getTransactions(walletAddress) {
    return this.prisma.transaction.findMany({
      where: {
        wallet_id: walletAddress
      }
    })

  }
  async createTransactions(transactions) {
    return this.prisma.transaction.createMany({ data: transactions })
  }
}

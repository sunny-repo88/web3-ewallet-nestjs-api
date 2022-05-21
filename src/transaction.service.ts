import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class TransactionService {
    constructor(private prisma: PrismaService) { }

    async createTransactions(data) {
        return this.prisma.transaction.createMany({
            data,
        });
    }
}
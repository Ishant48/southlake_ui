import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(private readonly accountingService: AccountingService) {}

  async onApplicationBootstrap() {
    console.log('Bootstrapping database seeds...');
    await this.accountingService.seedAll();
  }

  getHello(): string {
    return 'Southlake Advanced Accounting API Server';
  }
}

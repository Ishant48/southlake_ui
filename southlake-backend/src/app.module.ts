import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountingService } from './accounting.service';

// Entities
import { State } from './entities/state.entity';
import { Mga } from './entities/mga.entity';
import { Lob } from './entities/lob.entity';
import { AppType } from './entities/app-type.entity';
import { CoaAccount } from './entities/coa-account.entity';
import { Treaty } from './entities/treaty.entity';
import { TreatyAppType } from './entities/treaty-app-type.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { JournalEntryLine } from './entities/journal-entry-line.entity';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { SubCoa } from './entities/sub-coa.entity';
import { GlMap } from './entities/gl-map.entity';
import { TreatySequence } from './entities/treaty-sequence.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Rohitpk27',
      database: 'coa',
      entities: [
        State,
        Mga,
        Lob,
        AppType,
        CoaAccount,
        Treaty,
        TreatyAppType,
        JournalEntry,
        JournalEntryLine,
        ChartOfAccount,
        SubCoa,
        GlMap,
        TreatySequence,
      ],
      synchronize: true, // For development/prototyping, synchronize schema automatically
      logging: false,
    }),
    TypeOrmModule.forFeature([
      State,
      Mga,
      Lob,
      AppType,
      CoaAccount,
      Treaty,
      TreatyAppType,
      JournalEntry,
      JournalEntryLine,
      ChartOfAccount,
      SubCoa,
      GlMap,
      TreatySequence,
    ]),
  ],
  controllers: [AppController],
  providers: [AppService, AccountingService],
})
export class AppModule {}


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';

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

// DTOs
import {
  CreateStateDto,
  CreateMgaDto,
  CreateLobDto,
  CreateAppTypeDto,
  CreateCoaAccountDto,
  CreateTreatyDto,
  CreateJournalEntryDto,
  CreateChartOfAccountDto,
  CreateSubCoaDto,
  CreateGlMapDto,
} from './dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(State)
    private readonly stateRepo: Repository<State>,
    @InjectRepository(Mga)
    private readonly mgaRepo: Repository<Mga>,
    @InjectRepository(Lob)
    private readonly lobRepo: Repository<Lob>,
    @InjectRepository(AppType)
    private readonly appTypeRepo: Repository<AppType>,
    @InjectRepository(CoaAccount)
    private readonly coaRepo: Repository<CoaAccount>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
    @InjectRepository(TreatyAppType)
    private readonly treatyAppTypeRepo: Repository<TreatyAppType>,
    @InjectRepository(JournalEntry)
    private readonly jeRepo: Repository<JournalEntry>,
    @InjectRepository(JournalEntryLine)
    private readonly jelRepo: Repository<JournalEntryLine>,
    @InjectRepository(ChartOfAccount)
    private readonly chartOfAccountRepo: Repository<ChartOfAccount>,
    @InjectRepository(SubCoa)
    private readonly subCoaRepo: Repository<SubCoa>,
    @InjectRepository(GlMap)
    private readonly glMapRepo: Repository<GlMap>,
    @InjectRepository(TreatySequence)
    private readonly treatySequenceRepo: Repository<TreatySequence>,
  ) {}

  // ==========================================
  // STATE MASTER CRUD
  // ==========================================
  async getStates() {
    return this.stateRepo.find({ order: { name: 'ASC' } });
  }

  async createState(dto: CreateStateDto) {
    const state = this.stateRepo.create(dto);
    return this.stateRepo.save(state);
  }

  async updateState(id: string, dto: Partial<CreateStateDto>) {
    await this.stateRepo.update(id, dto);
    return this.stateRepo.findOne({ where: { id } });
  }

  // ==========================================
  // MGA CRUD
  // ==========================================
  async getMgas() {
    return this.mgaRepo.find({ order: { name: 'ASC' } });
  }

  async createMga(dto: CreateMgaDto) {
    const mga = this.mgaRepo.create(dto);
    return this.mgaRepo.save(mga);
  }

  // ==========================================
  // LOB CRUD
  // ==========================================
  async getLobs() {
    return this.lobRepo.find({ order: { lobName: 'ASC' } });
  }

  async createLob(dto: CreateLobDto) {
    const lob = this.lobRepo.create(dto);
    return this.lobRepo.save(lob);
  }

  async updateLob(lobId: number, dto: Partial<CreateLobDto>) {
    await this.lobRepo.update(lobId, dto);
    return this.lobRepo.findOne({ where: { lobId } });
  }

  async deleteLob(lobId: number) {
    await this.lobRepo.delete(lobId);
    return { deleted: true };
  }

  // ==========================================
  // APP TYPE CRUD
  // ==========================================
  async getAppTypes() {
    return this.appTypeRepo.find({ order: { applicationType: 'ASC' } });
  }

  async createAppType(dto: CreateAppTypeDto) {
    const appType = this.appTypeRepo.create(dto);
    return this.appTypeRepo.save(appType);
  }

  async updateAppType(applicationTypeId: number, dto: Partial<CreateAppTypeDto>) {
    await this.appTypeRepo.update(applicationTypeId, dto);
    return this.appTypeRepo.findOne({ where: { applicationTypeId } });
  }

  async deleteAppType(applicationTypeId: number) {
    await this.appTypeRepo.delete(applicationTypeId);
    return { deleted: true };
  }

  // ==========================================
  // CHART OF ACCOUNTS MASTER CRUD (Falcon)
  // ==========================================
  async getChartOfAccounts() {
    return this.chartOfAccountRepo.find({ order: { subCoaId: 'ASC' } });
  }

  async createChartOfAccount(dto: CreateChartOfAccountDto) {
    const exists = await this.chartOfAccountRepo.findOne({ where: { subCoaId: dto.subCoaId } });
    if (exists) {
      throw new BadRequestException(`Chart of Account with ID ${dto.subCoaId} already exists`);
    }
    const coa = this.chartOfAccountRepo.create(dto);
    return this.chartOfAccountRepo.save(coa);
  }

  async updateChartOfAccount(subCoaId: number, dto: Partial<CreateChartOfAccountDto>) {
    await this.chartOfAccountRepo.update(subCoaId, dto);
    return this.chartOfAccountRepo.findOne({ where: { subCoaId } });
  }

  async deleteChartOfAccount(subCoaId: number) {
    await this.chartOfAccountRepo.delete(subCoaId);
    return { deleted: true };
  }

  // ==========================================
  // SUB COA / CATEGORY MASTER CRUD (Falcon)
  // ==========================================
  async getSubCoas() {
    return this.subCoaRepo.find({ order: { categoryId: 'ASC' } });
  }

  async createSubCoa(dto: CreateSubCoaDto) {
    const exists = await this.subCoaRepo.findOne({ where: { categoryId: dto.categoryId } });
    if (exists) {
      throw new BadRequestException(`Category with ID ${dto.categoryId} already exists`);
    }
    const subCoa = this.subCoaRepo.create(dto);
    return this.subCoaRepo.save(subCoa);
  }

  async updateSubCoa(categoryId: number, dto: Partial<CreateSubCoaDto>) {
    await this.subCoaRepo.update(categoryId, dto);
    return this.subCoaRepo.findOne({ where: { categoryId } });
  }

  async deleteSubCoa(categoryId: number) {
    await this.subCoaRepo.delete(categoryId);
    return { deleted: true };
  }

  // ==========================================
  // GL MAP CRUD (Falcon)
  // ==========================================
  async getGlMaps() {
    return this.glMapRepo.find({ order: { glNumber: 'ASC' } });
  }

  async createGlMap(dto: CreateGlMapDto) {
    const glMap = this.glMapRepo.create(dto);
    return this.glMapRepo.save(glMap);
  }

  async updateGlMap(id: string, dto: Partial<CreateGlMapDto>) {
    await this.glMapRepo.update(id, dto);
    return this.glMapRepo.findOne({ where: { id } });
  }

  async deleteGlMap(id: string) {
    await this.glMapRepo.delete(id);
    return { deleted: true };
  }

  // ==========================================
  // TREATY SEQUENCE CRUD (Falcon)
  // ==========================================
  async getTreatySequences() {
    return this.treatySequenceRepo.find({ order: { sequenceNumber: 'ASC' } });
  }

  // ==========================================
  // CHART OF ACCOUNTS CRUD
  // ==========================================
  async getCoaAccounts() {
    return this.coaRepo.find({
      relations: { mga: true, lob: true, state: true },
      order: { accountNumber: 'ASC' },
    });
  }

  async createCoaAccount(dto: CreateCoaAccountDto) {
    // Check if account number already exists
    const exists = await this.coaRepo.findOne({ where: { accountNumber: dto.accountNumber } });
    if (exists) {
      throw new BadRequestException(`Account number ${dto.accountNumber} already exists`);
    }

    const coaAccount = this.coaRepo.create(dto);
    return this.coaRepo.save(coaAccount);
  }

  async toggleCoaAccountStatus(id: string) {
    const account = await this.coaRepo.findOne({ where: { id } });
    if (!account) {
      throw new NotFoundException(`COA Account with ID ${id} not found`);
    }
    account.status = account.status === 'Active' ? 'Inactive' : 'Active';
    account.updatedAt = new Date();
    return this.coaRepo.save(account);
  }

  // ==========================================
  // TREATY CRUD & Covered App Types Config
  // ==========================================
  async getTreaties() {
    return this.treatyRepo.find({ order: { name: 'ASC' }, relations: { mga: true } });
  }

  async createTreaty(dto: CreateTreatyDto) {
    const treaty = this.treatyRepo.create(dto);
    return this.treatyRepo.save(treaty);
  }

  async getTreatyCoveredAppTypes(treatyId: string) {
    return this.treatyAppTypeRepo.find({
      where: { treatyId },
      relations: { appType: true },
    });
  }

  async updateTreatyCoveredAppTypes(treatyId: string, appTypeIds: number[]) {
    // Clear old ones
    await this.treatyAppTypeRepo.delete({ treatyId });

    // Add new ones
    const newMappings = appTypeIds.map((appTypeId) =>
      this.treatyAppTypeRepo.create({
        treatyId,
        appTypeId,
        cessionSharePercentage: 100.00,
      }),
    );
    return this.treatyAppTypeRepo.save(newMappings);
  }

  async signTreaty(id: string) {
    const treaty = await this.treatyRepo.findOne({ where: { id } });
    if (!treaty) {
      throw new NotFoundException(`Treaty with ID ${id} not found`);
    }
    treaty.status = 'Active';
    return this.treatyRepo.save(treaty);
  }

  // ==========================================
  // JOURNAL ENTRIES & INGESTION
  // ==========================================
  async getJournalEntries() {
    return this.jeRepo.find({
      relations: { lines: { coaAccount: true }, treaty: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createManualJournalEntry(dto: CreateJournalEntryDto) {
    // Generate unique reference number
    const refNum = `JE-MAN-${Date.now().toString().slice(-6)}`;
    
    // Balance check
    let totalDebit = 0;
    let totalCredit = 0;
    for (const l of dto.lines) {
      totalDebit += l.debit;
      totalCredit += l.credit;
    }
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Journal Entry is not balanced. Debits (${totalDebit.toFixed(2)}) must equal Credits (${totalCredit.toFixed(2)}).`);
    }

    const je = this.jeRepo.create({
      description: dto.description || 'Manual Journal Posting',
      referenceNumber: refNum,
      entryDate: new Date(dto.entryDate),
      status: 'Draft',
      source: 'Manual',
    });

    const savedJe = await this.jeRepo.save(je);

    const lines = dto.lines.map((l) =>
      this.jelRepo.create({
        journalEntryId: savedJe.id,
        coaAccountId: l.coaAccountId,
        description: l.description || 'Manual Line Item',
        debit: l.debit,
        credit: l.credit,
        quantity: l.quantity || 0,
      }),
    );

    await this.jelRepo.save(lines);

    return this.jeRepo.findOne({
      where: { id: savedJe.id },
      relations: { lines: { coaAccount: true } },
    });
  }

  extractRowsFromFile(file: Express.Multer.File): any[][] {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    } else {
      const csvContent = file.buffer.toString('utf-8');
      const lines = csvContent.split(/\r?\n/);
      return lines
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, '')));
    }
  }

  async parseTreatyFile(treatyId: string, file: Express.Multer.File) {
    const treaty = await this.treatyRepo.findOne({ where: { id: treatyId } });
    if (!treaty) {
      throw new NotFoundException(`Treaty with ID ${treatyId} not found`);
    }
    if (treaty.status !== 'Active' && treaty.status !== 'In-Force') {
      throw new BadRequestException(`Cannot ingest files for non-active treaty (Current status: ${treaty.status})`);
    }

    // Get covered app types
    const coveredAppTypesMappings = await this.treatyAppTypeRepo.find({
      where: { treatyId },
    });
    const coveredAppTypeIds = new Set(
      coveredAppTypesMappings.map((m) => m.appTypeId),
    );

    const csvToFalconAppTypeMap: Record<string, number> = {
      'COMM_AUTO': 501, // SSIC AL
      'GEN_LIAB': 499,  // SSIC GL (CAS)
      'COMM_PROP': 492, // SSIC Property
      'WORKERS_COMP': 491, // WC FUT
      'INLAND_MARINE': 484, // Cargo Digital Rater
    };

    // standard accounts lookup
    const premiumCededAcct = await this.coaRepo.findOne({ where: { accountNumber: '512000' } });
    const payableAcct = await this.coaRepo.findOne({ where: { accountNumber: '220000' } });
    const commissionAcct = await this.coaRepo.findOne({ where: { accountNumber: '420000' } });
    const recoverableAcct = await this.coaRepo.findOne({ where: { accountNumber: '120000' } });
    const lossesPaidAcct = await this.coaRepo.findOne({ where: { accountNumber: '500010' } });

    if (!premiumCededAcct || !payableAcct || !commissionAcct || !recoverableAcct || !lossesPaidAcct) {
      throw new BadRequestException(
        'Required standard COA accounts (512000, 220000, 420000, 120000, 500010) are missing. Please seed COA first.',
      );
    }

    const rows = this.extractRowsFromFile(file);
    if (rows.length <= 1) {
      throw new BadRequestException('Empty file uploaded');
    }

    const headers = rows[0].map((h) => String(h).trim().replace(/^["']|["']$/g, ''));
    
    const dateIdx = headers.findIndex((h) => h.toLowerCase() === 'transaction date');
    const appTypeIdx = headers.findIndex((h) => h.toLowerCase() === 'app type code');
    const stateIdx = headers.findIndex((h) => h.toLowerCase() === 'state code');
    const lobIdx = headers.findIndex((h) => h.toLowerCase() === 'lob code');
    const premiumIdx = headers.findIndex((h) => h.toLowerCase() === 'gross premium');
    const claimsIdx = headers.findIndex((h) => h.toLowerCase() === 'claims paid');

    if (appTypeIdx === -1 || premiumIdx === -1 || claimsIdx === -1) {
      throw new BadRequestException(
        'File must contain "App Type Code", "Gross Premium", and "Claims Paid" columns',
      );
    }

    let totalGrossPremium = 0;
    let totalClaimsPaid = 0;
    let totalCededPremium = 0;
    let totalCededCommission = 0;
    let totalCededClaims = 0;

    const details: any[] = [];

    // Cession percentages
    const cessionPct = Number(treaty.cessionPercentage) / 100;
    const commPct = Number(treaty.commissionPercentage) / 100;

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols || cols.length === 0) continue;

      const appTypeCode = String(cols[appTypeIdx] || '').trim().toUpperCase();
      if (!appTypeCode) continue; // skip blank rows
      
      const appTypeId = csvToFalconAppTypeMap[appTypeCode] || parseInt(appTypeCode);
      const grossPremium = parseFloat(String(cols[premiumIdx] || '0')) || 0;
      const claimsPaid = parseFloat(String(cols[claimsIdx] || '0')) || 0;
      const stateCode = stateIdx !== -1 ? String(cols[stateIdx] || 'All') : 'All';
      const lobCode = lobIdx !== -1 ? String(cols[lobIdx] || 'All') : 'All';
      const transDate = dateIdx !== -1 ? String(cols[dateIdx] || '') : new Date().toISOString().split('T')[0];

      // Validate coverage
      const isCovered = coveredAppTypeIds.has(appTypeId);
      let status = 'Ceded';
      let cededPremium = 0;
      let cededCommission = 0;
      let cededClaims = 0;

      if (isCovered) {
        cededPremium = grossPremium * cessionPct;
        cededCommission = cededPremium * commPct;
        cededClaims = claimsPaid * cessionPct;

        totalGrossPremium += grossPremium;
        totalClaimsPaid += claimsPaid;
        
        totalCededPremium += cededPremium;
        totalCededCommission += cededCommission;
        totalCededClaims += cededClaims;
      } else {
        status = 'Excluded';
      }

      details.push({
        date: transDate,
        appType: appTypeCode,
        state: stateCode,
        lob: lobCode,
        grossPremium,
        claimsPaid,
        cededPremium,
        cededCommission,
        cededClaims,
        status,
      });
    }

    // Balance calculations
    const netDueToReinsurer = totalCededPremium - totalCededCommission;

    // Create Draft Journal Entry in memory
    const refNum = `JE-TR-${treaty.carrier.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const draftJe = {
      description: `Treaty Bordereau Ingestion - ${treaty.name} - Monthly Cessions`,
      referenceNumber: refNum,
      entryDate: new Date(),
      status: 'Draft',
      source: 'Treaty_Ingestion',
      treatyId: treaty.id,
      treatyName: treaty.name,
      carrier: treaty.carrier,
      totals: {
        grossPremium: totalGrossPremium,
        claimsPaid: totalClaimsPaid,
        cededPremium: totalCededPremium,
        cededCommission: totalCededCommission,
        cededClaims: totalCededClaims,
        netDueToReinsurer,
      },
      details,
      lines: [
        // 1. Reinsurance Premium Ceded (512000) -> DEBIT (Increase Expense)
        {
          coaAccountId: premiumCededAcct.id,
          coaAccount: premiumCededAcct,
          description: `Ceded Written Premium - ${treaty.name} (Ceded Share)`,
          debit: totalCededPremium,
          credit: 0,
        },
        // 2. Reinsurance Payable (220000) -> CREDIT (Increase Liability)
        {
          coaAccountId: payableAcct.id,
          coaAccount: payableAcct,
          description: `Net Premium Payable to ${treaty.carrier}`,
          debit: 0,
          credit: netDueToReinsurer,
        },
        // 3. Reinsurance Commission Income (420000) -> CREDIT (Increase Revenue)
        {
          coaAccountId: commissionAcct.id,
          coaAccount: commissionAcct,
          description: `Ceding Commission Income (${treaty.commissionPercentage}%)`,
          debit: 0,
          credit: totalCededCommission,
        },
        // 4. Reinsurance Recoverable (120000) -> DEBIT (Increase Asset)
        {
          coaAccountId: recoverableAcct.id,
          coaAccount: recoverableAcct,
          description: `Ceded Claims Recoverable from ${treaty.carrier}`,
          debit: totalCededClaims,
          credit: 0,
        },
        // 5. Losses Paid (500010) -> CREDIT (Decrease Expense)
        {
          coaAccountId: lossesPaidAcct.id,
          coaAccount: lossesPaidAcct,
          description: `Offset Claims Paid under ${treaty.name}`,
          debit: 0,
          credit: totalCededClaims,
        },
      ].filter((line) => line.debit > 0 || line.credit > 0), // Filter out zero lines
    };

    return draftJe;
  }

  async saveParsedJournalEntry(draftJe: any) {
    // Save Journal Entry header
    const je = this.jeRepo.create({
      description: draftJe.description,
      referenceNumber: draftJe.referenceNumber,
      entryDate: draftJe.entryDate,
      status: 'Draft',
      source: draftJe.source,
      treatyId: draftJe.treatyId,
    });

    const savedJe = await this.jeRepo.save(je);

    // Save lines
    const lines = draftJe.lines.map((l: any) =>
      this.jelRepo.create({
        journalEntryId: savedJe.id,
        coaAccountId: l.coaAccountId,
        description: l.description,
        debit: l.debit,
        credit: l.credit,
        quantity: 0,
      }),
    );

    await this.jelRepo.save(lines);

    return this.jeRepo.findOne({
      where: { id: savedJe.id },
      relations: { lines: { coaAccount: true } },
    });
  }

  async postJournalEntry(id: string) {
    const je = await this.jeRepo.findOne({
      where: { id },
      relations: { lines: true, treaty: true },
    });

    if (!je) {
      throw new NotFoundException(`Journal Entry with ID ${id} not found`);
    }
    if (je.status === 'Posted') {
      throw new BadRequestException('Journal Entry is already posted');
    }

    je.status = 'Posted';
    const postedJe = await this.jeRepo.save(je);

    // If linked to a Treaty, hit the Treaty ledger (update ceded premium YTD and recoverables)
    if (je.treatyId && je.treaty) {
      let premiumCededAmount = 0;
      let claimsRecoverableAmount = 0;

      // Extract details from lines
      const premiumCededAcct = await this.coaRepo.findOne({ where: { accountNumber: '512000' } });
      const recoverableAcct = await this.coaRepo.findOne({ where: { accountNumber: '120000' } });

      for (const line of je.lines) {
        if (premiumCededAcct && line.coaAccountId === premiumCededAcct.id) {
          premiumCededAmount += Number(line.debit);
        }
        if (recoverableAcct && line.coaAccountId === recoverableAcct.id) {
          claimsRecoverableAmount += Number(line.debit);
        }
      }

      je.treaty.cededPremiumYtd = Number(je.treaty.cededPremiumYtd) + premiumCededAmount;
      je.treaty.recoverables = Number(je.treaty.recoverables) + claimsRecoverableAmount;
      await this.treatyRepo.save(je.treaty);
    }

    return postedJe;
  }

  // ==========================================
  // LEDGER BALANCES (Grouped balances)
  // ==========================================
  async getLedgerBalances() {
    // Sub-query to fetch sum of debits and credits for all posted JEs
    const lines = await this.jelRepo.createQueryBuilder('line')
      .innerJoin('line.journalEntry', 'je')
      .where("je.status = 'Posted'")
      .select('line.coaAccountId', 'coaAccountId')
      .addSelect('SUM(line.debit)', 'totalDebit')
      .addSelect('SUM(line.credit)', 'totalCredit')
      .groupBy('line.coaAccountId')
      .getRawMany();

    const accounts = await this.coaRepo.find({
      relations: { mga: true, lob: true, state: true },
    });

    return accounts.map((acc) => {
      const balanceInfo = lines.find((l) => l.coaAccountId === acc.id);
      const debit = balanceInfo ? parseFloat(balanceInfo.totalDebit) : 0;
      const credit = balanceInfo ? parseFloat(balanceInfo.totalCredit) : 0;

      // Calculate balance based on account type
      // Assets & Expenses increase with Debits
      // Liabilities, Revenue, and Equity increase with Credits
      let balance = 0;
      const type = acc.accountType.toLowerCase();
      if (type === 'asset' || type === 'expense') {
        balance = debit - credit;
      } else {
        balance = credit - debit;
      }

      return {
        ...acc,
        debit,
        credit,
        balance,
      };
    });
  }

  // ==========================================
  // DATABASE RESET & SEEDING CONTROL
  // ==========================================
  async clearDatabase() {
    // Truncate / delete records in reverse dependency order
    await this.jelRepo.createQueryBuilder().delete().execute();
    await this.jeRepo.createQueryBuilder().delete().execute();
    await this.treatyAppTypeRepo.createQueryBuilder().delete().execute();
    await this.coaRepo.createQueryBuilder().delete().execute();
    await this.treatyRepo.createQueryBuilder().delete().execute();
    await this.appTypeRepo.createQueryBuilder().delete().execute();
    await this.lobRepo.createQueryBuilder().delete().execute();
    await this.mgaRepo.createQueryBuilder().delete().execute();
    await this.stateRepo.createQueryBuilder().delete().execute();
    await this.chartOfAccountRepo.createQueryBuilder().delete().execute();
    await this.subCoaRepo.createQueryBuilder().delete().execute();
    await this.glMapRepo.createQueryBuilder().delete().execute();
    await this.treatySequenceRepo.createQueryBuilder().delete().execute();

    return { message: 'Database cleared successfully' };
  }

  async resetDatabase() {
    await this.clearDatabase();
    await this.seedAll();
    return { message: 'Database reset and re-seeded successfully' };
  }

  async seedAll() {
    await this.seedStates();
    await this.seedMgas();
    await this.seedLobs();
    await this.seedAppTypes();
    await this.seedCoaAccounts();
    await this.seedTreaties();
    await this.seedTreatyAppTypes();
    await this.seedChartOfAccounts();
    await this.seedSubCoas();
    await this.seedGlMaps();
    await this.seedTreatySequences();
  }

  private async seedStates() {
    const count = await this.stateRepo.count();
    if (count === 0) {
      const states = [
        { name: 'Texas', code: 'TX', premiumTax: 1.600, surplusTax: 4.850, stampingFee: 0.075, status: 'Active' },
        { name: 'California', code: 'CA', premiumTax: 2.350, surplusTax: 3.000, stampingFee: 0.100, status: 'Configured' },
        { name: 'New York', code: 'NY', premiumTax: 2.000, surplusTax: 3.600, stampingFee: 0.150, status: 'Configured' },
        { name: 'Florida', code: 'FL', premiumTax: 1.750, surplusTax: 5.000, stampingFee: 0.065, status: 'Draft' },
        { name: 'Illinois', code: 'IL', premiumTax: 0.500, surplusTax: 3.500, stampingFee: 0.080, status: 'Draft' },
      ];
      await this.stateRepo.save(states);
    }
  }

  private async seedMgas() {
    const count = await this.mgaRepo.count();
    if (count === 0) {
      const mgas = [
        { name: 'Futuristic Insurance Services', code: 'FIS', status: 'Active' },
        { name: 'NTA Financial Corp', code: 'NTA', status: 'Active' },
        { name: 'ACCL Programs LLC', code: 'ACCL', status: 'Active' },
        { name: 'Southlake Direct LOB', code: 'SDL', status: 'Active' },
      ];
      await this.mgaRepo.save(mgas);
    }
  }

  private async seedLobs() {
    const count = await this.lobRepo.count();
    if (count === 0) {
      const lobs = [
        { lobId: 101, lobName: 'TRUC-AL', description: 'Auto Liability' },
        { lobId: 102, lobName: 'TRUC-PD', description: 'Physical Damage' },
        { lobId: 103, lobName: 'TRUC-CARGO', description: 'Cargo' },
        { lobId: 104, lobName: 'TRUC-PKG-APC', description: 'Package (AL, PD, CARGO)' },
        { lobId: 105, lobName: 'TRUC-EXCESS', description: 'Excess Liability' },
        { lobId: 106, lobName: 'TRUC-PKG-AG', description: 'Package (AL, GL)' },
        { lobId: 107, lobName: 'TRUC-PKG-AP', description: 'Package (AL, PD)' },
        { lobId: 108, lobName: 'TRUC-PKG-PC', description: 'Package (PD, Cargo)' },
        { lobId: 109, lobName: 'TRUC-GL', description: 'General Liability' },
        { lobId: 110, lobName: 'ONL-TRUC-PKG-APC', description: 'BROKER PKG (AL,PD,CARGO)' },
        { lobId: 112, lobName: 'PC-GL(CAS)', description: 'General Liability (CAS)' },
        { lobId: 113, lobName: 'PC-GL-(MPL)', description: 'Miscellaneous Professional Liability' },
        { lobId: 114, lobName: 'PC-GL-(CPC)', description: 'CPC-PKG' },
        { lobId: 117, lobName: 'Sexual Misconduct Liability', description: 'Sexual Misconduct Liability' },
        { lobId: 152, lobName: 'Digital PKG - (AL,PD,Cargo)', description: 'Digital PKG - (AL,PD,Cargo)' },
      ];
      await this.lobRepo.save(lobs);
    }
  }

  private async seedAppTypes() {
    const count = await this.appTypeRepo.count();
    if (count === 0) {
      const appTypes = [
        { applicationTypeId: 481, applicationType: 'AL Digital Rater', classId: '20', marketCompanyId: 450, lobId: 101, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,83' },
        { applicationTypeId: 482, applicationType: 'PD Digital Rater', classId: '40', marketCompanyId: 450, lobId: 102, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '' },
        { applicationTypeId: 483, applicationType: 'Digital Rater (AL,PD,Cargo)', classId: '20,40,50', marketCompanyId: 450, lobId: 152, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'Yes', fees: '1007,94,83,88' },
        { applicationTypeId: 484, applicationType: 'Cargo Digital Rater', classId: '50', marketCompanyId: 450, lobId: 103, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '' },
        { applicationTypeId: 485, applicationType: 'SSIC - XSHS', classId: '439', marketCompanyId: 450, lobId: 157, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,95,94,96,83,16' },
        { applicationTypeId: 486, applicationType: 'EXCESS', classId: '70', marketCompanyId: 450, lobId: 105, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '' },
        { applicationTypeId: 490, applicationType: 'XS-FUT', classId: '101', marketCompanyId: 450, lobId: 168, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '94,96,83' },
        { applicationTypeId: 491, applicationType: 'WC FUT', classId: '1006', marketCompanyId: 450, lobId: 167, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '' },
        { applicationTypeId: 492, applicationType: 'SSIC Property', classId: '460', marketCompanyId: 450, lobId: 158, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '95,94,96' },
        { applicationTypeId: 493, applicationType: 'SSIC - TheraCover', classId: '432', marketCompanyId: 450, lobId: 156, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,445,96,93,83,1' },
        { applicationTypeId: 494, applicationType: 'SSIC - SML', classId: '191', marketCompanyId: 450, lobId: 117, riskCompanyId: 210, raterType: 'Generic', appTypeMultiline: 'No', fees: '185,87,95,469,94' },
        { applicationTypeId: 495, applicationType: 'SSIC Excess', classId: '70', marketCompanyId: 450, lobId: 105, riskCompanyId: 210, raterType: 'Generic', appTypeMultiline: 'No', fees: '87,95,94,96,93,83' },
        { applicationTypeId: 496, applicationType: 'SSIC GL (CPC)', classId: '76', marketCompanyId: 450, lobId: 114, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,469,94,98,96,8' },
        { applicationTypeId: 497, applicationType: 'SSIC MPL', classId: '71', marketCompanyId: 450, lobId: 113, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,469,94,96,83,4' },
        { applicationTypeId: 499, applicationType: 'SSIC GL (CAS)', classId: '77', marketCompanyId: 450, lobId: 112, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,95,94,96,83,46' },
        { applicationTypeId: 501, applicationType: 'SSIC AL', classId: '20', marketCompanyId: 450, lobId: 101, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,95,94,96,96,1' },
        { applicationTypeId: 502, applicationType: 'SSIC PD', classId: '40', marketCompanyId: 450, lobId: 102, riskCompanyId: 210, raterType: 'Custom', appTypeMultiline: 'No', fees: '87,95,94,96,96,8' },
      ];
      await this.appTypeRepo.save(appTypes);
    }
  }

  private async seedCoaAccounts() {
    const count = await this.coaRepo.count();
    if (count === 0) {
      const texas = await this.stateRepo.findOne({ where: { code: 'TX' } });
      const california = await this.stateRepo.findOne({ where: { code: 'CA' } });
      const fis = await this.mgaRepo.findOne({ where: { code: 'FIS' } });
      const nta = await this.mgaRepo.findOne({ where: { code: 'NTA' } });

      const accounts = [
        { company: '100', accountNumber: '100010', accountName: 'Cash Operating', accountType: 'Asset', status: 'Active', gaapStandard: 'GAAP' },
        { company: '100', accountNumber: '100020', accountName: 'Cash Payroll', accountType: 'Asset', status: 'Active', gaapStandard: 'IFRS' },
        { company: '100', accountNumber: '110000', accountName: 'Premiums Receivable', accountType: 'Asset', status: 'Active', gaapStandard: 'GAAP' },
        { company: '200', accountNumber: '200010', accountName: 'Accounts Payable', accountType: 'Liability', status: 'Active', gaapStandard: 'IFRS' },
        { 
          company: '200', 
          accountNumber: '210000', 
          accountName: 'Unearned Premium Rsrv', 
          accountType: 'Liability', 
          status: 'Active', 
          gaapStandard: 'GAAP',
          mgaId: fis?.id,
          lobId: 101,
          stateId: texas?.id
        },
        { 
          company: '100', 
          accountNumber: '400015', 
          accountName: 'Written Premium CA', 
          accountType: 'Revenue', 
          status: 'Active', 
          gaapStandard: 'IFRS',
          mgaId: nta?.id,
          lobId: 109,
          stateId: california?.id
        },
        { company: '300', accountNumber: '500010', accountName: 'Losses Paid', accountType: 'Expense', status: 'Active', gaapStandard: 'GAAP' },
        { company: '100', accountNumber: '510000', accountName: 'LAE Paid', accountType: 'Expense', status: 'Active', gaapStandard: 'IFRS' },
        
        // Reinsurance standard accounts
        { company: '100', accountNumber: '512000', accountName: 'Reinsurance Premium Ceded', accountType: 'Expense', status: 'Active', gaapStandard: 'GAAP' },
        { company: '100', accountNumber: '420000', accountName: 'Reinsurance Commission Income', accountType: 'Revenue', status: 'Active', gaapStandard: 'GAAP' },
        { company: '100', accountNumber: '120000', accountName: 'Reinsurance Recoverable', accountType: 'Asset', status: 'Active', gaapStandard: 'GAAP' },
        { company: '100', accountNumber: '220000', accountName: 'Reinsurance Payable', accountType: 'Liability', status: 'Active', gaapStandard: 'GAAP' },
      ];
      await this.coaRepo.save(accounts);
    }
  }

  private async seedTreaties() {
    const count = await this.treatyRepo.count();
    if (count === 0) {
      const mgas = await this.mgaRepo.find();
      const treaties = [
        { name: 'Casualty Quota Share 2026', type: 'Quota Share', carrier: 'Swiss Re', limit: 25000000.00, retentionPercentage: 15.00, cessionPercentage: 85.00, commissionPercentage: 10.00, cededPremiumYtd: 3400000.00, recoverables: 1850000.00, rating: 'AA-', collateral: 'Valid LOC', status: 'Active', mgaId: mgas[0]?.id },
        { name: 'Property Excess of Loss 2026', type: 'Excess of Loss', carrier: 'Munich Re', limit: 10000000.00, retentionPercentage: 80.00, cessionPercentage: 20.00, commissionPercentage: 5.00, cededPremiumYtd: 1200000.00, recoverables: 450000.00, rating: 'AA', collateral: 'Valid LOC', status: 'Active', mgaId: mgas[1]?.id },
        { name: 'Property Catastrophe Excess', type: 'Catastrophe XOL', carrier: 'Hannover Re', limit: 50000000.00, retentionPercentage: 95.00, cessionPercentage: 5.00, commissionPercentage: 2.00, cededPremiumYtd: 850000.00, recoverables: 0.00, rating: 'AA-', collateral: 'Trust Account', status: 'In-Force', mgaId: mgas[2]?.id },
        { name: 'Specialty Excess Fac Treaty', type: 'Facultative', carrier: 'Lloyds of London', limit: 5000000.00, retentionPercentage: 50.00, cessionPercentage: 50.00, commissionPercentage: 15.00, cededPremiumYtd: 120000.00, recoverables: 45000.00, rating: 'A+', collateral: 'Funds Withheld', status: 'Run-off', mgaId: mgas[3]?.id },
      ];
      await this.treatyRepo.save(treaties);
    }
  }

  private async seedTreatyAppTypes() {
    const count = await this.treatyAppTypeRepo.count();
    if (count === 0) {
      const treaty = await this.treatyRepo.findOne({ where: { name: 'Casualty Quota Share 2026' } });
      const appTypes = await this.appTypeRepo.find();
      
      if (treaty && appTypes.length > 0) {
        const mappings = appTypes.map((at) => ({
          treatyId: treaty.id,
          appTypeId: at.applicationTypeId,
          cessionSharePercentage: 100.00,
        }));
        await this.treatyAppTypeRepo.save(mappings);
      }
    }
  }

  private async seedChartOfAccounts() {
    const count = await this.chartOfAccountRepo.count();
    if (count === 0) {
      const coas = [
        { parentCoaId: 2, subCoaId: 123, subCoaName: 'test', subCoaKey: 'TEST', nextAvailableNumber: 124 },
        { parentCoaId: 1, subCoaId: 110000, subCoaName: 'Current Assets', subCoaKey: 'CURRENT_ASSETS', nextAvailableNumber: 110020 },
        { parentCoaId: 1, subCoaId: 120000, subCoaName: 'Fixed Assets', subCoaKey: 'FIXED_ASSETS', nextAvailableNumber: 120019 },
        { parentCoaId: 1, subCoaId: 130000, subCoaName: 'Other Assets', subCoaKey: 'OTHER_ASSETS', nextAvailableNumber: 130013 },
        { parentCoaId: 2, subCoaId: 210000, subCoaName: 'Current Liabilities', subCoaKey: 'CURRENT_LIABILITIES', nextAvailableNumber: 210007 },
        { parentCoaId: 2, subCoaId: 220000, subCoaName: 'Long Term Liabilities', subCoaKey: 'LONG_TERM_LIABILITIES', nextAvailableNumber: 220004 },
        { parentCoaId: 5, subCoaId: 310000, subCoaName: 'Capital & Equity', subCoaKey: 'CAPITAL_EQUITY', nextAvailableNumber: 310002 },
        { parentCoaId: 5, subCoaId: 320000, subCoaName: 'Retained Earnings', subCoaKey: 'RETAINED_EARNINGS', nextAvailableNumber: 320002 },
        { parentCoaId: 5, subCoaId: 330000, subCoaName: 'Current Earnings', subCoaKey: 'CURRENT_EARNINGS', nextAvailableNumber: 330002 },
        { parentCoaId: 3, subCoaId: 410000, subCoaName: 'Income', subCoaKey: 'INCOME', nextAvailableNumber: 410018 },
        { parentCoaId: 4, subCoaId: 510000, subCoaName: 'Cost of Goods Sold', subCoaKey: 'COMMISSIONS', nextAvailableNumber: 510003 },
        { parentCoaId: 4, subCoaId: 520000, subCoaName: 'Employment Costs', subCoaKey: 'EMPLOYMENT_COST', nextAvailableNumber: 520001 },
        { parentCoaId: 4, subCoaId: 530000, subCoaName: 'Operating Expenses', subCoaKey: 'OPERATING_EXPENSES', nextAvailableNumber: 530004 },
        { parentCoaId: 4, subCoaId: 540000, subCoaName: 'Marketing Expenses', subCoaKey: 'MARKETING_EXPENSES', nextAvailableNumber: 540001 },
        { parentCoaId: 4, subCoaId: 550000, subCoaName: 'INSURANCE EXPENSES', subCoaKey: 'INSURANCE_EXPENSES', nextAvailableNumber: 550003 },
        { parentCoaId: 4, subCoaId: 560000, subCoaName: 'Professional Fees', subCoaKey: 'PROFESSIONAL_FEES', nextAvailableNumber: 560003 },
        { parentCoaId: 4, subCoaId: 570000, subCoaName: 'License Fee', subCoaKey: 'LICENSE_FEE', nextAvailableNumber: 570002 },
      ];
      await this.chartOfAccountRepo.save(coas);
    }
  }

  private async seedSubCoas() {
    const count = await this.subCoaRepo.count();
    if (count === 0) {
      const subCoas = [
        { categoryId: 1, categoryName: 'BANK ACCOUNTS' },
        { categoryId: 2, categoryName: 'RECEIVABLES' },
        { categoryId: 3, categoryName: 'OTHER CURRENT ASSETS' },
        { categoryId: 4, categoryName: 'COMPUTERS' },
        { categoryId: 5, categoryName: 'SOFTWARE' },
        { categoryId: 6, categoryName: 'FURNITURE AND FIXTURES' },
        { categoryId: 7, categoryName: 'LEASEHOLD IMPROVEMENTS' },
        { categoryId: 8, categoryName: 'OFFICE EQUIPMENT' },
        { categoryId: 9, categoryName: 'VEHICLES' },
        { categoryId: 10, categoryName: 'OTHER ASSETS' },
        { categoryId: 11, categoryName: 'CURRENT LIABILITIES' },
        { categoryId: 12, categoryName: 'CREDIT CARDS' },
        { categoryId: 13, categoryName: 'CORP 7402' },
        { categoryId: 14, categoryName: 'OTHER CURRENT LIABILITIES' },
        { categoryId: 15, categoryName: 'LONG TERM LIABILITIES-LOANS' },
        { categoryId: 16, categoryName: 'OTHER LONG TERM LIABILITIES' },
        { categoryId: 17, categoryName: 'CAPITAL' },
      ];
      await this.subCoaRepo.save(subCoas);
    }
  }

  private async seedGlMaps() {
    const count = await this.glMapRepo.count();
    if (count === 0) {
      const glMaps = [
        { glNumber: '110001 - ACCOUNT RECEIVABLE', type: 'AR' },
        { glNumber: '210001 - ACCOUNT PAYABLE', type: 'AP' },
        { glNumber: '410001 - MGA COMMISSION INCOME', type: 'MGA' },
        { glNumber: '510001 - BROKER COMMISSION EXPENSE', type: 'BRK' },
      ];
      await this.glMapRepo.save(glMaps);
    }
  }

  private async seedTreatySequences() {
    const count = await this.treatySequenceRepo.count();
    if (count === 0) {
      const sequences = Array.from({ length: 10 }, (_, i) => ({
        sequenceNumber: i + 1,
        description: `TY${i + 1}`,
      }));
      await this.treatySequenceRepo.save(sequences);
    }
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AccountingService } from './accounting.service';

// DTOs
import {
  CreateStateDto,
  CreateMgaDto,
  CreateLobDto,
  CreateAppTypeDto,
  CreateCoaAccountDto,
  CreateTreatyDto,
  UpdateTreatyAppTypesDto,
  CreateJournalEntryDto,
  CreateChartOfAccountDto,
  CreateSubCoaDto,
  CreateGlMapDto,
} from './dto';

@Controller('api')
@UsePipes(new ValidationPipe({ transform: true }))
export class AppController {
  constructor(private readonly accountingService: AccountingService) {}

  // ==========================================
  // STATE MASTER
  // ==========================================
  @Get('states')
  getStates() {
    return this.accountingService.getStates();
  }

  @Post('states')
  createState(@Body() dto: CreateStateDto) {
    return this.accountingService.createState(dto);
  }

  @Put('states/:id')
  updateState(@Param('id') id: string, @Body() dto: Partial<CreateStateDto>) {
    return this.accountingService.updateState(id, dto);
  }

  // ==========================================
  // MGAs
  // ==========================================
  @Get('mgas')
  getMgas() {
    return this.accountingService.getMgas();
  }

  @Post('mgas')
  createMga(@Body() dto: CreateMgaDto) {
    return this.accountingService.createMga(dto);
  }

  // ==========================================
  // LOBs
  // ==========================================
  @Get('lobs')
  getLobs() {
    return this.accountingService.getLobs();
  }

  @Post('lobs')
  createLob(@Body() dto: CreateLobDto) {
    return this.accountingService.createLob(dto);
  }

  @Put('lobs/:id')
  updateLob(@Param('id') id: number, @Body() dto: Partial<CreateLobDto>) {
    return this.accountingService.updateLob(id, dto);
  }

  @Delete('lobs/:id')
  deleteLob(@Param('id') id: number) {
    return this.accountingService.deleteLob(id);
  }

  // ==========================================
  // APP TYPES
  // ==========================================
  @Get('app-types')
  getAppTypes() {
    return this.accountingService.getAppTypes();
  }

  @Post('app-types')
  createAppType(@Body() dto: CreateAppTypeDto) {
    return this.accountingService.createAppType(dto);
  }

  @Put('app-types/:id')
  updateAppType(@Param('id') id: number, @Body() dto: Partial<CreateAppTypeDto>) {
    return this.accountingService.updateAppType(id, dto);
  }

  @Delete('app-types/:id')
  deleteAppType(@Param('id') id: number) {
    return this.accountingService.deleteAppType(id);
  }

  // ==========================================
  // CHART OF ACCOUNTS MASTER (Falcon)
  // ==========================================
  @Get('chart-of-accounts')
  getChartOfAccounts() {
    return this.accountingService.getChartOfAccounts();
  }

  @Post('chart-of-accounts')
  createChartOfAccount(@Body() dto: CreateChartOfAccountDto) {
    return this.accountingService.createChartOfAccount(dto);
  }

  @Put('chart-of-accounts/:id')
  updateChartOfAccount(@Param('id') id: number, @Body() dto: Partial<CreateChartOfAccountDto>) {
    return this.accountingService.updateChartOfAccount(id, dto);
  }

  @Delete('chart-of-accounts/:id')
  deleteChartOfAccount(@Param('id') id: number) {
    return this.accountingService.deleteChartOfAccount(id);
  }

  // ==========================================
  // SUB COA / CATEGORY MASTER (Falcon)
  // ==========================================
  @Get('sub-coas')
  getSubCoas() {
    return this.accountingService.getSubCoas();
  }

  @Post('sub-coas')
  createSubCoa(@Body() dto: CreateSubCoaDto) {
    return this.accountingService.createSubCoa(dto);
  }

  @Put('sub-coas/:id')
  updateSubCoa(@Param('id') id: number, @Body() dto: Partial<CreateSubCoaDto>) {
    return this.accountingService.updateSubCoa(id, dto);
  }

  @Delete('sub-coas/:id')
  deleteSubCoa(@Param('id') id: number) {
    return this.accountingService.deleteSubCoa(id);
  }

  // ==========================================
  // GL MAP (Falcon)
  // ==========================================
  @Get('gl-maps')
  getGlMaps() {
    return this.accountingService.getGlMaps();
  }

  // ==========================================
  // TREATY SEQUENCES (Falcon)
  // ==========================================
  @Get('treaty-sequences')
  getTreatySequences() {
    return this.accountingService.getTreatySequences();
  }

  @Post('gl-maps')
  createGlMap(@Body() dto: CreateGlMapDto) {
    return this.accountingService.createGlMap(dto);
  }

  @Put('gl-maps/:id')
  updateGlMap(@Param('id') id: string, @Body() dto: Partial<CreateGlMapDto>) {
    return this.accountingService.updateGlMap(id, dto);
  }

  @Delete('gl-maps/:id')
  deleteGlMap(@Param('id') id: string) {
    return this.accountingService.deleteGlMap(id);
  }

  // ==========================================
  // CHART OF ACCOUNTS (Actual Ledger Accounts)
  // ==========================================
  @Get('coa')
  getCoaAccounts() {
    return this.accountingService.getCoaAccounts();
  }

  @Post('coa')
  createCoaAccount(@Body() dto: CreateCoaAccountDto) {
    return this.accountingService.createCoaAccount(dto);
  }

  @Put('coa/:id/toggle')
  toggleCoaAccountStatus(@Param('id') id: string) {
    return this.accountingService.toggleCoaAccountStatus(id);
  }

  // ==========================================
  // TREATIES
  // ==========================================
  @Get('treaties')
  getTreaties() {
    return this.accountingService.getTreaties();
  }

  @Post('treaties')
  createTreaty(@Body() dto: CreateTreatyDto) {
    return this.accountingService.createTreaty(dto);
  }

  @Get('treaties/:id/app-types')
  getTreatyCoveredAppTypes(@Param('id') id: string) {
    return this.accountingService.getTreatyCoveredAppTypes(id);
  }

  @Post('treaties/:id/app-types')
  updateTreatyCoveredAppTypes(
    @Param('id') id: string,
    @Body() dto: UpdateTreatyAppTypesDto,
  ) {
    return this.accountingService.updateTreatyCoveredAppTypes(id, dto.appTypeIds);
  }

  @Post('treaties/:id/sign')
  signTreaty(@Param('id') id: string) {
    return this.accountingService.signTreaty(id);
  }

  // ==========================================
  // JOURNAL ENTRIES & INGESTION
  // ==========================================
  @Get('journal-entries')
  getJournalEntries() {
    return this.accountingService.getJournalEntries();
  }

  @Post('journal-entries/manual')
  createManualJournalEntry(@Body() dto: CreateJournalEntryDto) {
    return this.accountingService.createManualJournalEntry(dto);
  }

  @Post('journal-entries/ingest-treaty-file')
  @UseInterceptors(FileInterceptor('file'))
  async ingestTreatyFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('treatyId') treatyId: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!treatyId) {
      throw new BadRequestException('No treatyId provided');
    }
    return this.accountingService.parseTreatyFile(treatyId, file);
  }

  @Post('journal-entries/save-draft')
  saveDraftJournalEntry(@Body() draftJe: any) {
    return this.accountingService.saveParsedJournalEntry(draftJe);
  }

  @Post('journal-entries/:id/post')
  postJournalEntry(@Param('id') id: string) {
    return this.accountingService.postJournalEntry(id);
  }

  @Post('reset-db')
  resetDb() {
    return this.accountingService.resetDatabase();
  }

  @Post('clear-db')
  clearDb() {
    return this.accountingService.clearDatabase();
  }

  @Get('ledger-balances')
  getLedgerBalances() {
    return this.accountingService.getLedgerBalances();
  }
}

import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsArray, IsUUID } from 'class-validator';

export class CreateStateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  premiumTax: number;

  @IsNumber()
  surplusTax: number;

  @IsNumber()
  stampingFee: number;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateMgaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  status?: string;
}

export class CreateLobDto {
  @IsNumber()
  @IsNotEmpty()
  lobId: number;

  @IsString()
  @IsNotEmpty()
  lobName: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateAppTypeDto {
  @IsNumber()
  @IsNotEmpty()
  applicationTypeId: number;

  @IsString()
  @IsNotEmpty()
  applicationType: string;

  @IsString()
  @IsOptional()
  classId?: string;

  @IsNumber()
  @IsNotEmpty()
  marketCompanyId: number;

  @IsNumber()
  @IsNotEmpty()
  lobId: number;

  @IsNumber()
  @IsNotEmpty()
  riskCompanyId: number;

  @IsString()
  @IsNotEmpty()
  raterType: string;

  @IsString()
  @IsNotEmpty()
  appTypeMultiline: string;

  @IsString()
  @IsOptional()
  fees?: string;

  @IsString()
  @IsOptional()
  forms?: string;

  @IsString()
  @IsOptional()
  manager?: string;

  @IsString()
  @IsOptional()
  underwriter?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  active?: string;
}

export class CreateChartOfAccountDto {
  @IsNumber()
  @IsNotEmpty()
  parentCoaId: number;

  @IsNumber()
  @IsNotEmpty()
  subCoaId: number;

  @IsString()
  @IsNotEmpty()
  subCoaName: string;

  @IsString()
  @IsNotEmpty()
  subCoaKey: string;

  @IsNumber()
  @IsNotEmpty()
  nextAvailableNumber: number;

  @IsNumber()
  @IsOptional()
  categoryId?: number;
}

export class CreateSubCoaDto {
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  categoryName: string;
}

export class CreateGlMapDto {
  @IsString()
  @IsNotEmpty()
  glNumber: string;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class CreateCoaAccountDto {
  @IsString()
  @IsNotEmpty()
  company: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsNotEmpty()
  accountType: string;

  @IsString()
  @IsOptional()
  costCenter?: string;

  @IsUUID()
  @IsOptional()
  mgaId?: string;

  @IsNumber()
  @IsOptional()
  lobId?: number;

  @IsUUID()
  @IsOptional()
  stateId?: string;

  @IsString()
  @IsOptional()
  extension?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  gaapStandard?: string;

  @IsString()
  @IsOptional()
  parentAccount?: string;

  @IsString()
  @IsOptional()
  accountGroup?: string;

  @IsString()
  @IsOptional()
  summaryOrActual?: string;

  @IsString()
  @IsOptional()
  earningAccount?: string;
}

export class CreateTreatyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  carrier: string;

  @IsNumber()
  limit: number;

  @IsNumber()
  retentionPercentage: number;

  @IsNumber()
  cessionPercentage: number;

  @IsNumber()
  commissionPercentage: number;

  @IsString()
  @IsOptional()
  rating?: string;

  @IsString()
  @IsOptional()
  collateral?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  mgaId?: string;
}

export class UpdateTreatyAppTypesDto {
  @IsArray()
  @IsNumber(undefined, { each: true })
  appTypeIds: number[];
}

export class CreateJournalEntryLineDto {
  @IsUUID()
  coaAccountId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  debit: number;

  @IsNumber()
  credit: number;

  @IsNumber()
  @IsOptional()
  quantity?: number;
}

export class CreateJournalEntryDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  entryDate: string;

  @IsArray()
  lines: CreateJournalEntryLineDto[];
}

export class CreateTreatySequenceDto {
  @IsNumber()
  @IsNotEmpty()
  sequenceNumber: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}


import {
  StateMaster,
  StateDocument,
  MgaMaster,
  MgaDocument,
  ReinsurerCompany,
  RiskCompany,
  RiskCompanyDocument,
  LineOfBusiness,
  CobMaster,
  Treaty,
  DocumentType,
  SequencePrefixCounter,
  SimpleMasterRecord,
} from './master.model';
import { GlMapping } from './gl-mapping.model';

export enum MasterTab {
  Treaties = 'treaties',
  Mgas = 'mgas',
  Lobs = 'lobs',
  Cobs = 'cobs',
  States = 'states',
  Reinsurers = 'reinsurers',
  RiskCompanies = 'risk-companies',
  GlMappings = 'gl-mappings',
  Brokers = 'brokers',
  Products = 'products',
  LockedPeriods = 'locked-periods',
  DocumentTypes = 'document-types',
  SequencePrefixCounters = 'sequence-prefix-counters',
}

export type MasterListItem =
  | Treaty
  | MgaMaster
  | LineOfBusiness
  | CobMaster
  | StateMaster
  | ReinsurerCompany
  | RiskCompany
  | GlMapping
  | SimpleMasterRecord
  | DocumentType
  | SequencePrefixCounter;

export type SimpleEditableItem =
  | LineOfBusiness
  | CobMaster
  | ReinsurerCompany
  | SimpleMasterRecord
  | DocumentType
  | SequencePrefixCounter;

export type DocumentableMaster =
  | (MgaMaster & { documents: MgaDocument[] })
  | (StateMaster & { documents: StateDocument[] })
  | (RiskCompany & { documents: RiskCompanyDocument[] });

export type MasterDocument = MgaDocument | StateDocument | RiskCompanyDocument;

export enum DocumentMode {
  Mga = 'mga',
  State = 'state',
  RiskCompany = 'risk-company',
}

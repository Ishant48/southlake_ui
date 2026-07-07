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

export type MasterTab =
  | 'treaties'
  | 'mgas'
  | 'lobs'
  | 'cobs'
  | 'states'
  | 'reinsurers'
  | 'risk-companies'
  | 'gl-mappings'
  | 'brokers'
  | 'products'
  | 'locked-periods'
  | 'document-types'
  | 'sequence-prefix-counters';

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

import {
  MgaMaster,
  RiskCompany,
  ReinsurerCompany,
  StateMaster,
  LineOfBusiness,
  CobMaster,
  SimpleMasterRecord,
} from '../models/master.model';
import { ChartOfAccount } from '../../../core/models/chart-of-account.model';

export const mgaLabelFn = (item: MgaMaster): string =>
  item ? `${item.name} (${item.mga_code})` : '';

export const riskCompanyLabelFn = (item: RiskCompany): string =>
  item ? `${item.name} (${item.risk_company_id})` : '';

export const reinsurerLabelFn = (item: ReinsurerCompany): string =>
  item ? `${item.name} (${item.reinsurer_company_id})` : '';

export const stateLabelFn = (item: StateMaster): string =>
  item ? `${item.state_code} - ${item.name}` : '';

export const stateAbbrLabelFn = (item: StateMaster): string =>
  item ? `${item.state_abbr} - ${item.name}` : '';

export const lobLabelFn = (item: LineOfBusiness): string =>
  item ? `${item.name} (${item.lob_code})` : '';

export const cobLabelFn = (item: CobMaster): string =>
  item ? `${item.name} (${item.cob_code})` : '';

export const coaLabelFn = (item: ChartOfAccount): string =>
  item ? `${item.account_code} - ${item.description}` : '';

export const nameLabelFn = (item: { id: string; name: string }): string => (item ? item.name : '');

export const brokerLabelFn = (item: SimpleMasterRecord): string => item.name ?? '';

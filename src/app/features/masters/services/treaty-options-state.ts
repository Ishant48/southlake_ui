import { Injectable, inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MgasApi } from './mgas-api';
import { ReinsurersApi } from './reinsurers-api';
import { RiskCompaniesApi } from './risk-companies-api';
import { LobsApi } from './lobs-api';
import { CobsApi } from './cobs-api';
import { StatesApi } from './states-api';
import { BrokersApi } from './brokers-api';
import { ProductsApi } from './products-api';
import { TreatyTypesApi } from './treaty-types-api';
import {
  MgaMaster,
  ReinsurerCompany,
  RiskCompany,
  StateMaster,
  LineOfBusiness,
  CobMaster,
  SimpleMasterRecord,
  TreatyTypeMaster,
} from '../models/master.model';

@Injectable({ providedIn: 'root' })
export class TreatyOptionsState {
  private mgasApi = inject(MgasApi);
  private reinsurersApi = inject(ReinsurersApi);
  private riskCompaniesApi = inject(RiskCompaniesApi);
  private lobsApi = inject(LobsApi);
  private cobsApi = inject(CobsApi);
  private statesApi = inject(StatesApi);
  private brokersApi = inject(BrokersApi);
  private productsApi = inject(ProductsApi);
  private treatyTypesApi = inject(TreatyTypesApi);

  mgaOptions: MgaMaster[] = [];
  reinsurerOptions: ReinsurerCompany[] = [];
  riskCompanyOptions: RiskCompany[] = [];
  stateOptions: StateMaster[] = [];
  lobOptions: LineOfBusiness[] = [];
  cobOptions: CobMaster[] = [];
  brokerOptions: SimpleMasterRecord[] = [];
  productOptions: any[] = [];
  treatyTypeOptions: TreatyTypeMaster[] = [];

  loadMgaOptions(): Observable<MgaMaster[]> {
    return this.mgasApi.getMgas(undefined, true).pipe(tap(res => (this.mgaOptions = res)));
  }

  loadAll(): Observable<unknown> {
    return forkJoin([
      this.loadMgaOptions(),
      this.reinsurersApi
        .getReinsurers(undefined, true)
        .pipe(tap(res => (this.reinsurerOptions = res))),
      this.riskCompaniesApi
        .getRiskCompanies(undefined, true)
        .pipe(tap(res => (this.riskCompanyOptions = res))),
      this.lobsApi.getLobs(undefined, true).pipe(tap(res => (this.lobOptions = res))),
      this.cobsApi.getCobs(undefined, true).pipe(tap(res => (this.cobOptions = res))),
      this.statesApi.getStates(undefined, true).pipe(tap(res => (this.stateOptions = res))),
      this.brokersApi.getBrokers(undefined, true).pipe(tap(res => (this.brokerOptions = res))),
      this.productsApi.getProducts(undefined, true).pipe(tap(res => (this.productOptions = res))),
      this.treatyTypesApi.getTreatyTypes(undefined, true).pipe(tap(res => (this.treatyTypeOptions = res))),
    ]);
  }
}

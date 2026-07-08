import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LobsApi } from './lobs-api';
import { CobsApi } from './cobs-api';
import { ReinsurersApi } from './reinsurers-api';
import { BrokersApi } from './brokers-api';
import { ProductsApi } from './products-api';
import { DocumentTypesApi } from './document-types-api';
import { SequencePrefixCountersApi } from './sequence-prefix-counters-api';
import { TreatyTypesApi } from './treaty-types-api';
import { SimpleMode, SimpleFormValue } from '../components/simple-form-modal/simple-form-modal';
import { SimpleEditableItem } from '../models/master-tab.model';
import {
  LineOfBusiness,
  CobMaster,
  ReinsurerCompany,
  SimpleMasterRecord,
  DocumentType,
  SequencePrefixCounter,
  TreatyTypeMaster,
} from '../models/master.model';

const MASTER_LABELS: Record<SimpleMode, string> = {
  [SimpleMode.Lob]: 'Line of Business',
  [SimpleMode.Cob]: 'Class of Business',
  [SimpleMode.Reinsurer]: 'Reinsurer Company',
  [SimpleMode.Broker]: 'Broker',
  [SimpleMode.Product]: 'Product',
  [SimpleMode.DocumentType]: 'Document Type',
  [SimpleMode.SequencePrefixCounter]: 'Sequence Prefix & Counter',
  [SimpleMode.TreatyType]: 'Treaty Type',
};

const CODE_KEYS: Record<SimpleMode, string> = {
  [SimpleMode.Lob]: 'lob_code',
  [SimpleMode.Cob]: 'cob_code',
  [SimpleMode.Reinsurer]: 'reinsurer_company_id',
  [SimpleMode.Broker]: 'broker_code',
  [SimpleMode.Product]: 'product_id',
  [SimpleMode.DocumentType]: 'code',
  [SimpleMode.SequencePrefixCounter]: 'code',
  [SimpleMode.TreatyType]: 'type_code',
};

@Injectable({ providedIn: 'root' })
export class SimpleMastersState {
  private lobsApi = inject(LobsApi);
  private cobsApi = inject(CobsApi);
  private reinsurersApi = inject(ReinsurersApi);
  private brokersApi = inject(BrokersApi);
  private productsApi = inject(ProductsApi);
  private documentTypesApi = inject(DocumentTypesApi);
  private sequencePrefixCountersApi = inject(SequencePrefixCountersApi);
  private treatyTypesApi = inject(TreatyTypesApi);

  lobs: LineOfBusiness[] = [];
  cobs: CobMaster[] = [];
  reinsurers: ReinsurerCompany[] = [];
  brokers: SimpleMasterRecord[] = [];
  products: SimpleMasterRecord[] = [];
  documentTypes: DocumentType[] = [];
  sequencePrefixCounters: SequencePrefixCounter[] = [];
  treatyTypes: TreatyTypeMaster[] = [];

  getMasterLabel(mode: SimpleMode): string {
    return MASTER_LABELS[mode];
  }

  getList(mode: SimpleMode): SimpleEditableItem[] {
    switch (mode) {
      case SimpleMode.Lob:
        return this.lobs;
      case SimpleMode.Cob:
        return this.cobs;
      case SimpleMode.Reinsurer:
        return this.reinsurers;
      case SimpleMode.Broker:
        return this.brokers;
      case SimpleMode.Product:
        return this.products;
      case SimpleMode.DocumentType:
        return this.documentTypes;
      case SimpleMode.SequencePrefixCounter:
        return this.sequencePrefixCounters;
      case SimpleMode.TreatyType:
        return this.treatyTypes;
    }
  }

  load(mode: SimpleMode, search?: string, active?: boolean): Observable<SimpleEditableItem[]> {
    let request: Observable<SimpleEditableItem[]>;
    switch (mode) {
      case SimpleMode.Lob:
        request = this.lobsApi.getLobs(search, active);
        break;
      case SimpleMode.Cob:
        request = this.cobsApi.getCobs(search, active);
        break;
      case SimpleMode.Reinsurer:
        request = this.reinsurersApi.getReinsurers(search, active);
        break;
      case SimpleMode.Broker:
        request = this.brokersApi.getBrokers(search, active);
        break;
      case SimpleMode.Product:
        request = this.productsApi.getProducts(search, active);
        break;
      case SimpleMode.DocumentType:
        request = this.documentTypesApi.getDocumentTypes(search, active);
        break;
      case SimpleMode.SequencePrefixCounter:
        request = this.sequencePrefixCountersApi.getSequencePrefixCounters(search, active);
        break;
      case SimpleMode.TreatyType:
        request = this.treatyTypesApi.getTreatyTypes(search, active);
        break;
    }
    return request.pipe(map(res => this.assignList(mode, res)));
  }

  save(mode: SimpleMode, isEditMode: boolean, formValue: SimpleFormValue): Observable<unknown> {
    const codeKey = CODE_KEYS[mode];
    const payload: Record<string, unknown> = {
      [codeKey]: formValue.code,
      name: formValue.name,
      is_active: formValue.is_active,
    };

    if (mode === SimpleMode.Lob || mode === SimpleMode.Cob || mode === SimpleMode.TreatyType) {
      payload['description'] = formValue.description || null;
      if (mode === SimpleMode.Cob) {
        payload['type'] = formValue.type || null;
        payload['taxable'] = formValue.taxable || false;
        payload['priority'] = Number(formValue.priority || 1);
        payload['fully_earned'] = formValue.fully_earned || false;
        payload['asl_code'] = formValue.asl_code || null;
      } else if (mode === SimpleMode.Lob) {
        payload['taxable'] = formValue.taxable || false;
        payload['priority'] = Number(formValue.priority || 1);
        payload['fully_earned'] = formValue.fully_earned || false;
      }
    } else if (mode === SimpleMode.Broker) {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_name'] = formValue.contact_name || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_email'] = formValue.contact_email || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['contact_phone'] = formValue.contact_phone || null;
    } else if (mode === SimpleMode.Product) {
      payload['description'] = formValue.description || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['lob_id'] = formValue.lob_id || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['cob_id'] = formValue.cob_id || null;
    } else if (mode === SimpleMode.SequencePrefixCounter) {
      payload['description'] = formValue.description || null;
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- '' should be sent as null, not an empty string
      payload['prefix'] = formValue.prefix || null;
      payload['next_value'] = Number(formValue.next_value ?? 1);
      payload['padding_width'] = Number(formValue.padding_width ?? 4);
    }

    if (isEditMode) {
      const id = formValue.id;
      if (!id) throw new Error('Cannot update a simple master record without an id');
      return this.update(mode, id, payload);
    }
    return this.create(mode, payload);
  }

  delete(mode: SimpleMode, id: string): Observable<unknown> {
    switch (mode) {
      case SimpleMode.Lob:
        return this.lobsApi.deleteLob(id);
      case SimpleMode.Cob:
        return this.cobsApi.deleteCob(id);
      case SimpleMode.Reinsurer:
        return this.reinsurersApi.deleteReinsurer(id);
      case SimpleMode.Broker:
        return this.brokersApi.deleteBroker(id);
      case SimpleMode.Product:
        return this.productsApi.deleteProduct(id);
      case SimpleMode.DocumentType:
        return this.documentTypesApi.deleteDocumentType(id);
      case SimpleMode.SequencePrefixCounter:
        return this.sequencePrefixCountersApi.deleteSequencePrefixCounter(id);
      case SimpleMode.TreatyType:
        return this.treatyTypesApi.deleteTreatyType(id);
    }
  }

  private create(mode: SimpleMode, payload: Record<string, unknown>): Observable<unknown> {
    switch (mode) {
      case SimpleMode.Lob:
        return this.lobsApi.createLob(payload as Partial<LineOfBusiness>);
      case SimpleMode.Cob:
        return this.cobsApi.createCob(payload as Partial<CobMaster>);
      case SimpleMode.Reinsurer:
        return this.reinsurersApi.createReinsurer(payload as Partial<ReinsurerCompany>);
      case SimpleMode.Broker:
        return this.brokersApi.createBroker(payload as SimpleMasterRecord);
      case SimpleMode.Product:
        return this.productsApi.createProduct(payload as SimpleMasterRecord);
      case SimpleMode.DocumentType:
        return this.documentTypesApi.createDocumentType(payload as Partial<DocumentType>);
      case SimpleMode.SequencePrefixCounter:
        return this.sequencePrefixCountersApi.createSequencePrefixCounter(
          payload as Partial<SequencePrefixCounter>,
        );
      case SimpleMode.TreatyType:
        return this.treatyTypesApi.createTreatyType(payload as Partial<TreatyTypeMaster>);
    }
  }

  private update(
    mode: SimpleMode,
    id: string,
    payload: Record<string, unknown>,
  ): Observable<unknown> {
    switch (mode) {
      case SimpleMode.Lob:
        return this.lobsApi.updateLob(id, payload as Partial<LineOfBusiness>);
      case SimpleMode.Cob:
        return this.cobsApi.updateCob(id, payload as Partial<CobMaster>);
      case SimpleMode.Reinsurer:
        return this.reinsurersApi.updateReinsurer(id, payload as Partial<ReinsurerCompany>);
      case SimpleMode.Broker:
        return this.brokersApi.updateBroker(id, payload as SimpleMasterRecord);
      case SimpleMode.Product:
        return this.productsApi.updateProduct(id, payload as SimpleMasterRecord);
      case SimpleMode.DocumentType:
        return this.documentTypesApi.updateDocumentType(id, payload as Partial<DocumentType>);
      case SimpleMode.SequencePrefixCounter:
        return this.sequencePrefixCountersApi.updateSequencePrefixCounter(
          id,
          payload as Partial<SequencePrefixCounter>,
        );
      case SimpleMode.TreatyType:
        return this.treatyTypesApi.updateTreatyType(id, payload as Partial<TreatyTypeMaster>);
    }
  }

  private assignList(mode: SimpleMode, res: SimpleEditableItem[]): SimpleEditableItem[] {
    switch (mode) {
      case SimpleMode.Lob:
        this.lobs = res as LineOfBusiness[];
        break;
      case SimpleMode.Cob:
        this.cobs = res as CobMaster[];
        break;
      case SimpleMode.Reinsurer:
        this.reinsurers = res as ReinsurerCompany[];
        break;
      case SimpleMode.Broker:
        this.brokers = res as SimpleMasterRecord[];
        break;
      case SimpleMode.Product:
        this.products = res as SimpleMasterRecord[];
        break;
      case SimpleMode.DocumentType:
        this.documentTypes = res as DocumentType[];
        break;
      case SimpleMode.SequencePrefixCounter:
        this.sequencePrefixCounters = res as SequencePrefixCounter[];
        break;
      case SimpleMode.TreatyType:
        this.treatyTypes = res as TreatyTypeMaster[];
        break;
    }
    return res;
  }
}

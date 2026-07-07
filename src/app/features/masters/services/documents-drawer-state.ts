import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MgasApi } from './mgas-api';
import { StatesApi } from './states-api';
import { RiskCompaniesApi } from './risk-companies-api';
import { DocumentTypesApi } from './document-types-api';
import { DocumentType } from '../models/master.model';
import { DocumentMode, DocumentableMaster, MasterDocument } from '../models/master-tab.model';

const DOWNLOAD_ENDPOINTS: Record<DocumentMode, string> = {
  [DocumentMode.Mga]: 'mgas',
  [DocumentMode.State]: 'states',
  [DocumentMode.RiskCompany]: 'risk-companies',
};

@Injectable({ providedIn: 'root' })
export class DocumentsDrawerState {
  private mgasApi = inject(MgasApi);
  private statesApi = inject(StatesApi);
  private riskCompaniesApi = inject(RiskCompaniesApi);
  private documentTypesApi = inject(DocumentTypesApi);

  documentsList: MasterDocument[] = [];
  documentTypesOptions: DocumentType[] = [];

  loadDocumentTypes(): Observable<DocumentType[]> {
    return this.documentTypesApi.getDocumentTypes(undefined, true).pipe(
      map(res => {
        this.documentTypesOptions = res;
        return res;
      }),
    );
  }

  loadDocuments(mode: DocumentMode, id: string): Observable<MasterDocument[]> {
    return this.getOwner(mode, id).pipe(
      map(res => {
        this.documentsList = res.documents ?? [];
        return this.documentsList;
      }),
    );
  }

  upload(
    mode: DocumentMode,
    itemId: string,
    file: File,
    documentType: string,
  ): Observable<MasterDocument> {
    switch (mode) {
      case DocumentMode.Mga:
        return this.mgasApi.uploadMgaDocument(itemId, file, documentType);
      case DocumentMode.State:
        return this.statesApi.uploadStateDocument(itemId, file, documentType);
      case DocumentMode.RiskCompany:
        return this.riskCompaniesApi.uploadRiskCompanyDocument(itemId, file, documentType);
    }
  }

  delete(mode: DocumentMode, docId: string): Observable<void> {
    switch (mode) {
      case DocumentMode.Mga:
        return this.mgasApi.deleteMgaDocument(docId);
      case DocumentMode.State:
        return this.statesApi.deleteStateDocument(docId);
      case DocumentMode.RiskCompany:
        return this.riskCompaniesApi.deleteRiskCompanyDocument(docId);
    }
  }

  getDownloadEndpoint(mode: DocumentMode): string {
    return DOWNLOAD_ENDPOINTS[mode];
  }

  private getOwner(mode: DocumentMode, id: string): Observable<DocumentableMaster> {
    switch (mode) {
      case DocumentMode.Mga:
        return this.mgasApi.getMga(id);
      case DocumentMode.State:
        return this.statesApi.getState(id);
      case DocumentMode.RiskCompany:
        return this.riskCompaniesApi.getRiskCompany(id);
    }
  }
}

import { Component, inject, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MastersService } from '../../core/services/masters.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { environment } from '../../../environments/environment';
import { MgaMaster } from '../../core/models/master.model';
import { GlMappingsComponent } from './gl-mappings/gl-mappings.component';
import { LockedPeriodsComponent } from './locked-periods/locked-periods.component';
import { StateMasterComponent } from './state-master/state-master.component';
import { RiskCompanyMasterComponent } from './risk-company-master/risk-company-master.component';
import { MgaMasterComponent } from './mga-master/mga-master.component';
import { TreatyMasterComponent } from './treaty-master/treaty-master.component';
import { LobMasterComponent } from './lob-master/lob-master.component';
import { CobMasterComponent } from './cob-master/cob-master.component';
import { BrokerMasterComponent } from './broker-master/broker-master.component';
import { ReinsurerMasterComponent } from './reinsurer-master/reinsurer-master.component';
import { ProductMasterComponent } from './product-master/product-master.component';
import { DocumentTypeMasterComponent } from './document-type-master/document-type-master.component';
import { SequenceCounterMasterComponent } from './sequence-counter-master/sequence-counter-master.component';

type MasterTab =
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

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ConfirmDialogComponent,
    GlMappingsComponent,
    LockedPeriodsComponent,
    StateMasterComponent,
    RiskCompanyMasterComponent,
    MgaMasterComponent,
    TreatyMasterComponent,
    LobMasterComponent,
    CobMasterComponent,
    BrokerMasterComponent,
    ReinsurerMasterComponent,
    ProductMasterComponent,
    DocumentTypeMasterComponent,
    SequenceCounterMasterComponent,
  ],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  private service = inject(MastersService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild(GlMappingsComponent) glMappingsChild?: GlMappingsComponent;
  @ViewChild(LockedPeriodsComponent) lockedPeriodsChild?: LockedPeriodsComponent;
  @ViewChild(StateMasterComponent) stateMasterChild?: StateMasterComponent;
  @ViewChild(RiskCompanyMasterComponent) riskCompanyMasterChild?: RiskCompanyMasterComponent;
  @ViewChild(MgaMasterComponent) mgaMasterChild?: MgaMasterComponent;
  @ViewChild(TreatyMasterComponent) treatyMasterChild?: TreatyMasterComponent;
  @ViewChild(LobMasterComponent) lobMasterChild?: LobMasterComponent;
  @ViewChild(CobMasterComponent) cobMasterChild?: CobMasterComponent;
  @ViewChild(BrokerMasterComponent) brokerMasterChild?: BrokerMasterComponent;
  @ViewChild(ReinsurerMasterComponent) reinsurerMasterChild?: ReinsurerMasterComponent;
  @ViewChild(ProductMasterComponent) productMasterChild?: ProductMasterComponent;
  @ViewChild(DocumentTypeMasterComponent) documentTypeMasterChild?: DocumentTypeMasterComponent;
  @ViewChild(SequenceCounterMasterComponent) sequenceCounterMasterChild?: SequenceCounterMasterComponent;

  currentTab: MasterTab = 'treaties';
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  mgaFilter: string = 'all';

  // MGA options for the filter dropdown
  mgaOptions: MgaMaster[] = [];

  // Generic Documents Drawer
  showDocModal = false;
  documentMode: 'mga' | 'state' | 'risk-company' = 'mga';
  selectedItem: any = null;
  documentsList: any[] = [];
  uploadingDoc = false;
  documentTypesOptions: any[] = [];
  selectedDocType = '';

  // Notes View Modal
  showNotesModal = false;
  notesModalTitle = '';
  notesModalText = '';

  // Confirm dialog control (for document deletions)
  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  ngOnInit(): void {
    this.service.getMgas(undefined, true).subscribe(res => {
      this.mgaOptions = res;
      this.cdr.markForCheck();
    });

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as MasterTab;
      if (
        tab &&
        [
          'treaties',
          'mgas',
          'lobs',
          'cobs',
          'states',
          'reinsurers',
          'risk-companies',
          'gl-mappings',
          'brokers',
          'products',
          'locked-periods',
          'document-types',
          'sequence-prefix-counters',
        ].includes(tab)
      ) {
        this.currentTab = tab;
      } else {
        this.currentTab = 'treaties';
      }
      this.searchTerm = '';
      this.statusFilter = 'all';
      this.mgaFilter = 'all';
      this.loadData();
    });
  }

  selectTab(tab: MasterTab): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  loadData(): void {
    switch (this.currentTab) {
      case 'treaties':
        this.treatyMasterChild?.load(this.searchTerm, this.statusFilter, this.mgaFilter);
        break;
      case 'mgas':
        this.mgaMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'lobs':
        this.lobMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'cobs':
        this.cobMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'states':
        this.stateMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'reinsurers':
        this.reinsurerMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'risk-companies':
        this.riskCompanyMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'gl-mappings':
        this.glMappingsChild?.load(this.searchTerm);
        break;
      case 'brokers':
        this.brokerMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'products':
        this.productMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'locked-periods':
        this.lockedPeriodsChild?.load(this.searchTerm);
        break;
      case 'document-types':
        this.documentTypeMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
      case 'sequence-prefix-counters':
        this.sequenceCounterMasterChild?.load(this.searchTerm, this.statusFilter);
        break;
    }
  }

  onFilterChange(): void {
    this.loadData();
  }

  // ==========================================
  // EXPORT
  // ==========================================
  exportToExcel(): void {
    switch (this.currentTab) {
      case 'treaties':
        this.treatyMasterChild?.exportToExcel();
        return;
      case 'mgas':
        this.mgaMasterChild?.exportToExcel();
        return;
      case 'states':
        this.stateMasterChild?.exportToExcel();
        return;
      case 'risk-companies':
        this.riskCompanyMasterChild?.exportToExcel();
        return;
      case 'lobs':
        this.lobMasterChild?.exportToExcel();
        return;
      case 'cobs':
        this.cobMasterChild?.exportToExcel();
        return;
      case 'reinsurers':
        this.reinsurerMasterChild?.exportToExcel();
        return;
      case 'brokers':
        this.brokerMasterChild?.exportToExcel();
        return;
      case 'products':
        this.productMasterChild?.exportToExcel();
        return;
      case 'gl-mappings':
        this.glMappingsChild?.exportToExcel();
        return;
      case 'document-types':
        this.documentTypeMasterChild?.exportToExcel();
        return;
      case 'sequence-prefix-counters':
        this.sequenceCounterMasterChild?.exportToExcel();
        return;
    }
  }

  // ==========================================
  // GENERIC DOCUMENTS DRAWER ACTIONS
  // ==========================================
  openDocModal(mode: 'mga' | 'state' | 'risk-company', item: any): void {
    this.documentMode = mode;
    this.selectedItem = item;
    this.documentsList = [];
    this.selectedDocType = '';
    this.documentTypesOptions = [];
    this.showDocModal = true;

    this.service.getDocumentTypes(undefined, true).subscribe(res => {
      this.documentTypesOptions = res;
      this.cdr.markForCheck();
    });

    this.loadDocuments();
  }

  loadDocuments(): void {
    if (!this.selectedItem) return;
    const id = this.selectedItem.id;
    let request: Observable<any>;
    if (this.documentMode === 'mga') {
      request = this.service.getMga(id);
    } else if (this.documentMode === 'state') {
      request = this.service.getState(id);
    } else {
      request = this.service.getRiskCompany(id);
    }

    request.subscribe({
      next: res => {
        this.documentsList = res.documents || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load documents');
      },
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file || !this.selectedItem) return;

    if (!this.selectedDocType) {
      this.toast.error('Please select a Document Type first');
      event.target.value = '';
      return;
    }

    this.uploadingDoc = true;
    let request: Observable<any>;
    if (this.documentMode === 'mga') {
      request = this.service.uploadMgaDocument(this.selectedItem.id, file, this.selectedDocType);
    } else if (this.documentMode === 'state') {
      request = this.service.uploadStateDocument(this.selectedItem.id, file, this.selectedDocType);
    } else {
      request = this.service.uploadRiskCompanyDocument(this.selectedItem.id, file, this.selectedDocType);
    }

    request.subscribe({
      next: () => {
        this.toast.success('Document uploaded successfully');
        this.loadDocuments();
        this.uploadingDoc = false;
        event.target.value = '';
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.toast.error(err.error?.message || 'Failed to upload document');
        this.uploadingDoc = false;
        this.cdr.markForCheck();
      },
    });
  }

  downloadDoc(doc: any): void {
    let endpoint = '';
    if (this.documentMode === 'mga') {
      endpoint = 'mgas';
    } else if (this.documentMode === 'state') {
      endpoint = 'states';
    } else {
      endpoint = 'risk-companies';
    }
    window.open(
      `${environment.apiUrl}/masters/${endpoint}/documents/download/${doc.file_url}`,
      '_blank',
    );
  }

  deleteDoc(doc: any): void {
    this.confirmTitle = 'Delete Document';
    this.confirmMessage = `Are you sure you want to delete attachment "${doc.file_name}"?`;
    this.pendingAction = () => {
      let request: Observable<any>;
      if (this.documentMode === 'mga') {
        request = this.service.deleteMgaDocument(doc.id);
      } else if (this.documentMode === 'state') {
        request = this.service.deleteStateDocument(doc.id);
      } else {
        request = this.service.deleteRiskCompanyDocument(doc.id);
      }

      request.subscribe({
        next: () => {
          this.toast.success('Document deleted successfully');
          this.loadDocuments();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to delete document');
        },
      });
    };
    this.confirmOpen = true;
  }

  // ==========================================
  // NOTES VIEW MODAL ACTIONS
  // ==========================================
  openNotesModal(title: string, text: string | null | undefined): void {
    this.notesModalTitle = title;
    this.notesModalText = text || 'No notes available.';
    this.showNotesModal = true;
  }

  // ==========================================
  // CONFIRM MODAL ACTIONS (for document deletions)
  // ==========================================
  onConfirm(): void {
    if (this.pendingAction) this.pendingAction();
    this.confirmOpen = false;
    this.pendingAction = null;
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
  }
}

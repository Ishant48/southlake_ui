import { Component, OnInit } from '@angular/core';
import {
  AccountingService,
  State,
  Mga,
  Lob,
  AppType,
  CoaAccount,
  Treaty,
  TreatyAppType,
  JournalEntry,
  JournalEntryLine,
  ChartOfAccount,
  SubCoa,
  GlMap,
  TreatySequence
} from './accounting.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // Theme state
  isDarkMode = false;

  // Active navigation tabs
  activeTab = 'overview'; // overview, coa, admin_tools, treaties, ingestion, ledger
  adminActiveTab = 'apptype'; // apptype, lob, coa_master, sub_coa, gl_map, states, mgas

  // Master Data Arrays
  states: State[] = [];
  mgas: Mga[] = [];
  lobs: Lob[] = [];
  appTypes: AppType[] = [];
  coaAccounts: CoaAccount[] = [];
  treaties: Treaty[] = [];
  journalEntries: JournalEntry[] = [];
  ledgerBalances: CoaAccount[] = [];
  chartOfAccounts: ChartOfAccount[] = [];
  subCoas: SubCoa[] = [];
  glMaps: GlMap[] = [];
  treatySequences: TreatySequence[] = [];
  showTreatySequenceView = false;
  coaMasterFilter = 0;

  // Overview metrics
  totalCededPremium = 0;
  totalRecoverables = 0;
  activeAccountsCount = 0;
  activeTreatiesCount = 0;

  // Search & Filter States
  coaSearchQuery = '';
  coaStatusFilter = 'All'; // All, Active, Inactive
  coaGaapFilter = 'All'; // All, GAAP, IFRS, STAT, SAP

  // Loader states
  isLoading = false;

  // Forms Binding Data
  // 1. Propose COA / Create New Account tabs
  coaSubTab = 'listing'; // listing or details
  isAddingParentFromPropose = false;
  isAdminToolsOpen = false;
  showProposeCoa = false;
  newCoaForm: CoaAccount = {
    company: '100',
    accountNumber: '',
    accountName: '',
    accountType: 'Asset',
    costCenter: '-',
    extension: '-',
    currency: 'USD',
    status: 'Active',
    gaapStandard: 'GAAP',
    mgaId: '',
    lobId: undefined,
    stateId: '',
    parentAccount: '',
    accountGroup: '',
    summaryOrActual: 'Actual Account',
    earningAccount: ''
  };
  coaFormError = '';

  // 2. Add MGA
  showAddMgaModal = false;
  newMgaForm: Mga = { name: '', code: '', status: 'Active' };
  showMgaTreatiesView = false;
  selectedMga: Mga | null = null;

  // 3. Add & Edit LOB
  showAddLobModal = false;
  editingLob: Lob | null = null;
  newLobForm: Lob = { lobId: 0, lobName: '', description: '' };

  // 4. Add State
  showAddStateModal = false;
  newStateForm: State = { name: '', code: '', premiumTax: 0, surplusTax: 0, stampingFee: 0, status: 'Draft' };

  // 5. Add & Edit App Type
  showAddAppTypeModal = false;
  editingAppType: AppType | null = null;
  newAppTypeForm: AppType = {
    applicationTypeId: 0,
    applicationType: '',
    classId: '',
    marketCompanyId: 450,
    lobId: 101,
    riskCompanyId: 210,
    raterType: 'Custom',
    appTypeMultiline: 'No',
    fees: '',
    forms: 'Yes',
    manager: '',
    underwriter: '',
    category: 'Commercial',
    department: '',
    active: 'Yes'
  };
  newAppTypeClassMappings: { lobId: number; appTypeId: number }[] = [];
  lobIdToClassCodeMap: Record<number, string> = {
    101: '20',
    102: '40',
    103: '50',
    105: '70',
    112: '77',
    113: '71',
    114: '76',
    117: '191',
    156: '432',
    157: '439',
    158: '460'
  };

  addAppTypeClassMapping() {
    this.newAppTypeClassMappings.push({ lobId: 101, appTypeId: 481 });
  }

  removeAppTypeClassMapping(index: number) {
    this.newAppTypeClassMappings.splice(index, 1);
  }

  // 6. Add & Edit Chart of Account Master
  showAddChartOfAccountModal = false;
  editingChartOfAccount: ChartOfAccount | null = null;
  newChartOfAccountForm: ChartOfAccount = {
    parentCoaId: 1,
    subCoaId: 0,
    subCoaName: '',
    subCoaKey: '',
    nextAvailableNumber: 0,
    categoryId: undefined
  };

  // 7. Add & Edit Sub COA (Category Master)
  showAddSubCoaModal = false;
  editingSubCoa: SubCoa | null = null;
  newSubCoaForm: SubCoa = {
    categoryId: 0,
    categoryName: ''
  };

  // 8. Add & Edit GL Map
  showAddGlMapModal = false;
  editingGlMap: GlMap | null = null;
  newGlMapForm: GlMap = {
    glNumber: '',
    type: 'AR'
  };

  // 9. Add Treaty
  showAddTreatyModal = false;
  newTreatyForm: Treaty = {
    name: '',
    type: 'Quota Share',
    carrier: '',
    limit: 0,
    retentionPercentage: 0,
    cessionPercentage: 0,
    commissionPercentage: 0,
    cededPremiumYtd: 0,
    recoverables: 0,
    rating: 'A',
    collateral: 'Valid LOC',
    status: 'Draft',
    mgaId: ''
  };

  // Treaty covered app types config & signing
  selectedTreaty: Treaty | null = null;
  treatyCoveredAppTypes: TreatyAppType[] = [];
  isSigningBlockVisible = false;

  // Ingestion (Monthly File Upload) State
  ingestionSelectedTreatyId = '';
  uploadedFile: File | null = null;
  uploadedFileName = '';
  uploadProgress = 0;
  isUploading = false;
  uploadSuccess = false;
  
  draftJournalEntry: any = null; // Calculated from backend
  isDraftSaving = false;
  ingestedJeId = '';

  constructor(private api: AccountingService) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.isLoading = true;
    
    this.api.getStates().subscribe(res => this.states = res);
    this.api.getMgas().subscribe(res => this.mgas = res);
    this.api.getLobs().subscribe(res => this.lobs = res);
    this.api.getAppTypes().subscribe(res => this.appTypes = res);
    this.api.getChartOfAccounts().subscribe(res => this.chartOfAccounts = res);
    this.api.getSubCoas().subscribe(res => this.subCoas = res);
    this.api.getGlMaps().subscribe(res => this.glMaps = res);
    this.api.getTreatySequences().subscribe(res => this.treatySequences = res);
    
    this.api.getCoaAccounts().subscribe(res => {
      this.coaAccounts = res;
      this.activeAccountsCount = res.filter(a => a.status === 'Active').length;
    });

    this.api.getTreaties().subscribe(res => {
      this.treaties = res;
      this.activeTreatiesCount = res.filter(t => t.status === 'Active' || t.status === 'In-Force').length;
      
      // Calculate totals
      this.totalCededPremium = res.reduce((sum, t) => sum + Number(t.cededPremiumYtd), 0);
      this.totalRecoverables = res.reduce((sum, t) => sum + Number(t.recoverables), 0);
    });

    this.api.getJournalEntries().subscribe(res => this.journalEntries = res);
    this.api.getLedgerBalances().subscribe(res => {
      this.ledgerBalances = res;
      this.isLoading = false;
    }, err => {
      this.isLoading = false;
    });
  }

  loadTreatySequences() {
    this.isLoading = true;
    this.api.getTreatySequences().subscribe({
      next: (res) => {
        this.treatySequences = res;
        this.showTreatySequenceView = true;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'admin_tools') {
      this.isAdminToolsOpen = !this.isAdminToolsOpen;
    }
    this.selectedTreaty = null;
    this.isSigningBlockVisible = false;
    this.draftJournalEntry = null;
    this.uploadSuccess = false;
    this.uploadProgress = 0;
    this.uploadedFileName = '';
  }

  setAdminActiveTab(tab: string) {
    this.adminActiveTab = tab;
    this.editingLob = null;
    this.editingAppType = null;
    this.editingChartOfAccount = null;
    this.editingSubCoa = null;
    this.editingGlMap = null;
    this.showTreatySequenceView = false;
    this.coaMasterFilter = 0;
  }

  selectAdminSubTab(subTab: string) {
    this.activeTab = 'admin_tools';
    this.isAdminToolsOpen = true;
    this.setAdminActiveTab(subTab);
  }

  // ==========================================
  // CHART OF ACCOUNTS ACTIONS
  // ==========================================
  get filteredCoaAccounts() {
    return this.coaAccounts.filter(acc => {
      const matchSearch =
        acc.accountNumber.includes(this.coaSearchQuery) ||
        acc.accountName.toLowerCase().includes(this.coaSearchQuery.toLowerCase());
      
      const matchStatus =
        this.coaStatusFilter === 'All' ||
        (this.coaStatusFilter === 'Active' && acc.status === 'Active') ||
        (this.coaStatusFilter === 'Inactive' && acc.status === 'Inactive');

      const matchGaap =
        this.coaGaapFilter === 'All' ||
        acc.gaapStandard === this.coaGaapFilter;

      return matchSearch && matchStatus && matchGaap;
    });
  }

  get filteredChartOfAccounts() {
    if (this.coaMasterFilter === 0) {
      return this.chartOfAccounts;
    }
    return this.chartOfAccounts.filter(coa => coa.parentCoaId === this.coaMasterFilter);
  }

  proposeAccount() {
    this.coaFormError = '';
    
    if (!this.newCoaForm.accountNumber || !this.newCoaForm.accountName) {
      this.coaFormError = 'Account number and account name are required';
      return;
    }
    if (!/^\d+$/.test(this.newCoaForm.accountNumber)) {
      this.coaFormError = 'Account number must be numeric only';
      return;
    }

    const payload = { ...this.newCoaForm };
    if (!payload.mgaId) delete payload.mgaId;
    if (!payload.lobId) delete payload.lobId;
    if (!payload.stateId) delete payload.stateId;

    this.api.createCoaAccount(payload).subscribe({
      next: (res) => {
        this.showProposeCoa = false;
        this.resetCoaForm();
        this.loadAll();
        alert('Account proposed and registered successfully!');
      },
      error: (err) => {
        this.coaFormError = err.error?.message || 'Error proposing account';
      }
    });
  }

  toggleCoaStatus(account: CoaAccount) {
    if (!account.id) return;
    this.api.toggleCoaAccountStatus(account.id).subscribe({
      next: (res) => {
        account.status = res.status;
        this.loadAll();
      },
      error: (err) => {
        alert('Error updating status');
      }
    });
  }

  resetCoaForm() {
    this.newCoaForm = {
      company: '100',
      accountNumber: '',
      accountName: '',
      accountType: 'Asset',
      costCenter: '-',
      extension: '-',
      currency: 'USD',
      status: 'Active',
      gaapStandard: 'GAAP',
      mgaId: '',
      lobId: undefined,
      stateId: '',
      parentAccount: '',
      accountGroup: '',
      summaryOrActual: 'Actual Account',
      earningAccount: ''
    };
  }

  onParentAccountChange() {
    const parent = this.chartOfAccounts.find(coa => String(coa.subCoaId) === this.newCoaForm.parentAccount);
    if (parent) {
      this.newCoaForm.accountGroup = parent.subCoaName;
      if (parent.parentCoaId === 1) this.newCoaForm.accountType = 'Asset';
      else if (parent.parentCoaId === 2) this.newCoaForm.accountType = 'Liability';
      else if (parent.parentCoaId === 3) this.newCoaForm.accountType = 'Revenue';
      else if (parent.parentCoaId === 4) this.newCoaForm.accountType = 'Expense';
      else if (parent.parentCoaId === 5) this.newCoaForm.accountType = 'Equity';
    } else {
      this.newCoaForm.accountGroup = '';
    }
  }

  openAddParentFromPropose() {
    this.isAddingParentFromPropose = true;
    this.newChartOfAccountForm = {
      parentCoaId: 1,
      subCoaId: undefined as any,
      subCoaName: '',
      subCoaKey: '',
      nextAvailableNumber: undefined as any,
      categoryId: undefined
    };
    this.showAddChartOfAccountModal = true;
    this.editingChartOfAccount = null;
  }

  // ==========================================
  // ADD / EDIT MODALS SUBMIT
  // ==========================================
  submitMga() {
    if (!this.newMgaForm.name || !this.newMgaForm.code) return;
    this.api.createMga(this.newMgaForm).subscribe({
      next: () => {
        this.showAddMgaModal = false;
        this.newMgaForm = { name: '', code: '', status: 'Active' };
        this.loadAll();
      },
      error: err => alert(err.error?.message || 'Error adding MGA')
    });
  }

  viewMgaTreaties(mga: Mga) {
    this.selectedMga = mga;
    this.showMgaTreatiesView = true;
  }

  getTreatiesForSelectedMga(): Treaty[] {
    if (!this.selectedMga) return [];
    return this.treaties.filter(t => t.mgaId === this.selectedMga?.id || t.mga?.id === this.selectedMga?.id);
  }

  openEditLob(lob: Lob) {
    this.editingLob = lob;
    this.newLobForm = { ...lob };
    this.showAddLobModal = true;
  }

  submitLob() {
    if (!this.newLobForm.lobName) return;
    if (this.editingLob) {
      this.api.updateLob(this.editingLob.lobId, this.newLobForm).subscribe({
        next: () => {
          this.showAddLobModal = false;
          this.editingLob = null;
          this.newLobForm = { lobId: 0, lobName: '', description: '' };
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error updating LOB')
      });
    } else {
      this.api.createLob(this.newLobForm).subscribe({
        next: () => {
          this.showAddLobModal = false;
          this.newLobForm = { lobId: 0, lobName: '', description: '' };
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error adding LOB')
      });
    }
  }

  deleteLob(id: number) {
    if (confirm('Are you sure you want to delete this Line of Business?')) {
      this.api.deleteLob(id).subscribe({
        next: () => this.loadAll(),
        error: err => alert(err.error?.message || 'Error deleting LOB')
      });
    }
  }

  submitState() {
    if (!this.newStateForm.name || !this.newStateForm.code) return;
    this.api.createState(this.newStateForm).subscribe({
      next: () => {
        this.showAddStateModal = false;
        this.newStateForm = { name: '', code: '', premiumTax: 0, surplusTax: 0, stampingFee: 0, status: 'Draft' };
        this.loadAll();
      },
      error: err => alert(err.error?.message || 'Error adding State')
    });
  }

  openEditAppType(appType: AppType) {
    this.editingAppType = appType;
    this.newAppTypeForm = { ...appType };

    // Parse classId to build class mappings array
    const classCodes = appType.classId ? appType.classId.split(',').map(s => s.trim()) : [];
    this.newAppTypeClassMappings = classCodes.map(code => {
      // Find lobId from class code
      const lobIdStr = Object.keys(this.lobIdToClassCodeMap).find(key => this.lobIdToClassCodeMap[+key] === code);
      const lobId = lobIdStr ? +lobIdStr : 101;
      // Find appType with that class code
      const matchedApp = this.appTypes.find(at => at.classId === code);
      const appTypeId = matchedApp ? matchedApp.applicationTypeId : 481;
      return { lobId, appTypeId };
    });

    this.showAddAppTypeModal = true;
  }

  submitAppType() {
    if (!this.newAppTypeForm.applicationType) return;

    // Compile classId from class mappings array
    const codes = this.newAppTypeClassMappings.map(m => this.lobIdToClassCodeMap[m.lobId]).filter(Boolean);
    const uniqueCodes = Array.from(new Set(codes));
    this.newAppTypeForm.classId = uniqueCodes.join(',');

    if (this.editingAppType) {
      this.api.updateAppType(this.editingAppType.applicationTypeId, this.newAppTypeForm).subscribe({
        next: () => {
          this.showAddAppTypeModal = false;
          this.editingAppType = null;
          this.newAppTypeForm = {
            applicationTypeId: 0,
            applicationType: '',
            classId: '',
            marketCompanyId: 450,
            lobId: 101,
            riskCompanyId: 210,
            raterType: 'Custom',
            appTypeMultiline: 'No',
            fees: '',
            forms: 'Yes',
            manager: '',
            underwriter: '',
            category: 'Commercial',
            department: '',
            active: 'Yes'
          };
          this.newAppTypeClassMappings = [];
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error updating Application Type')
      });
    } else {
      this.api.createAppType(this.newAppTypeForm).subscribe({
        next: () => {
          this.showAddAppTypeModal = false;
          this.newAppTypeForm = {
            applicationTypeId: 0,
            applicationType: '',
            classId: '',
            marketCompanyId: 450,
            lobId: 101,
            riskCompanyId: 210,
            raterType: 'Custom',
            appTypeMultiline: 'No',
            fees: '',
            forms: 'Yes',
            manager: '',
            underwriter: '',
            category: 'Commercial',
            department: '',
            active: 'Yes'
          };
          this.newAppTypeClassMappings = [];
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error adding Application Type')
      });
    }
  }

  deleteAppType(id: number) {
    if (confirm('Are you sure you want to delete this Application Type?')) {
      this.api.deleteAppType(id).subscribe({
        next: () => this.loadAll(),
        error: err => alert(err.error?.message || 'Error deleting Application Type')
      });
    }
  }

  openEditChartOfAccount(coa: ChartOfAccount) {
    this.editingChartOfAccount = coa;
    this.newChartOfAccountForm = { ...coa };
    this.showAddChartOfAccountModal = true;
  }

  submitChartOfAccount() {
    if (!this.newChartOfAccountForm.subCoaName || !this.newChartOfAccountForm.subCoaId) return;
    if (this.editingChartOfAccount) {
      this.api.updateChartOfAccount(this.editingChartOfAccount.subCoaId, this.newChartOfAccountForm).subscribe({
        next: () => {
          this.showAddChartOfAccountModal = false;
          this.editingChartOfAccount = null;
          this.newChartOfAccountForm = { parentCoaId: 1, subCoaId: 0, subCoaName: '', subCoaKey: '', nextAvailableNumber: 0, categoryId: undefined };
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error updating Chart of Account')
      });
    } else {
      this.api.createChartOfAccount(this.newChartOfAccountForm).subscribe({
        next: (createdParent) => {
          this.showAddChartOfAccountModal = false;
          this.newChartOfAccountForm = { parentCoaId: 1, subCoaId: 0, subCoaName: '', subCoaKey: '', nextAvailableNumber: 0, categoryId: undefined };
          this.loadAll();
          if (this.isAddingParentFromPropose) {
            this.newCoaForm.parentAccount = String(createdParent.subCoaId);
            this.onParentAccountChange();
            this.isAddingParentFromPropose = false;
          }
        },
        error: err => alert(err.error?.message || 'Error adding Chart of Account')
      });
    }
  }

  deleteChartOfAccount(id: number) {
    if (confirm('Are you sure you want to delete this Chart of Account?')) {
      this.api.deleteChartOfAccount(id).subscribe({
        next: () => this.loadAll(),
        error: err => alert(err.error?.message || 'Error deleting Chart of Account')
      });
    }
  }

  openEditSubCoa(subCoa: SubCoa) {
    this.editingSubCoa = subCoa;
    this.newSubCoaForm = { ...subCoa };
    this.showAddSubCoaModal = true;
  }

  submitSubCoa() {
    if (!this.newSubCoaForm.categoryName || !this.newSubCoaForm.categoryId) return;
    if (this.editingSubCoa) {
      this.api.updateSubCoa(this.editingSubCoa.categoryId, this.newSubCoaForm).subscribe({
        next: () => {
          this.showAddSubCoaModal = false;
          this.editingSubCoa = null;
          this.newSubCoaForm = { categoryId: 0, categoryName: '' };
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error updating Category')
      });
    } else {
      this.api.createSubCoa(this.newSubCoaForm).subscribe({
        next: () => {
          this.showAddSubCoaModal = false;
          this.newSubCoaForm = { categoryId: 0, categoryName: '' };
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error adding Category')
      });
    }
  }

  deleteSubCoa(id: number) {
    if (confirm('Are you sure you want to delete this Category?')) {
      this.api.deleteSubCoa(id).subscribe({
        next: () => this.loadAll(),
        error: err => alert(err.error?.message || 'Error deleting Category')
      });
    }
  }

  openEditGlMap(glMap: GlMap) {
    this.editingGlMap = glMap;
    this.newGlMapForm = { ...glMap };
    this.showAddGlMapModal = true;
  }

  submitGlMap() {
    if (!this.newGlMapForm.glNumber || !this.newGlMapForm.type) return;
    if (this.editingGlMap && this.editingGlMap.id) {
      this.api.updateGlMap(this.editingGlMap.id, this.newGlMapForm).subscribe({
        next: () => {
          this.showAddGlMapModal = false;
          this.editingGlMap = null;
          this.newGlMapForm = { glNumber: '', type: 'AR' };
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error updating GL Map')
      });
    } else {
      this.api.createGlMap(this.newGlMapForm).subscribe({
        next: () => {
          this.showAddGlMapModal = false;
          this.newGlMapForm = { glNumber: '', type: 'AR' };
          this.loadAll();
        },
        error: err => alert(err.error?.message || 'Error adding GL Map')
      });
    }
  }

  deleteGlMap(id: string) {
    if (confirm('Are you sure you want to delete this GL Map?')) {
      this.api.deleteGlMap(id).subscribe({
        next: () => this.loadAll(),
        error: err => alert(err.error?.message || 'Error deleting GL Map')
      });
    }
  }

  submitTreaty() {
    if (!this.newTreatyForm.name || !this.newTreatyForm.carrier) return;
    this.api.createTreaty(this.newTreatyForm).subscribe({
      next: () => {
        this.showAddTreatyModal = false;
        this.newTreatyForm = {
          name: '',
          type: 'Quota Share',
          carrier: '',
          limit: 0,
          retentionPercentage: 0,
          cessionPercentage: 0,
          commissionPercentage: 0,
          cededPremiumYtd: 0,
          recoverables: 0,
          rating: 'A',
          collateral: 'Valid LOC',
          status: 'Draft',
          mgaId: ''
        };
        this.loadAll();
      },
      error: err => alert(err.error?.message || 'Error creating Treaty')
    });
  }

  // ==========================================
  // TREATY DETAILS, COVERAGE, SIGNING
  // ==========================================
  selectTreaty(treaty: Treaty) {
    this.selectedTreaty = treaty;
    this.isSigningBlockVisible = true;
    if (treaty.id) {
      this.api.getTreatyCoveredAppTypes(treaty.id).subscribe(res => {
        this.treatyCoveredAppTypes = res;
      });
    }
  }

  isAppTypeCovered(appTypeId: number): boolean {
    return this.treatyCoveredAppTypes.some(t => t.appTypeId === appTypeId);
  }

  toggleAppTypeCoverage(appType: AppType) {
    if (!this.selectedTreaty || !this.selectedTreaty.id || !appType.applicationTypeId) return;
    
    const coveredIds = this.treatyCoveredAppTypes.map(t => t.appTypeId);
    const idx = coveredIds.indexOf(appType.applicationTypeId);

    if (idx === -1) {
      coveredIds.push(appType.applicationTypeId);
    } else {
      coveredIds.splice(idx, 1);
    }

    this.api.updateTreatyCoveredAppTypes(this.selectedTreaty.id, coveredIds).subscribe({
      next: () => {
        if (this.selectedTreaty?.id) {
          this.api.getTreatyCoveredAppTypes(this.selectedTreaty.id).subscribe(res => {
            this.treatyCoveredAppTypes = res;
          });
        }
      }
    });
  }

  executeTreatyBinder() {
    if (!this.selectedTreaty || !this.selectedTreaty.id) return;
    
    this.api.signTreaty(this.selectedTreaty.id).subscribe({
      next: (updatedTreaty) => {
        this.selectedTreaty!.status = 'Active';
        this.loadAll();
        alert('Treaty Binder agreement has been signed and executed! Production engine parameters are now active.');
      },
      error: err => alert(err.error?.message || 'Error signing treaty')
    });
  }

  // ==========================================
  // FILE INGESTION (MONTHLY UPLOAD)
  // ==========================================
  triggerFileInput() {
    const fileInput = document.getElementById('csvFileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadedFile = file;
      this.uploadedFileName = file.name;
      this.draftJournalEntry = null;
      this.uploadSuccess = false;
    }
  }

  ingestMonthlyFile() {
    if (!this.ingestionSelectedTreatyId) {
      alert('Please select a Treaty first');
      return;
    }
    if (!this.uploadedFile) {
      alert('Please select a CSV or Excel file to upload');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 10;
    
    const interval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 20;
      }
    }, 150);

    this.api.uploadTreatyFile(this.ingestionSelectedTreatyId, this.uploadedFile).subscribe({
      next: (res) => {
        clearInterval(interval);
        this.uploadProgress = 100;
        setTimeout(() => {
          this.isUploading = false;
          this.uploadSuccess = true;
          this.draftJournalEntry = res;
        }, 200);
      },
      error: (err) => {
        clearInterval(interval);
        this.isUploading = false;
        this.uploadProgress = 0;
        alert(err.error?.message || 'Error parsing monthly file');
      }
    });
  }

  postDraftToLedger() {
    if (!this.draftJournalEntry) return;
    this.isDraftSaving = true;

    this.api.saveDraftJournalEntry(this.draftJournalEntry).subscribe({
      next: (savedJe) => {
        if (savedJe.id) {
          this.api.postJournalEntry(savedJe.id).subscribe({
            next: (postedJe) => {
              this.isDraftSaving = false;
              this.draftJournalEntry = null;
              this.uploadedFile = null;
              this.uploadedFileName = '';
              this.uploadSuccess = false;
              this.uploadProgress = 0;
              this.loadAll();
              alert(`Journal Entry ${postedJe.referenceNumber} has successfully posted to the general ledger! Account balances and treaty YTD metrics updated.`);
              this.setActiveTab('ledger');
            },
            error: (err) => {
              this.isDraftSaving = false;
              alert(err.error?.message || 'Error posting journal entry to ledger');
            }
          });
        }
      },
      error: (err) => {
        this.isDraftSaving = false;
        alert(err.error?.message || 'Error saving draft journal entry');
      }
    });
  }

  resetDatabase() {
    if (confirm('Are you sure you want to clear all data and reset the database to default seed state?')) {
      this.isLoading = true;
      this.api.resetDatabase().subscribe({
        next: () => {
          this.loadAll();
          alert('Database has been successfully reset and re-seeded!');
        },
        error: (err) => {
          this.isLoading = false;
          alert(err.error?.message || 'Error resetting database');
        }
      });
    }
  }

  clearDatabase() {
    if (confirm('Are you sure you want to clear all data? This will truncate the database to zero records.')) {
      this.isLoading = true;
      this.api.clearDatabase().subscribe({
        next: () => {
          this.loadAll();
          alert('Database has been successfully cleared!');
        },
        error: (err) => {
          this.isLoading = false;
          alert(err.error?.message || 'Error clearing database');
        }
      });
    }
  }
}


import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReinsuranceService } from '../../core/services/reinsurance.service';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-reinsurance-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reinsurance-workspace.component.html',
  styleUrl: './reinsurance-workspace.component.scss',
})
export class ReinsuranceWorkspaceComponent implements OnInit {
  private service = inject(ReinsuranceService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  workbooks: any[] = [];
  programs: any[] = [];
  selectedWorkbookId: number | null = null;
  selectedWorkbook: any = null;
  selectedState: string = 'TOTAL';
  states: string[] = ['TOTAL'];
  activeTab: 'statement' | 'glje' | 'cash' | 'itd' = 'statement';

  statementRows: any[] = [];
  gljeRows: any[] = [];
  cashSettlement: any = null;

  loading = false;
  uploading = false;
  seederLoading = false;

  // Forms
  ratesForm: any = {};
  mappingsForm: any = {};
  paramsForm: any = {};

  // Upload fields
  fileToUpload: File | null = null;
  uploadOverwrite = false;
  uploadProgram = '';

  // ITD Seeder baseline values
  seederFiles: any[] = [];
  selectedSeederState = 'TOTAL';
  seederForm: any = {};

  ngOnInit(): void {
    this.loadWorkbooks();
    this.loadPrograms();
    this.loadSeederFiles();
  }

  loadWorkbooks(): void {
    this.loading = true;
    this.service.getWorkbooks().subscribe({
      next: res => {
        this.workbooks = res;
        this.loading = false;
        if (res.length > 0 && !this.selectedWorkbookId) {
          this.selectedWorkbookId = res[0].id;
          this.onWorkbookChange();
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error('Failed to load workbooks');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadPrograms(): void {
    this.service.getPrograms().subscribe({
      next: res => {
        this.programs = res;
        if (res.length > 0) {
          this.uploadProgram = res[0].name;
        }
        this.cdr.markForCheck();
      },
    });
  }

  loadSeederFiles(): void {
    this.seederLoading = true;
    this.service.getSeederFiles().subscribe({
      next: res => {
        this.seederFiles = res;
        this.seederLoading = false;
        this.onSeederStateChange();
        this.cdr.markForCheck();
      },
      error: () => {
        this.seederLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onWorkbookChange(): void {
    if (!this.selectedWorkbookId) return;
    this.loading = true;
    this.service.getWorkbook(this.selectedWorkbookId).subscribe({
      next: res => {
        this.selectedWorkbook = res;
        this.ratesForm = { ...res.rates };
        this.mappingsForm = {
          mga: res.mga,
          lob: res.lob,
          lineDescSuffix: res.lineDescSuffix,
          comp: res.comp,
          cc: res.cc,
          ext: res.ext,
          sub: res.sub,
        };

        // Extract states from exhibits
        if (res.stateExhibits) {
          const codes = res.stateExhibits.map((e: any) => e.stateCode);
          this.states = ['TOTAL', ...codes.filter((c: string) => c !== 'TOTAL').sort()];
        } else {
          this.states = ['TOTAL'];
        }

        if (!this.states.includes(this.selectedState)) {
          this.selectedState = 'TOTAL';
        }

        this.loadActiveTabCalculations();
      },
      error: () => {
        this.toast.error('Failed to load workbook details');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onStateChange(): void {
    this.loadActiveTabCalculations();
  }

  setTab(tab: 'statement' | 'glje' | 'cash' | 'itd'): void {
    this.activeTab = tab;
    this.loadActiveTabCalculations();
  }

  loadActiveTabCalculations(): void {
    if (!this.selectedWorkbookId) return;
    this.loading = true;
    this.cdr.markForCheck();

    // Populate required parameters form from current state exhibit
    const curEx = this.selectedWorkbook?.stateExhibits?.find(
      (e: any) => e.stateCode === this.selectedState,
    );
    if (curEx) {
      this.paramsForm = {
        pw: curEx.pw[1],
        uep: curEx.uep[1],
        lp: curEx.lp[1],
        laep: curEx.laep[1],
        ae_paid: curEx.ae_paid[1],
        loss_reserves: curEx.loss_reserves[1],
        loss_ibnr: curEx.loss_ibnr[1],
        lae_reserves_dcc: curEx.lae_reserves_dcc[1],
        lae_ibnr_dcc: curEx.lae_ibnr_dcc[1],
        lae_reserves_aoe: curEx.lae_reserves_aoe[1],
        lae_ibnr_aoe: curEx.lae_ibnr_aoe[1],
        ulae_ibnr: curEx.ulae_ibnr[1],
      };
    }

    if (this.activeTab === 'statement') {
      this.service.getReinsuranceStatement(this.selectedWorkbookId, this.selectedState).subscribe({
        next: res => {
          this.statementRows = res;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    } else if (this.activeTab === 'glje') {
      this.service.getGLJournalEntries(this.selectedWorkbookId, this.selectedState).subscribe({
        next: res => {
          this.gljeRows = res;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    } else if (this.activeTab === 'cash') {
      this.service.getCashSettlementCalculations(this.selectedWorkbookId).subscribe({
        next: res => {
          this.cashSettlement = res;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  saveParams(): void {
    if (!this.selectedWorkbookId) return;
    this.loading = true;

    // Map single values back to [Prior, Current, YTD] array format
    const exData: any = {};
    Object.keys(this.paramsForm).forEach(k => {
      const curEx = this.selectedWorkbook?.stateExhibits?.find(
        (e: any) => e.stateCode === this.selectedState,
      );
      const prior = curEx ? curEx[k]?.[0] || 0 : 0;
      const current = Number(this.paramsForm[k] || 0);
      const ytd = prior + current;
      exData[k] = [prior, current, ytd];
    });

    this.service.updateExhibit(this.selectedWorkbookId, this.selectedState, exData).subscribe({
      next: () => {
        this.toast.success('Required parameters updated successfully');
        this.onWorkbookChange(); // Reload workbook details & calculations
      },
      error: () => {
        this.toast.error('Failed to update parameters');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  saveRates(): void {
    if (!this.selectedWorkbookId) return;
    this.loading = true;
    this.service.updateRates(this.selectedWorkbookId, this.ratesForm).subscribe({
      next: () => {
        this.toast.success('Rates updated successfully');
        this.onWorkbookChange();
      },
      error: () => {
        this.toast.error('Failed to update rates');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  saveMappings(): void {
    if (!this.selectedWorkbookId) return;
    this.loading = true;
    this.service.updateMappings(this.selectedWorkbookId, this.mappingsForm).subscribe({
      next: () => {
        this.toast.success('Mappings updated successfully');
        this.onWorkbookChange();
      },
      error: () => {
        this.toast.error('Failed to update mappings');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  saveCashParams(): void {
    if (!this.selectedWorkbookId || !this.cashSettlement) return;
    this.loading = true;
    const data = {
      begBal: Number(this.cashSettlement.beginningBalance || 0),
      amtPaid: Number(this.cashSettlement.amountPaid || 0),
    };
    this.service.updateCashSettlement(this.selectedWorkbookId, data).subscribe({
      next: () => {
        this.toast.success('Cash settlement balances updated');
        this.onWorkbookChange();
      },
      error: () => {
        this.toast.error('Failed to update cash settlement balances');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.fileToUpload = event.target.files[0];
    }
  }

  uploadWorkbook(): void {
    if (!this.fileToUpload) {
      this.toast.error('Please select an Excel workbook to upload');
      return;
    }
    this.uploading = true;
    this.cdr.markForCheck();

    this.service
      .uploadWorkbook(this.fileToUpload, this.uploadOverwrite, this.uploadProgram)
      .subscribe({
        next: res => {
          this.toast.success('Workbook uploaded and parsed successfully');
          this.fileToUpload = null;
          this.uploading = false;
          this.selectedWorkbookId = res.workbook.id;
          this.loadWorkbooks();
        },
        error: err => {
          const msg = err.error?.message || 'Failed to upload workbook';
          this.toast.error(msg);
          this.uploading = false;
          this.cdr.markForCheck();
        },
      });
  }

  deleteWorkbook(id: number, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this workbook and all its state exhibits?')) {
      this.loading = true;
      this.service.deleteWorkbook(id).subscribe({
        next: () => {
          this.toast.success('Workbook deleted successfully');
          if (this.selectedWorkbookId === id) {
            this.selectedWorkbookId = null;
            this.selectedWorkbook = null;
          }
          this.loadWorkbooks();
        },
        error: () => {
          this.toast.error('Failed to delete workbook');
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  // ITD Seeder Editor functions
  onSeederStateChange(): void {
    const file = this.seederFiles.find(f => f.stateCode === this.selectedSeederState);
    if (file && file.data) {
      this.seederForm = {
        pw: file.data.pw[1],
        uep: file.data.uep[1],
        lp: file.data.lp[1],
        laep: file.data.laep[1],
        ae_paid: file.data.ae_paid[1],
        loss_reserves: file.data.loss_reserves[1],
        loss_ibnr: file.data.loss_ibnr[1],
        lae_reserves_dcc: file.data.lae_reserves_dcc[1],
        lae_ibnr_dcc: file.data.lae_ibnr_dcc[1],
        lae_reserves_aoe: file.data.lae_reserves_aoe[1],
        lae_ibnr_aoe: file.data.lae_ibnr_aoe[1],
        ulae_ibnr: file.data.ulae_ibnr[1],
      };
    }
  }

  saveSeederState(): void {
    this.seederLoading = true;
    const file = this.seederFiles.find(f => f.stateCode === this.selectedSeederState);
    if (!file) return;

    const payload: any = {};
    Object.keys(this.seederForm).forEach(k => {
      const prior = file.data[k]?.[0] || 0;
      const current = Number(this.seederForm[k] || 0);
      const ytd = prior + current;
      payload[k] = [prior, current, ytd];
    });

    this.service.updateSeederFile(this.selectedSeederState, payload).subscribe({
      next: () => {
        this.toast.success(`ITD Seeder values updated for state ${this.selectedSeederState}`);
        this.loadSeederFiles();
        // If we are currently viewing the ITD baseline, reload it
        if (this.selectedWorkbook?.source === 'ITD') {
          this.onWorkbookChange();
        }
      },
      error: () => {
        this.toast.error('Failed to update ITD baseline values');
        this.seederLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  triggerReSeed(): void {
    if (
      confirm(
        'Are you sure you want to reset all workbook ceding tables and re-seed the baseline December 2025 ITD data? Any uploaded monthly workbooks will be deleted.',
      )
    ) {
      this.seederLoading = true;
      this.cdr.markForCheck();
      this.service.seedDatabase().subscribe({
        next: () => {
          this.toast.success('Database re-seeded successfully');
          this.selectedWorkbookId = null;
          this.selectedWorkbook = null;
          this.loadWorkbooks();
          this.loadSeederFiles();
        },
        error: () => {
          this.toast.error('Failed to seed database');
          this.seederLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  exportGLJECSV(): void {
    if (this.gljeRows.length === 0) return;
    let csv = 'Account Description,Comp,ACCOUNT,CC,MGA,LOB,ST,EXT,Sub,Description,Debit,Credit\n';

    let totalDebit = 0;
    let totalCredit = 0;

    this.gljeRows.forEach(r => {
      const debitStr = r.debit > 0 ? r.debit.toFixed(2) : '';
      const creditStr = r.credit > 0 ? `-${r.credit.toFixed(2)}` : '';
      totalDebit += Number(r.debit || 0);
      totalCredit += Number(r.credit || 0);
      csv += `"${r.desc}",${r.comp},${r.account},${r.cc},${r.mga},${r.lob},${r.st},${r.ext},${r.sub},"${r.lineDesc}",${debitStr},${creditStr}\n`;
    });
    csv += `JE Control Totals,,,,,,,,,,${totalDebit.toFixed(2)},-${totalCredit.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      'download',
      `GL_JE_Mapping_${this.selectedWorkbook?.program || 'Treaty'}_${this.selectedWorkbook?.monthKey || 'Period'}_${this.selectedState}.csv`,
    );
    link.click();
  }

  // Format Helper
  formatCurrency(value: number | string | null): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num)) return '-';
    const isNegative = num < 0;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(num));
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  }
}

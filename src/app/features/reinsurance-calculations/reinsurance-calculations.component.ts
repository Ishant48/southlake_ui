import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReinsuranceService } from '../../core/services/reinsurance.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MastersService } from '../../core/services/masters.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { StateExhibit, Workbook } from '../../core/models/reinsurance.model';
import { TreatyState } from '../../core/models/master.model';

interface ReinsuranceParamsForm {
  pw: number;
  prev_uep: number;
  curr_uep: number;
  prev_loss_reserves: number;
  loss_ibnr: number;
  prev_lae_reserves_dcc: number;
  lae_ibnr_dcc: number;
  prev_lae_reserves_aoe: number;
  lae_ibnr_aoe: number;
  ulae_ibnr: number;
}

interface ReinsuranceRatesForm {
  qs?: number;
  cf?: number;
  comm?: number;
  loss_pick?: number;
  loss_ratio_cap?: number;
  lae_dcc?: number;
  lae_aoe?: number;
  ulae?: number;
  boards_charge?: number;
  [key: string]: unknown;
}

interface ReinsuranceMappingsForm {
  mga?: string;
  lob?: string;
  line_desc_suffix?: string;
  comp?: string;
  cc?: string;
  ext?: string;
  sub?: string;
  [key: string]: unknown;
}

interface GljeRow {
  desc: string;
  comp: string;
  account: string;
  cc: string;
  mga: string;
  lob: string;
  st: string;
  ext: string;
  sub: string;
  debit: number | null;
  credit: number | null;
  isNew?: boolean;
  lineDesc?: string;
}

interface CashSettlementRow {
  label?: string;
  total?: number | string;
  reins?: number | string;
  ssic?: number | string;
  reinsColor?: string;
  ssicColor?: string;
  ssicUnderline?: boolean;
  isInput?: string;
  isBold?: boolean;
  isSubtotal?: boolean;
}

interface CashSettlement {
  beg_bal?: number;
  amt_paid?: number;
  qsPct?: number;
  reinsurerName?: string;
  rows?: CashSettlementRow[];
  [key: string]: unknown;
}

interface StatementRow {
  label?: string;
  value?: number | string;
  formula?: string;
  isHeader?: boolean;
  isBold?: boolean;
  borderClass?: string;
}

interface StatementResponse {
  rows?: StatementRow[];
  isPosted?: boolean;
}

interface JournalEntryBatch {
  id: number;
  batch_number: string;
}

@Component({
  selector: 'app-reinsurance-calculations',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './reinsurance-calculations.component.html',
  styleUrl: './reinsurance-calculations.component.scss',
})
export class ReinsuranceCalculationsComponent implements OnInit {
  private service = inject(ReinsuranceService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private mastersService = inject(MastersService);

  workbooks: Workbook[] = [];
  selectedWorkbookId: number | null = null;
  selectedWorkbook: Workbook | null = null;
  selectedState: string = 'TOTAL';
  states: string[] = ['TOTAL'];
  activeTab: 'statement' | 'glje' | 'cash' = 'statement';
  isPosted = false;

  statementRows: StatementRow[] = [];
  gljeRows: GljeRow[] = [];
  cashSettlement: CashSettlement | null = null;

  loading = false;
  postingBatch = false;

  confirmOpen = false;
  confirmTitle = '';
  confirmMessage = '';
  pendingAction: (() => void) | null = null;

  // Forms
  ratesForm: ReinsuranceRatesForm = {};
  mappingsForm: ReinsuranceMappingsForm = {};
  paramsForm: Partial<ReinsuranceParamsForm> = {};
  currentStateExhibitObj: StateExhibit | null = null;

  parametersExpanded = false;
  ratesExpanded = false;
  mappingsExpanded = false;

  ngOnInit(): void {
    this.loadWorkbooks();
  }

  loadWorkbooks(): void {
    this.loading = true;
    this.service.getWorkbooks().subscribe({
      next: res => {
        this.workbooks = (res ?? []).filter(w => w.source !== 'ITD');
        this.loading = false;
        if (this.workbooks.length > 0 && !this.selectedWorkbookId) {
          this.selectedWorkbookId = this.workbooks[0].id;
          this.onWorkbookChange();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load workbooks');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  deleteWorkbook(): void {
    if (!this.selectedWorkbookId) return;
    const confirmDelete = confirm(
      'Are you sure you want to delete this workbook and all its state exhibits?',
    );
    if (!confirmDelete) return;

    this.loading = true;
    this.service.deleteWorkbook(this.selectedWorkbookId).subscribe({
      next: () => {
        this.toast.success('Workbook deleted successfully');
        this.selectedWorkbookId = null;
        this.selectedWorkbook = null;
        this.loadWorkbooks();
      },
      error: () => {
        this.toast.error('Failed to delete workbook');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onWorkbookChange(): void {
    if (!this.selectedWorkbookId) return;
    this.loading = true;
    this.isPosted = false;
    this.service.getWorkbook(this.selectedWorkbookId).subscribe({
      next: res => {
        this.selectedWorkbook = res;
        this.ratesForm = { ...res.rates };
        this.mappingsForm = {
          mga: res.mga,
          lob: res.lob,
          line_desc_suffix: res.line_desc_suffix,
          comp: res.comp,
          cc: res.cc,
          ext: res.ext,
          sub: res.sub,
        };

        // Load treaties to filter states
        this.mastersService.getTreaties().subscribe({
          next: treaties => {
            const matchingTreaty = treaties.find(
              t => t.name?.trim().toLowerCase() === res.program?.trim().toLowerCase(),
            );

            // Extract states from exhibits
            const exhibits = res.state_exhibits ?? res.stateExhibits;
            if (exhibits) {
              const codes = exhibits.map(e => e.state_code ?? e.stateCode);
              const rawStates = [
                'TOTAL',
                ...codes.filter((c): c is string => !!c && c !== 'TOTAL').sort(),
              ];

              if (matchingTreaty) {
                const treatyStatesAbbrs = (matchingTreaty.treaty_states ?? [])
                  .map((s: TreatyState) => (s.state?.state_abbr ?? '').toUpperCase())
                  .filter(Boolean);

                this.states = rawStates.filter(
                  s =>
                    s === 'TOTAL' ||
                    treatyStatesAbbrs.includes(s.toUpperCase()) ||
                    (s === '5' && treatyStatesAbbrs.includes('CA')),
                );
              } else {
                this.states = rawStates;
              }
            } else {
              this.states = ['TOTAL'];
            }

            // Select the first non-TOTAL state by default if available
            const nonTotalState = this.states.find(s => s !== 'TOTAL');
            this.selectedState = nonTotalState ?? 'TOTAL';

            this.loadActiveTabCalculations();
          },
          error: () => {
            // Fallback to not filtering if treaties API fails
            const exhibits = res.state_exhibits ?? res.stateExhibits;
            if (exhibits) {
              const codes = exhibits.map(e => e.state_code ?? e.stateCode);
              this.states = [
                'TOTAL',
                ...codes.filter((c): c is string => !!c && c !== 'TOTAL').sort(),
              ];
            } else {
              this.states = ['TOTAL'];
            }

            const nonTotalState = this.states.find(s => s !== 'TOTAL');
            this.selectedState = nonTotalState ?? 'TOTAL';

            this.loadActiveTabCalculations();
          },
        });
      },
      error: () => {
        this.toast.error('Failed to load workbook details');
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onStateChange(): void {
    this.isPosted = false;
    this.loadActiveTabCalculations();
  }

  toggleAccordion(section: 'parameters' | 'rates' | 'mappings'): void {
    if (section === 'parameters') {
      this.parametersExpanded = !this.parametersExpanded;
    } else if (section === 'rates') {
      this.ratesExpanded = !this.ratesExpanded;
    } else if (section === 'mappings') {
      this.mappingsExpanded = !this.mappingsExpanded;
    }
    this.cdr.markForCheck();
  }

  setTab(tab: 'statement' | 'glje' | 'cash'): void {
    this.activeTab = tab;
    this.loadActiveTabCalculations();
  }

  loadActiveTabCalculations(): void {
    if (!this.selectedWorkbookId) return;
    this.loading = true;
    this.cdr.markForCheck();

    // Populate required parameters form from current state exhibit
    const exhibits = this.selectedWorkbook?.state_exhibits ?? this.selectedWorkbook?.stateExhibits;
    const curEx = exhibits?.find(e => (e.state_code ?? e.stateCode) === this.selectedState);
    if (curEx) {
      this.currentStateExhibitObj = curEx;
      this.paramsForm = {
        pw: this.tupleValue(curEx.pw, 1),
        prev_uep: this.tupleValue(curEx.uep, 0),
        curr_uep: this.tupleValue(curEx.uep, 1),
        prev_loss_reserves: this.tupleValue(curEx.loss_reserves, 0),
        loss_ibnr: this.tupleValue(curEx.loss_ibnr, 0),
        prev_lae_reserves_dcc: this.tupleValue(curEx.lae_reserves_dcc, 0),
        lae_ibnr_dcc: this.tupleValue(curEx.lae_ibnr_dcc, 0),
        prev_lae_reserves_aoe: this.tupleValue(curEx.lae_reserves_aoe, 0),
        lae_ibnr_aoe: this.tupleValue(curEx.lae_ibnr_aoe, 0),
        ulae_ibnr: this.tupleValue(curEx.ulae_ibnr, 0),
      };
    }

    if (this.activeTab === 'statement') {
      this.service.getReinsuranceStatement(this.selectedWorkbookId, this.selectedState).subscribe({
        next: res => {
          const statement = res as unknown as StatementResponse | StatementRow[];
          if (Array.isArray(statement)) {
            this.statementRows = statement;
            this.isPosted = false;
          } else {
            this.statementRows = statement.rows ?? [];
            this.isPosted = statement.isPosted ?? false;
          }
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
          this.gljeRows = res as unknown as GljeRow[];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
    } else if (this.activeTab === 'cash') {
      this.service
        .getCashSettlementCalculations(this.selectedWorkbookId, this.selectedState)
        .subscribe({
          next: res => {
            this.cashSettlement = res as unknown as CashSettlement;
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

  private tupleValue(arr: unknown, index: number): number {
    return Array.isArray(arr) ? Number(arr[index] ?? 0) : 0;
  }

  private getArr(arr: unknown): number[] {
    return Array.isArray(arr) ? [...(arr as number[])] : [0, 0, 0];
  }

  saveParams(): void {
    if (!this.selectedWorkbookId || !this.selectedState) return;
    this.loading = true;

    const exhibits = this.selectedWorkbook?.state_exhibits ?? this.selectedWorkbook?.stateExhibits;
    const curEx: StateExhibit =
      exhibits?.find(e => (e.state_code ?? e.stateCode) === this.selectedState) ?? {};

    const pw = this.getArr(curEx.pw);
    pw[1] = Number(this.paramsForm.pw ?? 0);
    pw[2] = Number(pw[0] ?? 0) + pw[1];

    const uep = this.getArr(curEx.uep);
    uep[0] = Number(this.paramsForm.prev_uep ?? 0);
    uep[1] = Number(this.paramsForm.curr_uep ?? 0);
    uep[2] = uep[0] + uep[1];

    const loss_reserves = this.getArr(curEx.loss_reserves);
    loss_reserves[0] = Number(this.paramsForm.prev_loss_reserves ?? 0);
    loss_reserves[1] = Number(loss_reserves[1] ?? 0);
    loss_reserves[2] = loss_reserves[0] + loss_reserves[1];

    const lu = this.getArr(curEx['lu']);
    lu[0] = Number(this.paramsForm.prev_loss_reserves ?? 0);
    lu[1] = Number(lu[1] ?? 0);
    lu[2] = lu[0] + lu[1];

    const loss_ibnr = this.getArr(curEx.loss_ibnr);
    loss_ibnr[0] = Number(this.paramsForm.loss_ibnr ?? 0);
    loss_ibnr[1] = Number(loss_ibnr[1] ?? 0);
    loss_ibnr[2] = loss_ibnr[0] + loss_ibnr[1];

    const lae_ibnr_dcc = this.getArr(curEx.lae_ibnr_dcc);
    lae_ibnr_dcc[0] = Number(this.paramsForm.lae_ibnr_dcc ?? 0);
    lae_ibnr_dcc[1] = Number(lae_ibnr_dcc[1] ?? 0);
    lae_ibnr_dcc[2] = lae_ibnr_dcc[0] + lae_ibnr_dcc[1];

    const lae_ibnr_aoe = this.getArr(curEx.lae_ibnr_aoe);
    lae_ibnr_aoe[0] = Number(this.paramsForm.lae_ibnr_aoe ?? 0);
    lae_ibnr_aoe[1] = Number(lae_ibnr_aoe[1] ?? 0);
    lae_ibnr_aoe[2] = lae_ibnr_aoe[0] + lae_ibnr_aoe[1];

    const lae_reserves_dcc = this.getArr(curEx.lae_reserves_dcc);
    lae_reserves_dcc[0] = Number(this.paramsForm.prev_lae_reserves_dcc ?? 0);
    lae_reserves_dcc[1] = Number(lae_reserves_dcc[1] ?? 0);
    lae_reserves_dcc[2] = lae_reserves_dcc[0] + lae_reserves_dcc[1];

    const lae_reserves_aoe = this.getArr(curEx.lae_reserves_aoe);
    lae_reserves_aoe[0] = Number(this.paramsForm.prev_lae_reserves_aoe ?? 0);
    lae_reserves_aoe[1] = Number(lae_reserves_aoe[1] ?? 0);
    lae_reserves_aoe[2] = lae_reserves_aoe[0] + lae_reserves_aoe[1];

    const ulae_ibnr = this.getArr(curEx.ulae_ibnr);
    ulae_ibnr[0] = Number(this.paramsForm.ulae_ibnr ?? 0);
    ulae_ibnr[1] = Number(ulae_ibnr[1] ?? 0);
    ulae_ibnr[2] = ulae_ibnr[0] + ulae_ibnr[1];

    const exData = {
      pw,
      uep,
      loss_reserves,
      lu,
      loss_ibnr,
      lae_reserves_dcc,
      lae_reserves_aoe,
      lae_ibnr_dcc,
      lae_ibnr_aoe,
      ulae_ibnr,
    };

    this.service.updateExhibit(this.selectedWorkbookId, this.selectedState, exData).subscribe({
      next: () => {
        this.toast.success('Required parameters updated successfully');
        this.onWorkbookChange();
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
      begBal: Number(this.cashSettlement.beg_bal ?? 0),
      amtPaid: Number(this.cashSettlement.amt_paid ?? 0),
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

  onPostClick(): void {
    if (this.isPosted) {
      this.toast.error('You have already posted to journal entries');
      return;
    }

    this.confirmTitle = 'Post to Journal Entries';
    this.confirmMessage = 'Do you want to post to journal entries Batch?';
    this.pendingAction = () => {
      this.postToJournalEntries();
    };
    this.confirmOpen = true;
    this.cdr.markForCheck();
  }

  onConfirm(): void {
    if (this.pendingAction) {
      this.pendingAction();
    }
    this.confirmOpen = false;
    this.pendingAction = null;
    this.cdr.markForCheck();
  }

  onCancelConfirm(): void {
    this.confirmOpen = false;
    this.pendingAction = null;
    this.cdr.markForCheck();
  }

  postToJournalEntries(): void {
    if (!this.selectedWorkbookId) return;
    this.postingBatch = true;
    this.cdr.markForCheck();

    // Call post to journal entries endpoint directly
    const url = `${this.service['apiUrl']}/workbooks/${this.selectedWorkbookId}/post-to-journal-entries/${this.selectedState}`;
    this.service['http'].post<JournalEntryBatch>(url, { customRows: this.gljeRows }).subscribe({
      next: batch => {
        this.toast.success(
          `Successfully posted ceding entries to Journal Entry batch: ${batch.batch_number}`,
        );
        this.postingBatch = false;
        this.isPosted = true;
        this.cdr.markForCheck();
        // Redirect to Manual Journal Entries Workspace with batchId query param
        this.router.navigate(['/journal-entries'], { queryParams: { batchId: batch.id } });
      },
      error: err => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty error message should also fall back to the default
        const msg = err.error?.message || 'Failed to post to journal entries';
        this.toast.error(msg);
        this.postingBatch = false;
        this.cdr.markForCheck();
      },
    });
  }

  addGLJERow(): void {
    this.gljeRows.push({
      desc: '',
      comp: this.selectedWorkbook?.comp ?? '',
      account: '',
      cc: this.selectedWorkbook?.cc ?? '',
      mga: this.selectedWorkbook?.mga ?? '',
      lob: this.selectedWorkbook?.lob ?? '',
      st: this.selectedState === 'TOTAL' ? '00' : this.selectedState,
      ext: this.selectedWorkbook?.ext ?? '',
      sub: this.selectedWorkbook?.sub ?? '',
      debit: null,
      credit: null,
      isNew: true,
    });
    this.isPosted = false;
    this.cdr.markForCheck();
  }

  removeGLJERow(index: number): void {
    this.gljeRows.splice(index, 1);
    this.isPosted = false;
    this.cdr.markForCheck();
  }

  onRowAmountChange(row: GljeRow, field: 'debit' | 'credit'): void {
    if (field === 'debit' && (row.debit ?? 0) > 0) {
      row.credit = 0;
    } else if (field === 'credit' && (row.credit ?? 0) > 0) {
      row.debit = 0;
    }
    this.isPosted = false;
  }

  onRowChange(): void {
    this.isPosted = false;
    this.cdr.markForCheck();
  }

  exportGLJECSV(): void {
    if (this.gljeRows.length === 0) return;
    let csv = 'Account Description,Comp,ACCOUNT,CC,MGA,LOB,ST,EXT,Sub,Description,Debit,Credit\n';

    let totalDebit = 0;
    let totalCredit = 0;

    this.gljeRows.forEach(r => {
      const debitStr = (r.debit ?? 0) > 0 ? (r.debit ?? 0).toFixed(2) : '';
      const creditStr = (r.credit ?? 0) > 0 ? `-${(r.credit ?? 0).toFixed(2)}` : '';
      totalDebit += Number(r.debit ?? 0);
      totalCredit += Number(r.credit ?? 0);
      csv += `"${r.desc}",${r.comp},${r.account},${r.cc},${r.mga},${r.lob},${r.st},${r.ext},${r.sub},"${r.lineDesc}",${debitStr},${creditStr}\n`;
    });
    csv += `JE Control Totals,,,,,,,,,,${totalDebit.toFixed(2)},-${totalCredit.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      'download',
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty program/month_key should also fall back to a readable filename part
      `GL_JE_Mapping_${this.selectedWorkbook?.program || 'Treaty'}_${this.selectedWorkbook?.month_key || 'Period'}_${this.selectedState}.csv`,
    );
    link.click();
  }

  formatCurrency(value: number | string | null | undefined): string {
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

  formatAccounting(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';
    const num = Number(value);
    if (isNaN(num) || Math.abs(num) < 0.001) return '-';
    const absVal = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(num));
    return num < 0 ? `(${absVal})` : absVal;
  }
}

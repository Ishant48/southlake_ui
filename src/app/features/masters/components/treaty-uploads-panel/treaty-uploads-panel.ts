import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItdFormModal } from '../itd-form-modal/itd-form-modal';
import { TreatiesState } from '../../services/treaties-state';
import { ReinsuranceApi } from '../../../reinsurance-calculations/services/reinsurance-api';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { HttpErrorLike } from '../../../../core/models/http-error.model';
import { Treaty } from '../../models/master.model';
import { ItdFormValue } from '../../models/itd.model';
import {
  buildItdStatesList,
  buildBlankExhibits,
  mergeLoadedExhibits,
  buildManualItdPayload,
  ITD_MONTHS_LIST,
  ITD_YEARS_LIST,
} from '../treaties-tab/treaty-itd.util';

@Component({
  selector: 'app-treaty-uploads-panel',
  imports: [CommonModule, ItdFormModal],
  templateUrl: './treaty-uploads-panel.html',
})
export class TreatyUploadsPanel {
  treatiesState = inject(TreatiesState);
  private reinsuranceApi = inject(ReinsuranceApi);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  @Output() reload = new EventEmitter<void>();

  @ViewChild('monthlyExcelInput') monthlyExcelInput!: ElementRef<HTMLInputElement>;
  @ViewChild('itdExcelInput') itdExcelInput!: ElementRef<HTMLInputElement>;

  showItdModal = false;
  selectedTreatyForItd: Treaty | null = null;
  selectedTreatyForUpload: Treaty | null = null;
  itdForm: ItdFormValue = { program: '', month_key: '', month_label: '', exhibits: {} };
  itdStatesList = [{ code: 'TOTAL', label: 'TOTAL' }];
  itdSelectedMonth = '12';
  itdSelectedYear = '2025';
  readonly monthsList = ITD_MONTHS_LIST;
  readonly yearsList = ITD_YEARS_LIST;

  triggerMonthlyUpload(treaty: Treaty): void {
    this.selectedTreatyForUpload = treaty;
    this.monthlyExcelInput?.nativeElement.click();
  }

  triggerItdUpload(treaty: Treaty): void {
    this.selectedTreatyForUpload = treaty;
    this.itdExcelInput?.nativeElement.click();
  }

  onMonthlyUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedTreatyForUpload) {
      const file = input.files[0];
      const programName = this.selectedTreatyForUpload.name;
      this.toast.info(`Uploading monthly exhibit for treaty: ${programName}...`);

      this.reinsuranceApi.uploadWorkbook(file, false, programName).subscribe({
        next: () => {
          this.toast.success(`Successfully uploaded monthly exhibit for ${programName}.`);
          this.selectedTreatyForUpload = null;
          input.value = '';
          this.reload.emit();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          this.toast.error(err.error?.message || 'Failed to upload monthly exhibit');
          this.selectedTreatyForUpload = null;
          input.value = '';
        },
      });
    }
  }

  onItdUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedTreatyForUpload) {
      const file = input.files[0];
      const programName = this.selectedTreatyForUpload.name;
      this.toast.info(`Uploading and seeding ITD baseline for treaty: ${programName}...`);

      this.reinsuranceApi.uploadWorkbook(file, true, programName).subscribe({
        next: () => {
          this.toast.success(
            `ITD baseline reserves uploaded and seeded for ${programName} successfully.`,
          );
          this.selectedTreatyForUpload = null;
          input.value = '';
          this.reload.emit();
        },
        error: (err: HttpErrorLike) => {
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
          this.toast.error(err.error?.message || 'Failed to seed ITD baseline');
          this.selectedTreatyForUpload = null;
          input.value = '';
        },
      });
    }
  }

  openAddItdModal(treaty: Treaty): void {
    this.selectedTreatyForItd = treaty;
    this.itdSelectedMonth = '12';
    this.itdSelectedYear = '2025';
    this.itdStatesList = buildItdStatesList(treaty);

    const blankExhibits = buildBlankExhibits(this.itdStatesList);
    this.itdForm = {
      ...this.itdForm,
      program: treaty.name,
      month_key: '2025-12',
      month_label: 'December 2025',
      exhibits: blankExhibits,
    };

    const wbId = this.treatiesState.itdWorkbookIds.get(treaty.name);
    if (!wbId) {
      this.showItdModal = true;
      this.cdr.markForCheck();
      return;
    }
    this.reinsuranceApi.getWorkbook(wbId).subscribe({
      next: wbDetail => {
        const exhibits = wbDetail.stateExhibits ?? wbDetail.state_exhibits ?? [];
        this.itdForm = { ...this.itdForm, exhibits: mergeLoadedExhibits(blankExhibits, exhibits) };
        this.showItdModal = true;
        this.cdr.markForCheck();
      },
      error: () => {
        this.showItdModal = true;
        this.cdr.markForCheck();
      },
    });
  }

  saveManualITD(formValue: ItdFormValue): void {
    this.itdForm = { ...this.itdForm, ...formValue };
    if (!this.selectedTreatyForItd) return;

    const payload = buildManualItdPayload(formValue);
    this.reinsuranceApi.createManualITD(payload).subscribe({
      next: () => {
        this.toast.success(`Successfully saved manual ITD baseline for ${payload.program}`);
        this.showItdModal = false;
        this.selectedTreatyForItd = null;
        this.reload.emit();
      },
      error: (err: HttpErrorLike) => {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
        this.toast.error(err.error?.message || 'Failed to save manual ITD baseline');
      },
    });
  }
}

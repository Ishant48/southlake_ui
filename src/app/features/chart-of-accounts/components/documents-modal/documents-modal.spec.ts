import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsModal } from './documents-modal';
import { ChartOfAccountDocument } from '../../../../core/models/chart-of-account.model';

describe('DocumentsModal', () => {
  let component: DocumentsModal;
  let fixture: ComponentFixture<DocumentsModal>;

  const doc: ChartOfAccountDocument = {
    id: 'd1',
    coa_id: 'a1',
    file_name: 'invoice.pdf',
    file_url: 'invoice.pdf',
    uploaded_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsModal],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsModal);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when closed', () => {
    component.open = false;
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.modal-overlay')).toBeNull();
  });

  it('shows the empty state when there are no documents', () => {
    component.open = true;
    component.documents = [];
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No documents uploaded yet.',
    );
  });

  it('lists documents and emits download/delete for the clicked row', () => {
    component.open = true;
    component.documents = [doc];
    fixture.detectChanges();

    const downloadSpy = vi.fn();
    const deleteSpy = vi.fn();
    component.download.subscribe(downloadSpy);
    component.delete.subscribe(deleteSpy);

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.doc-action-btn');
    (buttons[0] as HTMLButtonElement).click();
    (buttons[1] as HTMLButtonElement).click();

    expect(downloadSpy).toHaveBeenCalledWith(doc);
    expect(deleteSpy).toHaveBeenCalledWith(doc);
  });

  it('emits fileSelected with the raw change event', () => {
    component.open = true;
    fixture.detectChanges();
    const fileSelectedSpy = vi.fn();
    component.fileSelected.subscribe(fileSelectedSpy);

    const fileInput = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fileInput.dispatchEvent(new Event('change'));

    expect(fileSelectedSpy).toHaveBeenCalled();
  });

  it('emits closed when the close button is clicked', () => {
    component.open = true;
    fixture.detectChanges();
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const closeBtn = (fixture.nativeElement as HTMLElement).querySelector(
      '.panel-close',
    ) as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });
});

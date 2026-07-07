import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentDrawer, DrawerDocument } from './document-drawer';

describe('DocumentDrawer', () => {
  let component: DocumentDrawer;
  let fixture: ComponentFixture<DocumentDrawer>;

  const doc: DrawerDocument = {
    id: 'd-1',
    file_name: 'invoice.pdf',
    file_url: 'invoice.pdf',
    uploaded_at: '2026-06-01T00:00:00Z',
    document_type: 'Invoice',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentDrawer],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentDrawer);
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
    component.documentsList = [];
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('No documents uploaded yet');
  });

  it('lists documents and their type badge', () => {
    component.open = true;
    component.documentsList = [doc];
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('invoice.pdf');
    expect(text).toContain('Invoice');
  });

  it('docTypeLabel falls back to the camelCase field', () => {
    expect(
      component.docTypeLabel({ ...doc, document_type: undefined, documentType: 'Contract' }),
    ).toBe('Contract');
  });

  it('emits fileSelected with the file and selected document type', () => {
    component.open = true;
    component.selectedDocType = 'invoice';
    fixture.detectChanges();
    const emitSpy = vi.fn();
    component.fileSelected.subscribe(emitSpy);

    const file = new File(['data'], 'test.pdf');
    const input = { files: [file], value: 'test.pdf' } as unknown as HTMLInputElement;
    component.onFileInputChange({ target: input } as unknown as Event);

    expect(emitSpy).toHaveBeenCalledWith({ file, documentType: 'invoice' });
    expect(input.value).toBe('');
  });

  it('does not emit fileSelected when no document type is selected', () => {
    component.selectedDocType = '';
    const emitSpy = vi.fn();
    component.fileSelected.subscribe(emitSpy);

    const file = new File(['data'], 'test.pdf');
    const input = { files: [file], value: 'test.pdf' } as unknown as HTMLInputElement;
    component.onFileInputChange({ target: input } as unknown as Event);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits download and delete with the clicked document', () => {
    component.open = true;
    component.documentsList = [doc];
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

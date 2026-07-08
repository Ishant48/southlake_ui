export enum SimpleMode {
  Lob = 'lob',
  Cob = 'cob',
  Reinsurer = 'reinsurer',
  Broker = 'broker',
  Product = 'product',
  DocumentType = 'document-type',
  SequencePrefixCounter = 'sequence-prefix-counter',
}

export interface SimpleFormValue {
  id?: string;
  code: string;
  name: string;
  is_active: boolean;
  description: string;
  type: string;
  taxable: boolean;
  priority: number;
  fully_earned: boolean;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  lob_id?: any;
  cob_id?: any;
  prefix?: string;
  next_value?: number;
  padding_width?: number;
}

export function createBlankSimpleForm(): SimpleFormValue {
  return {
    code: '',
    name: '',
    is_active: true,
    description: '',
    type: '',
    taxable: false,
    priority: 1,
    fully_earned: false,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    lob_id: '',
    cob_id: '',
    prefix: '',
    next_value: 1,
    padding_width: 4,
  };
}

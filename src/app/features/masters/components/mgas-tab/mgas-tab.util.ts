import { MgaMaster } from '../../models/master.model';
import { MgaFormValue } from '../../models/mga-form.model';

export function mapMgaToFormValue(mga: MgaMaster): MgaFormValue {
  return {
    id: mga.id,
    mga_code: mga.mga_code,
    name: mga.name,
    tax_payable_inhouse: mga.tax_payable_inhouse,
    ledger_amount: mga.ledger_amount ?? 0,
    is_active: mga.is_active,
    company_id: mga.company_id ? Number(mga.company_id) : null,
    id_name: mga.id_name ?? '',
    address: mga.address ?? '',
    zip: mga.zip ?? '',
    city: mga.city ?? '',
    state: mga.state ?? '',
    phone: mga.phone ?? '',
    open_item: mga.open_item ?? false,
    op_start_date: mga.op_start_date ? mga.op_start_date.substring(0, 10) : '',
    other_names: mga.other_names ? JSON.parse(JSON.stringify(mga.other_names)) : [],
    contact_name: mga.contact_name ?? '',
    contact_email: mga.contact_email ?? '',
    contact_phone: mga.contact_phone ?? '',
  };
}

export function buildMgaPayload(form: MgaFormValue): Partial<MgaMaster> {
  return {
    ...form,
    ledger_amount: Number(form.ledger_amount || 0),
    company_id: form.company_id ? Number(form.company_id) : null,
    other_names: form.other_names && form.other_names.length > 0 ? form.other_names : null,
  };
}

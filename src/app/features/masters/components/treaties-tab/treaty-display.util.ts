import { Treaty, TreatyState, TreatyLob } from '../../models/master.model';

export function getMgasListDisplay(treaty: Treaty): string {
  if (treaty.treaty_mgas && treaty.treaty_mgas.length > 0) {
    return treaty.treaty_mgas
      .map(m => m.mga?.name)
      .filter(Boolean)
      .join(', ');
  }
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
  return treaty.mga?.name || '-';
}

export function getCarriersListDisplay(treaty: Treaty): string {
  if (treaty.treaty_carriers && treaty.treaty_carriers.length > 0) {
    return (
      treaty.treaty_carriers
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an empty string should also fall back to the placeholder/default shown here
        .map(tc => `${tc.risk_company?.name || 'Unknown'} (${tc.retention_pct}%)`)
        .join(', ')
    );
  }
  if (treaty.risk_company) {
    return `${treaty.risk_company.name} (${treaty.carrier_retention_pct ?? 100}%)`;
  }
  return '-';
}

export function getStatesListDisplay(states?: TreatyState[]): string {
  if (!states || states.length === 0) return '-';
  const codes = states.map(s => s.state?.state_code).filter(Boolean);
  if (codes.length === 0) return '-';
  if (codes.length > 5) {
    return codes.slice(0, 4).join(', ') + ` (+${codes.length - 4} more)`;
  }
  return codes.join(', ');
}

export function getLobsListDisplay(lobs?: TreatyLob[]): string {
  if (!lobs || lobs.length === 0) return '-';
  return lobs
    .map(l => {
      const lobName = l.lob?.lob_code;
      const cobs = l.treaty_lob_cobs
        ?.map(c => c.cob?.cob_code)
        .filter(Boolean)
        .join('/');
      return cobs ? `${lobName} (${cobs})` : lobName;
    })
    .filter(Boolean)
    .join(', ');
}

import { ChartOfAccount } from '../../../core/models/chart-of-account.model';

// Page-local shape for the hierarchical/tree grid display — not shared with
// other features, so it lives here rather than in core/models.
export interface TreeAccount extends ChartOfAccount {
  is_root: boolean;
  treeDepth: number;
}

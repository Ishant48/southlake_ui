import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TreatiesTab } from './components/treaties-tab/treaties-tab';
import { MgasTab } from './components/mgas-tab/mgas-tab';
import { StatesTab } from './components/states-tab/states-tab';
import { RiskCompaniesTab } from './components/risk-companies-tab/risk-companies-tab';
import { GlMappingsTab } from './components/gl-mappings-tab/gl-mappings-tab';
import { LockedPeriodsTab } from './components/locked-periods-tab/locked-periods-tab';
import { SimpleMasterTab } from './components/simple-master-tab/simple-master-tab';
import { MasterTab } from './models/master-tab.model';
import { SimpleMode } from './models/simple-form.model';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [
    CommonModule,
    TreatiesTab,
    MgasTab,
    StatesTab,
    RiskCompaniesTab,
    GlMappingsTab,
    LockedPeriodsTab,
    SimpleMasterTab,
  ],
  templateUrl: './masters.component.html',
  styleUrl: './masters.component.scss',
})
export class MastersComponent implements OnInit {
  protected readonly MasterTab = MasterTab;
  protected readonly SimpleMode = SimpleMode;

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  currentTab: MasterTab = MasterTab.Treaties;

  @ViewChild(MgasTab) mgasTab?: MgasTab;
  @ViewChild(StatesTab) statesTab?: StatesTab;
  @ViewChild(RiskCompaniesTab) riskCompaniesTab?: RiskCompaniesTab;
  @ViewChild(GlMappingsTab) glMappingsTab?: GlMappingsTab;
  @ViewChild(LockedPeriodsTab) lockedPeriodsTab?: LockedPeriodsTab;
  @ViewChild(SimpleMasterTab) simpleMasterTab?: SimpleMasterTab;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'] as MasterTab;
      this.currentTab = tab && Object.values(MasterTab).includes(tab) ? tab : MasterTab.Treaties;
    });
  }

  selectTab(tab: MasterTab): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }
}

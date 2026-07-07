import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReinsuranceParamsForm {
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

export interface ReinsuranceRatesForm {
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

export interface ReinsuranceMappingsForm {
  mga?: string;
  lob?: string;
  line_desc_suffix?: string;
  comp?: string;
  cc?: string;
  ext?: string;
  sub?: string;
  [key: string]: unknown;
}

export enum SettingsAccordionSection {
  Parameters = 'parameters',
  Rates = 'rates',
  Mappings = 'mappings',
}

@Component({
  selector: 'app-settings-accordions',
  imports: [CommonModule, FormsModule],
  templateUrl: './settings-accordions.html',
  styleUrl: './settings-accordions.scss',
})
export class SettingsAccordions {
  protected readonly SettingsAccordionSection = SettingsAccordionSection;

  @Input() selectedState = '';
  @Input() paramsForm: Partial<ReinsuranceParamsForm> = {};
  @Input() ratesForm: ReinsuranceRatesForm = {};
  @Input() mappingsForm: ReinsuranceMappingsForm = {};

  parametersExpanded = false;
  ratesExpanded = false;
  mappingsExpanded = false;

  toggleAccordion(section: SettingsAccordionSection): void {
    if (section === SettingsAccordionSection.Parameters) {
      this.parametersExpanded = !this.parametersExpanded;
    } else if (section === SettingsAccordionSection.Rates) {
      this.ratesExpanded = !this.ratesExpanded;
    } else if (section === SettingsAccordionSection.Mappings) {
      this.mappingsExpanded = !this.mappingsExpanded;
    }
  }
}

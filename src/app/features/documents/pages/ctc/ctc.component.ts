import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';

type CtcTab = 'calculator' | 'create';

interface CtcInputModel {
  annualCtc: number;
  basicPercent: number;
  hraPercent: number;
  daPercent: number;
  pfWageCeiling: number;
  includePfOnDa: boolean;
  employeePfRate: number;
  employerPfRate: number;
  esiWageCeiling: number;
  employeeEsiRate: number;
  employerEsiRate: number;
  monthlyTds: number;
  yearsOfService: number;
  medicalEmployer: number;
  medicalEmployee: number;
}

interface SalarySettingsPayload {
  companyid: number;
  basic_pay: number;
  hra: number;
  da: number;
  pf_Ceiling_limit: number;
  pf_amount: number;
  employee_pf_rate: number;
  employer_pf_rate: number;
  esi_Ceiling_limit: number;
  employee_esi_rate: number;
  employer_esi_rate: number;
  employee_med_ins_amount: number;
  employer_med_ins_amount: number;
  gratuity_rate: number;
  createdby: string;
  is_pf_Ceiling: boolean;
}

interface SalarySettingsFormValue {
  companyid: number | null;
  basic_pay: number | null;
  hra: number | null;
  da: number | null;
  pf_Ceiling_limit: number | null;
  pf_amount: number | null;
  employee_pf_rate: number | null;
  employer_pf_rate: number | null;
  esi_Ceiling_limit: number | null;
  employee_esi_rate: number | null;
  employer_esi_rate: number | null;
  employee_med_ins_amount: number | null;
  employer_med_ins_amount: number | null;
  gratuity_rate: number | null;
  createdby: string;
  is_pf_Ceiling: boolean;
}

@Component({
  selector: 'app-ctc',
  templateUrl: './ctc.component.html',
  styleUrls: ['./ctc.component.scss'],
})
export class CtcComponent implements OnInit {
  activeTab: CtcTab = 'calculator';
  submittingSettings = false;

  readonly model: CtcInputModel = {
    annualCtc: 300000,
    basicPercent: 40,
    hraPercent: 50,
    daPercent: 0,
    pfWageCeiling: 15000,
    includePfOnDa: true,
    employeePfRate: 12,
    employerPfRate: 12,
    esiWageCeiling: 21000,
    employeeEsiRate: 0.75,
    employerEsiRate: 3.25,
    monthlyTds: 5000,
    yearsOfService: 5,
    medicalEmployer: 1500,
    medicalEmployee: 0,
  };

  salarySettings: SalarySettingsFormValue;
  username: any;
  companyId: any;
  constructor(
    private apiService: ApiService,
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private feedback: UiFeedbackService
  ) {
    this.salarySettings = this.createDefaultSalarySettings();
    this.username = tokenStorage.getUsername();

  }
  ngOnInit(): void {
    this.getemployeedetails();
  }
  getemployeedetails() {
    this.apiService.getemployeedetails(this.username).subscribe((res: any) => {
      this.companyId = res.companyid;
      console.log("jhfgdshfghj  ",this.companyId);
      this.getSalarySetting(this.companyId)
    })
  }
  getSalarySetting(companyId: any) {
    this.apiService.getSalarySetting(companyId).subscribe((data: any) => {
      console.log("fdsfdsfd      =",data);

    })
  }
  get monthlyGross(): number {
    return this.model.annualCtc / 12;
  }

  get basicPay(): number {
    return this.monthlyGross * (this.model.basicPercent / 100);
  }

  get hra(): number {
    return this.basicPay * (this.model.hraPercent / 100);
  }

  get da(): number {
    return this.basicPay * (this.model.daPercent / 100);
  }

  get specialAllowance(): number {
    return Math.max(this.monthlyGross - this.basicPay - this.hra - this.da, 0);
  }

  get pfEligibleWage(): number {
    const base = this.model.includePfOnDa ? this.basicPay + this.da : this.basicPay;
    return this.model.pfWageCeiling > 0 ? Math.min(base, this.model.pfWageCeiling) : base;
  }

  get employeePf(): number {
    return this.pfEligibleWage * (this.model.employeePfRate / 100);
  }

  get employerPf(): number {
    return this.pfEligibleWage * (this.model.employerPfRate / 100);
  }

  get isEsiEligible(): boolean {
    return this.model.esiWageCeiling > 0 && this.monthlyGross <= this.model.esiWageCeiling;
  }

  get employeeEsi(): number {
    return this.isEsiEligible ? this.monthlyGross * (this.model.employeeEsiRate / 100) : 0;
  }

  get employerEsi(): number {
    return this.isEsiEligible ? this.monthlyGross * (this.model.employerEsiRate / 100) : 0;
  }

  get gratuityMonthly(): number {
    return ((this.basicPay * 15) / 26) / 12;
  }

  get gratuityRate(): number {
    return (15 / 26 / 12) * 100;
  }

  get employeeDeductions(): number {
    return this.employeePf + this.employeeEsi + this.model.monthlyTds + this.model.medicalEmployee;
  }

  get employerContributions(): number {
    return this.employerPf + this.employerEsi + this.model.medicalEmployer + this.gratuityMonthly;
  }

  get takeHome(): number {
    return this.monthlyGross - this.employeeDeductions;
  }

  get employerCost(): number {
    return this.monthlyGross + this.employerContributions;
  }

  get companyIdPreview(): number {
    return Number(this.salarySettings.companyid || this.resolveCompanyId() || 0);
  }

  get createdByPreview(): string {
    return `${this.salarySettings.createdby || this.resolveCreatedBy()}`.trim();
  }

  setActiveTab(tab: CtcTab): void {
    this.activeTab = tab;
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value || 0)));
  }

  printPage(): void {
    window.print();
  }

  downloadCalculation(): void {
    const content = [
      'CTC Payroll Calculator',
      `Annual CTC: Rs ${this.formatCurrency(this.model.annualCtc)}`,
      `Monthly Gross: Rs ${this.formatCurrency(this.monthlyGross)}`,
      `Take-home: Rs ${this.formatCurrency(this.takeHome)}`,
      `Employer Cost: Rs ${this.formatCurrency(this.employerCost)}`,
      '',
      'Earnings',
      `Basic: Rs ${this.formatCurrency(this.basicPay)}`,
      `HRA: Rs ${this.formatCurrency(this.hra)}`,
      `DA: Rs ${this.formatCurrency(this.da)}`,
      `Special Allowance: Rs ${this.formatCurrency(this.specialAllowance)}`,
      '',
      'Employee Deductions',
      `Employee PF: Rs ${this.formatCurrency(this.employeePf)}`,
      `Employee ESI: Rs ${this.formatCurrency(this.employeeEsi)}`,
      `TDS: Rs ${this.formatCurrency(this.model.monthlyTds)}`,
      `Medical Employee: Rs ${this.formatCurrency(this.model.medicalEmployee)}`,
      '',
      'Employer Contributions',
      `Employer PF: Rs ${this.formatCurrency(this.employerPf)}`,
      `Employer ESI: Rs ${this.formatCurrency(this.employerEsi)}`,
      `Medical Employer: Rs ${this.formatCurrency(this.model.medicalEmployer)}`,
      `Gratuity: Rs ${this.formatCurrency(this.gratuityMonthly)}`,
    ].join('\n');

    this.downloadTextFile('ctc-calculation.txt', content);
  }

  useCalculatorValues(): void {
    this.salarySettings = {
      ...this.salarySettings,
      basic_pay: this.roundCurrency(this.basicPay),
      hra: this.roundCurrency(this.hra),
      da: this.roundCurrency(this.da),
      pf_Ceiling_limit: this.roundCurrency(this.model.pfWageCeiling),
      pf_amount: this.roundCurrency(this.employeePf),
      employee_pf_rate: this.model.employeePfRate,
      employer_pf_rate: this.model.employerPfRate,
      esi_Ceiling_limit: this.roundCurrency(this.model.esiWageCeiling),
      employee_esi_rate: this.model.employeeEsiRate,
      employer_esi_rate: this.model.employerEsiRate,
      employee_med_ins_amount: this.roundCurrency(this.model.medicalEmployee),
      employer_med_ins_amount: this.roundCurrency(this.model.medicalEmployer),
      gratuity_rate: this.roundToTwo(this.gratuityRate),
      is_pf_Ceiling: this.model.pfWageCeiling > 0,
    };

    this.feedback.info('Calculator values copied into payroll create form.');
  }

  resetSalarySettings(): void {
    this.salarySettings = this.createDefaultSalarySettings();
  }

  saveSalarySettings(): void {
    const payload = this.normalizeSalarySettingsPayload();

    if (!payload.companyid) {
      this.feedback.warning('Company Id is required before saving payroll settings.');
      return;
    }

    if (!payload.createdby) {
      this.feedback.warning('Created By is required before saving payroll settings.');
      return;
    }

    this.submittingSettings = true;
    this.apiService.CreateSalaryDetails(payload)
      .pipe(finalize(() => (this.submittingSettings = false)))
      .subscribe({
        next: (response: any) => {
          this.salarySettings = { ...payload };
          this.feedback.success(response?.message || 'Payroll salary settings saved successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err?.error?.message || 'Failed to save payroll salary settings. Please try again.');
        },
      });
  }

  private normalizeSalarySettingsPayload(): SalarySettingsPayload {
    return {
      companyid: Number(this.salarySettings.companyid || this.resolveCompanyId() || 0),
      basic_pay: this.roundCurrency(this.salarySettings.basic_pay),
      hra: this.roundCurrency(this.salarySettings.hra),
      da: this.roundCurrency(this.salarySettings.da),
      pf_Ceiling_limit: this.roundCurrency(this.salarySettings.pf_Ceiling_limit),
      pf_amount: this.roundCurrency(this.salarySettings.pf_amount),
      employee_pf_rate: this.roundToTwo(this.salarySettings.employee_pf_rate),
      employer_pf_rate: this.roundToTwo(this.salarySettings.employer_pf_rate),
      esi_Ceiling_limit: this.roundCurrency(this.salarySettings.esi_Ceiling_limit),
      employee_esi_rate: this.roundToTwo(this.salarySettings.employee_esi_rate),
      employer_esi_rate: this.roundToTwo(this.salarySettings.employer_esi_rate),
      employee_med_ins_amount: this.roundCurrency(this.salarySettings.employee_med_ins_amount),
      employer_med_ins_amount: this.roundCurrency(this.salarySettings.employer_med_ins_amount),
      gratuity_rate: this.roundToTwo(this.salarySettings.gratuity_rate),
      createdby: `${this.salarySettings.createdby || this.resolveCreatedBy()}`.trim(),
      is_pf_Ceiling: !!this.salarySettings.is_pf_Ceiling,
    };
  }

  private createDefaultSalarySettings(): SalarySettingsFormValue {
    return {
      companyid: this.resolveCompanyId(),
      basic_pay: null,
      hra: null,
      da: null,
      pf_Ceiling_limit: null,
      pf_amount: null,
      employee_pf_rate: null,
      employer_pf_rate: null,
      esi_Ceiling_limit: null,
      employee_esi_rate: null,
      employer_esi_rate: null,
      employee_med_ins_amount: null,
      employer_med_ins_amount: null,
      gratuity_rate: null,
      createdby: this.resolveCreatedBy(),
      is_pf_Ceiling: true,
    };
  }

  private resolveCompanyId(): number {
    return Number(this.tokenStorage.getCompanyId() || this.authService.getID() || 0) || 0;
  }

  private resolveCreatedBy(): string {
    return `${this.tokenStorage.getUsername() || this.authService.getUsername() || ''}`.trim();
  }

  private roundCurrency(value: unknown): number {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? Math.round(numericValue) : 0;
  }

  private roundToTwo(value: unknown): number {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? Number(numericValue.toFixed(2)) : 0;
  }

  private downloadTextFile(filename: string, content: string): void {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}

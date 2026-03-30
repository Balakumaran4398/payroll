import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from 'src/app/core/services/auth.service';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';

type CtcTab = 'calculator' | 'create';

interface CtcInputModel {
  ctc: number;
  annualCtc: number;
  basicPercent: number;
  hraPercent: number;
  ltaPercent: number;
  pfWageCeiling: number;
  employeePfRate: number;
  employerPfRate: number;
  esiGrossCeiling: number;
  employeeEsiRate: number;
  employerEsiRate: number;
  mediclaim: number;
  isPf: boolean;
  isEsi: boolean;
  isGratuity: boolean;
  grossWageOverride: number;
  minWage: number;
  totalDays: number;
  workingDays: number;
  weekOff: number;
  paidHoliday: number;
  lopAbsent: number;
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

type SalarySettingsFieldKey = Exclude<keyof SalarySettingsFormValue, 'companyid' | 'createdby' | 'is_pf_Ceiling'>;
type SalarySettingsPercentFieldKey =
  | 'hra'
  | 'da'
  | 'employee_pf_rate'
  | 'employer_pf_rate'
  | 'employee_esi_rate'
  | 'employer_esi_rate'
  | 'gratuity_rate';

@Component({
  selector: 'app-ctc',
  templateUrl: './ctc.component.html',
  styleUrls: ['./ctc.component.scss'],
})
export class CtcComponent implements OnInit {
  activeTab: CtcTab = 'calculator';
  submittingSettings = false;
  salarySettingsSubmitAttempted = false;
  readonly salarySettingsPercentFields: SalarySettingsPercentFieldKey[] = [
    'hra',
    'da',
    'employee_pf_rate',
    'employer_pf_rate',
    'employee_esi_rate',
    'employer_esi_rate',
    'gratuity_rate',
  ];

  readonly salarySettingsFieldLabels: Record<SalarySettingsFieldKey, string> = {
    basic_pay: 'Basic Pay',
    hra: 'HRA',
    da: 'DA',
    pf_Ceiling_limit: 'PF Ceiling Limit',
    pf_amount: 'PF Amount',
    employee_pf_rate: 'Employee PF Rate',
    employer_pf_rate: 'Employer PF Rate',
    esi_Ceiling_limit: 'ESI Ceiling Limit',
    employee_esi_rate: 'Employee ESI Rate',
    employer_esi_rate: 'Employer ESI Rate',
    employee_med_ins_amount: 'Employee Medical Insurance Amount',
    employer_med_ins_amount: 'Employer Medical Insurance Amount',
    gratuity_rate: 'Gratuity Rate',
  };

  readonly model: CtcInputModel = {
    ctc: 25000,
    annualCtc: 300000,
    basicPercent: 40,
    hraPercent: 50,
    ltaPercent: 0,
    pfWageCeiling: 15000,
    employeePfRate: 12,
    employerPfRate: 9.6,
    esiGrossCeiling: 21000,
    employeeEsiRate: 0.75,
    employerEsiRate: 3.25,
    mediclaim: 1500,
    isPf: true,
    isEsi: false,
    isGratuity: true,
    grossWageOverride: 0,
    minWage: 0,
    totalDays: 30,
    workingDays: 26,
    weekOff: 4,
    paidHoliday: 0,
    lopAbsent: 0,
  };

  salarySettingsForm: FormGroup;
  username: any;
  companyId: any;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private feedback: UiFeedbackService
  ) {
    this.salarySettingsForm = this.buildSalarySettingsForm();
    this.username = tokenStorage.getUsername();
  }

  ngOnInit(): void {
    this.getemployeedetails();
  }

  getemployeedetails() {
    this.apiService.getemployeedetails(this.username).subscribe((res: any) => {
      this.companyId = res.companyid;
      this.salarySettingsForm.patchValue({
        companyid: Number(this.companyId || this.resolveCompanyId() || 0) || 0,
        createdby: this.resolveCreatedBy(),
      });
      this.getSalarySetting(this.companyId);
    });
  }

  getSalarySetting(companyId: any) {
    this.apiService.getSalarySetting(companyId).subscribe((data: any) => {
      const settings = Array.isArray(data) ? data[0] : data;

      if (!settings) {
        return;
      }

      this.salarySettingsForm.patchValue({
        companyid: Number(settings.companyid || this.resolveCompanyId() || 0) || 0,
        basic_pay: this.coerceNullableNumber(settings.basic_pay),
        hra: this.coerceNullableNumber(settings.hra),
        da: this.coerceNullableNumber(settings.da),
        pf_Ceiling_limit: this.coerceNullableNumber(settings.pf_Ceiling_limit),
        pf_amount: this.coerceNullableNumber(settings.pf_amount),
        employee_pf_rate: this.coerceNullableNumber(settings.employee_pf_rate),
        employer_pf_rate: this.coerceNullableNumber(settings.employer_pf_rate),
        esi_Ceiling_limit: this.coerceNullableNumber(settings.esi_Ceiling_limit),
        employee_esi_rate: this.coerceNullableNumber(settings.employee_esi_rate),
        employer_esi_rate: this.coerceNullableNumber(settings.employer_esi_rate),
        employee_med_ins_amount: this.coerceNullableNumber(settings.employee_med_ins_amount),
        employer_med_ins_amount: this.coerceNullableNumber(settings.employer_med_ins_amount),
        gratuity_rate: this.coerceNullableNumber(settings.gratuity_rate),
        createdby: `${settings.createdby || this.resolveCreatedBy()}`.trim(),
        is_pf_Ceiling: !!settings.is_pf_Ceiling,
      });
      this.clearSalarySettingsValidationState();
    });
  }

  get ctc_per_month(): number {
    return this.roundCurrency(this.model.ctc);
  }

  get annualCtcDisplay(): number {
    return this.ctc;
  }

  get basic_pay(): number {
    const calculatedBasic = Math.round((this.percentValue(this.model.basicPercent) / 100) * this.ctc_per_month);
    return Math.max(calculatedBasic, this.min_wage_amount);
  }

  get hra(): number {
    return Math.round((this.percentValue(this.model.hraPercent) / 100) * this.basic_pay);
  }

  get lta(): number {
    return Math.round((this.percentValue(this.model.ltaPercent) / 100) * this.basic_pay);
  }

  get da(): number {
    return 0;
  }

  get medical_insurance(): number {
    return this.roundCurrency(this.model.mediclaim);
  }

  get gratuity(): number {
    if (!this.model.isGratuity) {
      return 0;
    }

    return Math.round((this.basic_pay / 100) * 4.81);
  }

  get gross(): number {
    const overrideAmount = this.roundCurrency(this.model.grossWageOverride);

    if (overrideAmount > 0) {
      return overrideAmount;
    }

    return this.calculateAutoGross();
  }

  get employer_pf_amount(): number {
    return this.calculatePfContribution(this.model.employerPfRate);
  }

  get employer_esi_amount(): number {
    return this.calculateEsiContribution(this.model.employerEsiRate, this.gross);
  }

  get employee_pf_amount(): number {
    return this.calculatePfContribution(this.model.employeePfRate);
  }

  get employee_esi_amount(): number {
    return this.calculateEsiContribution(this.model.employeeEsiRate, this.gross);
  }

  get special_allowance(): number {
    return this.gross - (this.basic_pay + this.hra + this.lta);
  }

  get fixed_gross(): number {
    return this.basic_pay + this.hra + this.lta + this.special_allowance;
  }

  get total_deduction(): number {
    return this.employee_pf_amount + this.employee_esi_amount;
  }

  get netpay(): number {
    return this.gross - this.total_deduction;
  }

  get adjustedNetpay(): number {
    return this.netpay - this.lop_deduction;
  }

  get fixed_ctc(): number {
    return this.ctc_per_month;
  }

  get ctc(): number {
    return this.fixed_ctc * 12;
  }

  get week_off(): number {
    return this.roundWholeInput(this.model.weekOff);
  }

  get paid_holiday(): number {
    return this.roundWholeInput(this.model.paidHoliday);
  }

  get lop_absent(): number {
    return this.roundWholeInput(this.model.lopAbsent);
  }

  get total_days(): number {
    return this.roundWholeInput(this.model.totalDays);
  }

  get working_days(): number {
    return this.roundWholeInput(this.model.workingDays);
  }

  get lop_deduction(): number {
    if (this.total_days <= 0 || this.lop_absent <= 0) {
      return 0;
    }

    return Math.round((this.gross / this.total_days) * this.lop_absent);
  }

  get min_wage_amount(): number {
    return this.roundCurrency(this.model.minWage);
  }

  get companyIdPreview(): number {
    return Number(this.salarySettings.companyid || this.resolveCompanyId() || 0);
  }

  get createdByPreview(): string {
    return `${this.salarySettings.createdby || this.resolveCreatedBy()}`.trim();
  }

  get salarySettingsValidationMessage(): string {
    const invalidFields = (Object.keys(this.salarySettingsFieldLabels) as SalarySettingsFieldKey[])
      .filter((field) => this.hasSalaryFieldError(field)).length;

    if (!this.salarySettingsSubmitAttempted || !invalidFields) {
      return '';
    }

    return `Complete ${invalidFields} required payroll field${invalidFields === 1 ? '' : 's'} before saving.`;
  }

  setActiveTab(tab: CtcTab): void {
    this.activeTab = tab;
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value || 0)));
  }

  annualize(value: number | null | undefined): number {
    return Math.round(Number(value || 0) * 12);
  }

  printPage(): void {
    const el = document.getElementById('ctc-breakdown-print');
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
    setTimeout(() => window.print(), 150);
  }

  downloadCalculation(): void {
    const content = [
      'CTC MONTHLY BREAKDOWN — PAYROLL SYSTEM',
      '═══════════════════════════════════════',
      '',
      'EARNINGS',
      `  Basic Pay          : Rs ${this.formatCurrency(this.basic_pay)}   | Annual: Rs ${this.formatCurrency(this.basic_pay * 12)}`,
      `  HRA                : Rs ${this.formatCurrency(this.hra)}         | Annual: Rs ${this.formatCurrency(this.hra * 12)}`,
      `  DA                 : Rs ${this.formatCurrency(this.da)}          | Annual: Rs ${this.formatCurrency(this.da * 12)}`,
      `  Special Allowance  : Rs ${this.formatCurrency(this.special_allowance)} | Annual: Rs ${this.formatCurrency(this.special_allowance * 12)}`,
      `  Fixed Gross        : Rs ${this.formatCurrency(this.fixed_gross)} | Annual: Rs ${this.formatCurrency(this.fixed_gross * 12)}`,
      `  Gross              : Rs ${this.formatCurrency(this.gross)}       | Annual: Rs ${this.formatCurrency(this.gross * 12)}`,
      '',
      'EMPLOYEE DEDUCTIONS',
      `  Employee PF        : Rs ${this.formatCurrency(this.employee_pf_amount)} | Annual: Rs ${this.formatCurrency(this.employee_pf_amount * 12)}`,
      `  Employee ESI       : Rs ${this.formatCurrency(this.employee_esi_amount)} | Annual: Rs ${this.formatCurrency(this.employee_esi_amount * 12)}`,
      `  Total Deduction    : Rs ${this.formatCurrency(this.total_deduction)} | Annual: Rs ${this.formatCurrency(this.total_deduction * 12)}`,
      '',
      'EMPLOYER CONTRIBUTIONS',
      `  Employer PF        : Rs ${this.formatCurrency(this.employer_pf_amount)} | Annual: Rs ${this.formatCurrency(this.employer_pf_amount * 12)}`,
      `  Employer ESI       : Rs ${this.formatCurrency(this.employer_esi_amount)} | Annual: Rs ${this.formatCurrency(this.employer_esi_amount * 12)}`,
      `  Medical Insurance  : Rs ${this.formatCurrency(this.medical_insurance)} | Annual: Rs ${this.formatCurrency(this.medical_insurance * 12)}`,
      `  Gratuity           : Rs ${this.formatCurrency(this.gratuity)}    | Annual: Rs ${this.formatCurrency(this.gratuity * 12)}`,
      '',
      'ATTENDANCE',
      `  Week Off           : ${this.week_off}`,
      `  Paid Holiday       : ${this.paid_holiday}`,
      `  LOP Absent         : ${this.lop_absent}`,
      `  LOP Deduction      : Rs ${this.formatCurrency(this.lop_deduction)}`,
      `  Total Days         : ${this.total_days}`,
      `  Working Days       : ${this.working_days}`,
      '',
      'SUMMARY',
      `  Fixed CTC          : Rs ${this.formatCurrency(this.fixed_ctc)} | Annual: Rs ${this.formatCurrency(this.fixed_ctc * 12)}`,
      `  CTC                : Rs ${this.formatCurrency(this.ctc)}`,
      `  Net Pay            : Rs ${this.formatCurrency(this.netpay)} | Annual: Rs ${this.formatCurrency(this.netpay * 12)}`,
      '',
      '═══════════════════════════════════════',
      'CTC RECONCILIATION',
      `  CTC                : Rs ${this.formatCurrency(this.ctc)}`,
      `  Net Pay (Annual)   : Rs ${this.formatCurrency(this.netpay * 12)}`,
      `  LOP Deduction (Annual): Rs ${this.formatCurrency(this.lop_deduction * 12)}`,
      '═══════════════════════════════════════',
    ].join('\n');

    this.downloadTextFile('ctc-monthly-breakdown.txt', content);
  }

  saveBreakdown(): void {
    document.body.classList.add('ctc-saving');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('ctc-saving');
    }, 120);
  }

  useCalculatorValues(): void {
    this.salarySettingsForm.patchValue({
      basic_pay: this.roundCurrency(this.basic_pay),
      hra: this.roundToTwo(this.model.hraPercent),
      da: this.roundCurrency(this.da),
      pf_Ceiling_limit: this.model.isPf ? this.roundCurrency(this.model.pfWageCeiling) : 0,
      pf_amount: this.roundCurrency(this.employee_pf_amount),
      employee_pf_rate: this.model.isPf ? this.roundToTwo(this.model.employeePfRate) : 0,
      employer_pf_rate: this.model.isPf ? this.roundToTwo(this.model.employerPfRate) : 0,
      esi_Ceiling_limit: this.model.isEsi ? this.roundCurrency(this.model.esiGrossCeiling) : 0,
      employee_esi_rate: this.model.isEsi ? this.roundToTwo(this.model.employeeEsiRate) : 0,
      employer_esi_rate: this.model.isEsi ? this.roundToTwo(this.model.employerEsiRate) : 0,
      employee_med_ins_amount: 0,
      employer_med_ins_amount: this.roundCurrency(this.medical_insurance),
      gratuity_rate: this.model.isGratuity ? 4.81 : 0,
      is_pf_Ceiling: this.model.isPf && this.roundCurrency(this.model.pfWageCeiling) > 0,
    });
    this.clearSalarySettingsValidationState();

    this.feedback.info('Calculator values copied into payroll create form.');
  }

  resetSalarySettings(): void {
    this.salarySettingsForm.reset(this.createDefaultSalarySettings());
    this.clearSalarySettingsValidationState();
  }

  saveSalarySettings(): void {
    this.salarySettingsSubmitAttempted = true;
    this.salarySettingsForm.markAllAsTouched();

    if (this.salarySettingsForm.invalid) {
      this.feedback.warning('Enter all required payroll values before saving salary settings.');
      return;
    }

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
          this.salarySettingsForm.reset({ ...payload });
          this.clearSalarySettingsValidationState();
          this.feedback.success(response?.message || 'Payroll salary settings saved successfully.');
        },
        error: (err: any) => {
          this.feedback.error(err?.error?.message || 'Failed to save payroll salary settings. Please try again.');
        },
      });
  }

  hasSalaryFieldError(field: SalarySettingsFieldKey): boolean {
    const control = this.salarySettingsForm.get(field);
    return !!control && control.invalid && (control.touched || control.dirty || this.salarySettingsSubmitAttempted);
  }

  getSalaryFieldError(field: SalarySettingsFieldKey): string {
    const control = this.salarySettingsForm.get(field);
    const label = this.salarySettingsFieldLabels[field];

    if (!control || !this.hasSalaryFieldError(field)) {
      return '';
    }

    if (control.hasError('required')) {
      return `${label} is required.`;
    }

    if (this.isSalaryPercentField(field) && (control.hasError('min') || control.hasError('max'))) {
      return 'Value must be between 0 and 100.';
    }

    if (control.hasError('min')) {
      return `${label} cannot be negative.`;
    }

    return `${label} is invalid.`;
  }

  preventInvalidNumberInput(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  preventInvalidPercentagePaste(event: ClipboardEvent): void {
    const pastedValue = event.clipboardData?.getData('text')?.trim() ?? '';

    if (!pastedValue) {
      return;
    }

    if (!/^\d+(\.\d+)?$/.test(pastedValue)) {
      event.preventDefault();
    }
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

  private buildSalarySettingsForm(): FormGroup {
    const defaultSettings = this.createDefaultSalarySettings();

    return this.formBuilder.group({
      companyid: [defaultSettings.companyid, [Validators.required, Validators.min(1)]],
      basic_pay: [defaultSettings.basic_pay, [Validators.required, Validators.min(0)]],
      hra: [defaultSettings.hra, this.buildPercentValidators()],
      da: [defaultSettings.da, this.buildPercentValidators()],
      pf_Ceiling_limit: [defaultSettings.pf_Ceiling_limit, [Validators.required, Validators.min(0)]],
      pf_amount: [defaultSettings.pf_amount, [Validators.required, Validators.min(0)]],
      employee_pf_rate: [defaultSettings.employee_pf_rate, this.buildPercentValidators()],
      employer_pf_rate: [defaultSettings.employer_pf_rate, this.buildPercentValidators()],
      esi_Ceiling_limit: [defaultSettings.esi_Ceiling_limit, [Validators.required, Validators.min(0)]],
      employee_esi_rate: [defaultSettings.employee_esi_rate, this.buildPercentValidators()],
      employer_esi_rate: [defaultSettings.employer_esi_rate, this.buildPercentValidators()],
      employee_med_ins_amount: [defaultSettings.employee_med_ins_amount, [Validators.required, Validators.min(0)]],
      employer_med_ins_amount: [defaultSettings.employer_med_ins_amount, [Validators.required, Validators.min(0)]],
      gratuity_rate: [defaultSettings.gratuity_rate, this.buildPercentValidators()],
      createdby: [defaultSettings.createdby, Validators.required],
      is_pf_Ceiling: [defaultSettings.is_pf_Ceiling],
    });
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

  private clearSalarySettingsValidationState(): void {
    this.salarySettingsSubmitAttempted = false;
    Object.values(this.salarySettingsForm.controls).forEach((control) => {
      control.markAsPristine();
      control.markAsUntouched();
    });
  }

  get salarySettings(): SalarySettingsFormValue {
    return this.salarySettingsForm.getRawValue() as SalarySettingsFormValue;
  }

  private buildPercentValidators() {
    return [Validators.required, Validators.min(0), Validators.max(100)];
  }

  private isSalaryPercentField(field: SalarySettingsFieldKey): field is SalarySettingsPercentFieldKey {
    return this.salarySettingsPercentFields.includes(field as SalarySettingsPercentFieldKey);
  }

  private roundCurrency(value: unknown): number {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? Math.round(numericValue) : 0;
  }

  private roundWholeInput(value: unknown): number {
    return Math.max(this.roundCurrency(value), 0);
  }

  private roundToTwo(value: unknown): number {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? Number(numericValue.toFixed(2)) : 0;
  }

  private percentValue(value: unknown): number {
    return Math.max(Number(value || 0), 0);
  }

  private coerceNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private calculateAutoGross(): number {
    const baseAmount = Math.max(this.ctc_per_month - this.gratuity - this.medical_insurance, 0);
    const esiCandidate = this.iterateGross(baseAmount, true);

    if (this.isValidGrossCandidate(esiCandidate, true)) {
      return esiCandidate;
    }

    return this.iterateGross(baseAmount, false);
  }

  private iterateGross(initialGross: number, assumeEsi: boolean): number {
    let gross = Math.max(Math.round(initialGross), 0);

    for (let attempt = 0; attempt < 25; attempt += 1) {
      const employerPfAmount = this.calculatePfContribution(this.model.employerPfRate);
      const employerEsiAmount = this.calculateEmployerEsi(gross, assumeEsi);
      const nextGross = Math.max(
        Math.round(this.ctc_per_month - employerPfAmount - employerEsiAmount - this.gratuity - this.medical_insurance),
        0
      );

      if (nextGross === gross) {
        return nextGross;
      }

      gross = nextGross;
    }

    return gross;
  }

  private isValidGrossCandidate(gross: number, assumeEsi: boolean): boolean {
    if (!this.model.isEsi) {
      return !assumeEsi;
    }

    const esiGrossCeiling = this.roundCurrency(this.model.esiGrossCeiling);

    if (esiGrossCeiling <= 0) {
      return assumeEsi;
    }

    return assumeEsi ? gross <= esiGrossCeiling : gross > esiGrossCeiling;
  }

  private calculatePfContribution(rate: unknown): number {
    if (!this.model.isPf) {
      return 0;
    }

    const wageBase = this.calculatePfWageBase();
    const rateValue = this.percentValue(rate);

    if (wageBase <= 0 || rateValue <= 0) {
      return 0;
    }

    return Math.round((wageBase / 100) * rateValue);
  }

  private calculatePfWageBase(): number {
    if (!this.model.isPf) {
      return 0;
    }

    const configuredCeiling = this.roundCurrency(this.model.pfWageCeiling);
    const wageBase = Math.max(this.basic_pay + this.da, 0);

    if (configuredCeiling <= 0) {
      return wageBase;
    }

    return Math.min(wageBase, configuredCeiling);
  }

  private calculateEmployerEsi(gross: number, assumeEligible: boolean = this.model.isEsi): number {
    return this.calculateEsiContribution(this.model.employerEsiRate, gross, assumeEligible);
  }

  private calculateEsiContribution(rate: unknown, gross: number, assumeEligible: boolean = this.model.isEsi): number {
    const rateValue = this.percentValue(rate);

    if (!this.isEsiApplicable(gross, assumeEligible) || rateValue <= 0) {
      return 0;
    }

    return Math.round((gross / 100) * rateValue);
  }

  private isEsiApplicable(gross: number, assumeEligible: boolean = this.model.isEsi): boolean {
    if (!this.model.isEsi || !assumeEligible || gross <= 0) {
      return false;
    }

    const esiGrossCeiling = this.roundCurrency(this.model.esiGrossCeiling);
    return esiGrossCeiling <= 0 || gross <= esiGrossCeiling;
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

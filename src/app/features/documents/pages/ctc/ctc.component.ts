import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AppRole, AuthService } from 'src/app/core/services/auth.service';
import { ApiService } from 'src/app/core/services/api.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { SalaryRevisionLetterData } from '../../models/salary-revision-letter.model';
import { SalaryRevisionLetterPdfService } from '../../services/salary-revision-letter-pdf.service';

type CtcTab = 'calculator' | 'create';

interface CtcInputModel {
  ctc: number | null;
  annualCtc: number | null;
  basicPercent: number | null;
  basicPayAmount: number | null;
  hraPercent: number | null;
  daPercent: number | null;
  ltaPercent: number | null;
  pfWageCeiling: number | null;
  employeePfRate: number | null;
  employerPfRate: number | null;
  esiGrossCeiling: number | null;
  employeeEsiRate: number | null;
  employerEsiRate: number | null;
  employeeMedRate: number | null;
  employerMedRate: number | null;
  mediclaim: number | null;
  gratuityRate: number | null;
  isPf: boolean;
  isEsi: boolean;
  isGratuity: boolean;
  grossWageOverride: number | null;
  minWage: number | null;
  totalDays: number | null;
  workingDays: number | null;
  weekOff: number | null;
  paidHoliday: number | null;
  lopAbsent: number | null;
}

interface SalarySettingsPayload {
  id: number | null;
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
  id: number | null;
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

type SalarySettingsFieldKey = Exclude<keyof SalarySettingsFormValue, 'id' | 'companyid' | 'createdby' | 'is_pf_Ceiling'>;
type SalarySettingsPercentFieldKey =
  | 'hra'
  | 'da'
  | 'employee_pf_rate'
  | 'employer_pf_rate'
  | 'employee_esi_rate'
  | 'employer_esi_rate'
  | 'gratuity_rate';

interface PayrollBreakdown {
  inputMonthlyCtc: number;
  monthlyCtc: number;
  ctcPerMonth: number;
  annualCtc: number;
  attendanceRatio: number;
  gross: number;
  fixedGross: number;
  basic: number;
  hra: number;
  da: number;
  lta: number;
  specialAllowance: number;
  totalEmployerContribution: number;
  employerPf: number;
  employerEsi: number;
  employeePf: number;
  employeeEsi: number;
  gratuity: number;
  medicalInsurance: number;
  totalDeduction: number;
  netPay: number;
  professionalTax: number;
  esiApplicable: boolean;
  earnedBasic: number;
  earnedGross: number;
  earnedEmployeePf: number;
  earnedEmployerPf: number;
  earnedEmployeeEsi: number;
  earnedEmployerEsi: number;
  earnedGratuity: number;
  earnedSpecialAllowance: number;
  earnedTotalDeduction: number;
  earnedNetPay: number;
  earnedMonthlyCtc: number;
}

interface CtcEmployeeOption {
  id: number;
  companyid?: number | null;
  employee_name?: string | null;
  employeeName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  employee_code?: string | null;
  emp_code?: string | null;
  isactive?: boolean;
}

@Component({
  selector: 'app-ctc',
  templateUrl: './ctc.component.html',
  styleUrls: ['./ctc.component.scss'],
})
export class CtcComponent implements OnInit {
  activeTab: CtcTab = 'calculator';
  readonly restrictedPayrollRoles: AppRole[] = ['ROLE_MANAGER', 'ROLE_EMPLOYEE'];
  submittingSettings = false;
  loadingInitialData = false;
  savingSalarySettings = false;
  downloadingBreakdownPdf = false;
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

  readonly model: CtcInputModel = this.createDefaultCalculatorModel();
  private payrollBreakdownCache: { key: string; value: PayrollBreakdown } | null = null;

  salarySettingsForm: FormGroup;
  username: any;
  companyId: any;
  employeeId = 0;
  selectedEmployeeId: number | null = null;
  employeeOptions: CtcEmployeeOption[] = [];
  employeeSearchTerm = '';
  employeeProfile: any = null;
  employeeCtcDetails: any = null;
  updatingEmployeeCtc = false;
  lastEmployeeCtcUpdateResponse: any = null;
  salaryRevisionLetterData: SalaryRevisionLetterData | null = null;
  @ViewChild('salaryRevisionPdfHost', { static: false }) salaryRevisionPdfHost?: ElementRef<HTMLElement>;
  readonly currentYear = new Date().getFullYear();
  readonly years = Array.from({ length: 5 }, (_, index) => this.currentYear - 1 + index);
  selectedYear = Math.max(this.currentYear, 2026);
  userid: number;
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private feedback: UiFeedbackService,
    private salaryRevisionLetterPdfService: SalaryRevisionLetterPdfService
  ) {
    this.salarySettingsForm = this.buildSalarySettingsForm();
    this.username = tokenStorage.getUsername();
    this.userid = tokenStorage.getID();
  }

  ngOnInit(): void {
    this.bindSalarySettingsFormToCalculator();
    if (!this.canManagePayroll) {
      this.activeTab = 'calculator';
    }
    this.getemployeedetails();
  }

  get isRestrictedPayrollView(): boolean {
    return this.authService.hasAnyRole(this.restrictedPayrollRoles);
  }

  get canManagePayroll(): boolean {
    return !this.isRestrictedPayrollView;
  }

  get isPageBusy(): boolean {
    return this.loadingInitialData || this.savingSalarySettings || this.updatingEmployeeCtc || this.downloadingBreakdownPdf;
  }

  get isMedicalInsuranceEditable(): boolean {
    return !this.getPayrollBreakdown().esiApplicable;
  }

  trackByYear(_index: number, year: number): number {
    return year;
  }

  trackByEmployeeId(_index: number, employee: CtcEmployeeOption): number {
    return employee.id;
  }

  onEmployeeSelectOpened(isOpen: boolean): void {
    if (!isOpen) {
      this.employeeSearchTerm = '';
    }
  }

  get filteredEmployeeOptions(): CtcEmployeeOption[] {
    const searchTerm = this.employeeSearchTerm.trim().toLowerCase();

    if (!searchTerm) {
      return this.employeeOptions;
    }

    return this.employeeOptions.filter((employee) => this.getEmployeeOptionLabel(employee).toLowerCase().includes(searchTerm));
  }

  getEmployeeOptionLabel(employee: CtcEmployeeOption): string {
    const name =
      `${employee.employee_name || employee.employeeName || `${employee.firstname || ''} ${employee.lastname || ''}`}`.trim() ||
      `Employee #${employee.id}`;
    const code = `${employee.employee_code || employee.emp_code || ''}`.trim();
    return code ? `${name} (${code})` : name;
  }


  getemployeedetails() {
    this.loadingInitialData = true;

    if (this.isRestrictedPayrollView) {
      this.apiService.getemployeedetails(this.username).subscribe({
        next: (currentEmployee) => {
          this.employeeOptions = this.normalizeEmployeeOptions([currentEmployee]);
          const defaultEmployeeId =
            Number(currentEmployee?.id || currentEmployee?.employee_id || this.resolveEmployeeId() || 0) || 0;
          this.selectedEmployeeId = defaultEmployeeId;
          console.log("currentEmployee   =>", currentEmployee);

          this.loadSelectedEmployeePayroll(defaultEmployeeId, currentEmployee);
        },
        error: (error: any) => {
          this.loadingInitialData = false;
          console.error('Failed to load employee profile =>', error);
          this.feedback.error('Failed to load employee payroll data. Please refresh and try again.');
        },
      });
      return;
    }

    forkJoin({
      currentEmployee: this.apiService.getemployeedetails(this.username),
      employeeList: this.apiService.getEmployeeList(this.userid),
    }).subscribe({
      next: ({ currentEmployee, employeeList }) => {
        this.employeeOptions = this.normalizeEmployeeOptions(employeeList);
        const defaultEmployeeId =
          Number(currentEmployee?.id || currentEmployee?.employee_id || this.resolveEmployeeId() || 0) || 0;
        this.selectedEmployeeId = defaultEmployeeId;
        console.log("currentEmployee   =>", currentEmployee);

        this.loadSelectedEmployeePayroll(defaultEmployeeId, currentEmployee);
      },
      error: (error: any) => {
        this.loadingInitialData = false;
        console.error('Failed to load employee list/details =>', error);
        this.feedback.error('Failed to load employee list. Please refresh and try again.');
      },
    });
  }

  onEmployeeSelectionChange(employeeId: number | null): void {
    if (!this.canManagePayroll) {
      return;
    }

    const resolvedEmployeeId = Number(employeeId || 0) || 0;
    console.log("employeeId  =>", employeeId);

    if (!resolvedEmployeeId || resolvedEmployeeId === this.employeeId) {
      this.selectedEmployeeId = resolvedEmployeeId || this.selectedEmployeeId;
      return;
    }

    this.selectedEmployeeId = resolvedEmployeeId;
    this.loadSelectedEmployeePayroll(resolvedEmployeeId);
  }

  getemployeeCTCdetails(empId: any) {
    this.apiService.getemployeectcdetails(empId).subscribe((res: any) => {
      this.employeeCtcDetails = this.normalizeEmployeeCtcDetailResponse(res);
      console.log('getemployeectcdetails =>', this.employeeCtcDetails);
    });
  }

  getSalarySetting(companyId: any) {
    this.loadingInitialData = true;
    this.apiService.getSalarySetting(companyId)
      .pipe(finalize(() => (this.loadingInitialData = false)))
      .subscribe({
        next: (data: any) => {
          this.applySalarySettingsResponse(data);
        },
        error: (error: any) => {
          console.error('Failed to load salary settings =>', error);
          this.feedback.error('Failed to load salary settings. Please try again.');
        },
      });
  }

  get ctc_per_month(): number {
    return this.roundCurrency(this.model.ctc);
  }

  get annualCtcDisplay(): number {
    return this.ctc;
  }

  get basic_pay(): number {
    return this.getPayrollBreakdown().basic;
  }

  get hra(): number {
    return this.getPayrollBreakdown().hra;
  }

  get lta(): number {
    return this.getPayrollBreakdown().lta;
  }

  get da(): number {
    return this.getPayrollBreakdown().da;
  }

  get medical_insurance(): number {
    return this.getPayrollBreakdown().medicalInsurance;
  }

  get gratuity(): number {
    return this.getPayrollBreakdown().gratuity;
  }

  get gross(): number {
    return this.getPayrollBreakdown().gross;
  }

  get employer_pf_amount(): number {
    return this.getPayrollBreakdown().employerPf;
  }

  get employer_esi_amount(): number {
    return this.getPayrollBreakdown().employerEsi;
  }

  get employee_pf_amount(): number {
    return this.getPayrollBreakdown().employeePf;
  }

  get employee_esi_amount(): number {
    return this.getPayrollBreakdown().employeeEsi;
  }

  get special_allowance(): number {
    return this.getPayrollBreakdown().specialAllowance;
  }

  get fixed_gross(): number {
    return this.getPayrollBreakdown().fixedGross;
  }

  get total_deduction(): number {
    return this.getPayrollBreakdown().totalDeduction;
  }

  get netpay(): number {
    return this.getPayrollBreakdown().netPay;
  }

  get adjustedNetpay(): number {
    return this.getPayrollBreakdown().earnedNetPay;
  }

  get fixed_ctc(): number {
    return this.getPayrollBreakdown().monthlyCtc;
  }

  get ctc(): number {
    return this.getPayrollBreakdown().annualCtc;
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
    const breakdown = this.getPayrollBreakdown();
    return Math.max(Math.round(breakdown.netPay - breakdown.earnedNetPay), 0);
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
    if (!this.canManagePayroll && tab !== 'calculator') {
      return;
    }

    this.activeTab = tab;
  }

  onReadonlyYearChange(): void {
    const employeeId = this.employeeId || this.resolveEmployeeId();

    if (!employeeId) {
      return;
    }

    this.loadSelectedEmployeePayroll(employeeId, this.employeeProfile);
  }

  onEsiToggle(enabled: boolean): void {
    this.model.isEsi = enabled;

    if (!enabled) {
      return;
    }

    if (this.roundCurrency(this.model.esiGrossCeiling) <= 0) {
      this.model.esiGrossCeiling = 21000;
    }

    if (this.percentValue(this.model.employeeEsiRate) <= 0) {
      this.model.employeeEsiRate = 0.75;
    }

    if (this.percentValue(this.model.employerEsiRate) <= 0) {
      this.model.employerEsiRate = 3.25;
    }
  }

  onGratuityToggle(enabled: boolean): void {
    this.model.isGratuity = enabled;

    if (!enabled) {
      return;
    }

    if (this.percentValue(this.model.gratuityRate) <= 0) {
      this.model.gratuityRate = 4.81;
    }
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value || 0)));
  }

  formatPercentage(value: number | null | undefined): string {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? numericValue.toFixed(2).replace(/\.00$/, '') : '0';
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

      'SUMMARY',
      `  Fixed CTC          : Rs ${this.formatCurrency(this.fixed_ctc)} | Annual: Rs ${this.formatCurrency(this.fixed_ctc * 12)}`,
      `  CTC                : Rs ${this.formatCurrency(this.ctc)}`,
      `  Net Pay            : Rs ${this.formatCurrency(this.netpay)} | Annual: Rs ${this.formatCurrency(this.netpay * 12)}`,
      '',
    ].join('\n');

    this.downloadTextFile('ctc-monthly-breakdown.txt', content);
  }

  async saveBreakdown(): Promise<void> {
    document.body.classList.add('ctc-saving');
    this.downloadingBreakdownPdf = true;

    try {
      const employeeId = this.employeeId || this.resolveEmployeeId();

      if (!employeeId) {
        this.feedback.error('Employee id is missing. Unable to generate the salary revision PDF.');
        return;
      }

      const response = await this.apiService.getemployeectcdetails(employeeId).toPromise();
      const ctcDetails = this.normalizeEmployeeCtcDetailResponse(response);

      if (!ctcDetails) {
        this.feedback.error('Employee CTC details were not available for PDF generation.');
        return;
      }

      this.employeeCtcDetails = ctcDetails;
      this.salaryRevisionLetterData = this.buildSalaryRevisionLetterData(ctcDetails);
      await this.waitForLetterRender();

      if (!this.salaryRevisionPdfHost?.nativeElement) {
        this.feedback.error('Unable to prepare the salary revision letter for download.');
        return;
      }

      await this.salaryRevisionLetterPdfService.downloadPagesAsPdf(
        this.salaryRevisionPdfHost.nativeElement,
        this.buildSalaryRevisionFileName(ctcDetails)
      );
      this.feedback.success('Salary revision PDF download started.');
    } catch (error) {
      console.error('Salary revision PDF download failed:', error);
      this.feedback.error('Failed to generate the salary revision PDF. Please try again.');
    } finally {
      this.downloadingBreakdownPdf = false;
      document.body.classList.remove('ctc-saving');
    }
  }

  useCalculatorValues(): void {
    this.salarySettingsForm.patchValue({
      basic_pay: this.roundCurrency(this.basic_pay),
      hra: this.roundToTwo(this.model.hraPercent),
      da: this.roundToTwo(this.model.daPercent),
      pf_Ceiling_limit: this.model.isPf ? this.roundCurrency(this.model.pfWageCeiling) : 0,
      pf_amount: this.roundCurrency(this.employee_pf_amount),
      employee_pf_rate: this.model.isPf ? this.roundToTwo(this.model.employeePfRate) : 0,
      employer_pf_rate: this.model.isPf ? this.roundToTwo(this.model.employerPfRate) : 0,
      esi_Ceiling_limit: this.model.isEsi ? this.roundCurrency(this.model.esiGrossCeiling) : 0,
      employee_esi_rate: this.model.isEsi ? this.roundToTwo(this.model.employeeEsiRate) : 0,
      employer_esi_rate: this.model.isEsi ? this.roundToTwo(this.model.employerEsiRate) : 0,
      employee_med_ins_amount: this.roundCurrency(this.model.employeeMedRate),
      employer_med_ins_amount: this.roundCurrency(this.model.employerMedRate),
      // employer_med_ins_amount: this.roundCurrency(this.medical_insurance),
      gratuity_rate: this.model.isGratuity ? this.roundToTwo(this.model.gratuityRate) : 0,
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



    this.submittingSettings = true;
    this.savingSalarySettings = true;
    this.apiService.CreateSalaryDetails(payload)
      .pipe(finalize(() => {
        this.submittingSettings = false;
        this.savingSalarySettings = false;
      }))
      .subscribe({
        next: (response: any) => {
          const savedId = this.extractRecordId(response) ?? payload.id ?? null;
          this.salarySettingsForm.reset({
            ...this.createDefaultSalarySettings(),
            ...payload,
            id: savedId,
          });
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
      id: this.resolveSalarySettingsRecordId(),
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
      id: [defaultSettings.id],
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
      id: null,
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

  private resolveEmployeeId(): number {
    return Number(this.tokenStorage.getID() || this.authService.getID() || 0) || 0;
  }

  private applySalarySettingsResponse(data: any): void {
    console.log('data =>', data);
    const settings = Array.isArray(data) ? data[0] : data;

    if (!settings) {
      this.resetCalculatorModel();
      return;
    }

    this.salarySettingsForm.patchValue({
      id: Number(settings.id || 0) || null,
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
    this.syncCalculatorModel(settings);
    this.clearSalarySettingsValidationState();
  }

  private normalizeEmployeeCtcDetailResponse(response: any): any {
    const source = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.result)
          ? response.result
          : response
            ? [response]
            : [];

    return (
      source.find((item: any) => Number(item?.year || 0) === Number(this.selectedYear || 0)) ||
      source[source.length - 1] ||
      null
    );
  }

  private normalizeEmployeeOptions(data: any): CtcEmployeeOption[] {
    const source = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.result)
          ? data.result
          : [];

    return source
      .map((item: any) => ({
        id: Number(item?.id || item?.employee_id || 0) || 0,
        companyid: Number(item?.companyid || item?.company_id || 0) || null,
        employee_name: item?.employee_name ?? null,
        employeeName: item?.employeeName ?? null,
        firstname: item?.firstname ?? null,
        lastname: item?.lastname ?? null,
        employee_code: item?.employee_code ?? null,
        emp_code: item?.emp_code ?? null,
        isactive: item?.isactive,
      }))
      .filter((item: CtcEmployeeOption) => item.id > 0);
  }

  private loadSelectedEmployeePayroll(employeeId: number, prefetchedProfile?: any): void {
    this.loadingInitialData = true;

    const matchedEmployee = this.employeeOptions.find((item) => item.id === employeeId);
    const companyIdCandidate = Number(
      prefetchedProfile?.companyid ||
      prefetchedProfile?.company_id ||
      matchedEmployee?.companyid ||
      this.companyId ||
      this.resolveCompanyId() ||
      0
    ) || 0;
    console.log("employeeId   ---------->", employeeId);

    const employeeProfile$ = prefetchedProfile ? of(prefetchedProfile) : this.apiService.getemployeedetails(this.username);

    if (this.isRestrictedPayrollView) {
      forkJoin({
        employeeProfile: employeeProfile$,
        employeeCtcDetails: this.apiService.getemployeectcdetails(employeeId),
      })
        .pipe(finalize(() => (this.loadingInitialData = false)))
        .subscribe({
          next: ({ employeeProfile, employeeCtcDetails }) => {
            this.employeeProfile = employeeProfile || matchedEmployee || null;
            this.employeeId = employeeId;
            this.companyId = Number(
              this.employeeProfile?.companyid ||
              this.employeeProfile?.company_id ||
              matchedEmployee?.companyid ||
              this.resolveCompanyId() ||
              0
            ) || 0;
            this.salarySettingsForm.patchValue({
              companyid: this.companyId,
              createdby: this.resolveCreatedBy(),
            });
            this.employeeCtcDetails = this.normalizeEmployeeCtcDetailResponse(employeeCtcDetails);
            console.log('getemployeectcdetails =>', this.employeeCtcDetails);
          },
          error: (error: any) => {
            console.error('Failed to load selected employee payroll data =>', error);
            this.feedback.error('Failed to load selected employee payroll data. Please try again.');
          },
        });
      return;
    }

    forkJoin({
      employeeProfile: employeeProfile$,
      salarySettings: this.apiService.getSalarySetting(companyIdCandidate),
      employeeCtcDetails: this.apiService.getemployeectcdetails(employeeId),
    })
      .pipe(finalize(() => (this.loadingInitialData = false)))
      .subscribe({
        next: ({ employeeProfile, salarySettings, employeeCtcDetails }) => {
          this.employeeProfile = employeeProfile || matchedEmployee || null;
          this.employeeId = employeeId;
          this.companyId = Number(
            this.employeeProfile?.companyid ||
            this.employeeProfile?.company_id ||
            matchedEmployee?.companyid ||
            this.resolveCompanyId() ||
            0
          ) || 0;
          this.salarySettingsForm.patchValue({
            companyid: this.companyId,
            createdby: this.resolveCreatedBy(),
          });
          this.applySalarySettingsResponse(salarySettings);
          this.employeeCtcDetails = this.normalizeEmployeeCtcDetailResponse(employeeCtcDetails);
          console.log('getemployeectcdetails =>', this.employeeCtcDetails);
        },
        error: (error: any) => {
          console.error('Failed to load selected employee payroll data =>', error);
          this.feedback.error('Failed to load selected employee payroll data. Please try again.');
        },
      });
  }

  private buildSalaryRevisionLetterData(ctcDetails: any): SalaryRevisionLetterData {
    const employeeName =
      `${this.employeeProfile?.employee_name || this.employeeProfile?.employeeName || this.tokenStorage.getEmpname() || ''}`.trim() ||
      'Employee';
    const empCode =
      `${this.employeeProfile?.employee_code || this.employeeProfile?.emp_code || this.employeeProfile?.empid || ctcDetails?.empid || ''}`.trim() ||
      `${ctcDetails?.empid || this.employeeId || ''}`.trim();
    const department =
      `${this.employeeProfile?.department || this.employeeProfile?.department_name || this.employeeProfile?.departmentName || ''}`.trim() ||
      'Department';
    const designation =
      `${this.employeeProfile?.designation || this.employeeProfile?.designation_name || this.employeeProfile?.designationName || ''}`.trim() ||
      'Designation';
    const effectiveFrom = ctcDetails?.updated_date || ctcDetails?.created_date || new Date();
    const selectedYear = Number(ctcDetails?.year || this.selectedYear || this.currentYear) || this.currentYear;

    return {
      employeeName,
      empCode,
      department,
      designation,
      effectiveFrom,
      letterDate: new Date(),
      financialYear: this.formatFinancialYear(selectedYear),
      previousFY: this.formatFinancialYear(selectedYear - 1),
      currentCtc: this.buildCurrentLetterCtcInput(),
      revisedCtc: this.buildLetterCtcInputFromResponse(ctcDetails),
    };
  }

  private buildCurrentLetterCtcInput() {
    return {
      monthly: this.roundCurrency(this.fixed_ctc),
      basic: this.roundCurrency(this.basic_pay),
      hra: this.roundCurrency(this.hra),
      ta: this.roundCurrency(this.lta),
      specialAllowance: this.roundCurrency(this.special_allowance),
      employeePf: this.roundCurrency(this.employee_pf_amount),
      employeeEsi: this.roundCurrency(this.employee_esi_amount),
      employerPf: this.roundCurrency(this.employer_pf_amount),
      employerEsi: this.roundCurrency(this.employer_esi_amount),
      gratuity: this.roundCurrency(this.gratuity),
      mediclaim: this.roundCurrency(this.medical_insurance),
    };
  }

  private buildLetterCtcInputFromResponse(ctcDetails: any) {
    const gross = this.roundCurrency(ctcDetails?.gross);
    const basic = this.roundCurrency(ctcDetails?.basic_pay);
    const hra = this.roundCurrency(ctcDetails?.hra);
    const explicitTravelAllowance = this.roundCurrency(
      ctcDetails?.travel_allowance ?? ctcDetails?.travelAllowances ?? ctcDetails?.ta ?? ctcDetails?.lta
    );
    const explicitSpecialAllowance = this.roundCurrency(ctcDetails?.special_allowance);
    const remainingAfterKnownBreakup = Math.max(gross - basic - hra - explicitTravelAllowance - explicitSpecialAllowance, 0);
    const ta = explicitTravelAllowance;
    const specialAllowance = explicitSpecialAllowance > 0 ? explicitSpecialAllowance + remainingAfterKnownBreakup : remainingAfterKnownBreakup;

    return {
      monthly: this.roundCurrency(ctcDetails?.ctc),
      basic,
      hra,
      ta,
      specialAllowance,
      employeePf: this.roundCurrency(ctcDetails?.employee_pf_amount),
      employeeEsi: this.roundCurrency(ctcDetails?.employee_esi_amount),
      employerPf: this.roundCurrency(ctcDetails?.employer_pf_amount),
      employerEsi: this.roundCurrency(ctcDetails?.employer_esi_amount),
      gratuity: this.roundCurrency(ctcDetails?.gratuity),
      mediclaim: this.roundCurrency(ctcDetails?.medical_insurance),
    };
  }

  private formatFinancialYear(year: number): string {
    const startYear = Math.max(Number(year || this.currentYear) - 1, 0);
    const endYear = Math.max(Number(year || this.currentYear), 0);
    return `${`${startYear}`.slice(-2)}-${`${endYear}`.slice(-2)}`;
  }

  private buildSalaryRevisionFileName(ctcDetails: any): string {
    const employeeName =
      `${this.employeeProfile?.employee_name || this.employeeProfile?.employeeName || this.tokenStorage.getEmpname() || 'Employee'}`
        .trim()
        .replace(/\s+/g, '_') || 'Employee';
    const financialYear = this.formatFinancialYear(Number(ctcDetails?.year || this.selectedYear || this.currentYear))
      .replace(/\s+/g, '_');

    return `${employeeName}_SalaryRevisionLetter_FY_${financialYear}.pdf`;
  }

  private waitForLetterRender(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 0);
    });
  }

  private resolveCreatedBy(): string {
    return `${this.tokenStorage.getUsername() || this.authService.getUsername() || ''}`.trim();
  }

  private createDefaultCalculatorModel(): CtcInputModel {
    return {
      ctc: null,
      annualCtc: null,
      basicPercent: null,
      basicPayAmount: null,
      hraPercent: null,
      daPercent: null,
      ltaPercent: null,
      pfWageCeiling: null,
      employeePfRate: null,
      employerPfRate: null,
      esiGrossCeiling: null,
      employeeEsiRate: null,
      employerEsiRate: null,
      employeeMedRate: null,
      employerMedRate: null,
      mediclaim: null,
      gratuityRate: null,
      isPf: false,
      isEsi: false,
      isGratuity: false,
      grossWageOverride: null,
      minWage: null,
      totalDays: null,
      workingDays: null,
      weekOff: null,
      paidHoliday: null,
      lopAbsent: null,
    };
  }

  private resetCalculatorModel(): void {
    Object.assign(this.model, this.createDefaultCalculatorModel());
  }

  private syncCalculatorModel(settings: Partial<SalarySettingsPayload>): void {
    Object.assign(this.model, {
      ...this.createDefaultCalculatorModel(),
      ctc: this.model.ctc,
      annualCtc: this.model.annualCtc,
      grossWageOverride: this.model.grossWageOverride,
      minWage: this.model.minWage,
      totalDays: this.model.totalDays,
      workingDays: this.model.workingDays,
      weekOff: this.model.weekOff,
      paidHoliday: this.model.paidHoliday,
      lopAbsent: this.model.lopAbsent,
      basicPercent: this.coerceNullableNumber(settings.basic_pay),
      hraPercent: this.coerceNullableNumber(settings.hra),
      daPercent: this.coerceNullableNumber(settings.da),
      pfWageCeiling: this.coerceNullableNumber(settings.pf_Ceiling_limit),
      employeePfRate: this.coerceNullableNumber(settings.employee_pf_rate),
      employerPfRate: this.coerceNullableNumber(settings.employer_pf_rate),
      esiGrossCeiling: this.coerceNullableNumber(settings.esi_Ceiling_limit),
      employeeEsiRate: this.coerceNullableNumber(settings.employee_esi_rate),
      employerEsiRate: this.coerceNullableNumber(settings.employer_esi_rate),
      employeeMedRate: this.coerceNullableNumber(settings.employee_med_ins_amount),
      employerMedRate: this.coerceNullableNumber(settings.employer_med_ins_amount),
      mediclaim: this.coerceNullableNumber(settings.employer_med_ins_amount),
      gratuityRate: this.coerceNullableNumber(settings.gratuity_rate),
      isPf: this.hasPositiveValue(settings.employee_pf_rate, settings.employer_pf_rate, settings.pf_amount),
      isEsi: this.hasPositiveValue(
        settings.employee_esi_rate,
        settings.employer_esi_rate,
        settings.esi_Ceiling_limit
      ),
      isGratuity: this.hasPositiveValue(settings.gratuity_rate),
    });
  }

  private bindSalarySettingsFormToCalculator(): void {
    this.salarySettingsForm.valueChanges.subscribe((value) => {
      this.syncCalculatorModel(value as Partial<SalarySettingsPayload>);
    });
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

  private resolveSalarySettingsRecordId(): number | null {
    const id = Number(this.salarySettingsForm.get('id')?.value || this.salarySettings?.id || 0) || 0;
    return id > 0 ? id : null;
  }

  private resolveEmployeeCtcDetailRecordId(): number | null {
    const id = Number(this.employeeCtcDetails?.id || 0) || 0;
    return id > 0 ? id : null;
  }

  private extractRecordId(response: any): number | null {
    const id = Number(
      response?.id ||
      response?.data?.id ||
      response?.result?.id ||
      response?.record?.id ||
      0
    ) || 0;

    return id > 0 ? id : null;
  }

  private getApiPayrollValue(field: string, fallback: number = 0): number {
    return this.roundCurrency(this.employeeCtcDetails?.[field] ?? fallback);
  }

  private getApiPayrollValueByKeys(fields: string[], fallback: number = 0): number {
    for (const field of fields) {
      const value = this.employeeCtcDetails?.[field];

      if (value !== null && value !== undefined && value !== '') {
        return this.roundCurrency(value);
      }
    }

    return this.roundCurrency(fallback);
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

  private getPayrollBreakdown(): PayrollBreakdown {
    if (this.isRestrictedPayrollView && this.employeeCtcDetails) {
      return this.buildPayrollBreakdownFromApi(this.employeeCtcDetails);
    }

    const key = JSON.stringify({
      ctc: this.model.ctc,
      basicPercent: this.model.basicPercent,
      hraPercent: this.model.hraPercent,
      daPercent: this.model.daPercent,
      ltaPercent: this.model.ltaPercent,
      pfWageCeiling: this.model.pfWageCeiling,
      employeePfRate: this.model.employeePfRate,
      employerPfRate: this.model.employerPfRate,
      esiGrossCeiling: this.model.esiGrossCeiling,
      employeeEsiRate: this.model.employeeEsiRate,
      employerEsiRate: this.model.employerEsiRate,
      employeeMedRate: this.model.employeeMedRate,
      employerMedRate: this.model.employerMedRate,
      mediclaim: this.model.mediclaim,
      gratuityRate: this.model.gratuityRate,
      isPf: this.model.isPf,
      isEsi: this.model.isEsi,
      isGratuity: this.model.isGratuity,
      grossWageOverride: this.model.grossWageOverride,
      minWage: this.model.minWage,
    });

    if (this.payrollBreakdownCache?.key === key) {
      return this.payrollBreakdownCache.value;
    }

    const breakdown = this.calculatePayrollBreakdown();
    this.payrollBreakdownCache = { key, value: breakdown };
    return breakdown;
  }

  private buildPayrollBreakdownFromApi(ctcDetails: any): PayrollBreakdown {
    const basic = this.roundCurrency(ctcDetails?.basic_pay);
    const hra = this.roundCurrency(ctcDetails?.hra);
    const da = this.roundCurrency(ctcDetails?.da);
    const lta = this.roundCurrency(
      ctcDetails?.travel_allowance ?? ctcDetails?.travelAllowances ?? ctcDetails?.ta ?? ctcDetails?.lta
    );
    const specialAllowance = this.roundCurrency(ctcDetails?.special_allowance);
    const fixedGross = this.roundCurrency(ctcDetails?.gross || basic + hra + da + lta + specialAllowance);
    const employeePf = this.roundCurrency(ctcDetails?.employee_pf_amount);
    const employeeEsi = this.roundCurrency(ctcDetails?.employee_esi_amount);
    const employerPf = this.roundCurrency(ctcDetails?.employer_pf_amount);
    const employerEsi = this.roundCurrency(ctcDetails?.employer_esi_amount);
    const medicalInsurance = this.roundCurrency(ctcDetails?.medical_insurance);
    const gratuity = this.roundCurrency(ctcDetails?.gratuity);
    const totalDeduction = this.roundCurrency(ctcDetails?.total_deduction || employeePf + employeeEsi);
    const totalEmployerContribution = this.roundCurrency(
      ctcDetails?.total_employer_contribution || employerPf + employerEsi + medicalInsurance + gratuity
    );
    const monthlyCtc = this.roundCurrency(ctcDetails?.ctc || fixedGross + totalEmployerContribution);
    const netPay = this.roundCurrency(ctcDetails?.netpay || fixedGross - totalDeduction);
    const annualCtc = monthlyCtc * 12;

    return {
      inputMonthlyCtc: monthlyCtc,
      monthlyCtc,
      ctcPerMonth: monthlyCtc,
      annualCtc,
      attendanceRatio: 1,
      gross: fixedGross,
      fixedGross,
      basic,
      hra,
      da,
      lta,
      specialAllowance,
      totalEmployerContribution,
      employerPf,
      employerEsi,
      employeePf,
      employeeEsi,
      gratuity,
      medicalInsurance,
      totalDeduction,
      netPay,
      professionalTax: 0,
      esiApplicable: employerEsi > 0 || employeeEsi > 0,
      earnedBasic: basic,
      earnedGross: fixedGross,
      earnedEmployeePf: employeePf,
      earnedEmployerPf: employerPf,
      earnedEmployeeEsi: employeeEsi,
      earnedEmployerEsi: employerEsi,
      earnedGratuity: gratuity,
      earnedSpecialAllowance: specialAllowance,
      earnedTotalDeduction: totalDeduction,
      earnedNetPay: netPay,
      earnedMonthlyCtc: monthlyCtc,
    };
  }

  private calculatePayrollBreakdown(): PayrollBreakdown {
    const inputMonthlyCtc = Math.max(this.ctc_per_month, 0);

    if (inputMonthlyCtc <= 0) {
      return this.createEmptyPayrollBreakdown();
    }
    const basic = Math.max(
      this.roundCurrency((inputMonthlyCtc / 100) * this.percentValue(this.model.basicPercent)),
      0
    );
    const hra = this.calculateAllowanceFromBasic(basic, this.resolveHraPercent());
    const da = this.calculateAllowanceFromBasic(basic, this.resolveDaPercent());
    const lta = this.calculateAllowanceFromBasic(basic, this.resolveLtaPercent());
    const employeePf = this.calculatePfContribution(basic, this.resolveEmployeePfRate());
    const employerPf = this.calculatePfContribution(basic, this.resolveEmployerPfRate());
    const gratuity = this.model.isGratuity
      ? this.calculateAllowanceFromBasic(basic, this.resolveGratuityRate())
      : 0;
    const fixedGross = Math.max(Math.round(basic + hra + da + lta), 0);
    let specialAllowance = 0;
    let gross = fixedGross;
    let esiApplicable = false;
    let employerEsi = 0;
    let medicalInsurance = 0;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      esiApplicable = !!this.model.isEsi && gross > 0 && gross <= this.resolveEsiCeilingAmount();
      employerEsi = esiApplicable ? this.calculateEsiContribution(gross, this.resolveEmployerEsiRate()) : 0;
      medicalInsurance = esiApplicable ? 0 : this.resolveMedicalInsuranceAmount();
      const balancedSpecialAllowance = Math.max(
        Math.round(inputMonthlyCtc - (fixedGross + employerPf + employerEsi + gratuity + medicalInsurance)),
        0
      );
      const nextGross = Math.max(Math.round(fixedGross + balancedSpecialAllowance), 0);

      specialAllowance = balancedSpecialAllowance;

      if (nextGross === gross) {
        gross = nextGross;
        break;
      }

      gross = nextGross;
    }

    esiApplicable = !!this.model.isEsi && gross > 0 && gross <= this.resolveEsiCeilingAmount();
    employerEsi = esiApplicable ? this.calculateEsiContribution(gross, this.resolveEmployerEsiRate()) : 0;
    medicalInsurance = esiApplicable ? 0 : this.resolveMedicalInsuranceAmount();
    const employeeEsi = esiApplicable ? this.calculateEsiContribution(gross, this.resolveEmployeeEsiRate()) : 0;
    const professionalTax = this.professionalTaxAmount();
    const totalDeduction = Math.max(Math.round(employeePf + employeeEsi), 0);
    const totalEmployerContribution = Math.max(Math.round(employerPf + employerEsi + gratuity + medicalInsurance), 0);
    const monthlyCtc = inputMonthlyCtc;
    const annualCtc = monthlyCtc * 12;
    const ctcPerMonth = monthlyCtc;
    const netPay = Math.max(Math.round(gross - totalDeduction - professionalTax), 0);
    const attendanceRatio = this.resolveAttendanceRatio();
    const earnedBasic = this.prorateAmount(basic, attendanceRatio);
    const earnedHra = this.prorateAmount(hra, attendanceRatio);
    const earnedDa = this.prorateAmount(da, attendanceRatio);
    const earnedLta = this.prorateAmount(lta, attendanceRatio);
    const earnedSpecialAllowance = this.prorateAmount(specialAllowance, attendanceRatio);
    const earnedGross = Math.max(
      Math.round(earnedBasic + earnedHra + earnedDa + earnedLta + earnedSpecialAllowance),
      0
    );
    const earnedEmployeePf = this.calculatePfContribution(earnedBasic, this.resolveEmployeePfRate());
    const earnedEmployerPf = this.calculatePfContribution(earnedBasic, this.resolveEmployerPfRate());
    const earnedGratuity = this.model.isGratuity
      ? this.calculateAllowanceFromBasic(earnedBasic, this.resolveGratuityRate())
      : 0;
    const earnedEsiApplicable = !!this.model.isEsi && earnedGross > 0 && earnedGross <= this.resolveEsiCeilingAmount();
    const earnedEmployeeEsi = earnedEsiApplicable ? this.calculateEsiContribution(earnedGross, this.resolveEmployeeEsiRate()) : 0;
    const earnedEmployerEsi = earnedEsiApplicable ? this.calculateEsiContribution(earnedGross, this.resolveEmployerEsiRate()) : 0;
    const earnedMedicalInsurance = earnedEsiApplicable ? 0 : medicalInsurance;
    const earnedTotalDeduction = Math.max(Math.round(earnedEmployeePf + earnedEmployeeEsi), 0);
    const earnedNetPay = Math.max(Math.round(earnedGross - earnedTotalDeduction - professionalTax), 0);
    const earnedMonthlyCtc = Math.max(
      Math.round(earnedGross + earnedEmployerPf + earnedEmployerEsi + earnedGratuity + earnedMedicalInsurance),
      0
    );

    return {
      inputMonthlyCtc,
      monthlyCtc,
      ctcPerMonth,
      annualCtc,
      attendanceRatio,
      gross,
      fixedGross,
      basic,
      hra,
      da,
      lta,
      specialAllowance,
      totalEmployerContribution,
      employerPf,
      employerEsi,
      employeePf,
      employeeEsi,
      gratuity,
      medicalInsurance,
      totalDeduction,
      netPay,
      professionalTax,
      esiApplicable,
      earnedBasic,
      earnedGross,
      earnedEmployeePf,
      earnedEmployerPf,
      earnedEmployeeEsi,
      earnedEmployerEsi,
      earnedGratuity,
      earnedSpecialAllowance,
      earnedTotalDeduction,
      earnedNetPay,
      earnedMonthlyCtc,
    };
  }

  private createEmptyPayrollBreakdown(): PayrollBreakdown {
    return {
      inputMonthlyCtc: 0,
      monthlyCtc: 0,
      ctcPerMonth: 0,
      annualCtc: 0,
      attendanceRatio: 1,
      gross: 0,
      fixedGross: 0,
      basic: 0,
      hra: 0,
      da: 0,
      lta: 0,
      specialAllowance: 0,
      totalEmployerContribution: 0,
      employerPf: 0,
      employerEsi: 0,
      employeePf: 0,
      employeeEsi: 0,
      gratuity: 0,
      medicalInsurance: 0,
      totalDeduction: 0,
      netPay: 0,
      professionalTax: 0,
      esiApplicable: false,
      earnedBasic: 0,
      earnedGross: 0,
      earnedEmployeePf: 0,
      earnedEmployerPf: 0,
      earnedEmployeeEsi: 0,
      earnedEmployerEsi: 0,
      earnedGratuity: 0,
      earnedSpecialAllowance: 0,
      earnedTotalDeduction: 0,
      earnedNetPay: 0,
      earnedMonthlyCtc: 0,
    };
  }

  private resolveMedicalInsuranceAmount(): number {
    const employerMedicalInsurance = this.roundCurrency(this.model.employerMedRate);

    if (employerMedicalInsurance > 0) {
      return employerMedicalInsurance;
    }

    return this.roundCurrency(this.model.mediclaim);
  }

  private resolveEsiCeilingAmount(): number {
    const configuredCeiling = this.roundCurrency(this.model.esiGrossCeiling);
    return configuredCeiling > 0 ? configuredCeiling : 21000;
  }

  private resolvePfWageCeilingAmount(): number {
    const configuredCeiling = this.roundCurrency(this.model.pfWageCeiling);
    return configuredCeiling > 0 ? configuredCeiling : 15000;
  }

  private resolveEmployerPfRate(): number {
    const configuredRate = this.percentValue(this.model.employerPfRate);
    return configuredRate > 0 ? configuredRate : 12;
  }

  private resolveEmployeePfRate(): number {
    const configuredRate = this.percentValue(this.model.employeePfRate);
    return configuredRate > 0 ? configuredRate : 12;
  }

  private resolveEmployerEsiRate(): number {
    const configuredRate = this.percentValue(this.model.employerEsiRate);
    return configuredRate > 0 ? configuredRate : 3.25;
  }

  private resolveEmployeeEsiRate(): number {
    const configuredRate = this.percentValue(this.model.employeeEsiRate);
    return configuredRate > 0 ? configuredRate : 0.75;
  }

  private resolveHraPercent(): number {
    const configuredRate = this.percentValue(this.model.hraPercent);
    return configuredRate > 0 ? configuredRate : 40;
  }

  private resolveDaPercent(): number {
    const configuredRate = this.percentValue(this.model.daPercent);
    return configuredRate > 0 ? configuredRate : 10;
  }

  private resolveLtaPercent(): number {
    const configuredRate = this.percentValue(this.model.ltaPercent);
    return configuredRate > 0 ? configuredRate : 5;
  }

  private resolveGratuityRate(): number {
    const configuredRate = this.percentValue(this.model.gratuityRate);
    return configuredRate > 0 ? configuredRate : 4.81;
  }

  private hasPositiveValue(...values: unknown[]): boolean {
    return values.some((value) => Number(value || 0) > 0);
  }

  private resolveAttendanceRatio(): number {
    const totalDays = this.total_days;

    if (totalDays <= 0) {
      return 1;
    }

    const explicitWorkingDays = this.working_days;
    const derivedWorkingDays = Math.max(totalDays - this.lop_absent, 0);
    const workingDays = explicitWorkingDays > 0 ? Math.min(explicitWorkingDays, totalDays) : derivedWorkingDays;

    return Math.min(Math.max(workingDays / totalDays, 0), 1);
  }

  private prorateAmount(amount: number, ratio: number): number {
    return Math.max(Math.round(amount * ratio), 0);
  }

  private calculateAllowanceFromBasic(basic: number, percent: number): number {
    return Math.max(Math.round((basic / 100) * percent), 0);
  }

  private calculatePfContribution(basic: number, rate: number): number {
    if (!this.model.isPf || basic <= 0 || rate <= 0) {
      return 0;
    }

    const pfCeiling = this.resolvePfWageCeilingAmount();
    const pfWage = Math.min(basic, pfCeiling);
    return Math.max(Math.round((pfWage / 100) * rate), 0);
  }

  private calculateEsiContribution(gross: number, rate: number): number {
    if (!this.model.isEsi || gross <= 0 || rate <= 0 || gross > this.resolveEsiCeilingAmount()) {
      return 0;
    }

    return Math.max(Math.round((gross / 100) * rate), 0);
  }
  private professionalTaxAmount(): number {
    return 0;
  }

  getupdateemployeectcdetail(): void {
    const empid = this.employeeId || this.resolveEmployeeId();

    if (!empid) {
      this.feedback.warning('Employee id is missing. Unable to update employee CTC detail.');
      return;
    }

    const payload = this.buildEmployeeCtcUpdatePayload(empid);
    console.log('updateemployeectcdetail payload =>', payload);
    this.submittingSettings = true;
    this.updatingEmployeeCtc = true;

    this.apiService.updateemployeectcdetail(payload)
      .pipe(finalize(() => {
        this.updatingEmployeeCtc = false;
        this.submittingSettings = false;
      }))
      .subscribe({
        next: (response: any) => {
          this.lastEmployeeCtcUpdateResponse = response;
          const savedId = this.extractRecordId(response) ?? payload.id ?? null;
          this.employeeCtcDetails = {
            ...(this.employeeCtcDetails || {}),
            ...payload,
            id: savedId,
          };
          console.log('updateemployeectcdetail response =>', response);
          this.feedback.success(response?.message || 'Employee CTC detail updated successfully.');
          this.getemployeeCTCdetails(empid);
        },
        error: (error: any) => {
          this.lastEmployeeCtcUpdateResponse = error?.error || error;
          console.error('updateemployeectcdetail error =>', error);
          this.feedback.error(error?.error?.message || 'Failed to update employee CTC detail. Please try again.');
        },
      });
  }

  private buildEmployeeCtcUpdatePayload(empid: number): {
    id: number | null;
    empid: number;
    year: number;
    basic_pay: number;
    hra: number;
    da: number;
    special_allowance: number;
    gross: number;
    employee_pf_amount: number;
    employee_esi_amount: number;
    total_deduction: number;
    netpay: number;
    employer_pf_amount: number;
    employer_esi_amount: number;
    medical_insurance: number;
    gratuity: number;
    total_employer_contribution: number;
    ctc: number;
    createddate: string;
    updated_date: string;
    createdby: string;
  } {
    const timestamp = new Date().toISOString();
    const totalEmployerContribution = this.roundCurrency(
      this.employer_pf_amount + this.employer_esi_amount + this.gratuity + this.medical_insurance
    );

    return {
      id: this.resolveEmployeeCtcDetailRecordId(),
      empid,
      year: Number(this.selectedYear || this.currentYear) || this.currentYear,
      basic_pay: this.roundCurrency(this.basic_pay),
      hra: this.roundCurrency(this.hra),
      da: this.roundCurrency(this.da),
      special_allowance: this.roundCurrency(this.special_allowance),
      gross: this.roundCurrency(this.gross),
      employee_pf_amount: this.roundCurrency(this.employee_pf_amount),
      employee_esi_amount: this.roundCurrency(this.employee_esi_amount),
      total_deduction: this.roundCurrency(this.total_deduction),
      netpay: this.roundCurrency(this.netpay),
      employer_pf_amount: this.roundCurrency(this.employer_pf_amount),
      employer_esi_amount: this.roundCurrency(this.employer_esi_amount),
      medical_insurance: this.roundCurrency(this.medical_insurance),
      gratuity: this.roundCurrency(this.gratuity),
      total_employer_contribution: totalEmployerContribution,
      ctc: this.roundCurrency(this.fixed_ctc),
      createddate: timestamp,
      updated_date: timestamp,
      createdby: this.resolveCreatedBy(),
    };
  }

  private async downloadElementAsPdf(element: HTMLElement, fileName: string): Promise<void> {
    const [{ jsPDF }, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const html2canvas = html2canvasModule.default;
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });
    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageHeight = (canvas.height * pageWidth) / canvas.width;
    let remainingHeight = imageHeight;
    let position = 0;

    pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
    remainingHeight -= pageHeight;

    while (remainingHeight > 0) {
      position = remainingHeight - imageHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, position, pageWidth, imageHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;
    }

    const pdfBlob = pdf.output('blob');
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const anchor = document.createElement('a');

    anchor.href = downloadUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(downloadUrl);
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

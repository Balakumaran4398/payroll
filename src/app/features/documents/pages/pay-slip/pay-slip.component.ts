import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ApiService } from 'src/app/core/services/api.service';
import { AppRole, AuthService } from 'src/app/core/services/auth.service';
import { TokenStorageService } from 'src/app/core/services/token-storage.service';
import { UiFeedbackService } from 'src/app/core/services/ui-feedback.service';
import { SalaryRevisionLetterPdfService } from '../../services/salary-revision-letter-pdf.service';

interface PaySlipRow {
  label: string;
  fixed: number;
  earned: number;
}

interface WorkingDayDetails {
  cl_count: number;
  apsent: number;
  sl_count: number;
  working_days: number;
  weekend: number;
  holiday: number;
  total_days: number;
}

interface EmployeeCtcDetails {
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
  created_date?: string | null;
  updated_date?: string | null;
  createdby?: string | null;
}

interface EmployeeSalaryDetails {
  id: number | null;
  empid: number;
  month: string;
  year: number;
  basic_pay: number;
  hra: number;
  da: number;
  special_allowance: number;
  fixed_gross: number;
  gross: number;
  employee_pf_amount: number;
  employee_esi_amount: number;
  total_deduction: number;
  netpay: number;
  employer_pf_amount: number;
  employer_esi_amount: number;
  medical_insurance: number;
  gratuity: number;
  fixed_ctc: number;
  ctc: number;
  week_off: number;
  paid_holiday: number;
  lop_absent: number;
  lop_deduction: number;
  total_days: number;
  working_days: number;
  employeename?: string | null;
  employee_code?: string | null;
  emp_code?: string | null;
  createddate?: string | null;
  updated_date?: string | null;
  createdby?: string | null;
}

interface AdminSalaryListItem {
  id: number | null;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  month: string;
  year: number;
  gross: number;
  netPay: number;
  ctc: number;
  workingDays: number;
  totalDays: number;
  rawRecord: EmployeeSalaryDetails;
}

interface PayrollComputation {
  attendanceRatio: number;
  fixedBasic: number;
  fixedHra: number;
  fixedDa: number;
  fixedSpecialAllowance: number;
  fixedGross: number;
  fixedEmployeePf: number;
  fixedEmployeeEsi: number;
  fixedEmployerPf: number;
  fixedEmployerEsi: number;
  fixedMedicalInsurance: number;
  fixedGratuity: number;
  fixedTotalDeduction: number;
  fixedNetPay: number;
  fixedEmployerContribution: number;
  fixedCtc: number;
  earnedBasic: number;
  earnedHra: number;
  earnedDa: number;
  earnedSpecialAllowance: number;
  earnedGross: number;
  earnedEmployeePf: number;
  earnedEmployeeEsi: number;
  earnedEmployerPf: number;
  earnedEmployerEsi: number;
  earnedMedicalInsurance: number;
  earnedGratuity: number;
  earnedTotalDeduction: number;
  earnedNetPay: number;
  earnedEmployerContribution: number;
  earnedCtc: number;
  lopDeduction: number;
  employeePfRate: number;
  employerPfRate: number;
  employeeEsiRate: number;
  employerEsiRate: number;
  gratuityRate: number;
}

interface PaySlipPayload {
  id?: number;
  empid: number;
  month: string;
  year: number;
  basic_pay: number;
  hra: number;
  da: number;
  special_allowance: number;
  fixed_gross: number;
  gross: number;
  employee_pf_amount: number;
  employee_esi_amount: number;
  total_deduction: number;
  netpay: number;
  employer_pf_amount: number;
  employer_esi_amount: number;
  medical_insurance: number;
  gratuity: number;
  fixed_ctc: number;
  ctc: number;
  week_off: number;
  paid_holiday: number;
  lop_absent: number;
  lop_deduction: number;
  total_days: number;
  working_days: number;
  createddate: string;
  updated_date: string;
  createdby: string;
}

interface PaySlipEmployeeOption {
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

interface PaySlipPdfRow {
  label: string;
  fixed: string;
  earned: string;
}

interface PaySlipPdfData {
  companyName: string;
  logoSrc: string;
  periodLabel: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  joinDate: string;
  uan: string;
  esicNumber: string;
  earningsRows: PaySlipPdfRow[];
  deductionRows: Array<{ label: string; amount: string }>;
  totalDeductions: string;
  netPay: string;
  netPayWords: string;
  contributionRows: PaySlipPdfRow[];
  attendanceRows: Array<{ label: string; value: string }>;
}

@Component({
  selector: 'app-pay-slip',
  templateUrl: './pay-slip.component.html',
  styleUrls: ['./pay-slip.component.scss'],
})
export class PaySlipComponent implements OnInit {
  readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  readonly currentDate = new Date();
  readonly years = Array.from({ length: 3 }, (_, index) => this.currentDate.getFullYear() - 2 + index);
  readonly restrictedPayrollRoles: AppRole[] = ['ROLE_MANAGER', 'ROLE_EMPLOYEE'];

  selectedMonthIndex = this.currentDate.getMonth();
  selectedYear = this.currentDate.getFullYear();

  loading = false;
  saving = false;
  downloadingPdf = false;
  activeDownloadKey: string | null = null;
  readonly companyName = 'MRRIDSYS TECHNOLOGIES PRIVATE LIMITED';
  readonly paySlipLogoSrc = 'assets/images/Ridsyslogo.png';
  username = '';
  employeeId = 0;
  selectedEmployeeId: number | null = null;
  employeeOptions: PaySlipEmployeeOption[] = [];
  employeeSearchTerm = '';
  employeeProfile: any = null;
  workingDayDetails: WorkingDayDetails | null = null;
  employeeCtcDetails: EmployeeCtcDetails | null = null;
  currentSalaryDetails: EmployeeSalaryDetails | null = null;
  salaryHistory: EmployeeSalaryDetails[] = [];
  adminSalaryList: AdminSalaryListItem[] = [];
  adminSalaryListLoading = false;
  generatingPayroll = false;
  adminPayrollMessage = '';
  private currentCompanyId = 0;
  payroll: PayrollComputation = this.createEmptyPayroll();
  paySlipPdfData: PaySlipPdfData | null = null;
  private readonly payrollRecordIds = new Map<string, number>();
  @ViewChild('paySlipPdfHost', { static: false }) paySlipPdfHost?: ElementRef<HTMLElement>;
  userid: number;
  constructor(
    private apiService: ApiService,
    private tokenStorage: TokenStorageService,
    private authService: AuthService,
    private feedback: UiFeedbackService,
    private paySlipPdfService: SalaryRevisionLetterPdfService
  ) {
    this.username = this.tokenStorage.getUsername() || this.authService.getUsername() || '';
    this.userid = this.tokenStorage.getID();
  }

  ngOnInit(): void {
    this.loadEmployeeContext();
  }


  get isRestrictedPayrollView(): boolean {
    return this.authService.hasAnyRole(this.restrictedPayrollRoles);
  }

  get isAdminPayrollView(): boolean {
    return this.authService.getRole() === 'ROLE_ADMIN';
  }

  get canManagePayroll(): boolean {
    return !this.isRestrictedPayrollView;
  }

  get adminPayrollListTitle(): string {
    return `Payslip List - ${this.selectedMonthName} ${this.selectedYear}`;
  }

  get selectedMonthName(): string {
    return this.monthNames[this.selectedMonthIndex] || this.monthNames[this.currentDate.getMonth()];
  }

  get filteredEmployeeOptions(): PaySlipEmployeeOption[] {
    const searchTerm = this.employeeSearchTerm.trim().toLowerCase();

    if (!searchTerm) {
      return this.employeeOptions;
    }

    return this.employeeOptions.filter((employee) => this.getEmployeeOptionLabel(employee).toLowerCase().includes(searchTerm));
  }

  onEmployeeSelectOpened(isOpen: boolean): void {
    if (!isOpen) {
      this.employeeSearchTerm = '';
    }
  }

  get selectedPeriodLabel(): string {
    return `${this.selectedMonthName} ${this.selectedYear}`;
  }

  get salaryHistoryRows(): EmployeeSalaryDetails[] {
    return [...this.salaryHistory].sort((left, right) => {
      const yearDiff = Number(right.year || 0) - Number(left.year || 0);

      if (yearDiff !== 0) {
        return yearDiff;
      }

      return this.getMonthIndexByName(right.month) - this.getMonthIndexByName(left.month);
    });
  }

  get payrollPeriodLabel(): string {
    const totalDays = this.workingDayDetails?.total_days || this.getDaysInMonth(this.selectedYear, this.selectedMonthIndex);
    return `01 ${this.selectedMonthName} ${this.selectedYear} to ${String(totalDays).padStart(2, '0')} ${this.selectedMonthName} ${this.selectedYear}`;
  }

  get employeeName(): string {
    return (
      `${this.employeeProfile?.employee_name || this.employeeProfile?.employeeName || this.tokenStorage.getEmpname() || ''}`.trim() ||
      'Employee'
    );
  }

  get employeeCode(): string {
    return (
      `${this.employeeProfile?.employee_code || this.employeeProfile?.emp_code || this.employeeProfile?.empid || this.employeeId || ''}`.trim() ||
      'N/A'
    );
  }

  get designation(): string {
    return (
      `${this.employeeProfile?.designation || this.employeeProfile?.designation_name || this.employeeProfile?.designationName || ''}`.trim() ||
      'Designation'
    );
  }

  get department(): string {
    return (
      `${this.employeeProfile?.department || this.employeeProfile?.department_name || this.employeeProfile?.departmentName || ''}`.trim() ||
      'Department'
    );
  }

  get summaryCards() {
    return [
      {
        label: 'Earned Net Pay',
        value: `Rs ${this.formatCurrency(this.payroll.earnedNetPay)}`,
        tone: 'primary',
        caption: `${this.roundPercentage(this.payroll.attendanceRatio * 100)}% attendance ratio`,
      },
      {
        label: 'Fixed CTC',
        value: `Rs ${this.formatCurrency(this.payroll.fixedCtc)}`,
        tone: 'neutral',
        caption: 'Monthly fixed payroll structure',
      },
      {
        label: 'Earned CTC',
        value: `Rs ${this.formatCurrency(this.payroll.earnedCtc)}`,
        tone: 'accent',
        caption: 'Attendance-adjusted company cost',
      },
      {
        label: 'LOP Deduction',
        value: `Rs ${this.formatCurrency(this.payroll.lopDeduction)}`,
        tone: 'warn',
        caption: `${this.workingDayDetails?.apsent || 0} absent day(s) in period`,
      },
    ];
  }

  get earningsRows(): PaySlipRow[] {
    return [
      { label: 'Basic', fixed: this.payroll.fixedBasic, earned: this.payroll.earnedBasic },
      { label: 'H.R.A.', fixed: this.payroll.fixedHra, earned: this.payroll.earnedHra },
      { label: 'D.A.', fixed: this.payroll.fixedDa, earned: this.payroll.earnedDa },
      { label: 'Special Allowance', fixed: this.payroll.fixedSpecialAllowance, earned: this.payroll.earnedSpecialAllowance },
      { label: 'Gross Salary', fixed: this.payroll.fixedGross, earned: this.payroll.earnedGross },
    ];
  }

  get deductionRows(): PaySlipRow[] {
    return [
      { label: 'PROV.FUND', fixed: this.payroll.fixedEmployeePf, earned: this.payroll.earnedEmployeePf },
      { label: 'E.S.I.C.', fixed: this.payroll.fixedEmployeeEsi, earned: this.payroll.earnedEmployeeEsi },
      { label: 'Total Deductions', fixed: this.payroll.fixedTotalDeduction, earned: this.payroll.earnedTotalDeduction },
      { label: 'Net Pay', fixed: this.payroll.fixedNetPay, earned: this.payroll.earnedNetPay },
    ];
  }

  get contributionRows(): PaySlipRow[] {
    return [
      { label: 'Gross', fixed: this.payroll.fixedGross, earned: this.payroll.earnedGross },
      {
        label: `PF @${this.roundPercentage(this.payroll.employerPfRate)}% Basic`,
        fixed: this.payroll.fixedEmployerPf,
        earned: this.payroll.earnedEmployerPf,
      },
      {
        label: `ESIC @${this.roundPercentage(this.payroll.employerEsiRate)}%`,
        fixed: this.payroll.fixedEmployerEsi,
        earned: this.payroll.earnedEmployerEsi,
      },
      { label: 'Medical Insurance', fixed: this.payroll.fixedMedicalInsurance, earned: this.payroll.earnedMedicalInsurance },
      {
        label: `Gratuity @${this.roundPercentage(this.payroll.gratuityRate)}%`,
        fixed: this.payroll.fixedGratuity,
        earned: this.payroll.earnedGratuity,
      },
      { label: 'CTC', fixed: this.payroll.fixedCtc, earned: this.payroll.earnedCtc },
    ];
  }

  get attendanceRows(): Array<{ label: string; value: string }> {
    const details = this.workingDayDetails;
    const salaryDetails = this.currentSalaryDetails;
    const absentDays = this.roundCurrency(details?.apsent ?? salaryDetails?.lop_absent);
    const paidHoliday = this.roundCurrency(details?.holiday ?? salaryDetails?.paid_holiday);
    const weekend = this.roundCurrency(details?.weekend ?? salaryDetails?.week_off);
    const totalDays = this.roundCurrency(details?.total_days ?? salaryDetails?.total_days);
    const workingDays = this.roundCurrency(details?.working_days ?? salaryDetails?.working_days);
    const lopDeduction = this.roundCurrency(salaryDetails?.lop_deduction ?? this.payroll.lopDeduction);

    return [
      { label: 'Casual Leave', value: this.formatCurrencyValue(details?.cl_count) },
      { label: 'Sick Leave', value: this.formatCurrencyValue(details?.sl_count) },
      { label: 'Working Days', value: this.formatCurrencyValue(workingDays) },
      { label: 'Week Off', value: this.formatCurrencyValue(weekend) },
      { label: 'Paid Holiday', value: this.formatCurrencyValue(paidHoliday) },
      { label: 'Absent / LOP', value: this.formatCurrencyValue(absentDays) },
      { label: 'LOP Deduction', value: `Rs ${this.formatCurrency(lopDeduction)}` },
      { label: 'Month Total Days', value: this.formatCurrencyValue(totalDays) },
      { label: 'Attendance Ratio', value: `${this.roundPercentage(this.payroll.attendanceRatio * 100)}%` },
    ];
  }

  get monthCards() {
    const isCurrentYear = this.selectedYear >= this.currentDate.getFullYear();
    const maxMonthIndex = isCurrentYear ? this.currentDate.getMonth() : this.monthNames.length - 1;

    return this.monthNames.slice(0, maxMonthIndex + 1).map((month, index) => ({
      label: `${month} ${this.selectedYear}`,
      active: index === this.selectedMonthIndex,
      index,
    }));
  }

  selectMonth(index: number): void {
    if (this.selectedMonthIndex === index) {
      return;
    }

    this.selectedMonthIndex = index;
    this.loadPayrollData();
  }

  onYearChange(): void {
    if (this.selectedYear > this.currentDate.getFullYear()) {
      this.selectedYear = this.currentDate.getFullYear();
    }

    if (this.selectedYear === this.currentDate.getFullYear() && this.selectedMonthIndex > this.currentDate.getMonth()) {
      this.selectedMonthIndex = this.currentDate.getMonth();
    }

    this.loadPayrollData();
  }

  trackByEmployeeId(_index: number, employee: PaySlipEmployeeOption): number {
    return employee.id;
  }

  getEmployeeOptionLabel(employee: PaySlipEmployeeOption): string {
    const name =
      `${employee.employee_name || employee.employeeName || `${employee.firstname || ''} ${employee.lastname || ''}`}`.trim() ||
      `Employee #${employee.id}`;
    const code = `${employee.employee_code || employee.emp_code || ''}`.trim();
    return code ? `${name} (${code})` : name;
  }

  onEmployeeSelectionChange(employeeId: number | null): void {
    if (!this.canManagePayroll) {
      return;
    }

    const resolvedEmployeeId = Number(employeeId || 0) || 0;

    if (!resolvedEmployeeId || resolvedEmployeeId === this.employeeId) {
      this.selectedEmployeeId = resolvedEmployeeId || this.selectedEmployeeId;
      return;
    }

    this.selectedEmployeeId = resolvedEmployeeId;
    this.loadSelectedEmployeePayroll(resolvedEmployeeId);
  }

  printPage(): void {
    window.print();
  }

  trackBySalaryHistoryId(_index: number, item: EmployeeSalaryDetails): string {
    return `${item.id || 0}-${item.month}-${item.year}`;
  }

  trackByAdminSalaryRecord(_index: number, item: AdminSalaryListItem): string {
    return `${item.id || item.employeeId}-${item.month}-${item.year}`;
  }

  getSalaryHistoryLabel(item: EmployeeSalaryDetails): string {
    const month = `${item.month || ''}`.trim() || this.monthNames[Math.max(this.getMonthIndexByName(item.month), 0)] || 'Month';
    return `Payslip for ${month}, ${item.year}`;
  }

  isActiveSalaryHistoryRecord(item: EmployeeSalaryDetails): boolean {
    return Number(item.year || 0) === Number(this.selectedYear || 0)
      && this.getMonthIndexByName(item.month) === this.selectedMonthIndex;
  }

  viewSalaryHistoryRecord(item: EmployeeSalaryDetails): void {
    const monthIndex = this.getMonthIndexByName(item.month);

    if (monthIndex >= 0) {
      this.selectedMonthIndex = monthIndex;
    }

    if (Number(item.year || 0) > 0) {
      this.selectedYear = Number(item.year);
    }

    this.loadPayrollData();
  }

  downloadSalaryHistoryRecord(item: EmployeeSalaryDetails): void {
    void this.downloadPaySlip(item);
  }

  isDownloadInProgressForSalaryRecord(item: EmployeeSalaryDetails): boolean {
    return this.activeDownloadKey === this.buildSalaryHistoryDownloadKey(item);
  }

  isDownloadInProgressForAdminRecord(item: AdminSalaryListItem): boolean {
    return this.activeDownloadKey === this.buildAdminSalaryDownloadKey(item);
  }

  async savePayroll(): Promise<void> {
    if (!this.canManagePayroll) {
      this.feedback.warning('Payroll save is available only for admin and company roles.');
      return;
    }

    if (!this.employeeId) {
      this.feedback.warning('Employee id is missing. Unable to save payslip payroll.');
      return;
    }

    const payload = this.buildSalaryPayload();
    this.saving = true;

    this.apiService.updateemployeesalarydetails(payload)
      .subscribe({
        next: (response: any) => {
          const savedId = this.extractRecordId(response) ?? payload.id ?? null;

          if (savedId) {
            this.payrollRecordIds.set(this.buildPayrollRecordKey(payload.empid, payload.month, payload.year), savedId);
          }

          this.refreshSavedPayrollDetails(payload.empid, response?.message || 'Payslip payroll saved successfully.');
        },
        error: (error: any) => {
          this.saving = false;
          console.error('updateemployeesalarydetails error =>', error);
          this.feedback.error(error?.error?.message || 'Failed to save payslip payroll. Please try again.');
        },
      });
  }

  async downloadPaySlip(record?: EmployeeSalaryDetails | null): Promise<void> {
    if (this.downloadingPdf) {
      return;
    }

    const downloadKey = this.buildDownloadKey(record);
    const pdfData = record
      ? this.buildPaySlipPdfDataFromSalaryRecord(record)
      : this.buildPaySlipPdfDataFromCurrentPayroll();

    if (!pdfData) {
      this.feedback.warning('Payslip data is not available for PDF download.');
      return;
    }

    this.paySlipPdfData = pdfData;
    this.downloadingPdf = true;
    this.activeDownloadKey = downloadKey;

    try {
      await this.waitForPdfRender();

      if (!this.paySlipPdfHost?.nativeElement) {
        this.feedback.error('Unable to prepare the payslip PDF.');
        return;
      }

      await this.paySlipPdfService.downloadPagesAsPdf(
        this.paySlipPdfHost.nativeElement,
        this.buildPaySlipFileName(record)
      );
      this.feedback.success('Payslip PDF download started.');
    } catch (error) {
      console.error('Payslip PDF download failed =>', error);
      this.feedback.error('Failed to generate the payslip PDF. Please try again.');
    } finally {
      this.downloadingPdf = false;
      this.activeDownloadKey = null;
      this.paySlipPdfData = null;
    }
  }

  async downloadAdminPayrollRecord(record: AdminSalaryListItem): Promise<void> {
    if (this.downloadingPdf) {
      return;
    }

    this.downloadingPdf = true;
    this.activeDownloadKey = this.buildAdminSalaryDownloadKey(record);

    try {
      const month = `${record.month || this.selectedMonthName}`.trim() || this.selectedMonthName;
      console.log("11111111111   -----", month);

      const year = Number(record.year || this.selectedYear) || this.selectedYear;
      console.log("2222222   -----", year);

      const [employeeProfile, ctcDetailsResponse, workingDayDetailsResponse] = await new Promise<[any, any, any]>((resolve, reject) => {
        forkJoin([
          this.apiService.getemployeedetails(record.employeeId).pipe(catchError(() => of(null))),
          this.apiService.getemployeectcdetails(record.employeeId).pipe(catchError(() => of(null))),
          this.apiService.getworkingdaydetailsforpayslip(record.employeeId, month, year).pipe(catchError(() => of(null))),
        ]).subscribe({
          next: (value) => resolve(value as [any, any, any]),
          error: reject,
        });
      });

      const resolvedEmployeeProfile = this.buildAdminRecordEmployeeProfile(record, employeeProfile);
      const workingDayDetails = this.normalizeWorkingDayDetails(workingDayDetailsResponse);
      const employeeCtcDetails = this.normalizeEmployeeCtcDetailResponse(ctcDetailsResponse);
      const payroll = this.calculatePayrollFromApiSources(employeeCtcDetails, record.rawRecord, workingDayDetails);
      const pdfData = this.buildPaySlipPdfData(
        payroll,
        workingDayDetails,
        month,
        year,
        resolvedEmployeeProfile,
        record.employeeId
      );

      this.paySlipPdfData = pdfData;
      await this.waitForPdfRender();

      if (!this.paySlipPdfHost?.nativeElement) {
        this.feedback.error('Unable to prepare the payslip PDF.');
        return;
      }

      await this.paySlipPdfService.downloadPagesAsPdf(
        this.paySlipPdfHost.nativeElement,
        this.buildPaySlipFileName(record.rawRecord, resolvedEmployeeProfile, record.employeeId)
      );
      this.feedback.success('Payslip PDF download started.');
    } catch (error) {
      console.error('Admin payslip PDF download failed =>', error);
      this.feedback.error('Failed to generate the admin payslip PDF. Please try again.');
    } finally {
      this.downloadingPdf = false;
      this.activeDownloadKey = null;
      this.paySlipPdfData = null;
    }
  }

  private loadEmployeeContext(): void {
    if (!this.username) {
      this.feedback.warning('Username is missing. Unable to load payslip data.');
      return;
    }

    this.loading = true;

    if (this.isRestrictedPayrollView) {
      this.apiService.getemployeedetails(this.username).subscribe({
        next: (currentEmployee) => {
          const normalizedCurrentEmployee = this.normalizeEmployeeOptions([currentEmployee]);
          this.employeeOptions = normalizedCurrentEmployee;
          const defaultEmployeeId =
            Number(currentEmployee?.id || currentEmployee?.employee_id || this.resolveEmployeeId() || 0) || 0;
          this.selectedEmployeeId = defaultEmployeeId;
          this.loadSelectedEmployeePayroll(defaultEmployeeId, currentEmployee);
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Failed to load employee profile =>', error);
          this.feedback.error('Failed to load employee payroll profile. Please refresh and try again.');
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
        this.currentCompanyId = this.resolveCompanyId(currentEmployee);
        const defaultEmployeeId =
          Number(currentEmployee?.id || currentEmployee?.employee_id || this.resolveEmployeeId() || 0) || 0;
        this.selectedEmployeeId = defaultEmployeeId;
        if (this.isAdminPayrollView) {
          this.loadAdminSalaryList();
        }
        this.loadSelectedEmployeePayroll(defaultEmployeeId, currentEmployee);
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Failed to load employee list/details =>', error);
        this.feedback.error('Failed to load employee list. Please refresh and try again.');
      },
    });
  }

  loadPayrollData(): void {
    if (this.isAdminPayrollView) {
      this.loadAdminSalaryList();
    }

    const resolvedEmployeeId = Number(this.selectedEmployeeId || this.employeeId || 0) || 0;

    if (!resolvedEmployeeId) {
      this.loading = false;
      return;
    }

    this.loadSelectedEmployeePayroll(resolvedEmployeeId, this.employeeProfile);
  }

  private normalizeEmployeeOptions(data: any): PaySlipEmployeeOption[] {
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
      .filter((item: PaySlipEmployeeOption) => item.id > 0);
  }

  getcalculatepayroll(): void {
    if (!this.username) {
      this.feedback.warning('Username is missing. Unable to generate payroll.');
      return;
    }

    this.generatingPayroll = true;
    this.adminPayrollMessage = '';

    this.apiService.getcalculatepayroll(this.username)
      .pipe(finalize(() => (this.generatingPayroll = false)))
      .subscribe({
        next: (data: any) => {
          const message = `${data?.message || data?.data?.message || 'Payroll generated successfully.'}`.trim();
          this.adminPayrollMessage = message;
          this.feedback.success(message);
          if (this.isAdminPayrollView) {
            this.loadAdminSalaryList();
          }
          this.loadPayrollData();
        },
        error: (error: any) => {
          const message = `${error?.error?.message || 'Failed to generate payroll.'}`.trim();
          this.adminPayrollMessage = message;
          this.feedback.error(message);
        },
      });
  }

  openAdminPayrollRecord(record: AdminSalaryListItem): void {
    const monthIndex = this.getMonthIndexByName(record.month);
    if (monthIndex >= 0) {
      this.selectedMonthIndex = monthIndex;
    }

    if (Number(record.year || 0) > 0) {
      this.selectedYear = Number(record.year);
    }

    this.selectedEmployeeId = record.employeeId;
    this.currentSalaryDetails = record.rawRecord;
    this.loadSelectedEmployeePayroll(record.employeeId, undefined, record.rawRecord);
  }

  private loadSelectedEmployeePayroll(
    employeeId: number,
    prefetchedProfile?: any,
    prefetchedSalaryDetails?: EmployeeSalaryDetails | null
  ): void {
    this.loading = true;
    const matchedEmployee = this.employeeOptions.find((item) => item.id === employeeId);
    const employeeProfile$ = prefetchedProfile ? of(prefetchedProfile) : this.apiService.getemployeedetails(employeeId);
    const payrollDetails$ = this.apiService.getemployeectcdetails(employeeId).pipe(catchError(() => of(null)));
    const savedSalaryDetails$ = prefetchedSalaryDetails
      ? of([prefetchedSalaryDetails])
      : (this.isRestrictedPayrollView
        ? this.apiService.getallpayslipdata(employeeId)
        : this.apiService.getemployeesalarydetails(employeeId)
      ).pipe(catchError(() => of(null)));

    forkJoin({
      employeeProfile: employeeProfile$,
      workingDayDetails: this.apiService.getworkingdaydetailsforpayslip(employeeId, this.selectedMonthName, this.selectedYear),
      payrollDetails: payrollDetails$,
      savedSalaryDetails: savedSalaryDetails$,
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: ({ employeeProfile, workingDayDetails, payrollDetails, savedSalaryDetails }) => {
          this.employeeId = employeeId;
          this.selectedEmployeeId = employeeId;
          this.employeeProfile = employeeProfile || matchedEmployee || null;
          this.workingDayDetails = this.normalizeWorkingDayDetails(workingDayDetails);
          this.employeeCtcDetails = this.normalizeEmployeeCtcDetailResponse(payrollDetails);
          this.salaryHistory = this.normalizeEmployeeSalaryDetailsResponse(savedSalaryDetails);
          this.currentSalaryDetails = this.resolveEmployeeSalaryDetail(this.salaryHistory);

          if (this.isRestrictedPayrollView) {
            this.payroll = this.calculatePayrollFromApiSources(
              this.employeeCtcDetails,
              this.currentSalaryDetails,
              this.workingDayDetails
            );

            const savedId = Number(this.currentSalaryDetails?.id || 0) || 0;
            if (savedId > 0) {
              this.payrollRecordIds.set(this.buildPayrollRecordKey(employeeId, this.selectedMonthName, this.selectedYear), savedId);
            }
            return;
          }

          if (this.currentSalaryDetails) {
            const savedId = Number(this.currentSalaryDetails.id || 0) || 0;

            if (savedId > 0) {
              this.payrollRecordIds.set(
                this.buildPayrollRecordKey(employeeId, this.selectedMonthName, this.selectedYear),
                savedId
              );
            }

            this.payroll = this.calculatePayrollFromApiSources(
              this.employeeCtcDetails,
              this.currentSalaryDetails,
              this.workingDayDetails
            );
            return;
          }

          this.payroll = this.calculatePayroll(this.employeeCtcDetails, this.workingDayDetails);
        },
        error: (error: any) => {
          console.error('Failed to load payslip payroll data =>', error);
          this.feedback.error('Failed to load payslip payroll data. Please try again.');
          this.workingDayDetails = null;
          this.employeeCtcDetails = null;
          this.currentSalaryDetails = null;
          this.salaryHistory = [];
          this.payroll = this.createEmptyPayroll();
        },
      });
  }

  private normalizeWorkingDayDetails(response: any): WorkingDayDetails {
    const source = Array.isArray(response?.data)
      ? response.data[0]
      : Array.isArray(response)
        ? response[0]
        : response || {};

    return {
      cl_count: this.roundCurrency(source?.cl_count),
      apsent: this.roundCurrency(source?.apsent),
      sl_count: this.roundCurrency(source?.sl_count),
      working_days: this.roundCurrency(source?.working_days),
      weekend: this.roundCurrency(source?.weekend),
      holiday: this.roundCurrency(source?.holiday),
      total_days: this.roundCurrency(source?.total_days) || this.getDaysInMonth(this.selectedYear, this.selectedMonthIndex),
    };
  }

  private normalizeEmployeeCtcDetailResponse(response: any): EmployeeCtcDetails | null {
    const source = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.result)
          ? response.result
          : response
            ? [response]
            : [];

    const item = source.find((entry: any) => Number(entry?.year || 0) === this.selectedYear) || source[source.length - 1];

    if (!item) {
      return null;
    }

    return {
      id: Number(item?.id || 0) || null,
      empid: this.roundCurrency(item?.empid),
      year: this.roundCurrency(item?.year),
      basic_pay: this.roundCurrency(item?.basic_pay),
      hra: this.roundCurrency(item?.hra),
      da: this.roundCurrency(item?.da),
      special_allowance: this.roundCurrency(item?.special_allowance),
      gross: this.roundCurrency(item?.gross),
      employee_pf_amount: this.roundCurrency(item?.employee_pf_amount),
      employee_esi_amount: this.roundCurrency(item?.employee_esi_amount),
      total_deduction: this.roundCurrency(item?.total_deduction),
      netpay: this.roundCurrency(item?.netpay),
      employer_pf_amount: this.roundCurrency(item?.employer_pf_amount),
      employer_esi_amount: this.roundCurrency(item?.employer_esi_amount),
      medical_insurance: this.roundCurrency(item?.medical_insurance),
      gratuity: this.roundCurrency(item?.gratuity),
      total_employer_contribution: this.roundCurrency(item?.total_employer_contribution),
      ctc: this.roundCurrency(item?.ctc),
      created_date: item?.created_date ?? null,
      updated_date: item?.updated_date ?? null,
      createdby: item?.createdby ?? null,
    };
  }

  private normalizeEmployeeSalaryDetailsResponse(response: any): EmployeeSalaryDetails[] {
    const source = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.result)
          ? response.result
          : response
            ? [response]
            : [];

    return source
      .map((item: any) => ({
        id: Number(item?.id || 0) || null,
        empid: this.roundCurrency(item?.empid),
        month: `${item?.month || ''}`.trim(),
        year: this.roundCurrency(item?.year),
        basic_pay: this.roundCurrency(item?.basic_pay),
        hra: this.roundCurrency(item?.hra),
        da: this.roundCurrency(item?.da),
        special_allowance: this.roundCurrency(item?.special_allowance),
        fixed_gross: this.roundCurrency(item?.fixed_gross),
        gross: this.roundCurrency(item?.gross),
        employee_pf_amount: this.roundCurrency(item?.employee_pf_amount),
        employee_esi_amount: this.roundCurrency(item?.employee_esi_amount),
        total_deduction: this.roundCurrency(item?.total_deduction),
        netpay: this.roundCurrency(item?.netpay),
        employer_pf_amount: this.roundCurrency(item?.employer_pf_amount),
        employer_esi_amount: this.roundCurrency(item?.employer_esi_amount),
        medical_insurance: this.roundCurrency(item?.medical_insurance),
        gratuity: this.roundCurrency(item?.gratuity),
        fixed_ctc: this.roundCurrency(item?.fixed_ctc),
        ctc: this.roundCurrency(item?.ctc),
        week_off: this.roundCurrency(item?.week_off),
        paid_holiday: this.roundCurrency(item?.paid_holiday),
        lop_absent: this.roundCurrency(item?.lop_absent),
        lop_deduction: this.roundCurrency(item?.lop_deduction),
        total_days: this.roundCurrency(item?.total_days),
        working_days: this.roundCurrency(item?.working_days),
        employeename: item?.employeename ?? item?.employee_name ?? null,
        employee_code: item?.employee_code ?? null,
        emp_code: item?.emp_code ?? null,
        createddate: item?.createddate ?? null,
        updated_date: item?.updated_date ?? null,
        createdby: item?.createdby ?? null,
      }))
      .filter((item: EmployeeSalaryDetails) => item.year > 0 || !!item.month);
  }

  private loadAdminSalaryList(): void {
    if (!this.isAdminPayrollView || !this.currentCompanyId) {
      this.adminSalaryList = [];
      return;
    }

    this.adminSalaryListLoading = true;
    this.apiService.getallsalarydetails(this.selectedMonthName, this.selectedYear, this.currentCompanyId)
      .pipe(finalize(() => (this.adminSalaryListLoading = false)))
      .subscribe({
        next: (response: any) => {
          this.adminSalaryList = this.normalizeAdminSalaryListResponse(response);
        },
        error: (error: any) => {
          console.error('Failed to load admin salary list =>', error);
          this.adminSalaryList = [];
          this.feedback.error('Failed to load the admin payslip list.');
        },
      });
  }

  private normalizeAdminSalaryListResponse(response: any): AdminSalaryListItem[] {
    const salaryDetails = this.normalizeEmployeeSalaryDetailsResponse(response);

    return salaryDetails
      .map((item) => {
        const employeeOption = this.employeeOptions.find((employee) => employee.id === item.empid);
        const employeeName = `${item.employeename
          || employeeOption?.employee_name
          || employeeOption?.employeeName
          || (employeeOption
            ? `${employeeOption.firstname || ''} ${employeeOption.lastname || ''}`.trim()
            : '')
          }`.trim() || `Employee #${item.empid}`;
        const employeeCode = `${item.employee_code || item.emp_code || employeeOption?.employee_code || employeeOption?.emp_code || ''}`.trim()
          || `EMP${String(item.empid || 0).padStart(3, '0')}`;

        return {
          id: item.id,
          employeeId: item.empid,
          employeeName,
          employeeCode,
          month: item.month,
          year: item.year,
          gross: item.gross,
          netPay: item.netpay,
          ctc: item.ctc,
          workingDays: item.working_days,
          totalDays: item.total_days,
          rawRecord: item,
        };
      })
      .sort((left, right) => left.employeeName.localeCompare(right.employeeName));
  }

  private resolveCompanyId(currentEmployee: any): number {
    return Number(
      currentEmployee?.companyid ||
      currentEmployee?.company_id ||
      this.tokenStorage.getCompanyId() ||
      0
    ) || 0;
  }

  private resolveEmployeeSalaryDetail(items: EmployeeSalaryDetails[]): EmployeeSalaryDetails | null {
    const selectedMonth = this.selectedMonthName.trim().toLowerCase();
    const selectedYear = Number(this.selectedYear || 0) || 0;
    const item =
      items.find((entry: EmployeeSalaryDetails) =>
        `${entry.month || ''}`.trim().toLowerCase() === selectedMonth && Number(entry.year || 0) === selectedYear
      ) ||
      items.find((entry: EmployeeSalaryDetails) => Number(entry.year || 0) === selectedYear) ||
      this.salaryHistoryRows[0] ||
      null;

    if (!item) {
      return null;
    }

    return item;
  }

  private refreshSavedPayrollDetails(employeeId: number, successMessage: string): void {
    this.apiService.getemployeesalarydetails(employeeId).subscribe({
      next: (response: any) => {
        const salaryHistory = this.normalizeEmployeeSalaryDetailsResponse(response);
        const selectedRecord = this.resolveEmployeeSalaryDetail(salaryHistory);

        this.salaryHistory = salaryHistory;

        if (selectedRecord) {
          const savedId = Number(selectedRecord.id || 0) || 0;

          if (savedId > 0) {
            this.payrollRecordIds.set(
              this.buildPayrollRecordKey(employeeId, this.selectedMonthName, this.selectedYear),
              savedId
            );
          }

          this.currentSalaryDetails = selectedRecord;
          this.payroll = this.calculatePayrollFromApiSources(
            this.employeeCtcDetails,
            selectedRecord,
            this.workingDayDetails
          );
        }

        this.saving = false;
        this.feedback.success(successMessage);
      },
      error: (error: any) => {
        this.saving = false;
        console.error('getemployeesalarydetails refresh error =>', error);
        this.feedback.warning(`${successMessage} Saved successfully, but the latest payroll details could not be refreshed.`);
      },
    });
  }

  private buildPaySlipPdfDataFromCurrentPayroll(): PaySlipPdfData | null {
    if (!this.employeeId) {
      return null;
    }

    return this.buildPaySlipPdfData(
      this.payroll,
      this.workingDayDetails,
      this.selectedMonthName,
      this.selectedYear,
      this.employeeProfile,
      this.employeeId
    );
  }

  private buildPaySlipPdfDataFromSalaryRecord(record: EmployeeSalaryDetails): PaySlipPdfData | null {
    const workingDayDetails = this.buildWorkingDayDetailsFromSalaryRecord(record);
    const payroll = this.calculatePayrollFromApiSources(this.employeeCtcDetails, record, workingDayDetails);
    return this.buildPaySlipPdfData(payroll, workingDayDetails, record.month, record.year, this.employeeProfile, this.employeeId);
  }

  private buildPaySlipPdfData(
    payroll: PayrollComputation,
    workingDayDetails: WorkingDayDetails | null,
    month: string,
    year: number,
    employeeProfileOverride?: any,
    employeeIdOverride?: number
  ): PaySlipPdfData {
    const employeeProfile = employeeProfileOverride || this.employeeProfile;
    const employeeId = Number(employeeIdOverride || this.employeeId || 0) || 0;
    const deductionRows = [
      { label: 'PROV.FUND', amount: this.formatPdfAmount(payroll.earnedEmployeePf) },
      { label: 'E.S.I.C.', amount: this.formatPdfAmount(payroll.earnedEmployeeEsi) },
    ].filter((item) => Number(item.amount.replace(/,/g, '')) > 0);

    return {
      companyName: this.companyName,
      logoSrc: this.paySlipLogoSrc,
      periodLabel: `${this.getShortMonthLabel(month)} - ${year}`,
      employeeName: this.resolveEmployeeNameForProfile(employeeProfile, employeeId),
      employeeCode: this.resolveEmployeeCodeForProfile(employeeProfile, employeeId),
      designation: this.resolveDesignationForProfile(employeeProfile),
      joinDate: this.resolveEmployeeProfileValueFromProfile(employeeProfile, ['joining_date', 'join_date', 'date_of_joining', 'date_of_join']) || 'N/A',
      uan: this.resolveEmployeeProfileValueFromProfile(employeeProfile, ['uan', 'uan_number', 'uanno']) || 'N/A',
      esicNumber: this.resolveEmployeeProfileValueFromProfile(employeeProfile, ['esic_number', 'esicnumber', 'esi_number']) || 'N/A',
      earningsRows: [
        { label: 'Basic', fixed: this.formatPdfAmount(payroll.fixedBasic), earned: this.formatPdfAmount(payroll.earnedBasic) },
        { label: 'H.R.A.', fixed: this.formatPdfAmount(payroll.fixedHra), earned: this.formatPdfAmount(payroll.earnedHra) },
        { label: 'D.A.', fixed: this.formatPdfAmount(payroll.fixedDa), earned: this.formatPdfAmount(payroll.earnedDa) },
        {
          label: 'Special Allowance',
          fixed: this.formatPdfAmount(payroll.fixedSpecialAllowance),
          earned: this.formatPdfAmount(payroll.earnedSpecialAllowance),
        },
        { label: 'Gross Salary', fixed: this.formatPdfAmount(payroll.fixedGross), earned: this.formatPdfAmount(payroll.earnedGross) },
      ],
      deductionRows: deductionRows.length ? deductionRows : [{ label: 'No Deductions', amount: this.formatPdfAmount(0) }],
      totalDeductions: this.formatPdfAmount(payroll.earnedTotalDeduction),
      netPay: this.formatPdfAmount(payroll.earnedNetPay),
      netPayWords: this.numberToWords(payroll.earnedNetPay),
      contributionRows: [
        { label: 'Gross', fixed: this.formatPdfAmount(payroll.fixedGross), earned: this.formatPdfAmount(payroll.earnedGross) },
        {
          label: `PF @${this.roundPercentage(payroll.employerPfRate)}% Basic`,
          fixed: this.formatPdfAmount(payroll.fixedEmployerPf),
          earned: this.formatPdfAmount(payroll.earnedEmployerPf),
        },
        {
          label: `ESIC @${this.roundPercentage(payroll.employerEsiRate)}%`,
          fixed: this.formatPdfAmount(payroll.fixedEmployerEsi),
          earned: this.formatPdfAmount(payroll.earnedEmployerEsi),
        },
        {
          label: 'Medical Insurance',
          fixed: this.formatPdfAmount(payroll.fixedMedicalInsurance),
          earned: this.formatPdfAmount(payroll.earnedMedicalInsurance),
        },
        {
          label: `Gratuity @${this.roundPercentage(payroll.gratuityRate)}%`,
          fixed: this.formatPdfAmount(payroll.fixedGratuity),
          earned: this.formatPdfAmount(payroll.earnedGratuity),
        },
        { label: 'CTC', fixed: this.formatPdfAmount(payroll.fixedCtc), earned: this.formatPdfAmount(payroll.earnedCtc) },
      ],
      attendanceRows: [
        { label: 'Casual Leave', value: this.formatPdfValue(workingDayDetails?.cl_count) },
        { label: 'Sick Leave', value: this.formatPdfValue(workingDayDetails?.sl_count) },
        { label: 'Working Days', value: this.formatPdfValue(workingDayDetails?.working_days) },
        { label: 'Week Off', value: this.formatPdfValue(workingDayDetails?.weekend) },
        { label: 'Paid Holiday', value: this.formatPdfValue(workingDayDetails?.holiday) },
        { label: 'Absent / LOP', value: this.formatPdfValue(workingDayDetails?.apsent) },
        { label: 'LOP Deduction', value: this.formatPdfAmount(payroll.lopDeduction) },
        { label: 'Month Total Days', value: this.formatPdfValue(workingDayDetails?.total_days) },
        { label: 'Attendance Ratio', value: `${this.roundPercentage(payroll.attendanceRatio * 100)}%` },
      ],
    };
  }

  private buildAdminRecordEmployeeProfile(record: AdminSalaryListItem, employeeProfile?: any): any {
    const matchedEmployee = this.employeeOptions.find((employee) => employee.id === record.employeeId);

    return {
      ...(matchedEmployee || {}),
      ...(employeeProfile || {}),
      employee_name:
        `${employeeProfile?.employee_name || employeeProfile?.employeeName || record.employeeName || record.rawRecord?.employeename || ''}`.trim()
        || null,
      employeeName:
        `${employeeProfile?.employeeName || employeeProfile?.employee_name || record.employeeName || record.rawRecord?.employeename || ''}`.trim()
        || null,
      employeename:
        `${employeeProfile?.employeename || employeeProfile?.employee_name || record.rawRecord?.employeename || record.employeeName || ''}`.trim()
        || null,
      employee_code:
        `${employeeProfile?.employee_code || employeeProfile?.emp_code || record.employeeCode || record.rawRecord?.employee_code || record.rawRecord?.emp_code || ''}`.trim()
        || null,
      emp_code:
        `${employeeProfile?.emp_code || employeeProfile?.employee_code || record.rawRecord?.emp_code || record.rawRecord?.employee_code || record.employeeCode || ''}`.trim()
        || null,
      empid: Number(employeeProfile?.empid || record.rawRecord?.empid || record.employeeId || 0) || record.employeeId,
    };
  }

  private buildWorkingDayDetailsFromSalaryRecord(record: EmployeeSalaryDetails): WorkingDayDetails {
    return {
      cl_count: 0,
      apsent: this.roundCurrency(record.lop_absent),
      sl_count: 0,
      working_days: this.roundCurrency(record.working_days),
      weekend: this.roundCurrency(record.week_off),
      holiday: this.roundCurrency(record.paid_holiday),
      total_days: this.roundCurrency(record.total_days) || this.getDaysInMonth(Number(record.year || this.selectedYear), Math.max(this.getMonthIndexByName(record.month), 0)),
    };
  }

  private buildPaySlipFileName(record?: EmployeeSalaryDetails | null, employeeProfileOverride?: any, employeeIdOverride?: number): string {
    const month = `${record?.month || this.selectedMonthName || 'payslip'}`.trim().toLowerCase().replace(/\s+/g, '-');
    const year = Number(record?.year || this.selectedYear || new Date().getFullYear()) || new Date().getFullYear();
    const employeeName = `${this.resolveEmployeeNameForProfile(employeeProfileOverride || this.employeeProfile, employeeIdOverride || this.employeeId) || 'employee'}`
      .trim()
      .replace(/\s+/g, '_');
    return `${employeeName}_pay-slip_${month}_${year}.pdf`;
  }

  private waitForPdfRender(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  private resolveAbsentDays(workingDayDetails: WorkingDayDetails | null, totalDays: number): number {
    const absentDays = this.roundCurrency(workingDayDetails?.apsent);
    return Math.min(Math.max(absentDays, 0), totalDays);
  }

  private resolveAttendanceRatioFromAbsentDays(totalDays: number, absentDays: number): number {
    if (totalDays <= 0) {
      return 0;
    }

    const payableDays = Math.max(totalDays - absentDays, 0);
    return Math.min(Math.max(payableDays / totalDays, 0), 1);
  }

  private calculatePayroll(ctcDetails: EmployeeCtcDetails | null, workingDayDetails: WorkingDayDetails | null): PayrollComputation {
    if (!ctcDetails) {
      return this.createEmptyPayroll();
    }

    const totalDays = Math.max(this.roundCurrency(workingDayDetails?.total_days), 1);
    const absentDays = this.resolveAbsentDays(workingDayDetails, totalDays);
    const attendanceRatio = this.resolveAttendanceRatioFromAbsentDays(totalDays, absentDays);
    const fixedBasic = this.roundCurrency(ctcDetails.basic_pay);
    const fixedHra = this.roundCurrency(ctcDetails.hra);
    const fixedDa = this.roundCurrency(ctcDetails.da);
    const fixedSpecialAllowance = this.roundCurrency(ctcDetails.special_allowance);
    const fixedGross = this.roundCurrency(ctcDetails.gross || fixedBasic + fixedHra + fixedDa + fixedSpecialAllowance);
    const pfWageBase = Math.min(fixedBasic, 15000);
    const employeePfRate = this.resolveRate(ctcDetails.employee_pf_amount, pfWageBase, 12);
    const employerPfRate = this.resolveRate(ctcDetails.employer_pf_amount, pfWageBase, 12);
    const employeeEsiRate = this.resolveRate(ctcDetails.employee_esi_amount, fixedGross, 0.75);
    const employerEsiRate = this.resolveRate(ctcDetails.employer_esi_amount, fixedGross, 3.25);
    const gratuityRate = this.resolveRate(ctcDetails.gratuity, fixedBasic, 4.81);
    const fixedEmployeePf = this.roundCurrency(ctcDetails.employee_pf_amount || (pfWageBase * employeePfRate) / 100);
    const fixedEmployerPf = this.roundCurrency(ctcDetails.employer_pf_amount || (pfWageBase * employerPfRate) / 100);
    const fixedEmployeeEsi = fixedGross <= 21000 ? this.roundCurrency((fixedGross * employeeEsiRate) / 100) : 0;
    const fixedEmployerEsi = fixedGross <= 21000 ? this.roundCurrency((fixedGross * employerEsiRate) / 100) : 0;
    const fixedMedicalInsurance = fixedEmployerEsi === 0 ? this.roundCurrency(ctcDetails.medical_insurance) : 0;
    const fixedGratuity = this.roundCurrency(ctcDetails.gratuity || (fixedBasic * gratuityRate) / 100);
    const fixedTotalDeduction = this.roundCurrency(ctcDetails.total_deduction || (fixedEmployeePf + fixedEmployeeEsi));
    const fixedNetPay = this.roundCurrency(ctcDetails.netpay || (fixedGross - fixedTotalDeduction));
    const fixedEmployerContribution = this.roundCurrency(
      ctcDetails.total_employer_contribution || (fixedEmployerPf + fixedEmployerEsi + fixedMedicalInsurance + fixedGratuity)
    );
    const fixedCtc = this.roundCurrency(ctcDetails.ctc || (fixedGross + fixedEmployerContribution));
    const earnedBasic = this.prorateAmount(fixedBasic, attendanceRatio);
    const earnedHra = this.prorateAmount(fixedHra, attendanceRatio);
    const earnedDa = this.prorateAmount(fixedDa, attendanceRatio);
    const lopDeduction = this.calculateLopDeduction(fixedGross, totalDays, absentDays);
    const earnedGross = this.roundCurrency(Math.max(fixedGross - lopDeduction, 0));
    const earnedSpecialAllowance = this.roundCurrency(
      Math.max(earnedGross - (earnedBasic + earnedHra + earnedDa), 0)
    );
    const earnedPfWageBase = Math.min(earnedBasic, 15000);
    const earnedEmployeePf = this.roundCurrency((earnedPfWageBase * employeePfRate) / 100);
    const earnedEmployerPf = this.roundCurrency((earnedPfWageBase * employerPfRate) / 100);
    const earnedEmployeeEsi = earnedGross <= 21000 ? this.roundCurrency((earnedGross * employeeEsiRate) / 100) : 0;
    const earnedEmployerEsi = earnedGross <= 21000 ? this.roundCurrency((earnedGross * employerEsiRate) / 100) : 0;
    const earnedMedicalInsurance = earnedEmployerEsi === 0 ? fixedMedicalInsurance : 0;
    const earnedGratuity = this.roundCurrency((earnedBasic * gratuityRate) / 100);
    const earnedTotalDeduction = this.roundCurrency(earnedEmployeePf + earnedEmployeeEsi);
    const earnedNetPay = this.roundCurrency(earnedGross - earnedTotalDeduction);
    const earnedEmployerContribution = this.roundCurrency(
      earnedEmployerPf + earnedEmployerEsi + earnedMedicalInsurance + earnedGratuity
    );
    const earnedCtc = this.roundCurrency(earnedGross + earnedEmployerContribution);

    return {
      attendanceRatio,
      fixedBasic,
      fixedHra,
      fixedDa,
      fixedSpecialAllowance,
      fixedGross,
      fixedEmployeePf,
      fixedEmployeeEsi,
      fixedEmployerPf,
      fixedEmployerEsi,
      fixedMedicalInsurance,
      fixedGratuity,
      fixedTotalDeduction,
      fixedNetPay,
      fixedEmployerContribution,
      fixedCtc,
      earnedBasic,
      earnedHra,
      earnedDa,
      earnedSpecialAllowance,
      earnedGross,
      earnedEmployeePf,
      earnedEmployeeEsi,
      earnedEmployerPf,
      earnedEmployerEsi,
      earnedMedicalInsurance,
      earnedGratuity,
      earnedTotalDeduction,
      earnedNetPay,
      earnedEmployerContribution,
      earnedCtc,
      lopDeduction,
      employeePfRate,
      employerPfRate,
      employeeEsiRate,
      employerEsiRate,
      gratuityRate,
    };
  }

  private calculatePayrollFromSalaryDetails(
    salaryDetails: EmployeeSalaryDetails | null,
    workingDayDetails: WorkingDayDetails | null
  ): PayrollComputation {
    if (!salaryDetails) {
      return this.createEmptyPayroll();
    }

    const totalDays = Math.max(
      this.roundCurrency(workingDayDetails?.total_days || salaryDetails.total_days),
      1
    );
    const absentDays = Math.min(
      Math.max(this.roundCurrency(workingDayDetails?.apsent ?? salaryDetails.lop_absent), 0),
      totalDays
    );
    const attendanceRatio = this.resolveAttendanceRatioFromAbsentDays(totalDays, absentDays);

    const earnedBasic = this.roundCurrency(salaryDetails.basic_pay);
    const earnedHra = this.roundCurrency(salaryDetails.hra);
    const earnedDa = this.roundCurrency(salaryDetails.da);
    const earnedSpecialAllowance = this.roundCurrency(salaryDetails.special_allowance);
    const earnedGross = this.roundCurrency(
      salaryDetails.gross || earnedBasic + earnedHra + earnedDa + earnedSpecialAllowance
    );
    const earnedEmployeePf = this.roundCurrency(salaryDetails.employee_pf_amount);
    const earnedEmployeeEsi = this.roundCurrency(salaryDetails.employee_esi_amount);
    const earnedEmployerPf = this.roundCurrency(salaryDetails.employer_pf_amount);
    const earnedEmployerEsi = this.roundCurrency(salaryDetails.employer_esi_amount);
    const earnedMedicalInsurance = this.roundCurrency(salaryDetails.medical_insurance);
    const earnedGratuity = this.roundCurrency(salaryDetails.gratuity);
    const earnedTotalDeduction = this.roundCurrency(
      salaryDetails.total_deduction || earnedEmployeePf + earnedEmployeeEsi
    );
    const earnedNetPay = this.roundCurrency(salaryDetails.netpay || earnedGross - earnedTotalDeduction);
    const earnedEmployerContribution = this.roundCurrency(
      earnedEmployerPf + earnedEmployerEsi + earnedMedicalInsurance + earnedGratuity
    );
    const earnedCtc = this.roundCurrency(salaryDetails.ctc || earnedGross + earnedEmployerContribution);

    const fixedBasic = this.inflateProratedAmount(earnedBasic, attendanceRatio);
    const fixedHra = this.inflateProratedAmount(earnedHra, attendanceRatio);
    const fixedDa = this.inflateProratedAmount(earnedDa, attendanceRatio);
    const fixedSpecialAllowance = this.inflateProratedAmount(earnedSpecialAllowance, attendanceRatio);
    const fixedGross = this.roundCurrency(
      salaryDetails.fixed_gross || fixedBasic + fixedHra + fixedDa + fixedSpecialAllowance
    );
    const fixedEmployeePf = this.inflateProratedAmount(earnedEmployeePf, attendanceRatio);
    const fixedEmployeeEsi = fixedGross <= 21000 ? this.inflateProratedAmount(earnedEmployeeEsi, attendanceRatio) : 0;
    const fixedEmployerPf = this.inflateProratedAmount(earnedEmployerPf, attendanceRatio);
    const fixedEmployerEsi = fixedGross <= 21000 ? this.inflateProratedAmount(earnedEmployerEsi, attendanceRatio) : 0;
    const fixedMedicalInsurance = earnedMedicalInsurance;
    const fixedGratuity = this.inflateProratedAmount(earnedGratuity, attendanceRatio);
    const fixedTotalDeduction = this.roundCurrency(fixedEmployeePf + fixedEmployeeEsi);
    const fixedNetPay = this.roundCurrency(fixedGross - fixedTotalDeduction);
    const fixedCtc = this.roundCurrency(
      salaryDetails.fixed_ctc || fixedGross + fixedEmployerPf + fixedEmployerEsi + fixedMedicalInsurance + fixedGratuity
    );
    const fixedEmployerContribution = this.roundCurrency(
      fixedCtc - fixedGross || fixedEmployerPf + fixedEmployerEsi + fixedMedicalInsurance + fixedGratuity
    );
    const lopDeduction = this.roundCurrency(
      salaryDetails.lop_deduction || this.calculateLopDeduction(fixedGross, totalDays, absentDays)
    );

    const employeePfRate = this.resolveRate(fixedEmployeePf, Math.min(Math.max(fixedBasic, 0), 15000), 12);
    const employerPfRate = this.resolveRate(fixedEmployerPf, Math.min(Math.max(fixedBasic, 0), 15000), 12);
    const employeeEsiRate = this.resolveRate(earnedEmployeeEsi, earnedGross, 0.75);
    const employerEsiRate = this.resolveRate(earnedEmployerEsi, earnedGross, 3.25);
    const gratuityRate = this.resolveRate(earnedGratuity, Math.max(earnedBasic, 0), 4.81);

    return {
      attendanceRatio,
      fixedBasic,
      fixedHra,
      fixedDa,
      fixedSpecialAllowance,
      fixedGross,
      fixedEmployeePf,
      fixedEmployeeEsi,
      fixedEmployerPf,
      fixedEmployerEsi,
      fixedMedicalInsurance,
      fixedGratuity,
      fixedTotalDeduction,
      fixedNetPay,
      fixedEmployerContribution,
      fixedCtc,
      earnedBasic,
      earnedHra,
      earnedDa,
      earnedSpecialAllowance,
      earnedGross,
      earnedEmployeePf,
      earnedEmployeeEsi,
      earnedEmployerPf,
      earnedEmployerEsi,
      earnedMedicalInsurance,
      earnedGratuity,
      earnedTotalDeduction,
      earnedNetPay,
      earnedEmployerContribution,
      earnedCtc,
      lopDeduction,
      employeePfRate,
      employerPfRate,
      employeeEsiRate,
      employerEsiRate,
      gratuityRate,
    };
  }

  private calculatePayrollFromApiSources(
    ctcDetails: EmployeeCtcDetails | null,
    salaryDetails: EmployeeSalaryDetails | null,
    workingDayDetails: WorkingDayDetails | null
  ): PayrollComputation {
    if (!salaryDetails) {
      return this.calculatePayroll(ctcDetails, workingDayDetails);
    }

    if (!ctcDetails) {
      return this.calculatePayrollFromSalaryDetails(salaryDetails, workingDayDetails);
    }

    const totalDays = Math.max(
      this.roundCurrency(workingDayDetails?.total_days || salaryDetails.total_days),
      1
    );
    const absentDays = Math.min(
      Math.max(this.roundCurrency(workingDayDetails?.apsent ?? salaryDetails.lop_absent), 0),
      totalDays
    );
    const attendanceRatio = this.resolveAttendanceRatioFromAbsentDays(totalDays, absentDays);

    const fixedBasic = this.roundCurrency(ctcDetails.basic_pay);
    const fixedHra = this.roundCurrency(ctcDetails.hra);
    const fixedDa = this.roundCurrency(ctcDetails.da);
    const fixedSpecialAllowance = this.roundCurrency(ctcDetails.special_allowance);
    const fixedGross = this.roundCurrency(
      ctcDetails.gross || fixedBasic + fixedHra + fixedDa + fixedSpecialAllowance
    );
    const fixedEmployeePf = this.roundCurrency(ctcDetails.employee_pf_amount);
    const fixedEmployeeEsi = this.roundCurrency(ctcDetails.employee_esi_amount);
    const fixedEmployerPf = this.roundCurrency(ctcDetails.employer_pf_amount);
    const fixedEmployerEsi = this.roundCurrency(ctcDetails.employer_esi_amount);
    const fixedMedicalInsurance = this.roundCurrency(ctcDetails.medical_insurance);
    const fixedGratuity = this.roundCurrency(ctcDetails.gratuity);
    const fixedTotalDeduction = this.roundCurrency(
      ctcDetails.total_deduction || fixedEmployeePf + fixedEmployeeEsi
    );
    const fixedNetPay = this.roundCurrency(ctcDetails.netpay || fixedGross - fixedTotalDeduction);
    const fixedEmployerContribution = this.roundCurrency(
      ctcDetails.total_employer_contribution || (fixedEmployerPf + fixedEmployerEsi + fixedMedicalInsurance + fixedGratuity)
    );
    const fixedCtc = this.roundCurrency(ctcDetails.ctc || fixedGross + fixedEmployerContribution);

    const earnedBasic = this.roundCurrency(salaryDetails.basic_pay);
    const earnedHra = this.roundCurrency(salaryDetails.hra);
    const earnedDa = this.roundCurrency(salaryDetails.da);
    const earnedSpecialAllowance = this.roundCurrency(salaryDetails.special_allowance);
    const earnedGross = this.roundCurrency(
      salaryDetails.gross || earnedBasic + earnedHra + earnedDa + earnedSpecialAllowance
    );
    const earnedEmployeePf = this.roundCurrency(salaryDetails.employee_pf_amount);
    const earnedEmployeeEsi = this.roundCurrency(salaryDetails.employee_esi_amount);
    const earnedEmployerPf = this.roundCurrency(salaryDetails.employer_pf_amount);
    const earnedEmployerEsi = this.roundCurrency(salaryDetails.employer_esi_amount);
    const earnedMedicalInsurance = this.roundCurrency(salaryDetails.medical_insurance);
    const earnedGratuity = this.roundCurrency(salaryDetails.gratuity);
    const earnedTotalDeduction = this.roundCurrency(
      salaryDetails.total_deduction || earnedEmployeePf + earnedEmployeeEsi
    );
    const earnedNetPay = this.roundCurrency(salaryDetails.netpay || earnedGross - earnedTotalDeduction);
    const earnedEmployerContribution = this.roundCurrency(
      earnedEmployerPf + earnedEmployerEsi + earnedMedicalInsurance + earnedGratuity
    );
    const earnedCtc = this.roundCurrency(salaryDetails.ctc || earnedGross + earnedEmployerContribution);
    const lopDeduction = this.roundCurrency(
      salaryDetails.lop_deduction || this.calculateLopDeduction(fixedGross, totalDays, absentDays)
    );

    const pfBase = Math.min(Math.max(fixedBasic, 0), 15000);
    const employeePfRate = this.resolveRate(fixedEmployeePf, pfBase, 12);
    const employerPfRate = this.resolveRate(fixedEmployerPf, pfBase, 12);
    const esiBase = Math.max(fixedGross || earnedGross, 0);
    const employeeEsiRate = this.resolveRate(fixedEmployeeEsi || earnedEmployeeEsi, esiBase, 0.75);
    const employerEsiRate = this.resolveRate(fixedEmployerEsi || earnedEmployerEsi, esiBase, 3.25);
    const gratuityRate = this.resolveRate(fixedGratuity || earnedGratuity, Math.max(fixedBasic || earnedBasic, 0), 4.81);

    return {
      attendanceRatio,
      fixedBasic,
      fixedHra,
      fixedDa,
      fixedSpecialAllowance,
      fixedGross,
      fixedEmployeePf,
      fixedEmployeeEsi,
      fixedEmployerPf,
      fixedEmployerEsi,
      fixedMedicalInsurance,
      fixedGratuity,
      fixedTotalDeduction,
      fixedNetPay,
      fixedEmployerContribution,
      fixedCtc,
      earnedBasic,
      earnedHra,
      earnedDa,
      earnedSpecialAllowance,
      earnedGross,
      earnedEmployeePf,
      earnedEmployeeEsi,
      earnedEmployerPf,
      earnedEmployerEsi,
      earnedMedicalInsurance,
      earnedGratuity,
      earnedTotalDeduction,
      earnedNetPay,
      earnedEmployerContribution,
      earnedCtc,
      lopDeduction,
      employeePfRate,
      employerPfRate,
      employeeEsiRate,
      employerEsiRate,
      gratuityRate,
    };
  }

  private buildSalaryPayload(): PaySlipPayload {
    const timestamp = new Date().toISOString();
    const details = this.workingDayDetails;
    const payrollRecordId = this.resolvePayrollRecordId();

    return {
      ...(payrollRecordId ? { id: payrollRecordId } : {}),
      empid: this.employeeId,
      month: this.selectedMonthName,
      year: this.selectedYear,
      basic_pay: this.payroll.earnedBasic,
      hra: this.payroll.earnedHra,
      da: this.payroll.earnedDa,
      special_allowance: this.payroll.earnedSpecialAllowance,
      fixed_gross: this.payroll.fixedGross,
      gross: this.payroll.earnedGross,
      employee_pf_amount: this.payroll.earnedEmployeePf,
      employee_esi_amount: this.payroll.earnedEmployeeEsi,
      total_deduction: this.payroll.earnedTotalDeduction,
      netpay: this.payroll.earnedNetPay,
      employer_pf_amount: this.payroll.earnedEmployerPf,
      employer_esi_amount: this.payroll.earnedEmployerEsi,
      medical_insurance: this.payroll.earnedMedicalInsurance,
      gratuity: this.payroll.earnedGratuity,
      fixed_ctc: this.payroll.fixedCtc,
      ctc: this.payroll.earnedCtc,
      week_off: this.roundCurrency(details?.weekend),
      paid_holiday: this.roundCurrency(details?.holiday),
      lop_absent: this.roundCurrency(details?.apsent),
      lop_deduction: this.payroll.lopDeduction,
      total_days: this.roundCurrency(details?.total_days),
      working_days: this.roundCurrency(details?.working_days),
      createddate: timestamp,
      updated_date: timestamp,
      createdby: this.resolveCreatedBy(),
    };
  }

  private buildPayrollRecordKey(empid: number, month: string, year: number): string {
    return `${empid}-${month}-${year}`;
  }

  private buildDownloadKey(record?: EmployeeSalaryDetails | null): string {
    return record ? this.buildSalaryHistoryDownloadKey(record) : 'current-payslip';
  }

  private buildSalaryHistoryDownloadKey(record: EmployeeSalaryDetails): string {
    return `history-${record.id || 0}-${record.empid}-${record.month}-${record.year}`;
  }

  private buildAdminSalaryDownloadKey(record: AdminSalaryListItem): string {
    return `admin-${record.id || 0}-${record.employeeId}-${record.month}-${record.year}`;
  }

  private resolvePayrollRecordId(): number | null {
    const key = this.buildPayrollRecordKey(this.employeeId, this.selectedMonthName, this.selectedYear);
    const id = Number(this.payrollRecordIds.get(key) || 0) || 0;
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

  private createEmptyPayroll(): PayrollComputation {
    return {
      attendanceRatio: 0,
      fixedBasic: 0,
      fixedHra: 0,
      fixedDa: 0,
      fixedSpecialAllowance: 0,
      fixedGross: 0,
      fixedEmployeePf: 0,
      fixedEmployeeEsi: 0,
      fixedEmployerPf: 0,
      fixedEmployerEsi: 0,
      fixedMedicalInsurance: 0,
      fixedGratuity: 0,
      fixedTotalDeduction: 0,
      fixedNetPay: 0,
      fixedEmployerContribution: 0,
      fixedCtc: 0,
      earnedBasic: 0,
      earnedHra: 0,
      earnedDa: 0,
      earnedSpecialAllowance: 0,
      earnedGross: 0,
      earnedEmployeePf: 0,
      earnedEmployeeEsi: 0,
      earnedEmployerPf: 0,
      earnedEmployerEsi: 0,
      earnedMedicalInsurance: 0,
      earnedGratuity: 0,
      earnedTotalDeduction: 0,
      earnedNetPay: 0,
      earnedEmployerContribution: 0,
      earnedCtc: 0,
      lopDeduction: 0,
      employeePfRate: 12,
      employerPfRate: 12,
      employeeEsiRate: 0.75,
      employerEsiRate: 3.25,
      gratuityRate: 4.81,
    };
  }

  private resolveRate(amount: number, base: number, fallback: number): number {
    if (amount > 0 && base > 0) {
      return Number(((amount / base) * 100).toFixed(2));
    }

    return fallback;
  }

  private resolveEmployeeId(): number {
    return Number(this.tokenStorage.getID() || this.authService.getID() || 0) || 0;
  }

  private resolveCreatedBy(): string {
    return `${this.tokenStorage.getUsername() || this.authService.getUsername() || ''}`.trim();
  }

  private prorateAmount(value: number, ratio: number): number {
    return this.roundCurrency(value * ratio);
  }

  private calculateLopDeduction(fixedGross: number, totalDays: number, absentDays: number): number {
    if (fixedGross <= 0 || totalDays <= 0 || absentDays <= 0) {
      return 0;
    }

    const perDaySalary = fixedGross / totalDays;
    return this.roundCurrency(perDaySalary * absentDays);
  }

  private inflateProratedAmount(value: number, ratio: number): number {
    if (value <= 0) {
      return 0;
    }

    if (ratio > 0 && ratio < 1) {
      return this.roundCurrency(value / ratio);
    }

    return this.roundCurrency(value);
  }

  private roundCurrency(value: unknown): number {
    const numericValue = Number(value || 0);
    return Number.isFinite(numericValue) ? Math.round(numericValue) : 0;
  }

  roundPercentage(value: number): string {
    return Number.isFinite(value) ? value.toFixed(2).replace(/\.00$/, '') : '0';
  }

  formatCurrency(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value || 0)));
  }

  private formatPdfAmount(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  private formatPdfValue(value: number | null | undefined): string {
    return this.formatPdfAmount(value);
  }

  private formatCurrencyValue(value: number | null | undefined): string {
    return `${this.roundCurrency(value)}`;
  }

  private getDaysInMonth(year: number, monthIndex: number): number {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  private getMonthIndexByName(month: string | null | undefined): number {
    const normalizedMonth = `${month || ''}`.trim().toLowerCase();
    return this.monthNames.findIndex((item) => item.toLowerCase() === normalizedMonth);
  }

  private getShortMonthLabel(month: string | null | undefined): string {
    const monthIndex = this.getMonthIndexByName(month);
    return monthIndex >= 0 ? this.monthNames[monthIndex].slice(0, 3) : `${month || ''}`.slice(0, 3);
  }

  private resolveEmployeeProfileValue(keys: string[]): string {
    return this.resolveEmployeeProfileValueFromProfile(this.employeeProfile, keys);
  }

  private resolveEmployeeProfileValueFromProfile(profile: any, keys: string[]): string {
    for (const key of keys) {
      const value = profile?.[key];

      if (value !== null && value !== undefined && `${value}`.trim()) {
        return `${value}`.trim();
      }
    }

    return '';
  }

  private resolveEmployeeNameForProfile(profile: any, employeeId: number): string {
    const matchedEmployee = this.employeeOptions.find((employee) => employee.id === employeeId);

    return (
      `${profile?.employee_name || profile?.employeeName || profile?.employeename || profile?.firstname || ''} ${profile?.lastname || ''}`.trim() ||
      `${matchedEmployee?.employee_name || matchedEmployee?.employeeName || `${matchedEmployee?.firstname || ''} ${matchedEmployee?.lastname || ''}`}`.trim() ||
      `${profile?.name || ''}`.trim() ||
      (employeeId === this.employeeId ? `${this.tokenStorage.getEmpname() || ''}`.trim() : '') ||
      (employeeId ? `Employee ${employeeId}` : 'Employee')
    );
  }

  private resolveEmployeeCodeForProfile(profile: any, employeeId: number): string {
    const matchedEmployee = this.employeeOptions.find((employee) => employee.id === employeeId);

    return (
      `${profile?.employee_code || profile?.emp_code || matchedEmployee?.employee_code || matchedEmployee?.emp_code || profile?.empid || profile?.attendanceid || employeeId || ''}`.trim() ||
      'N/A'
    );
  }

  private resolveDesignationForProfile(profile: any): string {
    return (
      `${profile?.designation || profile?.designation_name || profile?.designationName || profile?.position || ''}`.trim() ||
      'Designation'
    );
  }

  private numberToWords(value: number): string {
    const amount = Math.max(Math.round(Number(value || 0)), 0);

    if (amount === 0) {
      return 'Zero Rupees';
    }

    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const twoDigitWords = (num: number): string => {
      if (num < 20) {
        return units[num];
      }

      const tenPart = tens[Math.floor(num / 10)];
      const unitPart = units[num % 10];
      return `${tenPart}${unitPart ? ` ${unitPart}` : ''}`.trim();
    };

    const threeDigitWords = (num: number): string => {
      const hundredPart = Math.floor(num / 100);
      const remainder = num % 100;
      const prefix = hundredPart ? `${units[hundredPart]} Hundred` : '';
      const suffix = remainder ? twoDigitWords(remainder) : '';
      return `${prefix}${prefix && suffix ? ' ' : ''}${suffix}`.trim();
    };

    const crore = Math.floor(amount / 10000000);
    const lakh = Math.floor((amount % 10000000) / 100000);
    const thousand = Math.floor((amount % 100000) / 1000);
    const remainder = amount % 1000;

    const parts = [
      crore ? `${twoDigitWords(crore)} Crore` : '',
      lakh ? `${twoDigitWords(lakh)} Lakh` : '',
      thousand ? `${twoDigitWords(thousand)} Thousand` : '',
      remainder ? threeDigitWords(remainder) : '',
    ].filter(Boolean);

    return `${parts.join(' ')} Rupees`;
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

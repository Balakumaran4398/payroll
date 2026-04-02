import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  SalaryRevisionLetterBreakdown,
  SalaryRevisionLetterCtcInput,
  SalaryRevisionLetterData,
  SalaryRevisionLetterTableRow,
} from '../../models/salary-revision-letter.model';
import { SalaryRevisionLetterPdfService } from '../../services/salary-revision-letter-pdf.service';

@Component({
  selector: 'app-salary-revision-letter',
  templateUrl: './salary-revision-letter.component.html',
  styleUrls: ['./salary-revision-letter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalaryRevisionLetterComponent implements OnInit {
  @Input() hideActions = false;
  @Input() data: SalaryRevisionLetterData = {
    employeeName: 'Employee Name',
    empCode: 'EMP001',
    department: 'Engineering',
    designation: 'Software Engineer',
    effectiveFrom: '2025-04-01',
    letterDate: '2025-05-14',
    financialYear: '2025-2026',
    previousFY: '2024-2025',
    currentCtc: {
      basic: 15000,
      hra: 7500,
      ta: 2500,
      specialAllowance: 5000,
      employeePf: 1800,
      employeeEsi: 0,
      employerPf: 1800,
      employerEsi: 0,
      gratuity: 722,
      mediclaim: 500,
    },
    revisedCtc: {
      basic: 18000,
      hra: 9000,
      ta: 3000,
      specialAllowance: 7000,
      employeePf: 1800,
      employeeEsi: 0,
      employerPf: 1800,
      employerEsi: 0,
      gratuity: 866,
      mediclaim: 500,
    },
  };

  @ViewChild('documentRoot', { static: false }) documentRoot?: ElementRef<HTMLElement>;

  readonly logoPath = 'assets/images/Ridsyslogo.png';
  readonly companyName = 'MRRIDSYS TECHNOLOGIES PRIVATE LIMITED';
  readonly companyAddress = 'No.21, Jansi Street, Indira Gandhi Nagar, Orleanpet, Pondicherry - 605001';
  readonly companyPhone = '+91 94898 34442';
  readonly companyWebsite = 'www.ridsys.com';
  readonly companyEmail = 'support@ridsys.com';
  readonly cooName = 'Aravind A';
  readonly cooDesignation = 'COO';
  readonly terms = [
    'Office Timings: 9.30 am to 6.30 pm (1 hour lunch break)',
    'Monthly two permissions are allowed (30 mins)',
    'LOP considered for late come after excluding the permission, Improper Thumb, DSR not send (3:1)',
    'Casual leave(CL) - 6 Days + Sick Leave(SL) - 6 Days',
  ];

  isDownloading = false;
  logoDataUrl = '';

  constructor(private pdfService: SalaryRevisionLetterPdfService) {}

  ngOnInit(): void {
    void this.loadLogo();
  }

  get currentBreakdown(): SalaryRevisionLetterBreakdown {
    return this.buildBreakdown(this.data.currentCtc);
  }

  get revisedBreakdown(): SalaryRevisionLetterBreakdown {
    return this.buildBreakdown(this.data.revisedCtc);
  }

  get annexureRows(): SalaryRevisionLetterTableRow[] {
    const current = this.currentBreakdown;
    const revised = this.revisedBreakdown;

    return [
      this.createRow('Basic', current.basic, revised.basic),
      this.createRow('HRA', current.hra, revised.hra),
      this.createRow('Travel Allowances', current.ta, revised.ta),
      this.createRow('Special Allowance', current.specialAllowance, revised.specialAllowance),
      this.createRow('Gross Salary (A)', current.grossSalary, revised.grossSalary, 'total'),
      this.createRow('Employee Contributions (B)', 0, 0, 'section'),
      this.createRow('Provident Fund', current.employeePf, revised.employeePf),
      this.createRow('ESI', current.employeeEsi, revised.employeeEsi),
      this.createRow(
        'Total Employee Contributions (B)',
        current.totalEmployeeContributions,
        revised.totalEmployeeContributions,
        'total'
      ),
      this.createRow('Net Salary (A-B)', current.netSalary, revised.netSalary, 'total'),
      this.createRow('Employer Contributions (C)', 0, 0, 'section'),
      this.createRow('Provident Fund', current.employerPf, revised.employerPf),
      this.createRow('ESI', current.employerEsi, revised.employerEsi),
      this.createRow('Gratuity', current.gratuity, revised.gratuity),
      this.createRow('Mediclaim', current.mediclaim, revised.mediclaim),
      this.createRow(
        'Total Employer Contributions (C)',
        current.totalEmployerContributions,
        revised.totalEmployerContributions,
        'total'
      ),
      this.createRow('Cost to Company (A+C)', current.costToCompany, revised.costToCompany, 'total', true),
    ];
  }

  get annualRevisedCtc(): number {
    return this.resolveAnnualCtc(this.data.revisedCtc, this.revisedBreakdown.costToCompany);
  }

  get annualCurrentCtc(): number {
    return this.resolveAnnualCtc(this.data.currentCtc, this.currentBreakdown.costToCompany);
  }

  get monthlyRevisedCtc(): number {
    return this.resolveMonthlyCtc(this.data.revisedCtc, this.revisedBreakdown.costToCompany);
  }

  get monthlyCurrentCtc(): number {
    return this.resolveMonthlyCtc(this.data.currentCtc, this.currentBreakdown.costToCompany);
  }

  get annualIncrement(): number {
    return Math.max(this.annualRevisedCtc - this.annualCurrentCtc, 0);
  }

  get monthlyIncrement(): number {
    return Math.max(this.monthlyRevisedCtc - this.monthlyCurrentCtc, 0);
  }

  get letterFileName(): string {
    const name = this.data.employeeName.trim().replace(/\s+/g, '_') || 'Employee';
    const financialYear = this.data.financialYear.trim().replace(/\s+/g, '_') || 'FY';
    return `${name}_SalaryRevisionLetter_${financialYear}.pdf`;
  }

  async downloadPdf(): Promise<void> {
    if (!this.documentRoot?.nativeElement || this.isDownloading) {
      return;
    }

    this.isDownloading = true;

    try {
      if (!this.logoDataUrl) {
        await this.loadLogo();
      }

      await this.pdfService.downloadPagesAsPdf(this.documentRoot.nativeElement, this.letterFileName);
    } finally {
      this.isDownloading = false;
    }
  }

  printDocument(): void {
    window.print();
  }

  formatCurrency(value: number | null | undefined, withSymbol: boolean = false): string {
    const amount = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value || 0)));

    return withSymbol ? `₹ ${amount}` : amount;
  }

  formatDate(value: string | Date): string {
    const parsedValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedValue.getTime())) {
      return `${value || ''}`;
    }

    const parts = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).formatToParts(parsedValue);
    const day = parts.find((part) => part.type === 'day')?.value || '';
    const month = parts.find((part) => part.type === 'month')?.value || '';
    const year = parts.find((part) => part.type === 'year')?.value || '';

    return [day, month, year].filter(Boolean).join('-');
  }

  formatMonthYear(value: string | Date): string {
    const parsedValue = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsedValue.getTime())) {
      return `${value || ''}`;
    }

    return new Intl.DateTimeFormat('en-GB', {
      month: 'short',
      year: 'numeric',
    }).format(parsedValue);
  }

  private async loadLogo(): Promise<void> {
    try {
      this.logoDataUrl = await this.pdfService.getAssetAsDataUrl(this.logoPath);
    } catch {
      this.logoDataUrl = this.logoPath;
    }
  }

  private buildBreakdown(source: SalaryRevisionLetterCtcInput): SalaryRevisionLetterBreakdown {
    const basic = this.normalizeAmount(source.basic);
    const hra = this.normalizeAmount(source.hra);
    const ta = this.normalizeAmount(source.ta);
    const specialAllowance = this.normalizeAmount(source.specialAllowance);
    const employeePf = this.normalizeAmount(source.employeePf);
    const employeeEsi = this.normalizeAmount(source.employeeEsi);
    const employerPf = this.normalizeAmount(source.employerPf);
    const employerEsi = this.normalizeAmount(source.employerEsi);
    const gratuity = this.normalizeAmount(source.gratuity);
    const mediclaim = this.normalizeAmount(source.mediclaim);
    const grossSalary = basic + hra + ta + specialAllowance;
    const totalEmployeeContributions = employeePf + employeeEsi;
    const netSalary = grossSalary - totalEmployeeContributions;
    const totalEmployerContributions = employerPf + employerEsi + gratuity + mediclaim;
    const costToCompany = grossSalary + totalEmployerContributions;

    return {
      basic,
      hra,
      ta,
      specialAllowance,
      grossSalary,
      employeePf,
      employeeEsi,
      totalEmployeeContributions,
      netSalary,
      employerPf,
      employerEsi,
      gratuity,
      mediclaim,
      totalEmployerContributions,
      costToCompany,
    };
  }

  private createRow(
    label: string,
    currentMonthly: number,
    revisedMonthly: number,
    kind?: 'section' | 'total',
    currencySymbol: boolean = false
  ): SalaryRevisionLetterTableRow {
    const isSection = kind === 'section';

    return {
      label,
      currentMonthly: isSection ? null : currentMonthly,
      currentAnnual: isSection ? null : this.toAnnual(currentMonthly),
      revisedMonthly: isSection ? null : revisedMonthly,
      revisedAnnual: isSection ? null : this.toAnnual(revisedMonthly),
      kind,
      currencySymbol,
    };
  }

  private toAnnual(monthly: number): number {
    return Math.round(monthly * 12);
  }

  private resolveMonthlyCtc(source: SalaryRevisionLetterCtcInput, fallback: number): number {
    const monthly = this.normalizeAmount(source.monthly);
    return monthly > 0 ? monthly : fallback;
  }

  private resolveAnnualCtc(source: SalaryRevisionLetterCtcInput, fallbackMonthly: number): number {
    const annual = this.normalizeAmount(source.annual);
    return annual > 0 ? annual : this.toAnnual(this.resolveMonthlyCtc(source, fallbackMonthly));
  }

  private normalizeAmount(value: number | null | undefined): number {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.round(amount) : 0;
  }
}

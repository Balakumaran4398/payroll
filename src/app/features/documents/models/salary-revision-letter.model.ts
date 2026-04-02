export interface SalaryRevisionLetterCtcInput {
  monthly?: number | null;
  annual?: number | null;
  basic: number | null;
  hra: number | null;
  ta: number | null;
  specialAllowance: number | null;
  employeePf: number | null;
  employeeEsi: number | null;
  employerPf: number | null;
  employerEsi: number | null;
  gratuity: number | null;
  mediclaim: number | null;
}

export interface SalaryRevisionLetterData {
  employeeName: string;
  empCode: string;
  department: string;
  designation: string;
  effectiveFrom: string | Date;
  letterDate: string | Date;
  financialYear: string;
  previousFY: string;
  currentCtc: SalaryRevisionLetterCtcInput;
  revisedCtc: SalaryRevisionLetterCtcInput;
}

export interface SalaryRevisionLetterBreakdown {
  basic: number;
  hra: number;
  ta: number;
  specialAllowance: number;
  grossSalary: number;
  employeePf: number;
  employeeEsi: number;
  totalEmployeeContributions: number;
  netSalary: number;
  employerPf: number;
  employerEsi: number;
  gratuity: number;
  mediclaim: number;
  totalEmployerContributions: number;
  costToCompany: number;
}

export interface SalaryRevisionLetterTableRow {
  label: string;
  currentMonthly: number | null;
  currentAnnual: number | null;
  revisedMonthly: number | null;
  revisedAnnual: number | null;
  kind?: 'section' | 'total';
  currencySymbol?: boolean;
}

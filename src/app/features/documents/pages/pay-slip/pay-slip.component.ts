import { Component } from '@angular/core';

interface PaySlipRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-pay-slip',
  templateUrl: './pay-slip.component.html',
  styleUrls: ['./pay-slip.component.scss'],
})
export class PaySlipComponent {
  readonly summaryCards = [
    { label: 'Net Salary', value: 'Rs 43,860', tone: 'primary', caption: 'Credited on 31 Mar 2026' },
    { label: 'Gross Salary', value: 'Rs 52,500', tone: 'neutral', caption: 'Before deductions' },
    { label: 'Total Deductions', value: 'Rs 8,640', tone: 'warn', caption: 'PF, ESI, PT and tax' },
  ];

  readonly paySlipMonths = [
    { month: 'March 2026', status: 'Current', net: 'Rs 43,860' },
    { month: 'February 2026', status: 'Generated', net: 'Rs 43,120' },
    { month: 'January 2026', status: 'Generated', net: 'Rs 42,980' },
  ];

  readonly earnings: PaySlipRow[] = [
    { label: 'Basic Pay', value: 'Rs 21,000' },
    { label: 'House Rent Allowance', value: 'Rs 10,500' },
    { label: 'Special Allowance', value: 'Rs 14,000' },
    { label: 'Travel Allowance', value: 'Rs 4,000' },
    { label: 'Medical Allowance', value: 'Rs 3,000' },
  ];

  readonly deductions: PaySlipRow[] = [
    { label: 'Employee PF', value: 'Rs 1,800' },
    { label: 'Professional Tax', value: 'Rs 200' },
    { label: 'TDS', value: 'Rs 6,200' },
    { label: 'Canteen / Other', value: 'Rs 440' },
  ];

  printPage(): void {
    window.print();
  }

  downloadPaySlip(): void {
    const content = [
      'Pay Slip - March 2026',
      'Employee Id: EMP-1024',
      '',
      'Summary',
      ...this.summaryCards.map((item) => `${item.label}: ${item.value} (${item.caption})`),
      '',
      'Earnings',
      ...this.earnings.map((item) => `${item.label}: ${item.value}`),
      '',
      'Deductions',
      ...this.deductions.map((item) => `${item.label}: ${item.value}`),
      '',
      'Net Pay: Rs 43,860',
      'Payment Mode: Bank Transfer',
    ].join('\n');

    this.downloadTextFile('pay-slip-march-2026.txt', content);
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

import { Component } from '@angular/core';

@Component({
  selector: 'app-call-letter',
  templateUrl: './call-letter.component.html',
  styleUrls: ['./call-letter.component.scss'],
})
export class CallLetterComponent {
  readonly candidate = {
    name: 'Arun Kumar',
    role: 'Senior Frontend Engineer',
    department: 'Product Engineering',
    joiningDate: '15 Apr 2026',
    location: 'Chennai',
    ctc: 'Rs 6,80,000 per annum',
    reportingTo: 'Engineering Manager',
  };

  readonly checkpoints = [
    'Carry valid government ID proof on joining day.',
    'Submit educational and experience documents for verification.',
    'Report to HR desk by 9:30 AM on the date of joining.',
  ];

  printPage(): void {
    window.print();
  }

  downloadLetter(): void {
    const content = [
      'Call Letter',
      `Candidate: ${this.candidate.name}`,
      `Role: ${this.candidate.role}`,
      `Department: ${this.candidate.department}`,
      `Joining Date: ${this.candidate.joiningDate}`,
      `Location: ${this.candidate.location}`,
      `CTC: ${this.candidate.ctc}`,
      `Reporting To: ${this.candidate.reportingTo}`,
      '',
      'Joining Checklist',
      ...this.checkpoints.map((item, index) => `${index + 1}. ${item}`),
    ].join('\n');

    this.downloadTextFile('call-letter.txt', content);
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

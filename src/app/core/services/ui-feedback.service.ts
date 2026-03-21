import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type FeedbackTone = 'success' | 'warning' | 'error' | 'info';

@Injectable({
  providedIn: 'root',
})
export class UiFeedbackService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, actionLabel = 'Close'): void {
    this.open(message, 'success', actionLabel, 4200);
  }

  warning(message: string, actionLabel = 'Close'): void {
    this.open(message, 'warning', actionLabel, 5200);
  }

  error(message: string, actionLabel = 'Close'): void {
    this.open(message, 'error', actionLabel, 6200);
  }

  info(message: string, actionLabel = 'Close'): void {
    this.open(message, 'info', actionLabel, 4200);
  }

  private open(message: string, tone: FeedbackTone, actionLabel: string, duration: number): void {
    this.snackBar.open(message, actionLabel, {
      duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['app-feedback-snackbar', `app-feedback-snackbar--${tone}`],
    });
  }
}

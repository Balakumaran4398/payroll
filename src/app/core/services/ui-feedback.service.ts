import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

type FeedbackTone = 'success' | 'warning' | 'error' | 'info';

interface FeedbackOptions {
  actionLabel?: string;
  duration?: number;
  horizontalPosition?: MatSnackBarHorizontalPosition;
  verticalPosition?: MatSnackBarVerticalPosition;
  extraPanelClass?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UiFeedbackService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, actionLabel = 'Close'): void {
    this.open(message, 'success', { actionLabel, duration: 4200 });
  }

  warning(message: string, actionLabel = 'Close'): void {
    this.open(message, 'warning', { actionLabel, duration: 5200 });
  }

  error(message: string, actionLabel = 'Close'): void {
    this.open(message, 'error', { actionLabel, duration: 6200 });
  }

  info(message: string, actionLabel = 'Close'): void {
    this.open(message, 'info', { actionLabel, duration: 4200 });
  }

  welcome(message: string): void {
    this.open(message, 'success', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      extraPanelClass: ['app-feedback-snackbar--welcome'],
    });
  }

  private open(message: string, tone: FeedbackTone, options: FeedbackOptions): void {
    const duration = options.duration ?? 4200;

    this.snackBar.open(message, options.actionLabel, {
      duration,
      horizontalPosition: options.horizontalPosition ?? 'end',
      verticalPosition: options.verticalPosition ?? 'top',
      panelClass: [
        'app-feedback-snackbar',
        `app-feedback-snackbar--${tone}`,
        `app-feedback-snackbar--duration-${duration}`,
        ...(options.extraPanelClass || []),
      ],
    });
  }
}

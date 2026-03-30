import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  submitted = false;

  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.isValidEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.loading = true;

    this.http.post(`${this.API_URL}/auth/forgot-password`, {
      email: this.email
    }).subscribe({
      next: (response: any) => {
        this.successMessage = 'Password reset link has been sent to your email. Please check your inbox.';
        this.email = '';
        this.loading = false;
        this.submitted = false;
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Forgot password error:', error);
        this.errorMessage = error.error?.message || 'Failed to send reset link. Please try again.';
        this.loading = false;
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}

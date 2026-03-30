import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  submitted = false;
  token: string = '';
  showPassword = false;
  showConfirmPassword = false;

  private API_URL = 'https://hotel-management-backend-n59d.onrender.com/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get reset token from URL
    this.token = this.route.snapshot.paramMap.get('token') || '';
    if (!this.token) {
      this.errorMessage = 'Invalid reset link. Please request a new password reset.';
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.password) {
      this.errorMessage = 'Please enter a new password';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Invalid reset token. Please request a new password reset.';
      return;
    }

    this.loading = true;

    this.http.post(`${this.API_URL}/auth/reset-password/${this.token}`, {
      password: this.password,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (response: any) => {
        this.successMessage = 'Password reset successfully! Redirecting to login...';
        this.password = '';
        this.confirmPassword = '';
        this.loading = false;
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Reset password error:', error);
        if (error.status === 400) {
          this.errorMessage = 'Reset link has expired. Please request a new password reset.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to reset password. Please try again.';
        }
        this.loading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}

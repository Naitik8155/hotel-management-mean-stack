import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-staff-login',
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.css']
})
export class StaffLoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  showPassword = false;
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    // Check if already logged in
    if (this.authService.isAuthenticated()) {
      const user = this.getUserFromStorage();
      if (user?.role === 'staff' || user?.role === 'admin') {
        this.router.navigate(['/staff/dashboard']);
        return;
      }
    }

    // Get return URL from route parameters or default to '/staff/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/staff/dashboard';

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() { return this.loginForm.controls; }

  getUserFromStorage() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      return null;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        console.log('Login response:', response);

        // Check if user is staff or admin
        const userRole = response.user?.role || response.role;

        if (userRole === 'staff' || userRole === 'admin') {
          console.log('✓ Staff login successful');
          this.toastService.success('Logged in as Staff Member', 'Staff Portal');
          this.router.navigate([this.returnUrl]);
        } else {
          this.toastService.error('Access denied. Staff credentials required.', 'Access Denied');
          this.authService.logout();
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Login error:', error);
        this.toastService.error(error.error?.message || 'Login failed. Please check your credentials.', 'Auth Error');
        this.loading = false;
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      formGroup.get(key)?.markAsTouched();
    });
  }

  // Getter methods for form controls
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}

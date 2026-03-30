import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
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
    // Check if already logged in as admin
    if (this.authService.isAuthenticated()) {
      const user = this.getUserFromStorage();
      if (user?.role === 'admin') {
        console.log('✓ Admin already logged in, redirecting to dashboard');
        this.router.navigate(['/admin/dashboard']);
        return;
      }
    }

    // Get return URL from route parameters or default to '/admin/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

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

        // Check if user is admin
        const userRole = response.user?.role || response.role;

        if (userRole === 'admin') {
          console.log('✓ Admin login successful, redirecting to dashboard');
          this.toastService.success('Logged in as Administrator', 'Admin Control Center');
          // Always redirect to admin dashboard
          this.router.navigate(['/admin/dashboard']).then(() => {
            console.log('✓ Successfully navigated to admin dashboard');
          });
        } else {
          this.toastService.error('Access denied. Admin credentials required.', 'Access Denied');
          this.authService.logout();
          this.loading = false;
        }
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

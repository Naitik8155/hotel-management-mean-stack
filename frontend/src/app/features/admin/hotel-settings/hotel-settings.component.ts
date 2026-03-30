import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-hotel-settings',
  templateUrl: './hotel-settings.component.html',
  styleUrls: ['./hotel-settings.component.css']
})
export class HotelSettingsComponent implements OnInit {
  activeTab = 'hotel'; // Default tab
  
  // Forms
  hotelForm!: FormGroup;
  passwordForm!: FormGroup;
  notificationForm!: FormGroup;
  
  // Data
  sessions: any[] = [];
  loginHistory: any[] = [];
  
  // State
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadSessions();
    this.loadLoginHistory();
    this.loadHotelSettings();
  }

  initializeForms(): void {
    // Hotel General Settings
    this.hotelForm = this.fb.group({
      hotelName: ['Luxury Grand Hotel', [Validators.required]],
      contactEmail: ['contact@luxurygrand.com', [Validators.required, Validators.email]],
      currency: ['INR', Validators.required],
      taxRate: [18, [Validators.required, Validators.min(0)]],
      checkInTime: ['12:00', Validators.required],
      checkOutTime: ['11:00', Validators.required],
      cancellationPolicy: ['Free cancellation up to 24 hours before check-in.', Validators.required]
    });

    // Account Security (Moved from Profile)
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Notification Preferences
    this.notificationForm = this.fb.group({
      emailBookings: [true],
      emailCancellations: [true],
      emailWeeklyReport: [false],
      smsAlerts: [false]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    return newPassword && confirmPassword && newPassword.value === confirmPassword.value
      ? null : { passwordMismatch: true };
  }

  loadHotelSettings(): void {
    // In a real app, load from a service. For now, using defaults.
  }

  loadSessions(): void {
    this.sessions = [
      { id: 1, device: 'Chrome on Windows 11', location: 'Mumbai, India', lastActive: new Date(), current: true },
      { id: 2, device: 'Safari on iPhone 15', location: 'Pune, India', lastActive: new Date(Date.now() - 3600000 * 2), current: false }
    ];
  }

  loadLoginHistory(): void {
    this.loginHistory = [
      { date: new Date(), device: 'Chrome on Windows', location: 'Mumbai, India', ip: '192.168.1.1', status: 'success' },
      { date: new Date(Date.now() - 86400000), device: 'Firefox on Mac', location: 'Delhi, India', ip: '192.168.1.2', status: 'success' },
      { date: new Date(Date.now() - 86400000 * 2), device: 'Unknown Device', location: 'London, UK', ip: '45.12.33.1', status: 'failed' }
    ];
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  saveHotelSettings(): void {
    if (this.hotelForm.invalid) return;
    this.isSaving = true;
    setTimeout(() => {
      this.showSuccess('Hotel configuration synchronized successfully');
      this.isSaving = false;
    }, 1000);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.isSaving = true;
    
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.showSuccess('Vault credentials updated successfully');
        this.passwordForm.reset();
        this.isSaving = false;
      },
      error: (err) => {
        this.showError(err.error?.message || 'Password update failed');
        this.isSaving = false;
      }
    });
  }

  saveNotifications(): void {
    this.isSaving = true;
    setTimeout(() => {
      this.showSuccess('Notification preferences updated');
      this.isSaving = false;
    }, 800);
  }

  logoutSession(sessionId: number): void {
    if (!confirm('Logout this active node?')) return;
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
    this.showSuccess('Session terminated successfully');
  }

  logoutAllSessions(): void {
    if (!confirm('Logout all other authorized nodes?')) return;
    this.sessions = this.sessions.filter(s => s.current);
    this.showSuccess('All auxiliary sessions terminated');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 4000);
  }

  showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => this.errorMessage = '', 4000);
  }
}

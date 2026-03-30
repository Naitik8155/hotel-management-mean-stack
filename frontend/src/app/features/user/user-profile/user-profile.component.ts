import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  preferencesForm!: FormGroup;
  activeTab = 'profile';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  selectedProfilePicture: File | null = null;
  profilePicturePreview: string | null = null;
  isUploadingPicture = false;
  editMode = false;
  isDeleting = false;
  showDeleteConfirm = false;
  isDeleted = false;
  preferencesLoading = false;
  tabErrors: { [key: string]: string } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.profilePicturePreview = user.profileImage || null;
          this.populateProfileForm();
          this.populatePreferencesForm();
        }
      });
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        country: [''],
        zipCode: ['']
      })
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.preferencesForm = this.fb.group({
      emailNotifications: [true],
      smsNotifications: [false],
      marketingEmails: [false],
      bookingReminders: [true],
      newsletterSubscription: [false]
    });
  }

  populateProfileForm(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        address: this.currentUser.address || {}
      });
    }
  }

  populatePreferencesForm(): void {
    if (this.currentUser?.preferences) {
      this.preferencesForm.patchValue(this.currentUser.preferences);
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('newPassword');
    const confirmPassword = group.get('confirmPassword');

    if (password && confirmPassword) {
      return password.value === confirmPassword.value ? null : { passwordMismatch: true };
    }
    return null;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.setError('profile', 'Please fill all required fields correctly');
      return;
    }

    this.isLoading = true;
    this.clearError('profile');
    this.clearSuccess();

    this.authService.updateUserProfile(this.profileForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response) => {
          this.showSuccess('Profile updated successfully!');
          this.isLoading = false;
          this.editMode = false;
          this.currentUser = response.data || response;
          this.authService.updateCurrentUser(this.currentUser);
        },
        (error) => {
          this.setError('profile', error.error?.message || 'Error updating profile');
          this.isLoading = false;
        }
      );
  }

  enableEdit(): void {
    this.editMode = true;
    this.populateProfileForm();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.populateProfileForm();
    this.clearError('profile');
    this.clearSuccess();
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.setError('password', 'Please fill all password fields correctly');
      return;
    }

    this.isLoading = true;
    this.clearError('password');
    this.clearSuccess();

    this.authService.changePassword(this.passwordForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response) => {
          this.showSuccess('Password changed successfully!');
          this.passwordForm.reset();
          this.isLoading = false;
        },
        (error) => {
          this.setError('password', error.error?.message || 'Error changing password');
          this.isLoading = false;
        }
      );
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      this.setError('preferences', 'Please correct the preferences form');
      return;
    }

    this.preferencesLoading = true;
    this.clearError('preferences');
    this.clearSuccess();

    const preferencesData = this.preferencesForm.value;

    // Store preferences locally - update backend method when available
    this.currentUser = { ...this.currentUser, preferences: preferencesData };
    this.authService.updateCurrentUser(this.currentUser);
    this.showSuccess('Preferences saved successfully!');
    this.preferencesLoading = false;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.clearSuccess();
    this.clearError(tab);
  }

  setError(tab: string, message: string): void {
    this.tabErrors[tab] = message;
    this.toastService.error(message, 'Error');
  }

  clearError(tab?: string): void {
    if (tab) {
      delete this.tabErrors[tab];
    } else {
      this.tabErrors = {};
    }
    if (!Object.keys(this.tabErrors).length) {
      this.errorMessage = '';
    }
  }

  showSuccess(message: string): void {
    this.toastService.success(message, 'Success');
  }

  clearSuccess(): void {
    this.successMessage = '';
  }

  logout(): void {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
    }
  }

  onProfilePictureSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.setError('profile', 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.setError('profile', 'File size must be less than 5MB');
      return;
    }

    this.selectedProfilePicture = file;
    this.clearError('profile');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePicturePreview = e.target?.result;
    };
    reader.readAsDataURL(file);
  }

  removeProfilePictureSelection(): void {
    this.selectedProfilePicture = null;
    this.profilePicturePreview = this.currentUser?.profileImage || null;
    this.clearError('profile');
  }

  uploadProfilePicture(): void {
    if (!this.selectedProfilePicture) {
      this.setError('profile', 'Please select an image first');
      return;
    }

    this.isUploadingPicture = true;
    this.clearError('profile');
    this.clearSuccess();

    this.authService.uploadProfilePicture(this.selectedProfilePicture)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response) => {
          this.currentUser = response.data || response;
          this.profilePicturePreview = this.currentUser.profileImage || null;
          this.selectedProfilePicture = null;
          this.showSuccess('Profile picture uploaded successfully!');
          this.isUploadingPicture = false;
          this.authService.updateCurrentUser(this.currentUser);
        },
        (error) => {
          this.setError('profile', error.error?.message || 'Error uploading profile picture');
          this.isUploadingPicture = false;
        }
      );
  }

  confirmDeleteAccount(): void {
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  deleteAccount(): void {
    if (this.isDeleting) return;

    this.isDeleting = true;
    this.clearError('preferences');
    this.clearSuccess();

    this.authService.deleteUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.showDeleteConfirm = false;
          this.isDeleted = true;
          this.showSuccess('Your account has been deleted');
          setTimeout(() => {
            this.authService.logout();
          }, 2000);
        },
        error: (err) => {
          this.setError('preferences', err.error?.message || 'Failed to delete account');
          this.isDeleting = false;
          this.showDeleteConfirm = false;
        }
      });
  }

  getFieldError(formName: 'profileForm' | 'passwordForm', fieldName: string): string {
    const form = formName === 'profileForm' ? this.profileForm : this.passwordForm;
    const field = form.get(fieldName);

    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
    if (field.errors['minLength']) return `Minimum length is ${field.errors['minLength'].requiredLength}`;
    if (field.errors['maxLength']) return `Maximum length is ${field.errors['maxLength'].requiredLength}`;
    if (field.errors['email']) return 'Invalid email address';
    if (field.errors['pattern']) return `Invalid ${this.formatFieldName(fieldName)} format`;

    return 'Invalid input';
  }

  formatFieldName(name: string): string {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  resolveImageUrl(img: any): string {
    if (!img) return '';
    let raw = typeof img === 'string' ? img : (img.url || img);
    if (!raw) return '';

    // Repair malformed URLs
    raw = String(raw).replace(/uploadsrooms/gi, 'uploads/rooms');
    raw = raw.replace(/\\/g, '/');

    if (raw.startsWith('http')) return raw;

    // For profiles, images might be in /uploads/profiles or similar, usually standardizing to uploads
    const path = raw.startsWith('/uploads') ? raw : `/uploads/${raw}`;
    return `http://localhost:5000${path}`;
  }
}

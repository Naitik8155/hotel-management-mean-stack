import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.component.html',
  styleUrls: ['./admin-profile.component.css']
})
export class AdminProfileComponent implements OnInit {
  profileForm!: FormGroup;
  profile: any = {};

  isLoading = false;
  isSaving = false;
  isEditMode = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadProfile();
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });

    this.profileForm.disable();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.authService.getUserProfile().subscribe(
      (response) => {
        this.profile = response.data || {};
        this.updateProfileForm();
        this.isLoading = false;
      },
      (error) => {
        this.showError('Error loading profile');
        this.isLoading = false;
      }
    );
  }

  updateProfileForm(): void {
    if (this.profile) {
      if (this.isEditMode) {
        this.profileForm.enable();
      } else {
        this.profileForm.disable();
      }
      
      const addr = this.profile.address || {};
      this.profileForm.patchValue({
        name: this.profile.name || '',
        email: this.profile.email || '',
        phone: this.profile.phone || '',
        gender: this.profile.gender || '',
        address: addr.street || addr || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zipCode || ''
      });
    }
  }

  enableEditMode(): void {
    this.isEditMode = true;
    this.profileForm.enable();
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsUntouched();
    });
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.profileForm.disable();
    this.updateProfileForm();
    this.errorMessage = '';
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsUntouched();
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      this.showError('Registry parameters invalid. Please rectify highlighted entries.');
      return;
    }

    this.isSaving = true;
    const formVal = this.profileForm.getRawValue();

    const profileData = {
      name: formVal.name,
      email: formVal.email,
      phone: formVal.phone,
      gender: formVal.gender,
      address: {
        street: formVal.address,
        city: formVal.city,
        state: formVal.state,
        zipCode: formVal.zipCode
      }
    };

    this.authService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        this.profile = response.data || profileData;
        this.updateProfileForm();
        this.showSuccess('Identity Dossier Updated Successfully');
        this.isEditMode = false;
        this.profileForm.disable();
        this.isSaving = false;
      },
      error: (error) => {
        const errorMsg = error.error?.message || 'Synchronization Failure: Database rejected the update request.';
        this.showError(errorMsg);
        this.isSaving = false;
      }
    });
  }

  deleteProfile(): void {
    if (!confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    this.isSaving = true;
    this.authService.deleteUserProfile().subscribe(
      () => {
        this.showSuccess('Profile deleted successfully. Redirecting...');
        setTimeout(() => {
          this.authService.logout();
        }, 2000);
        this.isSaving = false;
      },
      (error) => {
        const errorMsg = error.error?.message || 'Error deleting profile. Please try again.';
        this.showError(errorMsg);
        this.isSaving = false;
      }
    );
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.showError('Photo too large (max 2MB)');
        return;
      }

      this.isSaving = true;
      this.authService.uploadProfilePicture(file).subscribe({
        next: (response) => {
          this.profile.profileImage = response.data.profileImage;
          const currentUser = this.authService.getCurrentUser();
          currentUser.profileImage = response.data.profileImage;
          this.authService.updateCurrentUser(currentUser);
          this.showSuccess('Visual identity synchronized successfully.');
          this.isSaving = false;
        },
        error: (err) => {
          this.showError('Binary upload failed. Please verify technical specifications.');
          this.isSaving = false;
        }
      });
    }
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 4000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 4000);
  }
}

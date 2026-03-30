import { Component, OnInit } from '@angular/core';
import { ContentService } from '@core/services/content.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cms-management',
  templateUrl: './cms-management.component.html',
  styleUrls: ['./cms-management.component.css']
})
export class CMSManagementComponent implements OnInit {
  activeTab = 'banners';

  banners: any[] = [];
  testimonials: any[] = [];
  hotelDetails: any = {};

  showBannerForm = false;
  editBannerMode = false;
  selectedBanner: any = null;

  bannerForm!: FormGroup;
  hotelForm!: FormGroup;

  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  selectedFile: File | null = null;

  constructor(
    private contentService: ContentService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.loadAllContent();
  }

  initializeForms(): void {
    this.bannerForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      imageUrl: [''],
      ctaLink: ['/rooms'],
      ctaText: ['Book Now', Validators.required],
      priority: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      isActive: [true]
    });

    this.hotelForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      checkInTime: ['14:00', Validators.required],
      checkOutTime: ['12:00', Validators.required]
    });
  }

  loadAllContent(): void {
    this.loadBanners();
    this.loadTestimonials();
    this.loadHotelDetails();
  }

  loadBanners(): void {
    this.isLoading = true;
    this.contentService.getAllBanners().subscribe(
      (response) => {
        this.banners = response.data || [];
        this.isLoading = false;
      },
      (error) => {
        this.showError('Error loading banners');
        this.isLoading = false;
      }
    );
  }


  loadTestimonials(): void {
    this.contentService.getTestimonials().subscribe(
      (response) => {
        this.testimonials = response.data || [];
      },
      (error) => {
        this.showError('Error loading testimonials');
      }
    );
  }

  loadHotelDetails(): void {
    this.contentService.getHotelDetails().subscribe(
      (response) => {
        this.hotelDetails = response.data || {};
        this.hotelForm.patchValue(this.hotelDetails);
      },
      (error) => {
        this.showError('Error loading hotel details');
      }
    );
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  openBannerForm(): void {
    this.editBannerMode = false;
    this.selectedFile = null;
    this.bannerForm.reset({ priority: 1, isActive: true, ctaText: 'Book Now', ctaLink: '/rooms' });
    this.showBannerForm = true;
  }

  editBanner(banner: any): void {
    this.editBannerMode = true;
    this.selectedBanner = banner;
    this.selectedFile = null;
    this.bannerForm.patchValue({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      ctaLink: banner.ctaLink,
      ctaText: banner.ctaText,
      priority: banner.priority,
      isActive: banner.isActive
    });
    this.showBannerForm = true;
  }

  closeBannerForm(): void {
    this.showBannerForm = false;
    this.bannerForm.reset();
    this.editBannerMode = false;
    this.selectedBanner = null;
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.showError('File size exceeds 10MB limit');
        return;
      }
      this.selectedFile = file;
      this.bannerForm.patchValue({ imageUrl: 'file_selected' });
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    if (this.editBannerMode && this.selectedBanner) {
      this.bannerForm.patchValue({ imageUrl: this.selectedBanner.imageUrl });
    } else {
      this.bannerForm.patchValue({ imageUrl: '' });
    }
  }

  saveBanner(): void {
    // Basic validation
    if (this.bannerForm.get('title')?.invalid ||
      this.bannerForm.get('description')?.invalid ||
      this.bannerForm.get('ctaText')?.invalid) {
      this.bannerForm.markAllAsTouched();
      return;
    }

    // Must have either an existing image or a new file
    if (!this.selectedFile && !this.bannerForm.get('imageUrl')?.value) {
      this.showError('Banner image is required');
      return;
    }

    this.isSaving = true;

    const formData = new FormData();
    formData.append('title', this.bannerForm.get('title')?.value);
    formData.append('description', this.bannerForm.get('description')?.value);
    formData.append('ctaLink', this.bannerForm.get('ctaLink')?.value);
    formData.append('ctaText', this.bannerForm.get('ctaText')?.value);
    formData.append('priority', this.bannerForm.get('priority')?.value);
    formData.append('isActive', this.bannerForm.get('isActive')?.value);

    if (this.selectedFile) {
      formData.append('imageUrl', this.selectedFile);
    }

    if (this.editBannerMode && this.selectedBanner) {
      this.contentService.updateBanner(this.selectedBanner._id, formData).subscribe(
        () => {
          this.showSuccess('Banner updated successfully');
          this.closeBannerForm();
          this.loadAllContent(); // Reload everything to be sure
          this.isSaving = false;
        },
        (error) => {
          this.showError(error.error?.message || 'Error updating banner');
          this.isSaving = false;
        }
      );
    } else {
      this.contentService.createBanner(formData).subscribe(
        () => {
          this.showSuccess('Banner created successfully');
          this.closeBannerForm();
          this.loadAllContent();
          this.isSaving = false;
        },
        (error) => {
          this.showError(error.error?.message || 'Error creating banner');
          this.isSaving = false;
        }
      );
    }
  }

  deleteBanner(banner: any): void {
    if (!confirm(`Delete banner: ${banner.title}?`)) return;

    this.contentService.deleteBanner(banner._id).subscribe(
      () => {
        this.showSuccess('Banner deleted successfully');
        this.loadBanners();
      },
      (error) => {
        this.showError('Error deleting banner');
      }
    );
  }


  approveTestimonial(testimonial: any): void {
    // Approve testimonial logic
    this.showSuccess('Testimonial approved');
  }

  rejectTestimonial(testimonial: any): void {
    if (!confirm('Reject this testimonial?')) return;
    this.showSuccess('Testimonial rejected');
  }

  saveHotelDetails(): void {
    if (this.hotelForm.invalid) {
      Object.keys(this.hotelForm.controls).forEach(key => {
        this.hotelForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSaving = true;
    const hotelData = this.hotelForm.value;

    // Save hotel details logic
    setTimeout(() => {
      this.showSuccess('Hotel details updated successfully');
      this.isSaving = false;
    }, 1000);
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

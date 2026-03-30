import { Component, OnInit } from '@angular/core';
import { AdminService } from '@core/services/admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-staff-management',
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.css']
})
export class StaffManagementComponent implements OnInit {
  staff: any[] = [];
  filteredStaff: any[] = [];

  showForm = false;
  showDeleteConfirm = false;
  selectedStaff: any = null;
  editMode = false;

  staffForm!: FormGroup;
  searchTerm = '';
  selectedRole = '';

  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  roles = [
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'housekeeper', label: 'Housekeeper' },
    { value: 'manager', label: 'Manager' },
    { value: 'chef', label: 'Chef' },
    { value: 'maintenance', label: 'Maintenance' }
  ];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadStaff();
  }

  initializeForm(): void {
    this.staffForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      role: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      shift: ['', Validators.required],
      joiningDate: ['', Validators.required],
      password: ['']
    });
  }

  loadStaff(): void {
    this.isLoading = true;
    this.adminService.getAllStaff().subscribe(
      (response) => {
        this.staff = response.data || [];
        this.filterStaff();
        this.isLoading = false;
      },
      (error) => {
        this.showError('Error loading staff');
        this.isLoading = false;
      }
    );
  }

  filterStaff(): void {
    this.filteredStaff = this.staff.filter(member => {
      const matchesSearch =
        member.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesRole = !this.selectedRole || member.role === this.selectedRole;

      return matchesSearch && matchesRole;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.filterStaff();
  }

  openAddForm(): void {
    this.editMode = false;
    this.staffForm.reset();
    this.showForm = true;
  }

  editStaff(member: any): void {
    this.editMode = true;
    this.selectedStaff = member;
    this.staffForm.patchValue({
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      salary: member.salary,
      shift: member.shift,
      joiningDate: member.joiningDate?.split('T')[0]
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.staffForm.reset();
    this.editMode = false;
    this.selectedStaff = null;
  }

  saveStaff(): void {
    if (this.staffForm.invalid) {
      Object.keys(this.staffForm.controls).forEach(key => {
        this.staffForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSaving = true;
    const staffData = this.staffForm.value;

    if (this.editMode && this.selectedStaff) {
      this.adminService.updateStaff(this.selectedStaff._id, staffData).subscribe(
        () => {
          this.showSuccess('Staff member updated successfully');
          this.closeForm();
          this.loadStaff();
          this.isSaving = false;
        },
        (error) => {
          this.showError('Error updating staff member');
          this.isSaving = false;
        }
      );
    } else {
      this.adminService.createStaff(staffData).subscribe(
        () => {
          this.showSuccess('Staff member added successfully');
          this.closeForm();
          this.loadStaff();
          this.isSaving = false;
        },
        (error) => {
          this.showError('Error adding staff member');
          this.isSaving = false;
        }
      );
    }
  }

  deleteStaff(member: any): void {
    this.selectedStaff = member;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.selectedStaff = null;
  }

  confirmDelete(): void {
    if (!this.selectedStaff) return;

    this.adminService.deleteStaff(this.selectedStaff._id).subscribe(
      () => {
        this.showSuccess('Staff member deleted successfully');
        this.closeDeleteConfirm();
        this.loadStaff();
      },
      (error) => {
        this.showError('Error deleting staff member');
      }
    );
  }

  getTotalStaff(): number {
    return this.filteredStaff.length;
  }

  getActiveStaff(): number {
    return this.filteredStaff.filter(s => s.isActive).length;
  }

  getTotalSalary(): number {
    return this.filteredStaff.reduce((sum, s) => sum + (s.salary || 0), 0);
  }

  getRoleBadgeClass(role: string): string {
    const classes: any = {
      'receptionist': 'badge-primary',
      'housekeeper': 'badge-success',
      'manager': 'badge-danger',
      'chef': 'badge-warning',
      'maintenance': 'badge-info'
    };
    return classes[role] || 'badge-secondary';
  }

  getShiftBadgeClass(shift: string): string {
    const classes: any = {
      'morning': 'badge-warning',
      'afternoon': 'badge-info',
      'night': 'badge-secondary'
    };
    return classes[shift] || 'badge-light';
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  }

  showSuccess(message: string): void {
    this.toastService.success(message, 'Success');
  }

  showError(message: string): void {
    this.toastService.error(message, 'Error');
  }
}

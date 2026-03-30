import { Component, OnInit } from '@angular/core';
import { AdminService } from '@core/services/admin.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-users-management',
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.css']
})
export class UsersManagementComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];

  showDetailsModal = false;
  showRoleModal = false;
  selectedUser: any = null;

  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  isLoading = false;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  roleForm!: FormGroup;
  roles = ['user', 'staff', 'admin'];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadUsers();
  }

  initializeForm(): void {
    this.roleForm = this.fb.group({
      role: ['', Validators.required]
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe(
      (response) => {
        this.users = response.data || [];
        this.filterUsers();
        this.isLoading = false;
      },
      (error) => {
        this.showError('Error loading users');
        this.isLoading = false;
      }
    );
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch =
        user.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(this.searchTerm));

      const matchesRole = !this.selectedRole || user.role === this.selectedRole;
      const matchesStatus = this.selectedStatus === '' ||
        (this.selectedStatus === 'active' && user.isActive) ||
        (this.selectedStatus === 'blocked' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.filterUsers();
  }

  getTotalUsers(): number {
    return this.filteredUsers.length;
  }

  getActiveUsers(): number {
    return this.filteredUsers.filter(u => u.isActive).length;
  }

  getBlockedUsers(): number {
    return this.filteredUsers.filter(u => !u.isActive).length;
  }

  getAdminCount(): number {
    return this.filteredUsers.filter(u => u.role === 'admin').length;
  }

  viewDetails(user: any): void {
    this.selectedUser = user;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedUser = null;
  }

  openRoleModal(user: any): void {
    this.selectedUser = user;
    this.roleForm.patchValue({ role: user.role });
    this.showRoleModal = true;
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    this.roleForm.reset();
  }

  updateRole(): void {
    if (this.roleForm.invalid || !this.selectedUser) return;

    this.isSaving = true;
    const newRole = this.roleForm.get('role')?.value;

    this.adminService.updateUserRole(this.selectedUser._id, newRole).subscribe(
      () => {
        this.showSuccess('User role updated successfully');
        this.closeRoleModal();
        this.loadUsers();
        this.isSaving = false;
      },
      (error) => {
        this.showError('Error updating user role');
        this.isSaving = false;
      }
    );
  }

  toggleUserStatus(user: any): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'Restore Access' : 'Restrict Access';

    // Using a simple confirm for now, but the design handles the state
    if (!confirm(`Confirm: ${action} for ${user.name}?`)) return;

    this.adminService.updateUserStatus(user._id, newStatus).subscribe(
      () => {
        user.isActive = newStatus;
        this.showSuccess(`Member ${newStatus ? 'Access Restored' : 'Access Restricted'} Successfully`);
        if (this.selectedUser && this.selectedUser._id === user._id) {
          this.selectedUser.isActive = newStatus;
        }
      },
      (error) => {
        this.showError(`Execution Failed: Unable to ${newStatus ? 'restore' : 'restrict'} access.`);
      }
    );
  }

  deleteUser(user: any): void {
    if (!confirm(`⚠ WARNING: This will permanently remove the account for ${user.name}. Related data like bookings may be affected. Are you sure you wish to proceed?`)) {
      return;
    }

    this.adminService.deleteUser(user._id).subscribe(
      () => {
        this.showSuccess(`Account for ${user.name} Has Been Permanently Removed`);
        this.loadUsers();
      },
      (error) => {
        this.showError('Operation Failed: Unable to remove user account from the registry.');
      }
    );
  }

  formatDate(date: string): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
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

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RoomsManagementComponent } from './rooms-management/rooms-management.component';
import { UsersManagementComponent } from './users-management/users-management.component';
import { BookingsManagementComponent } from './bookings-management/bookings-management.component';
import { StaffManagementComponent } from './staff-management/staff-management.component';
import { PaymentManagementComponent } from './payment-management/payment-management.component';

import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { HotelSettingsComponent } from './hotel-settings/hotel-settings.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      { path: '', component: DashboardComponent, data: { title: 'Admin Dashboard' } },
      { path: 'dashboard', component: DashboardComponent, data: { title: 'Admin Dashboard' } },
      { path: 'rooms', component: RoomsManagementComponent, data: { title: 'Rooms Management' } },
      { path: 'users', component: UsersManagementComponent, data: { title: 'Users Management' } },
      { path: 'bookings', component: BookingsManagementComponent, data: { title: 'Bookings Management' } },
      { path: 'staff', component: StaffManagementComponent, data: { title: 'Staff Management' } },
      { path: 'payments', component: PaymentManagementComponent, data: { title: 'Payment Management' } },

      { path: 'profile', component: AdminProfileComponent, data: { title: 'Admin Profile' } },
      { path: 'settings', component: HotelSettingsComponent, data: { title: 'Hotel Settings' } },
      { path: '**', component: DashboardComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }

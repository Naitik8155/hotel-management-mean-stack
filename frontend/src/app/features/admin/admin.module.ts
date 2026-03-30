import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { RoomsManagementComponent } from './rooms-management/rooms-management.component';
import { UsersManagementComponent } from './users-management/users-management.component';
import { BookingsManagementComponent } from './bookings-management/bookings-management.component';
import { StaffManagementComponent } from './staff-management/staff-management.component';
import { PaymentManagementComponent } from './payment-management/payment-management.component';

import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { HotelSettingsComponent } from './hotel-settings/hotel-settings.component';
import { ChartDirective } from '@shared/directives/chart.directive';

@NgModule({
  declarations: [
    AdminComponent,
    DashboardComponent,
    RoomsManagementComponent,
    UsersManagementComponent,
    BookingsManagementComponent,
    StaffManagementComponent,
    PaymentManagementComponent,

    AdminProfileComponent,
    HotelSettingsComponent,
    ChartDirective
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AdminModule { }

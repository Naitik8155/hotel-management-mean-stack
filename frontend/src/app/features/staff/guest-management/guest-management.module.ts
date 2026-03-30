import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GuestManagementRoutingModule } from './guest-management-routing.module';
import { GuestManagementComponent } from './guest-management.component';

@NgModule({
  declarations: [
    GuestManagementComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    GuestManagementRoutingModule
  ]
})
export class GuestManagementModule { }

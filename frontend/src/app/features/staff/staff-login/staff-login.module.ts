import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StaffLoginRoutingModule } from './staff-login-routing.module';
import { StaffLoginComponent } from './staff-login.component';

@NgModule({
  declarations: [
    StaffLoginComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StaffLoginRoutingModule
  ]
})
export class StaffLoginModule { }

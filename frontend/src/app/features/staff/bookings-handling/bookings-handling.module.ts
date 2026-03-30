import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BookingsHandlingRoutingModule } from './bookings-handling-routing.module';
import { BookingsHandlingComponent } from './bookings-handling.component';

@NgModule({
  declarations: [
    BookingsHandlingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BookingsHandlingRoutingModule
  ]
})
export class BookingsHandlingModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BookingsRoutingModule } from './bookings-routing.module';
import { BookingListComponent } from './booking-list/booking-list.component';
import { BookingDetailComponent } from './booking-detail/booking-detail.component';
import { BookingSuccessComponent } from './booking-success/booking-success.component';
import { BookingCreateComponent } from './booking-create/booking-create.component';
import { BookingPaymentComponent } from './booking-payment/booking-payment.component';

@NgModule({
  declarations: [
    BookingListComponent,
    BookingDetailComponent,
    BookingSuccessComponent,
    BookingCreateComponent,
    BookingPaymentComponent
  ],
  imports: [
    CommonModule,
    BookingsRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class BookingsModule { }

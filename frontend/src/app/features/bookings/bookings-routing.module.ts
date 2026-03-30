import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@core/guards/auth.guard';
import { BookingListComponent } from './booking-list/booking-list.component';
import { BookingDetailComponent } from './booking-detail/booking-detail.component';
import { BookingSuccessComponent } from './booking-success/booking-success.component';
import { BookingCreateComponent } from './booking-create/booking-create.component';
import { BookingPaymentComponent } from './booking-payment/booking-payment.component';

const routes: Routes = [
  { 
    path: '', 
    component: BookingListComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user'] }
  },
  { 
    path: 'create/:roomId', 
    component: BookingCreateComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user'] }
  },
  { 
    path: 'payment/:bookingId', 
    component: BookingPaymentComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user'] }
  },
  { 
    path: 'success', 
    component: BookingSuccessComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user'] }
  },
  { 
    path: ':id', 
    component: BookingDetailComponent,
    canActivate: [AuthGuard],
    data: { roles: ['user'] }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingsRoutingModule { }

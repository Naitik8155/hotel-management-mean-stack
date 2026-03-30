import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookingsHandlingComponent } from './bookings-handling.component';

const routes: Routes = [
  {
    path: '',
    component: BookingsHandlingComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingsHandlingRoutingModule { }

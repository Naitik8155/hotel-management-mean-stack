import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffComponent } from './staff.component';
import { StaffGuard } from '../../core/guards/staff.guard';

const routes: Routes = [
  {
    path: '',
    component: StaffComponent,
    canActivate: [StaffGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'bookings',
        loadChildren: () => import('./bookings-handling/bookings-handling.module').then(m => m.BookingsHandlingModule)
      },
      {
        path: 'guests',
        loadChildren: () => import('./guest-management/guest-management.module').then(m => m.GuestManagementModule)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { StaffGuard } from './core/guards/staff.guard';
import { AdminLoginComponent } from './features/auth/admin-login/admin-login.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then(m => m.HomeModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'admin/login',
    component: AdminLoginComponent
  },
  {
    path: 'staff/login',
    loadChildren: () => import('./features/staff/staff-login/staff-login.module').then(m => m.StaffLoginModule)
  },
  {
    path: 'rooms',
    loadChildren: () => import('./features/rooms/rooms.module').then(m => m.RoomsModule)
  },
  {
    path: 'contact',
    loadChildren: () => import('./features/contact/contact.module').then(m => m.ContactModule)
  },
  {
    path: 'bookings',
    loadChildren: () => import('./features/bookings/bookings.module').then(m => m.BookingsModule),
    canActivate: [AuthGuard],
    data: { roles: ['user'] }
  },
  {
    path: 'user',
    loadChildren: () => import('./features/user/user.module').then(m => m.UserModule),
    canActivate: [AuthGuard],
    data: { roles: ['user'] }
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'staff',
    loadChildren: () => import('./features/staff/staff.module').then(m => m.StaffModule),
    canActivate: [StaffGuard]
  },
  { path: '**', redirectTo: 'home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

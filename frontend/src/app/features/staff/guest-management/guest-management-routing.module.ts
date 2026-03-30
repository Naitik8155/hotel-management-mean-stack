import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuestManagementComponent } from './guest-management.component';

const routes: Routes = [
  {
    path: '',
    component: GuestManagementComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GuestManagementRoutingModule { }

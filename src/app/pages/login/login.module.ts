import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Login } from './login';

const loginRoutes: Routes = [{ path: '', component: Login }];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(loginRoutes), Login],
})
export class LoginModule {}

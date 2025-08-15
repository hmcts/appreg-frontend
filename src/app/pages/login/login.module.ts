import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login';

const loginRoutes: Routes = [{ path: '', component: Login }];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(loginRoutes), Login],
})
export class LoginModule {}

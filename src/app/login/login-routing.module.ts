import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginPage } from './login.page';
import { Tab1Page } from '../tab1/tab1.page';
import { RegistrarPage } from '../registrar/registrar.page';

const routes: Routes = [
  {
    path: '',
    component: LoginPage
  },
  {
    path: 'tabs/tab1',
    component: Tab1Page,
  },
  {
    path: 'registrar',
    component: RegistrarPage
  }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginPageRoutingModule {}

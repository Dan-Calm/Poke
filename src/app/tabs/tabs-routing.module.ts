import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { LoginPage } from '../login/login.page';
import { AuthGuard } from '../guards/auth.guard';
import { ColeccionDetalleComponent } from '../pages/coleccion-detalle/coleccion-detalle.component';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule),
        canActivate: [AuthGuard],
        data: { rol: 'usuario' } // Requiere rol de usuario
      },
      {
        path: 'tab2',
        loadChildren: () => import('../tab2/tab2.module').then(m => m.Tab2PageModule),
        canActivate: [AuthGuard],
        data: { rol: 'usuario' } // Requiere rol de usuario
      },
      {
        path: 'tab3/:id',
        loadChildren: () => import('../tab3/tab3.module').then(m => m.Tab3PageModule),
        canActivate: [AuthGuard],
        data: { rol: 'usuario' } // Requiere rol de usuario
      },
      {
        path: 'tab3',
        loadChildren: () => import('../tab1/tab1.module').then(m => m.Tab1PageModule),
        canActivate: [AuthGuard],
        data: { rol: 'usuario' } // Requiere rol de usuario
      },
      {
        path: 'tab4',
        loadChildren: () => import('../tab4/tab4.module').then(m => m.Tab4PageModule),
        canActivate: [AuthGuard],
        data: { rol: 'administrador' } // Requiere rol de usuario
      },
      {
        path: 'coleccion-detalle/:id', component: ColeccionDetalleComponent
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full'
      },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule { }

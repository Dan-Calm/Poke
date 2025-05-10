import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ColeccionDetalleComponent } from './pages/coleccion-detalle/coleccion-detalle.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard],
  },
  {
    path: 'registrar',
    loadChildren: () => import('./registrar/registrar.module').then(m => m.RegistrarPageModule)
  },
  { path: 'coleccion-detalle/:id', component: ColeccionDetalleComponent }, {
    path: 'registrar',
    loadChildren: () => import('./registrar/registrar.module').then(m => m.RegistrarPageModule)
  },  {
    path: 'tab4',
    loadChildren: () => import('./tab4/tab4.module').then( m => m.Tab4PageModule)
  },

  // Ruta para la segunda pantalla

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

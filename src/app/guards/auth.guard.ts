import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const userId = await this.authService.getCurrentUser();
    if (userId) {
      console.log('Usuario autenticado:', userId);
      const rol = await this.authService.getRol();
      console.log('Rol del usuario:', rol);

      // Permitir acceso a todas las rutas si el usuario es administrador
      if (rol === 'admin') {
        return true;
      }

      const rolRequerido = route.data['rol'];
      console.log('Rol requerido:', rolRequerido);

      if (rol === 'admin') {
        return true;
      }

      // Permitir si el rol requerido es un array y el rol del usuario está incluido
      if (Array.isArray(rolRequerido) && rolRequerido.includes(rol)) {
        return true;
      }

      // Permitir si el rol requerido es string y coincide
      if (rol === rolRequerido) {
        return true;
      }

      console.log('Acceso denegado. Rol insuficiente.');
      const toast = document.createElement('ion-toast');
      toast.message = 'Eres pobre.';
      toast.duration = 2000;
      toast.color = 'danger';
      document.body.appendChild(toast);
      await toast.present();
      // this.router.navigate(['/tab1']);
      return false;

    } else {
      console.log('Usuario no autenticado.');
      this.router.navigate(['/login']); // Redirigir al login si no está autenticado
      return false;
    }
  }
}
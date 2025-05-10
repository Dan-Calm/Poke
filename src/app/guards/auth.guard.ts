import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const userId = await this.authService.getCurrentUser();
    if (userId) {
      console.log('Usuario autenticado:', userId);
      const rol = await this.authService.getRol();
      console.log('Rol del usuario:', rol);

      // Permitir acceso a todas las rutas si el usuario es administrador
      if (rol === 'administrador') {
        return true;
      }

      // Verificar el rol requerido para la ruta
      const rolRequerido = route.data['rol'];
      if (rol === rolRequerido) {
        return true; // Permitir acceso si el rol coincide
      } else {
        console.log('Acceso denegado. Rol insuficiente.');
        this.router.navigate(['/tab1']); // Redirigir si el rol no coincide
        return false;
      }
    } else {
      console.log('Usuario no autenticado.');
      this.router.navigate(['/tab1']); // Redirigir al login si no está autenticado
      return false;
    }
  }
}
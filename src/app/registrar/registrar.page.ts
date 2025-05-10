import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-registrar',
  templateUrl: './registrar.page.html',
  styleUrls: ['./registrar.page.scss'],
  standalone: false,
})
export class RegistrarPage {
  email: string = '';
  password: string = '';
  nombre: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async register() {
    try {
      const datos = { nombre: this.nombre }; // Información adicional del usuario
      console.log('Datos del usuario:', datos);
      console.log('Email:', this.email);
      console.log('Contraseña:', this.password);
      const user = await this.authService.register(this.email, this.password, datos);
      console.log('Usuario registrado:', user);

      // Redirigir al usuario a la página principal después del registro
      this.router.navigate(['/tabs/tab1']);
    } catch (error) {
      console.error('Error en el registro:', error);
      this.errorMessage = 'Error al registrar. Inténtalo de nuevo.';
    }
  }
}
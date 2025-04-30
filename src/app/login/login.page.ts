import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  async login() {
    try {
      const user = await this.authService.login(this.email, this.password);
      console.log('Usuario autenticado:', user);
      this.router.navigate(['/tabs/tab1']); // Redirigir a la página de inicio después del login
    } catch (error) {
      console.error('Error en el login:', error);
      this.errorMessage = 'Credenciales inválidas. Inténtalo de nuevo.';
    }
  }

  ngOnInit() {
  }

}

import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from 'src/app/config/firebase.config';
import { IonicModule } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-modal-configuracion',
  templateUrl: './modal-configuracion.component.html',
  styleUrls: ['./modal-configuracion.component.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class ModalConfiguracionComponent implements OnInit {

  @Input() nombreUsuario: string = '';
  @Input() correoUsuario: string = '';
  cambios: any = {};

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private afAuth: AngularFireAuth
  ) { }

  ngOnInit() {
    console.log('ngOnInit', this.nombreUsuario, this.correoUsuario);
  }

  cerrarModal() {
    this.modalCtrl.dismiss(this.cambios); // Devuelve todos los cambios hechos
  }

  async editarNombre() {
    const alert = await this.alertCtrl.create({
      header: 'Editar nombre',
      inputs: [{ name: 'nombre', type: 'text', placeholder: 'Nuevo nombre', value: this.cambios.nombre_usuario || this.nombreUsuario }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            const user = await this.afAuth.currentUser;
            if (user) {
              try {
                const userRef = doc(db, 'usuarios', user.uid);
                await updateDoc(userRef, { nombre_usuario: data.nombre });
                this.cambios.nombre_usuario = data.nombre; // Guarda el cambio localmente
                this.mostrarExito('Nombre actualizado correctamente.');
              } catch (error) {
                this.mostrarError('No se pudo actualizar el nombre.');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async editarCorreo() {
    const alert = await this.alertCtrl.create({
      header: 'Editar correo electrónico',
      inputs: [{ name: 'email', type: 'email', placeholder: 'Nuevo correo', value: this.cambios.email || this.correoUsuario }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            const user = await this.afAuth.currentUser;
            if (user) {
              try {
                await user.updateEmail(data.email);
                this.cambios.email = data.email; // Guarda el cambio localmente
                this.mostrarExito('Correo actualizado correctamente.');
              } catch (error) {
                this.mostrarError('No se pudo actualizar el correo.');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async cambiarContrasena() {
    const user = await this.afAuth.currentUser;
    if (user && user.email) {
      try {
        await this.afAuth.sendPasswordResetEmail(user.email);
        const alert = await this.alertCtrl.create({
          header: 'Correo enviado',
          message: 'Se ha enviado un correo para restablecer la contraseña.',
          buttons: ['OK']
        });
        await alert.present();
      } catch (error) {
        this.mostrarError('No se pudo enviar el correo de restablecimiento.');
      }
    }
  }

  private async mostrarError(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Error',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarExito(mensaje: string) {
    const alert = await this.alertCtrl.create({
      header: 'Éxito',
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}

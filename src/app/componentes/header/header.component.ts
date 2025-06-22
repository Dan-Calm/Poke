import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonicModule, CommonModule], // <-- Agrega CommonModule aquí
  template: `
    <ion-toolbar class="app-header-toolbar" style="padding-top: 32px;">
      <ion-buttons slot="start">
        <ion-menu-button *ngIf="showMenuButton"></ion-menu-button>
      </ion-buttons>
      <ion-title style="width: 100%; display: block; text-align: center;">{{ title }}</ion-title>
      <ng-content></ng-content>
    </ion-toolbar>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title: string = '';
  @Input() showMenuButton: boolean = false;
}
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-toolbar class="app-header-toolbar">
      <ion-buttons slot="start">
        <ion-menu-button></ion-menu-button>
      </ion-buttons>
      <ion-title>{{ title }}</ion-title>
      <ng-content></ng-content>
    </ion-toolbar>
  `,
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() title: string = '';
}
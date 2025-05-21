import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-barra-progreso',
  template: `
    <div style="margin: 1rem auto; width: 90%; max-width: 400px;">
      <div style="background: #eee; border-radius: 10px; height: 24px; position: relative; overflow: hidden;">
        <div
          [style.width.%]="total ? (valor / total) * 100 : 0"
          [style.background]="color"
          style="height: 100%; border-radius: 10px 0 0 10px; transition: width 0.5s;">
        </div>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #222;">
          {{ valor }} / {{ total }}
        </div>
      </div>
    </div>
  `
})
export class BarraProgresoComponent {
  @Input() valor: number = 0;
  @Input() total: number = 0;
  @Input() color: string = 'linear-gradient(90deg, #e53935, #e35d5b)';
}
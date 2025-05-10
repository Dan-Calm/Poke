import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ModalFavoritosComponent } from './modal-favoritos.component';

describe('ModalFavoritosComponent', () => {
  let component: ModalFavoritosComponent;
  let fixture: ComponentFixture<ModalFavoritosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ModalFavoritosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalFavoritosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

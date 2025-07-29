/* tslint:disable:no-unused-variable */
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhaserGameFrameComponent } from './PhaserGameFrame.component';

describe('PhaserGameFrameComponent', () => {
  let component: PhaserGameFrameComponent;
  let fixture: ComponentFixture<PhaserGameFrameComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [ PhaserGameFrameComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PhaserGameFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

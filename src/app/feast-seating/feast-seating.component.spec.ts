import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeastSeatingComponent } from './feast-seating.component';

describe('FeastSeatingComponent', () => {
  let component: FeastSeatingComponent;
  let fixture: ComponentFixture<FeastSeatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeastSeatingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeastSeatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

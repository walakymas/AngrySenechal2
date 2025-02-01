import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeastComponent } from './feast.component';

describe('FeastComponent', () => {
  let component: FeastComponent;
  let fixture: ComponentFixture<FeastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeastComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FeastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

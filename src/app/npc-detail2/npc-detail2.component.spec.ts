import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NpcDetail2Component } from './npc-detail2.component';

describe('NpcDetail2Component', () => {
  let component: NpcDetail2Component;
  let fixture: ComponentFixture<NpcDetail2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NpcDetail2Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NpcDetail2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

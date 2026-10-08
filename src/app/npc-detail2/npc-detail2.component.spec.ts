import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NpcDetail2Component } from './npc-detail2.component';
import { AppModule } from '../app.module';

describe('NpcDetail2Component', () => {
  let component: NpcDetail2Component;
  let fixture: ComponentFixture<NpcDetail2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule, NoopAnimationsModule],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(NpcDetail2Component);
    component = fixture.componentInstance;
    // no detectChanges(): the template needs the `char` input of the parent
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

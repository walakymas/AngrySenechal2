import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FeastRoundComponent } from './feast-round.component';
import { AppModule } from '../app.module';
import { Feast, FeastConfig, LordBase } from '../lord';

describe('FeastRoundComponent', () => {
  let fixture: ComponentFixture<FeastRoundComponent>;

  const feast = {
    id: 1, title: 'Test', description: '', pos: 0,
    data: {
      state: 'feast', round: 1, rounds: 3, royal: false, log: [],
      participiants: {
        '5': { position: 'near', glory: 2000, geniality: 1, fumbled: false, left: false, kept: [], award: 0, significant: [],
               enabled: [3], rounds: { '1': { action: 'card', cards: [3, 4] } } },
        '6': { position: 'above', glory: 5000, geniality: 2, fumbled: false, left: false, kept: [], award: 0, significant: [],
               enabled: [], rounds: {} },
      },
    },
  } as unknown as Feast;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModule, NoopAnimationsModule],
      providers: [provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(FeastRoundComponent);
    const c = fixture.componentInstance;
    c.feast = feast;
    c.config = { '3': { name: 'Three' }, '4': { name: 'Four' } } as unknown as FeastConfig;
    c.list = [{ id: 5, name: 'Ulf' }, { id: 6, name: 'Ban' }] as LordBase[];
    c.mine = [5, 6];
    fixture.detectChanges();
  });

  it('shows the hand and only the enabled card can be played', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('div.card').length).toBe(2);
    expect(el.querySelectorAll('div.card button').length).toBe(1);
  });

  it('refuses feast cards above the salt in the activity buttons', () => {
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.activities button')) as HTMLButtonElement[];
    const card = buttons.find(b => b.textContent!.trim() === 'card')!;
    expect(card.disabled).toBeTrue();
    expect(buttons.find(b => b.textContent!.trim() === 'gossip')!.disabled).toBeFalse();
  });
});

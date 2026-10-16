import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AppModule } from '../app.module';
import { CharacterMarksDialog } from './character-detail.component';
import { MarksResponse } from '../marks';

describe('CharacterMarksDialog', () => {
  const marks: MarksResponse = {
    year: 481,
    years: [
      { year: 481, marks: [{ id: 1, spec: 'Sword', status: 'Increase' }, { id: 2, spec: 'Honest', status: 'Failed' }] },
      { year: 480, marks: [{ id: 3, spec: 'Hunting', status: 'Updated' }] },
    ],
  };

  function create(service: any) {
    const parent = { id: 5, char: { char: { name: 'Bors' } }, getService: () => service };
    TestBed.configureTestingModule({
      imports: [AppModule, NoopAnimationsModule],
      providers: [provideHttpClientTesting(), { provide: MAT_DIALOG_DATA, useValue: { parent } }],
    });
    const fixture = TestBed.createComponent(CharacterMarksDialog);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a panel for every year and opens the current one', () => {
    const fixture = create({ getMarks: () => of(marks) });
    fixture.detectChanges();
    const headers = Array.from(fixture.nativeElement.querySelectorAll('mat-expansion-panel-header'))
      .map((h: any) => h.textContent);
    expect(headers.length).toBe(2);
    expect(headers[0]).toContain('481');
    expect(headers[0]).toContain('Increase: 1');
    expect(fixture.componentInstance.opened).toBe(481);
  });

  it('updates a year and shows the new statuses', async () => {
    const after: MarksResponse = {
      year: 481,
      years: [{ year: 481, marks: [{ id: 1, spec: 'Sword', status: 'Updated' }] }],
      changes: [{ name: 'Sword', old: 15, new: 16 }],
    };
    const updateMarks = jasmine.createSpy('updateMarks').and.resolveTo(after);
    const fixture = create({ getMarks: () => of(marks), updateMarks });
    fixture.componentInstance.update(marks.years[0]);
    await fixture.whenStable();
    expect(updateMarks).toHaveBeenCalledWith(5, 481);
    expect(fixture.componentInstance.years).toEqual(after.years);
    expect(fixture.componentInstance.changed).toBeTrue();
  });
});

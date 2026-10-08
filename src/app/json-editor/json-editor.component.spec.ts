import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonEditorComponent } from './json-editor.component';

describe('JsonEditorComponent', () => {
  let fixture: ComponentFixture<JsonEditorComponent>;
  let component: JsonEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [JsonEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(JsonEditorComponent);
    component = fixture.componentInstance;
  });

  it('shows the data given as a form value', () => {
    component.writeValue({ name: 'Sir Test' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.jsoneditor')).toBeTruthy();
    expect((component as any).editor.getText()).toContain('Sir Test');  // (the ace editor draws its lines lazily)
  });

  it('shows the [data] input', () => {
    component.data = { name: 'From input' };
    fixture.detectChanges();
    expect((component as any).editor.getText()).toContain('From input');
  });

  it('reports a valid change and keeps the last good value for broken text', () => {
    const values: any[] = [];
    component.registerOnChange(v => values.push(v));
    component.writeValue({ a: 1 });
    fixture.detectChanges();
    const editor = (component as any).editor;
    editor.set({ a: 2 });
    (component as any).changed();
    expect(values[values.length - 1]).toEqual({ a: 2 });
    spyOn(editor, 'get').and.throwError('invalid JSON');
    (component as any).changed();
    expect(values[values.length - 1]).toEqual({ a: 2 });
  });
});

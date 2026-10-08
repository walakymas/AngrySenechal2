import { AfterViewInit, Component, ElementRef, forwardRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import JSONEditor, { JSONEditorOptions } from 'jsoneditor';

/**
 * A thin Angular wrapper around jsoneditor: a form control (`formControlName` / `ngModel`) plus a `[data]` input.
 * It replaces the `ang-jsoneditor` package, which is a View Engine library and cannot be built with Angular 16+.
 */
@Component({
    selector: 'json-editor',
    template: '<div #host></div>',
    styles: [':host { display: block; }'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => JsonEditorComponent), multi: true }],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class JsonEditorComponent implements ControlValueAccessor, AfterViewInit, OnChanges, OnDestroy {
  @Input() options: JSONEditorOptions = { mode: 'code', modes: ['code', 'tree'] };
  @Input() data: any;
  @ViewChild('host', { static: true }) host: ElementRef<HTMLElement>;

  private editor: JSONEditor;
  private pending: any;
  private propagateChange: (value: any) => void = () => {};
  private propagateTouched: () => void = () => {};

  ngAfterViewInit(): void {
    this.editor = new JSONEditor(this.host.nativeElement, { ...this.options, onChange: () => this.changed() });
    this.editor.set(this.pending !== undefined ? this.pending : this.data);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.data && this.editor) {
      this.editor.set(this.data);
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  private changed(): void {
    try {
      this.propagateChange(this.editor.get());
    } catch (e) {
      // the text is not valid JSON (yet): keep the last good value
    }
    this.propagateTouched();
  }

  writeValue(value: any): void {
    this.pending = value;
    if (this.editor && value !== undefined) {
      this.editor.set(value);
    }
  }

  registerOnChange(fn: (value: any) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.propagateTouched = fn;
  }
}

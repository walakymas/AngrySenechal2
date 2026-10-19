import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ArmsOptions, ArmsResult, DEFAULT_OPTIONS, generateArms, LogEntry } from './arms-generator';
import { renderArmsSvg } from './arms-svg';

interface LogStep {
  step: number;
  title: string;
  entries: string[];
}

interface LogGroup {
  scope: string;
  steps: LogStep[];
}

const STEP_TITLES = ['', 'Step 1: Shield Design', 'Step 2: Tinctures', 'Step 3: Charges'];

// A random coat of arms by Appendix B (Coat of Arms Generator) of the Pendragon core rulebook
@Component({
    selector: 'app-arms',
    templateUrl: './arms.component.html',
    styleUrls: ['./arms.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ArmsComponent implements OnInit {
  private readonly optionsKey = 'armsOptions';
  private readonly lastKey = 'armsLast';
  options: ArmsOptions = { ...DEFAULT_OPTIONS };
  result: ArmsResult | null = null;
  svg: SafeHtml | null = null;
  groups: LogGroup[] = [];
  copied = false;
  private rawSvg = '';

  constructor(private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    try {
      const options = JSON.parse(window.localStorage.getItem(this.optionsKey) || 'null');
      if (options) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
      }
      const last = JSON.parse(window.localStorage.getItem(this.lastKey) || 'null');
      if (last?.design && last?.blazon && Array.isArray(last.log)) {
        this.show(last);
      }
    } catch { }  // no storage, or a stale entry: start with an empty page
  }

  roll(): void {
    this.show(generateArms(undefined, this.options));
    try {
      window.localStorage.setItem(this.lastKey, JSON.stringify(this.result));
    } catch { }
  }

  saveOptions(): void {
    try {
      window.localStorage.setItem(this.optionsKey, JSON.stringify(this.options));
    } catch { }
  }

  private show(result: ArmsResult): void {
    this.result = result;
    this.rawSvg = renderArmsSvg(result.design);
    // the SVG is built from the fixed tables of the generator only, the sanitizer would drop its filters and clip paths
    this.svg = this.sanitizer.bypassSecurityTrustHtml(this.rawSvg);
    this.groups = this.groupLog(result.log);
    this.copied = false;
    this.cdr.markForCheck();
  }

  private groupLog(log: LogEntry[]): LogGroup[] {
    return [...new Set(log.map(l => l.scope))].map(scope => ({
      scope,
      steps: [1, 2, 3].map(step => ({
        step,
        title: STEP_TITLES[step],
        entries: log.filter(l => l.scope === scope && l.step === step).map(l => l.text)
      })).filter(s => s.entries.length)
    }));
  }

  async copyBlazon(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.result!.blazon);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
        this.cdr.markForCheck();
      }, 2000);
      this.cdr.markForCheck();
    } catch { }
  }

  downloadSvg(): void {
    const blob = new Blob([this.rawSvg.replace('<svg ', '<svg width="400" height="480" ')], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'coat-of-arms.svg';
    a.click();
    URL.revokeObjectURL(url);
  }
}

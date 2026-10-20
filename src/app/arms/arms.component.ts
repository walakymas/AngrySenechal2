import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ArmsOptions, ArmsResult, DEFAULT_OPTIONS, generateArms, LogEntry } from './arms-generator';
import { CharacterService } from '../character.service';
import {
  BuilderChoice, buildDesign, canHead, designToChoice, StoredArms, validDesign, canPose, CHARGE_OPTIONS, CHARGE_TINCTURE_OPTIONS, ChargeChoice, defaultChoice, DIVISION_OPTIONS,
  MAX_FIELD_CHARGES, newCharge, ORDINARY_OPTIONS, PATTERN_OPTIONS, patternCounts, POSE_OPTIONS, TINCTURE_OPTIONS
} from './arms-builder';
import { blazonOf } from './arms-blazon';
import { armsBattlePrompt, armsPhotoPrompt, armsPrompt, PromptCharacter } from './arms-prompt';
import { armsImagesLoaded, loadArmsImages, renderArmsSvg } from './arms-svg';

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
  private readonly modeKey = 'armsMode';
  private readonly choiceKey = 'armsChoice';
  // rolled by the dice of Appendix B, or chosen by hand
  mode: 'roll' | 'choose' = 'roll';
  choice: BuilderChoice = defaultChoice();
  readonly tinctures = TINCTURE_OPTIONS;
  readonly chargeTinctures = CHARGE_TINCTURE_OPTIONS;
  readonly divisions = DIVISION_OPTIONS;
  readonly patterns = PATTERN_OPTIONS;
  readonly ordinaries = ORDINARY_OPTIONS;
  readonly chargeOptions = CHARGE_OPTIONS;
  readonly poses = POSE_OPTIONS;
  readonly maxFieldCharges = MAX_FIELD_CHARGES;
  readonly canHead = canHead;
  readonly canPose = canPose;
  readonly patternCounts = patternCounts;
  options: ArmsOptions = { ...DEFAULT_OPTIONS };
  result: ArmsResult | null = null;
  svg: SafeHtml | null = null;
  groups: LogGroup[] = [];
  copied = false;
  promptCopied = false;
  photoCopied = false;
  battleCopied = false;
  // the character viewed last, when it has a picture
  fighter: PromptCharacter | null = null;
  // the character viewed last: the coat of arms can be saved into it (the `arms` field of its data) and loaded from it
  character: { id: number; name: string; arms: StoredArms | null } | null = null;
  saveState: '' | 'saved' | 'error' = '';
  loadNote = '';
  private rawSvg = '';

  constructor(private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef, private characters: CharacterService) { }

  ngOnInit(): void {
    if (!armsImagesLoaded()) {
      // the drawings come in a lazy chunk: draw the page again with them when they have arrived
      loadArmsImages().then(() => {
        if (armsImagesLoaded() && this.result) {
          this.show(this.result);
          this.cdr.markForCheck();
        }
      });
    }
    try {
      const options = JSON.parse(window.localStorage.getItem(this.optionsKey) || 'null');
      if (options) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
      }
      const choice = JSON.parse(window.localStorage.getItem(this.choiceKey) || 'null');
      if (choice?.charges) {
        this.choice = { ...defaultChoice(), ...choice };
      }
      this.mode = window.localStorage.getItem(this.modeKey) === 'choose' ? 'choose' : 'roll';
      const last = JSON.parse(window.localStorage.getItem(this.lastKey) || 'null');
      if (this.mode === 'choose') {
        this.applyChoice();
      } else if (last?.design && last?.blazon && Array.isArray(last.log)) {
        this.show(last);
      }
    } catch { }  // no storage, or a stale entry: start with an empty page
    this.loadFighter();
  }

  private loadFighter(): void {
    let id = 0;
    try {
      id = Number(window.localStorage.getItem('lastCharacter'));
    } catch { }
    if (!(id > 0)) {
      return;
    }
    this.characters.getLord(id).subscribe(l => {
      const c = l?.char;
      if (!c || !c['name']) {
        return;
      }
      this.character = { id, name: '' + c['name'], arms: this.storedArms(c['arms']) };
      if (c['url']) {
        this.fighter = { name: '' + c['name'], url: '' + c['url'] };
      }
      this.cdr.markForCheck();
    });
  }

  private storedArms(data: any): StoredArms | null {
    return data && typeof data.blazon === 'string' && validDesign(data.design) ? { blazon: data.blazon, design: data.design } : null;
  }

  isLoggedIn(): boolean {
    return this.characters.isLoggedIn();
  }

  async saveToCharacter(): Promise<void> {
    if (!this.character || !this.result) {
      return;
    }
    this.saveState = '';
    const stored: StoredArms = { blazon: this.result.blazon, design: this.result.design };
    const l = await this.characters.modifyProp(this.character.id, 'arms', JSON.stringify(stored));
    const saved = this.storedArms(l?.char?.['arms']);
    this.saveState = saved?.blazon === stored.blazon ? 'saved' : 'error';
    if (saved) {
      this.character.arms = saved;
    }
    this.cdr.markForCheck();
  }

  // The stored coat of arms into the editor, when it can be edited by hand; otherwise it is only shown
  loadFromCharacter(): void {
    const arms = this.character?.arms;
    if (!arms) {
      return;
    }
    const choice = designToChoice(arms.design);
    if (choice) {
      this.choice = choice;
      this.mode = 'choose';
      this.setMode();
      this.loadNote = '';
    } else {
      this.show({ design: arms.design, blazon: arms.blazon, log: [] });
      this.loadNote = 'This coat of arms was rolled (countercharged, semé, minor charges or halves), so it can be shown but not edited.';
    }
    this.saveState = '';
    this.cdr.markForCheck();
  }

  setMode(): void {
    try {
      window.localStorage.setItem(this.modeKey, this.mode);
    } catch { }
    if (this.mode === 'choose') {
      this.applyChoice();
    }
  }

  // The coat of arms of the form: the design is built from the choices, there are no rolls to log
  applyChoice(): void {
    const design = buildDesign(this.choice);
    this.show({ design, blazon: blazonOf(design), log: [] });
    try {
      window.localStorage.setItem(this.choiceKey, JSON.stringify(this.choice));
    } catch { }
  }

  // A new charge: the usual tincture of its kind, and no pose or head the new charge can't have
  chargeKeyChanged(c: ChargeChoice): void {
    const fresh = newCharge(c.key);
    c.tincture = fresh.tincture;
    c.head = c.head && canHead(c.key);
    c.pose = canPose(c.key) ? c.pose : '';
    this.applyChoice();
  }

  addCharge(): void {
    if (this.choice.charges.length < MAX_FIELD_CHARGES) {
      this.choice.charges.push(newCharge('Cross'));
      this.applyChoice();
    }
  }

  removeCharge(i: number): void {
    this.choice.charges.splice(i, 1);
    this.applyChoice();
  }

  toggleOrdinaryCharge(): void {
    this.choice.onOrdinary = this.choice.onOrdinary ? null : newCharge('Mullet');
    this.applyChoice();
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
    this.promptCopied = false;
    this.photoCopied = false;
    this.battleCopied = false;
    this.saveState = '';
    this.loadNote = '';
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

  copyPrompt(): Promise<void> {
    return this.copyText(armsPrompt(this.result!.blazon), 'promptCopied');
  }

  copyPhotoPrompt(): Promise<void> {
    return this.copyText(armsPhotoPrompt(this.result!.blazon), 'photoCopied');
  }

  copyBattlePrompt(): Promise<void> {
    return this.copyText(armsBattlePrompt(this.result!.blazon, this.fighter!), 'battleCopied');
  }

  private async copyText(text: string, flag: 'promptCopied' | 'photoCopied' | 'battleCopied'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this[flag] = true;
      setTimeout(() => {
        this[flag] = false;
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

  // The SVG drawn on a canvas (800 x 960, on a transparent background) and saved as a PNG
  downloadPng(): void {
    const width = 800;
    const height = 960;
    const svgUrl = URL.createObjectURL(new Blob([this.rawSvg.replace('<svg ', `<svg width="${width}" height="${height}" `)],
      { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob(png => {
        if (!png) {
          return;
        }
        const url = URL.createObjectURL(png);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'coat-of-arms.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    };
    img.onerror = () => URL.revokeObjectURL(svgUrl);
    img.src = svgUrl;
  }
}

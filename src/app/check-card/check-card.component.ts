import { Component, Input, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CheckAll } from '../character.service';

// svgIcon name (registered in AppComponent) of a check result
export function checkIconName(success: string): string {
  const names = { Critical: 'critical', Success: 'success', Fail: 'fail', Fumble: 'fumble' };
  return names[success] ? 'check:' + names[success] : '';
}

type CheckTone = 'gold' | 'green' | 'neutral' | 'red' | 'maroon' | 'gray' | 'black';

// The card of one roll: the popup of the character page and the storyteller's roll log use it
@Component({
    selector: 'check-card',
    template: `
  <div class="crd crd-{{tone}}">
    <span class="crd-corner tl">❖</span><span class="crd-corner tr">❖</span>
    <span class="crd-corner bl">❖</span><span class="crd-corner br">❖</span>
    <div class="crd-name">{{ check.name }}</div>
    <div class="crd-command">{{ command() }}</div>
    @if (showTime) {
      <div class="crd-time">{{ check.created | date:'yyyy-MM-dd HH:mm:ss' }}</div>
    }
    <div class="crd-divider">⚜</div>
    @if (check.result['action']=='dice') {
      <div class="crd-big">{{ check.result['c1']['sum'] }}</div>
      <div class="crd-line">{{ check.result['c1']['count'] || 1 }}D{{ check.result['c1']['size'] }}{{ modifierText() }}
        &nbsp;·&nbsp; ({{ check.result['c1']['dices'].join(', ') }})</div>
      <div class="crd-sub">expected {{ expected() }}</div>
    } @else {
      @for (k of ['c1','c2']; track k) {
        @if (check.result[k]) {
          <div class="crd-row">
            <mat-icon [svgIcon]="icon(k)"></mat-icon>
            <div>
              <div class="crd-big small">{{ check.result[k]['success'] }}</div>
              <div class="crd-line">{{ check.result[k]['name'] }} ({{ check.result[k]['base'] }}{{ checkModifierText(k) }}) &nbsp;·&nbsp; rolled {{ check.result[k]['ro'] }}</div>
            </div>
          </div>
        }
      }
    }
  </div>`,
    styles: [`
  .crd { position: relative; min-width: 300px; max-width: 420px; padding: 22px 34px 12px; text-align: center;
    background: linear-gradient(160deg, var(--crd-bg1), var(--crd-bg2)); color: var(--crd-fg);
    border: 3px double var(--crd-frame); border-radius: 6px;
    box-shadow: 0 0 0 2px var(--crd-bg2), 0 0 0 4px var(--crd-frame), 0 10px 28px rgba(0,0,0,.6), inset 0 0 40px rgba(0,0,0,.25);
    font-family: 'Overlock', serif; }
  .crd-corner { position: absolute; color: var(--crd-frame); font-size: 16px; line-height: 1; }
  .crd-corner.tl { top: 3px; left: 5px; } .crd-corner.tr { top: 3px; right: 5px; }
  .crd-corner.bl { bottom: 3px; left: 5px; } .crd-corner.br { bottom: 3px; right: 5px; }
  .crd-name { font-family: 'Cormorant Unicase', serif; font-size: 26px; font-weight: bold; letter-spacing: 1px; }
  .crd-command { font-size: 13px; opacity: .8; } .crd-time { font-size: 12px; opacity: .65; }
  .crd-divider { color: var(--crd-frame); margin: 6px 0 2px; font-size: 18px; }
  .crd-big { font-family: 'Cormorant Unicase', serif; font-size: 54px; font-weight: bold; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,.35); }
  .crd-big.small { font-size: 30px; text-transform: uppercase; letter-spacing: 2px; }
  .crd-line { font-size: 15px; } .crd-sub { font-size: 13px; opacity: .75; margin-top: 2px; }
  .crd-row { display: flex; align-items: center; justify-content: center; gap: 14px; margin: 8px 0; text-align: left; }
  .crd-row .mat-icon { font-size: 40px; width: 40px; height: 40px; }
  .crd-actions { margin-top: 10px; text-align: center; } .crd-actions button { color: #f2e8d0; }
  .crd-gold    { --crd-bg1:#f0cd6b; --crd-bg2:#b8892b; --crd-fg:#2a1d05; --crd-frame:#5c3f0a; }
  .crd-green   { --crd-bg1:#6a9a55; --crd-bg2:#3b6a2e; --crd-fg:#f4fbef; --crd-frame:#d8bf6a; }
  .crd-neutral { --crd-bg1:#555b69; --crd-bg2:#383c46; --crd-fg:#eef0f5; --crd-frame:#c9a24b; }
  .crd-red     { --crd-bg1:#a4442f; --crd-bg2:#6b2418; --crd-fg:#fff1ec; --crd-frame:#d8bf6a; }
  .crd-maroon  { --crd-bg1:#55141a; --crd-bg2:#2b0709; --crd-fg:#ffd9d6; --crd-frame:#c9a24b; }
  .crd-gray    { --crd-bg1:#b4b7bd; --crd-bg2:#8f9299; --crd-fg:#15161a; --crd-frame:#3a3c42; }
  .crd-black   { --crd-bg1:#1b1b1b; --crd-bg2:#050505; --crd-fg:#f2e8d0; --crd-frame:#c9a24b; }
  `],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CheckCardComponent {
  @Input() check: CheckAll;
  @Input() showTime = false;

  get tone(): CheckTone {
    return this.computeTone();
  }

  command(): string {
    return (this.check['command'] || '').replace(/<@!\d{5,}>/, '');
  }

  private success(c: string): string {
    return this.check.result?.[c]?.['success'];
  }

  private computeTone(): CheckTone {
    const action = this.check.result?.['action'];
    if (action == 'dice') {
      const z = this.diceDeviation();
      return z >= 1.5 ? 'gold' : z >= 0.5 ? 'green' : z > -0.5 ? 'neutral' : z > -1.5 ? 'red' : 'maroon';
    }
    const c1 = this.success('c1');
    if (action == 'trait') {
      if (c1 == 'Critical') return 'gold';
      if (c1 == 'Success') return 'green';
      const c2 = this.success('c2');
      return c2 == 'Success' || c2 == 'Critical' ? 'black' : 'gray';
    }
    return c1 == 'Critical' ? 'gold' : c1 == 'Success' ? 'green' : c1 == 'Fumble' ? 'maroon' : 'red';
  }

  // Deviation of the sum from the expectation in standard deviations
  private diceDeviation(): number {
    const c = this.check.result['c1'];
    const n = +c['count'] || 1, size = +c['size'];
    const sd = Math.sqrt(n * (size * size - 1) / 12);
    return sd > 0 ? (c['sum'] - this.expected()) / sd : 0;
  }

  expected(): number {
    const c = this.check.result['c1'];
    return (+c['count'] || 1) * (+c['size'] + 1) / 2 + (c['modifier'] || 0);
  }

  modifierText(): string {
    const m = this.check.result['c1']['modifier'];
    return m ? (m > 0 ? '+' : '') + m : '';
  }

  // The modifier of a skill / trait roll, e.g. ' +3' (the second roll of a trait check has none)
  checkModifierText(c: string): string {
    const m = c == 'c1' ? +this.check.result?.[c]?.['modifier'] : 0;
    return m ? ' ' + (m > 0 ? '+' : '') + m : '';
  }

  icon(c: string): string {
    return checkIconName(this.success(c));
  }
}

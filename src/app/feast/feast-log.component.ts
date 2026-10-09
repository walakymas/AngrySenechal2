import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Feast, LordBase } from '../lord';
import { guestName } from './feast-util';

@Component({
    selector: 'feast-log',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
    @if (feast.data.log && feast.data.log.length > 0) {
      <h3>Log</h3>
      <ul class="log">
        @for (e of feast.data.log; track $index) {
          <li>Round {{e.round}}: {{name(e.cid)}} {{e.text}}</li>
        }
      </ul>
    }
    `
})
export class FeastLogComponent {
  @Input() feast: Feast;
  @Input() list: LordBase[] = [];

  name(cid: string): string { return guestName(this.list, cid); }
}

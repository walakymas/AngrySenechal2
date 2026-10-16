import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Feast, FeastGuest, LordBase } from '../lord';
import { SEATS, currentRound, guestName } from './feast-util';

@Component({
    selector: 'feast-scoreboard',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
    <h3>Guests</h3>
    <table class="gueststable">
      <tr>
        <th>Name</th><th>Seat</th><th>Glory</th><th>Geniality</th><th>Round</th>
        @if (feast.data.state === 'end') { <th>Gained</th> }
      </tr>
      @for (g of guests; track g.cid) {
        <tr [class.left]="g.guest.left">
          <th>{{name(g.cid)}}</th>
          <td>{{g.guest.position}}</td>
          <td>{{g.guest.glory}}</td>
          <td>{{g.guest.geniality}}</td>
          <td>{{status(g.guest)}}</td>
          @if (feast.data.state === 'end') { <td>{{g.guest.finalGlory}}</td> }
        </tr>
      }
    </table>
    <table class="seats">
      @for (s of seats; track s) {
        <tr><th>{{s}}</th><td class="seating"><feast-seating [filter]="s" [participiants]="feast.data.participiants"></feast-seating></td></tr>
      }
    </table>
    `
})
export class FeastScoreboardComponent {
  @Input() feast: Feast;
  @Input() list: LordBase[] = [];
  seats = SEATS;

  // The order of drawing: the highest (modified) APP roll first
  get guests(): { cid: number, guest: FeastGuest }[] {
    const p = this.feast.data.participiants;
    return Object.keys(p).map(cid => ({ cid: +cid, guest: p[cid] }))
      .sort((a, b) => (b.guest.app || 0) - (a.guest.app || 0));
  }

  name(cid: number): string { return guestName(this.list, cid); }

  status(g: FeastGuest): string {
    if (g.left) {
      return 'away';
    }
    if (this.feast.data.state !== 'feast') {
      return '';
    }
    const r = currentRound(g, this.feast.data.round);
    return r.action ? r.action + (r.selected ? ' #' + r.selected : '') : 'choosing…';
  }
}

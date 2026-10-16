import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { Feast, FeastReply, LordBase } from '../lord';
import { SEATS } from './feast-util';

// The size of the feast: the minimum number of rounds of Table 1.2 of the Book of Feasts
const SIZES = [
  { label: 'Small (2 rounds)', rounds: 2, royal: false },
  { label: 'Medium (3 rounds)', rounds: 3, royal: false },
  { label: 'Large (4 rounds)', rounds: 4, royal: false },
  { label: 'Royal (5 rounds)', rounds: 5, royal: true },
];

@Component({
    selector: 'feast-setup',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
    @if (isHost && (!feast || feast.data.state === 'end')) {
      <fieldset>
        <legend>New feast</legend>
        <input [(ngModel)]="title" placeholder="Title" maxlength="100"/>
        <select [(ngModel)]="size">
          @for (s of sizes; track s.label; let i = $index) {
            <option [ngValue]="i">{{s.label}}</option>
          }
        </select>
        <button (click)="create()">Create</button>
      </fieldset>
    }
    @if (feast && feast.data.state === 'init') {
      <fieldset>
        <legend>Seating</legend>
        @for (cid of toRoll; track cid) {
          <div class="line">
            <b>{{name(cid)}}</b>
            Jewelry (£) <input type="number" min="0" max="100" [(ngModel)]="jewelry" class="small"/>
            Fashion <input type="number" min="0" max="100" [(ngModel)]="fashion" class="small"/>
            <button (click)="rollApp(cid)">Roll APP</button>
          </div>
        }
        @if (toRoll.length === 0) {
          <p class="hint">Everybody of yours is seated.</p>
        }
        @if (isHost) {
          <div class="line">
            <select [(ngModel)]="guest">
              <option [ngValue]="null">Seat a guest by hand…</option>
              @for (l of unseated; track l.id) {
                <option [ngValue]="l.id">{{l.name}}</option>
              }
            </select>
            <select [(ngModel)]="seat">
              @for (s of seats; track s) {
                <option [ngValue]="s">{{s}}</option>
              }
            </select>
            <button (click)="seatGuest()" [disabled]="guest === null">Seat</button>
          </div>
        }
      </fieldset>
    }
    @if (isHost && feast && feast.data.state !== 'end') {
      <button (click)="next()" class="next">{{nextLabel}}</button>
    }
    `
})
export class FeastSetupComponent {
  @Input() feast: Feast | null = null;
  @Input() list: LordBase[] = [];
  @Input() isHost = false;
  @Input() mine: number[] = [];
  @Output() updated = new EventEmitter<FeastReply | null>();

  sizes = SIZES;
  seats = SEATS;
  title = '';
  size = 1;
  jewelry = 0;
  fashion = 0;
  guest: number | null = null;
  seat = 'below';

  constructor(private service: CharacterService) { }

  name(cid: number): string {
    const lord = this.list.find(l => l.id === cid);
    return lord ? lord.name : '#' + cid;
  }

  // Player characters that have not rolled their APP yet (the host may repeat a roll by seating by hand)
  get toRoll(): number[] {
    const guests = this.feast ? this.feast.data.participiants : {};
    return this.mine.filter(cid => !(guests['' + cid] && guests['' + cid].app !== undefined));
  }

  get unseated(): LordBase[] {
    const guests = this.feast ? this.feast.data.participiants : {};
    return this.list.filter(l => l.type === 'pc' && !guests['' + l.id]);
  }

  get nextLabel(): string {
    if (!this.feast || this.feast.data.state === 'init') {
      return 'Start the feast';
    }
    return this.feast.data.round < this.feast.data.rounds ? `Close round ${this.feast.data.round}` : 'Close the last round, end the feast';
  }

  create(): void {
    const size = SIZES[this.size];
    this.service.feastNew(this.title, size.rounds, size.royal).subscribe(r => this.updated.emit(r));
  }

  rollApp(cid: number): void {
    this.service.feastAppRoll(cid, this.jewelry || 0, this.fashion || 0).subscribe(r => this.updated.emit(r));
  }

  seatGuest(): void {
    if (this.guest !== null) {
      this.service.feastSeat(this.guest, this.seat).subscribe(r => { this.guest = null; this.updated.emit(r); });
    }
  }

  next(): void {
    this.service.feastNext().subscribe(r => this.updated.emit(r));
  }
}

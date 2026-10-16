import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { Feast, FeastConfig, FeastGuest, FeastReply, FeastRoundData, LordBase } from '../lord';
import { ACTIVITIES, canDraw, cardImage, currentRound, guestName, resultIcon } from './feast-util';

const ROLLED = ['gossip', 'indulge', 'flirt', 'game'];

@Component({
    selector: 'feast-round',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false,
    template: `
    @for (g of guests; track g.cid) {
      <div class="guest-panel">
        <h3>{{name(g.cid)}}
          <small>{{g.guest.position}} · Glory {{g.guest.glory}} · Geniality {{g.guest.geniality}}</small>
        </h3>

        @if (g.guest.left) {
          <p>Has left the feast. <button (click)="back(g.cid)">Return</button></p>
        } @else {
          @let r = round(g.guest);

          @if (!r.action) {
            <div class="activities">
              @for (a of activities; track a) {
                <button (click)="activity(g.cid, a)" [disabled]="a === 'card' && !draws(g.guest)"
                        [title]="a === 'card' && !draws(g.guest) ? 'Feast cards need 1,000 Glory and a seat below the salt' : ''">{{a}}</button>
              }
            </div>
          } @else {
            <p>Activity: <b>{{r.action}}</b>@if (r.forced) { (forced) }</p>
            @if (r.requires && r.requires.length > 0) {
              <p>To do this, a roll must succeed first:
                @for (t of r.requires; track t) {
                  <button (click)="requirement(g.cid, t)">Roll {{t}}</button>
                }
              </p>
            } @else if (isRolled(r.action) && !r.result) {
              @if (r.action === 'indulge') {
                <button (click)="roll(g.cid, 'temperate')">Roll Temperate</button>
                <button (click)="roll(g.cid, 'indulgent')">Roll Indulgent</button>
              } @else {
                <button (click)="roll(g.cid)">Roll</button>
              }
            }
            @if (r.result) {
              <p><mat-icon [svgIcon]="icon(r.result)"></mat-icon> {{r.result}}</p>
            }
          }

          @if (r.cards) {
            <div class="cards">
              @for (c of r.cards; track c) {
                <div class="card" [class.inactive]="!isEnabled(g.guest, r, c)" [class.selected]="r.selected === c">
                  <img [src]="image(c)" [alt]="cardName(c)" [title]="cardName(c)"/>
                  @if (isEnabled(g.guest, r, c)) {
                    <button (click)="select(g.cid, c)">Play</button>
                  }
                </div>
              }
            </div>
            @if (r.cards.length === 0) {
              <p class="hint">No cards this round.</p>
            }
            @if (r.selected) {
              <p class="cardtext">{{cardText(r.selected)}}</p>
            }
          }

          @if (g.guest.kept.length > 0) {
            <div>Kept:
              @for (c of g.guest.kept; track c) {
                <span class="kept"><img [src]="image(c)" [title]="cardName(c)" width="60"/>
                  <button (click)="discard(g.cid, c)">Discard</button></span>
              }
            </div>
          }

          <div class="leave">
            <button (click)="leave(g.cid, true)" [disabled]="feast.data.round < 2"
                    title="Courtesy roll; the first round has to be attended">Leave (Courtesy)</button>
            @if (isHost) {
              <button (click)="leave(g.cid, false)">Forced departure</button>
            }
          </div>
        }
      </div>
    }
    @if (guests.length === 0) {
      <p class="hint">None of your characters is at the feast.</p>
    }
    `
})
export class FeastRoundComponent {
  @Input() feast: Feast;
  @Input() config: FeastConfig;
  @Input() list: LordBase[] = [];
  @Input() isHost = false;
  @Input() mine: number[] = [];
  @Output() updated = new EventEmitter<FeastReply | null>();

  activities = ACTIVITIES;

  constructor(private service: CharacterService) { }

  // The guests the user acts for (the host: everybody)
  get guests(): { cid: number, guest: FeastGuest }[] {
    return Object.keys(this.feast.data.participiants)
      .filter(cid => this.isHost || this.mine.includes(+cid))
      .map(cid => ({ cid: +cid, guest: this.feast.data.participiants[cid] }));
  }

  name(cid: number): string { return guestName(this.list, cid); }
  round(g: FeastGuest): FeastRoundData { return currentRound(g, this.feast.data.round); }
  draws(g: FeastGuest): boolean { return canDraw(g); }
  isRolled(action: string | undefined): boolean { return !!action && ROLLED.includes(action); }
  icon(result: string): string { return resultIcon(result); }
  image(card: number): string { return cardImage(card); }
  cardName(card: number): string { const c = this.config['' + card]; return c ? c.name : '#' + card; }
  cardText(card: number): string { const c = this.config['' + card]; return c ? (c.full || c.text || '') : ''; }
  isEnabled(g: FeastGuest, r: FeastRoundData, card: number): boolean {
    return !r.selected && !!g.enabled && g.enabled.includes(card);
  }

  private emit(call: any) { call.subscribe((r: FeastReply | null) => this.updated.emit(r)); }

  activity(cid: number, a: string) { this.emit(this.service.feastActivity(cid, a)); }
  requirement(cid: number, trait: string) { this.emit(this.service.feastRequirement(cid, trait)); }
  roll(cid: number, trait?: string) { this.emit(this.service.feastRoll(cid, trait)); }
  select(cid: number, card: number) { this.emit(this.service.feastSelectCard(cid, card)); }
  discard(cid: number, card: number) { this.emit(this.service.feastDiscardKept(cid, card)); }
  leave(cid: number, voluntary: boolean) { this.emit(this.service.feastLeave(cid, voluntary)); }
  back(cid: number) { this.emit(this.service.feastReturn(cid)); }
}

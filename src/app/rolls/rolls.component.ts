import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { CharacterService, CheckAll } from '../character.service';
import { LordBase } from '../lord';

interface PlayerOption {
  id: number;
  label: string;
}

// The storyteller's roll log: the last 100 rolls, of everybody or of the characters of one player
@Component({
    selector: 'app-rolls',
    templateUrl: './rolls.component.html',
    styleUrls: ['./rolls.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class RollsComponent implements OnInit, OnDestroy {
  readonly limits = [10, 25, 50, 100];
  limit = 100;
  private readonly playerStorageKey = 'rollsPlayer';
  private readonly limitStorageKey = 'rollsLimit';
  checks: CheckAll[] = [];
  players: PlayerOption[] = [];
  player: number | null = null;  // null: everybody
  private subscription: Subscription;

  constructor(private service: CharacterService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // Without a remembered choice the log shows the logged in player's characters
    const stored = window.localStorage.getItem(this.playerStorageKey);
    const userId = Number(window.localStorage.getItem('userId'));
    const own = this.service.isLoggedIn() && userId > 0 ? userId : null;
    this.player = stored === 'all' ? null : Number(stored) > 0 ? Number(stored) : own;
    const storedLimit = Number(window.localStorage.getItem(this.limitStorageKey));
    this.limit = this.limits.includes(storedLimit) ? storedLimit : 100;
    this.service.getList().subscribe(l => this.setPlayers(l));
    this.load();
    this.subscription = interval(5000).subscribe(() => this.load());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // One option per player, labelled by the names of their characters
  private setPlayers(chars: LordBase[]): void {
    const names = new Map<number, string[]>();
    for (const c of chars || []) {
      if (c.player) {
        names.set(c.player, [...(names.get(c.player) || []), c.name]);
      }
    }
    this.players = [...names.entries()]
      .map(([id, n]) => ({ id, label: n.join(', ') }))
      .sort((a, b) => a.label.localeCompare(b.label));
    this.cdr.markForCheck();
  }

  // 0 is the "All characters" option (a null option value is treated as an empty selection by mat-select)
  setPlayer(value: number): void {
    const player = value > 0 ? value : null;
    this.player = player;
    try {
      window.localStorage.setItem(this.playerStorageKey, player ? '' + player : 'all');
    } catch { }
    this.load();
  }

  setLimit(limit: number): void {
    this.limit = limit;
    try {
      window.localStorage.setItem(this.limitStorageKey, '' + limit);
    } catch { }
    this.load();
  }

  load(): void {
    const requested = this.player, requestedLimit = this.limit;
    this.service.getCheckList(requestedLimit, requested).subscribe(l => {
      if (requested === this.player && requestedLimit === this.limit && l) {  // ignore a late answer for a previous filter
        this.checks = [...l].sort((a, b) => b.id - a.id);  // newest on top
        this.cdr.markForCheck();
      }
    });
  }
}

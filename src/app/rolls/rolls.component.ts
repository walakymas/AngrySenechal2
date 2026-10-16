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
  readonly limit = 100;
  private readonly playerStorageKey = 'rollsPlayer';
  checks: CheckAll[] = [];
  players: PlayerOption[] = [];
  player: number | null = null;  // null: everybody
  private subscription: Subscription;

  constructor(private service: CharacterService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const stored = Number(window.localStorage.getItem(this.playerStorageKey));
    this.player = stored > 0 ? stored : null;
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

  setPlayer(player: number | null): void {
    this.player = player;
    try {
      window.localStorage.setItem(this.playerStorageKey, player ? '' + player : '');
    } catch { }
    this.load();
  }

  load(): void {
    const requested = this.player;
    this.service.getCheckList(this.limit, requested).subscribe(l => {
      if (requested === this.player && l) {  // ignore a late answer for a previous filter
        this.checks = [...l].sort((a, b) => b.id - a.id);  // newest on top
        this.cdr.markForCheck();
      }
    });
  }
}

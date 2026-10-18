import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { CharacterService, CheckAll } from '../character.service';
import { LordBase } from '../lord';

interface PlayerOption {
  id: number;
  label: string;
}

interface GridRow {
  label: string;
  checks: CheckAll[];
}

const GRID = -1;  // the "Grid" option value of the player select

// The storyteller's roll log: the last 100 rolls, of everybody (as a grid with a row per player, or one list) or of the characters of one player
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
  grid = true;  // everybody's rolls, one row per player
  private charPlayer = new Map<number, number>();  // character id -> player id
  text = '';  // case insensitive substring filter, applied on the loaded rolls only
  private subscription: Subscription;

  constructor(private service: CharacterService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // Without a remembered choice the log shows everybody's rolls as a grid
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(this.playerStorageKey);
    } catch { }
    this.grid = stored == null || stored === 'grid';
    this.player = Number(stored) > 0 ? Number(stored) : null;
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
    this.charPlayer = new Map<number, number>();
    for (const c of chars || []) {
      if (c.player) {
        this.charPlayer.set(Number(c.id), Number(c.player));
      }
      if (c.player) {
        const id = Number(c.player);
        names.set(id, [...(names.get(id) || []), c.name]);
      }
    }
    this.players = [...names.entries()]
      .map(([id, n]) => ({ id, label: n.join(', ') }))
      .sort((a, b) => a.label.localeCompare(b.label));
    this.cdr.markForCheck();
  }

  // 0 is the "All characters" option (a null option value is treated as an empty selection by mat-select), -1 the grid
  setPlayer(value: number): void {
    const player = value > 0 ? value : null;
    this.grid = value === GRID;
    this.player = player;
    try {
      window.localStorage.setItem(this.playerStorageKey, this.grid ? 'grid' : player ? '' + player : 'all');
    } catch { }
    this.load();
  }

  get selected(): number {
    return this.grid ? GRID : this.player || 0;
  }

  // The grid rows: the rolls of each player (the rolls are already newest first), players without a roll are left out
  get rows(): GridRow[] {
    const byPlayer = new Map<number, CheckAll[]>();
    const others: CheckAll[] = [];
    for (const c of this.filteredChecks) {
      const p = this.charPlayer.get(Number(c.character));
      if (p) {
        byPlayer.set(p, [...(byPlayer.get(p) || []), c]);
      } else {
        others.push(c);
      }
    }
    const rows: GridRow[] = this.players
      .filter(p => byPlayer.has(p.id))
      .map(p => ({ label: p.label, checks: byPlayer.get(p.id) }));
    return others.length ? [...rows, { label: 'Others', checks: others }] : rows;
  }

  setLimit(limit: number): void {
    this.limit = limit;
    try {
      window.localStorage.setItem(this.limitStorageKey, '' + limit);
    } catch { }
    this.load();
  }

  // The rolls whose displayed texts contain the filter text
  get filteredChecks(): CheckAll[] {
    const needle = this.text.trim().toLowerCase();
    return needle ? this.checks.filter(c => this.searchText(c).includes(needle)) : this.checks;
  }

  private searchText(c: CheckAll): string {
    const r = c.result || {};
    const parts = [c.name, c.command, r['action'], c.created];
    for (const k of ['c1', 'c2']) {
      if (r[k]) {
        parts.push(r[k]['success'], r[k]['name']);
      }
    }
    return parts.filter(p => p != null).join(' ').toLowerCase();
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

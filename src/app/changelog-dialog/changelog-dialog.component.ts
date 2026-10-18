import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CharacterService } from '../character.service';

const SEEN_KEY = 'changelogSeen';

// A short fingerprint of the whole changes text: any edit of it counts as a change
function fingerprint(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return text.length + ':' + h;
}

/** True when the changelog differs from the one the user has seen last (or was never seen). */
export function changelogIsNew(text: string): boolean {
  if (!text || !text.trim()) {
    return false;
  }
  try {
    return window.localStorage.getItem(SEEN_KEY) !== fingerprint(text);
  } catch {
    return false;  // without storage the popup would come on every visit
  }
}

function markChangelogSeen(text: string): void {
  try {
    window.localStorage.setItem(SEEN_KEY, fingerprint(text));
  } catch { }
}

interface ChangeEntry {
  date: string;
  lines: { text: string; em: boolean }[][];  // a line is a list of parts, the *marked* ones are emphasized
}

// The changelog popup: the `changes` text of senechal.yml (the same as the bot's !changes), newest first
@Component({
    selector: 'app-changelog-dialog',
    template: `
  <h2 mat-dialog-title>Changelog</h2>
  <div mat-dialog-content class="changelog-content">
    @if (loading) {
      <p>Loading...</p>
    } @else if (entries.length == 0) {
      <p>No changelog available.</p>
    }
    @for (e of entries; track e.date) {
      <h3>{{e.date}}</h3>
      @for (l of e.lines; track $index) {
        <p>@for (p of l; track $index) {@if (p.em) {<code>{{p.text}}</code>} @else {{{p.text}}}}</p>
      }
    }
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button (click)="dialogRef.close()">Close</button>
  </div>`,
    styles: [`
  .changelog-content { max-height: 60vh; overflow-y: auto; }
  h3 { margin: 12px 0 4px; }
  p { margin: 0 0 6px; }
  `],
    standalone: false
})
export class ChangelogDialogComponent implements OnInit {
  entries: ChangeEntry[] = [];
  loading = true;

  constructor(public dialogRef: MatDialogRef<ChangelogDialogComponent>, private service: CharacterService,
              private cdr: ChangeDetectorRef) { }

  async ngOnInit() {
    const base = await this.service.getBase();
    const text = (base && base['changes']) || '';
    this.entries = this.parse(text);
    markChangelogSeen(text);
    this.loading = false;
    this.cdr.markForCheck();
  }

  // Blocks are separated by an empty line, the first line of a block is its **date**
  private parse(text: string): ChangeEntry[] {
    return String(text).trim().split(/\n\s*\n/).filter(b => b.trim()).map(block => {
      const [head, ...rest] = block.trim().split('\n');
      return { date: head.replace(/\*/g, '').trim(), lines: rest.map(l => this.parts(l.trim())) };
    });
  }

  private parts(line: string): { text: string; em: boolean }[] {
    return line.split(/(\*[^*]+\*)/).filter(p => p)
      .map(p => p.length > 2 && p.startsWith('*') && p.endsWith('*') ? { text: p.slice(1, -1), em: true } : { text: p, em: false });
  }
}

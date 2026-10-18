import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LordBase } from '../lord';

export interface AllDialogData {
  Lords: LordBase[];
  Ladies: LordBase[];
  Other: LordBase[];
}

// The "All" popup: a Lords / Ladies / Other filter over a scrollable list of characters
@Component({
    selector: 'app-all-dialog',
    template: `
  <h2 mat-dialog-title>Characters</h2>
  <div mat-dialog-content class="all-dialog-content">
    <mat-button-toggle-group [(value)]="group" class="all-dialog-filter" aria-label="Filter">
      <mat-button-toggle value="Lords"><mat-icon>male</mat-icon> Lords ({{data.Lords.length}})</mat-button-toggle>
      <mat-button-toggle value="Ladies"><mat-icon>female</mat-icon> Ladies ({{data.Ladies.length}})</mat-button-toggle>
      <mat-button-toggle value="Other"><mat-icon>transgender</mat-icon> Other ({{data.Other.length}})</mat-button-toggle>
    </mat-button-toggle-group>
    <div class="all-dialog-list">
      @for (c of data[group]; track c.id) {
        <button mat-button class="all-dialog-item" routerLink="/character/{{c.name}}" (click)="dialogRef.close()">{{c.name}}</button>
      }
    </div>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button (click)="dialogRef.close()">Close</button>
  </div>`,
    styles: [`
  .all-dialog-content { display: flex; flex-direction: column; gap: 12px; }
  .all-dialog-filter { align-self: center; max-width: 100%; }
  .all-dialog-list { display: flex; flex-direction: column; max-height: 50vh; overflow-y: auto; }
  .all-dialog-item { justify-content: flex-start; text-align: left; }
  `],
    standalone: false
})
export class AllDialogComponent {
  group: 'Lords' | 'Ladies' | 'Other' = 'Lords';

  constructor(public dialogRef: MatDialogRef<AllDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: AllDialogData) { }
}

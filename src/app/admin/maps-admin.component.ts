import { Component, OnInit, ViewChild } from '@angular/core';
import { CharacterService, MapEntry } from '../character.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-maps-admin',
  templateUrl: './maps-admin.component.html',
  styleUrls: ['./maps-admin.component.css']
})
export class MapsAdminComponent implements OnInit {
  ds: MatTableDataSource<MapEntry> = new MatTableDataSource([]);
  displayed: string[] = ['id','name','category','ord','url','actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private service: CharacterService, public dialog: MatDialog, private snack: MatSnackBar) { }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.service.getMaps().subscribe(m => { this.ds.data = m; this.ds.paginator = this.paginator; this.ds.sort = this.sort; });
  }

  edit(row: MapEntry) {
    const dialogRef = this.dialog.open(MapEditDialog, { data: {map: {...row} } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const body = new URLSearchParams();
        body.set('id',''+result.id);
        body.set('url', result.url || '');
        body.set('category', result.category || '');
        body.set('ord', ''+(result.ord||0));
        body.set('name', result.name || '');
        this.service['http'].post(this.service.getUrl()+'update_map', body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).subscribe(() => { this.snack.open('Map updated','OK',{duration:2000}); this.load(); });
      }
    });
  }

  add() {
    const dialogRef = this.dialog.open(MapEditDialog, { data: {map: {id:0, url:'', category:'', ord:0, name:''} } });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const body = new URLSearchParams();
        body.set('url', result.url || '');
        body.set('category', result.category || '');
        body.set('ord', ''+(result.ord||0));
        body.set('name', result.name || '');
        this.service['http'].post(this.service.getUrl()+'add_map', body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).subscribe(() => { this.snack.open('Map added','OK',{duration:2000}); this.load(); });
      }
    });
  }

  delete(row: MapEntry) {
    if (!confirm('Delete map?')) return;
    const body = new URLSearchParams();
    body.set('id',''+row.id);
    this.service['http'].post(this.service.getUrl()+'delete_map', body.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }).subscribe(() => { this.snack.open('Map deleted','OK',{duration:2000}); this.load(); });
  }
}

import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'map-edit-dialog',
  template: `
  <h2 mat-dialog-title>Map</h2>
  <div mat-dialog-content>
    <mat-form-field appearance="fill" style="width:100%"><mat-label>Name</mat-label><input matInput [(ngModel)]="data.map.name"></mat-form-field>
    <mat-form-field appearance="fill" style="width:100%"><mat-label>URL</mat-label><input matInput [(ngModel)]="data.map.url"></mat-form-field>
    <mat-form-field appearance="fill" style="width:100%"><mat-label>Category</mat-label><input matInput [(ngModel)]="data.map.category"></mat-form-field>
    <mat-form-field appearance="fill" style="width:100%"><mat-label>Order</mat-label><input matInput type="number" [(ngModel)]="data.map.ord"></mat-form-field>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="data.map">Save</button>
  </div>
  `
})
export class MapEditDialog {
  constructor(public dialogRef: MatDialogRef<MapEditDialog>, @Inject(MAT_DIALOG_DATA) public data: {map: MapEntry}) {}
}

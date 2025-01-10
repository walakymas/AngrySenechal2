import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { Location } from '@angular/common';
import { CharacterService, Player, TokenAll } from '../character.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LordBase } from '../lord';
import {MatSort, Sort, MatSortModule} from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit, AfterViewInit {
  snackBarConfig: MatSnackBarConfig;
  players: Player[];
  dsPlayers: MatTableDataSource<Player> = new MatTableDataSource([]);
  tokens: TokenAll[];
  dsTokens: MatTableDataSource<TokenAll> = new MatTableDataSource([]);
  chars: LordBase[];
  dsChars: MatTableDataSource<LordBase> = new MatTableDataSource([]);
  displayedColumns: string[] = ['id','name','character','right','did'];
  dcChars: string[] = ['id','name','role','type', 'plyr'];
  dcTokens: string[] = ['id','expires','cid','state'];
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private service: CharacterService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
  ) {
    this.snackBarConfig = new MatSnackBarConfig();
    this.snackBarConfig.duration = 2000;
  }

  ngAfterViewInit() {
    this.dsPlayers.sort = this.sort;
    this.dsChars.sort = this.sort;
    this.dsChars.paginator = this.paginator;
  }

  ngOnInit(): void {
    this.service.getPlayerList().subscribe( l => {this.setPlayerList(l); this.dsPlayers.data=l;});
    this.service.getTokenList().subscribe( l => {this.setTokenList(l); this.dsTokens.data=l});
    this.service.getList().subscribe( l => {this.setCharList(l); this.dsChars.data=l; });
  }

  setPlayerList(l: Player[]): void {
    this.players = l;
  }

  setTokenList(l: TokenAll[]): void {
    this.tokens = l;
  }

  setCharList(l: LordBase[]): void {
    this.chars = l;
  }

  getCharName(id): string {
    for(let c in this.chars) {
      if (this.chars[c]['id'] == id) {
        return this.chars[c]['name'];
      }
    }
    return "??? id:"+id;

  }

  getPlyrName(id): string {
    if (id!=null) {
      for(let c in this.players) {
        if (this.players[c]['cid'] == id) {
          return this.players[c]['name'];
        }
      }
      return "??? id:"+id;
    }
    return null;
  }

  clickPlayer(row){
    const dialogRef = this.dialog.open(PlayerEditDialog, {
      minWidth: '100vw',
      minHeight: '100vh',
      data: {player: row}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('pre updatePlayer:'+result.did)

        this.service.updatePlayer(result).then(c => {
          this.snackBar.open('Player refreshed','Ok',this.snackBarConfig);
        })
      }

    });
  }

  clickChar(row){
    const dialogRef = this.dialog.open(CharEditDialog, {
      minWidth: '100vw',
      minHeight: '100vh',
      data: {p: row}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.updateChar(result).then(c => {
          this.snackBar.open('Char refreshed','Ok',this.snackBarConfig);
        })
      }
    });
  }
}

@Component({
  selector: 'player-main-dialog',
  template: `
  <div mat-dialog-content>
  <mat-form-field appearance="fill" style="width:50%">
        <mat-label>id</mat-label>
        <input disabled matInput [(ngModel)]="data.player.cid">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Character</mat-label>
        <input matInput [(ngModel)]="data.player.character">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.player.name">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Created</mat-label>
        <input matInput disabled [(ngModel)]="data.player.created">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Modified</mat-label>
        <input matInput disabled [(ngModel)]="data.player.modified">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:25%">
        <mat-label>Rihts</mat-label>
        <input matInput disabled [(ngModel)]="data.player.playerrights">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:25%">
        <mat-label>State</mat-label>
        <input matInput disabled [(ngModel)]="data.player.playerstate">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Discord Id</mat-label>
        <input matInput [(ngModel)]="data.player.did">
      </mat-form-field>
    </div>
  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="data.player" cdkFocusInitial>Save</button>
  </div> `})
export class PlayerEditDialog {
  constructor(
    private dialogRef: MatDialogRef<PlayerEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {player:Player}){
        console.log(data)
    }
}

@Component({
  selector: 'char-main-dialog',
  template: `
  <div mat-dialog-content>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>id</mat-label>
        <input disabled matInput [(ngModel)]="data.p.id">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Discord</mat-label>
        <input matInput [(ngModel)]="data.p.memberid
        ">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.p.name">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Url</mat-label>
        <input matInput [(ngModel)]="data.p.url">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Modified</mat-label>
        <input matInput disabled [(ngModel)]="data.p.modified">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Role</mat-label>
        <input matInput [(ngModel)]="data.p.role">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Type</mat-label>
        <input matInput disabled [(ngModel)]="data.p.type">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Player</mat-label>
        <input matInput [(ngModel)]="data.p.player">
      </mat-form-field>
      <div><img src="data.c.url"/></div>
    </div>
  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="data.p" cdkFocusInitial>Save</button>
  </div> `})
export class CharEditDialog {
  constructor(
    private dialogRef: MatDialogRef<CharEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {p:LordBase}){
        console.log(data)
    }
}


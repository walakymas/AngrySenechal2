import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { Lord, LordBase } from './../lord';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { Location } from '@angular/common';
import { C2C, CharacterService, CheckAll } from './../character.service';
import { Logger } from '../logger.service';
import { Base } from '../base';
import { MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef} from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MAT_DIALOG_DATA} from '@angular/material/dialog';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-character-detail',
  templateUrl: './character-detail.component.html',
  styleUrls: ['./character-detail.component.css']
})
export class CharacterDetailComponent implements OnInit {
  id : number = NaN;
  traits: Trait[] = []
  checks: CheckAll[] = []
  healthmod: number = 0;
  actualCheck: number = 1;
  lastCheck: number = -1;
  char : Lord;
  details: {};
  weapon: {};
  combat: {};
  base : Base;
  main_horse = {};
  snackBarConfig: MatSnackBarConfig;
  chivalry : number = 0;
  subscription: Subscription;
  checksubscription: Subscription;
  virtues: {};
  connections: C2C[] = [];
  chars: LordBase[];
  
  constructor(
    private route: ActivatedRoute,
    private service: CharacterService,
    private location: Location,
    private logger: Logger,
    private snackBar: MatSnackBar,
    public dialog: MatDialog
    ) {
      this.snackBarConfig = new MatSnackBarConfig();
      this.snackBarConfig.duration = 2000;
    }

  getService(): CharacterService {
    return this.service;
  }

  ngOnInit(): void {
    console.log('CharacterDetailComponent ngOnInit')
    this.route.paramMap.subscribe(data => this.load(data));
    this.subscription = interval(60000).subscribe(v => this.loadLord());
    this.checksubscription = interval(5000).subscribe(v =>   this.service.getCheckList().subscribe( l => this.setChecks(l)));
    this.service.getList().subscribe( l => {this.setCharList(l); });

    this.loadLord()
  }

  setCharList(l: LordBase[]): void {
    this.chars = l;
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.checksubscription.unsubscribe();
  }

  load(p:ParamMap) {
    const name = p.get('name');
    let id = +name;
    console.log('route:'+name+', id:'+id)

    this.service.getBase().then( t =>
      {
        console.log('base in team')
        this.base = t;
        this.traits = [];
        for(let t in this.base.traits) {
          this.traits.push(new Trait(this.base.traits[t][0].substring(0,3).toLowerCase(), this.base.traits[t][0], this.base.traits[t][1]));
        }
      }
    );
    if (id > 0) {
      this.service.getLord(id).subscribe( l => {
        this.service.getConnections(l.char['dbid']*1).subscribe( l => this.setConnections(l));
        this.setLord(l);
      });
    } else {
      this.service.getLordByName(name).subscribe( l => {
        this.service.getConnections(l.char['dbid']*1).subscribe( l => this.setConnections(l));
        this.setLord(l)
      });
    }
  }

  setConnections(l: C2C[]) {
    l.sort((a, b) => {
      if (a.char.name < b.char.name) {
        return -1;
      }
      if (a.char.name > b.char.name) {
        return 1;
      }
      return 0; // If names are the same
    });

    this.connections = l;
  }

  loadLord(): void {
    console.log('loadLord')
    if (!isNaN(this.id)) {
      this.service.getLord(this.id).subscribe( l => this.setLord(l));
    }
  }

  playDiceSound(){
    let audio = new Audio();
    audio.src = "../../assets/audio/dice-95077.mp3";
    audio.load();
    audio.play();
  }
  setChecks(l: CheckAll[]) {
    if (l[0].id !=this.lastCheck) {
      console.log('setCheck')
      if (this.lastCheck!=-1) {
        this.playDiceSound();
      }
      this.checks = l;
      this.lastCheck = l[0].id;
    }
  }

  check(p:string){
    let res = this.checks[this.actualCheck-1][p]
    if ("command"==p){
      res = res.replace(/<@!\d{5,}>/,'')
    }
    return res;
  }
  checkIcon(c){
    let res = this.checks[this.actualCheck-1].result[c]['success']
    if ("Critical"==res){
      res = "crown"
    } else if  ("Fail"==res) {
      res=  "thumb_down"
    } else if  ("Success"==res) {
      res=  "thumb_up"
    } else if  ("Fumble"==res) {
      res=  "thunderstorm"
    }
    return res;
  }
  setLord(l: Lord) {
    if (this.char!=null && this.char.modified == l.modified ) {
      return;
    }

    this.id = l.char['dbid']*1;
    this.char =  l;
    let g :number  = 0
    let years = [];
    let y: number;
    const weapon = {};
    for (const [n, v] of Object.entries(this.base['weapons']['default'])) {
      weapon[n] = v
    }
    if (this.base['weapons'][l.char['combat']['weapon']]) {
        for (const [n, v] of Object.entries(this.base['weapons'][l.char['combat']['weapon']])) {
            weapon[n] = v
        }
    }
    this.weapon = weapon;
    this.combat = {}
    for (var i in this.char.char['combat'])
      this.combat[i] = this.char.char['combat'][i];
    if (this.char.events) {
      this.char.events.forEach(e => {
        g += e['glory'];
        if (!y || y != e['year']*1) {
          y = e['year']*1;
          years.push(y);
        }
      });
    }
    if (l.char['main']['Culture']) {
      for (const [n, v] of Object.entries(this.base.virtues)) {
        if (l.char['main']['Culture'].indexOf(n)>-1) {
          this.virtues = this.base.virtues[n];
        }
      }
    }

    this.chivalry = 0;
    for(let tid in this.traits) {
      let t : Trait = this.traits[tid];
      if (this.isChivalry(t.first)) {
        this.chivalry +=  this.char.char['traits'][t.short];
      }
      if (this.isChivalry(t.second)) {
        this.chivalry +=  20 - this.char.char['traits'][t.short];
      }
    }
    this.details = {};
    console.log(''+g)
    this.details['glory'] = g;
    this.details['years'] = years;
    let maxhp = this.char.char['stats']['siz']*1+this.char.char['stats']['con']*1;
    this.details['hp'] = maxhp;
    this.details['hr'] = Math.round((this.char.char['stats']['str']*1+this.char.char['stats']['con']*1)/10);
    this.details['wounds'] = "";
    this.details['ahp'] = maxhp;
    if (this.char.char['health'] && this.char.char['health']['changes']) {
      for(let ii in  this.char.char['health']['changes']) {
        this.details['ahp'] += this.char.char['health']['changes'][ii]*1;
        this.details['wounds']+=', '+this.char.char['health']['changes'][ii];
        if (this.details['ahp'] < 0) {
          this.details['ahp'] =0;
        } else if (this.details['ahp']>this.details['hp']) {
          this.details['ahp'] = this.details['hp'];
        }
      }
      this.details['wounds'] = this.details['wounds'] .replace(/^,/,'');
      if (this.details['ahp'] !=this.details['hp'] ) {
        this.details['chi'] = this.char.char['health']['chirurgery']
      }
    }
    try {
      this.main_horse = this.base.horsetypes[this.char.char['winter']['horses'][0]]
      this.main_horse['hea'] = Math.round((this.main_horse['str']*1+this.main_horse['con']*1)/10);
      this.main_horse['unc'] = Math.round((this.main_horse['siz']*1+this.main_horse['con']*1)/4);
    } catch (error) {
      
    }
  }

  getMarkClass(name : string)  {
    return (this.char.marks.indexOf(name)>=0) ? "material-icons md-light md-48 md-check-square" : "material-icons md-48 md-light md-square";
  }

  isMarked(name : string)  {
    return this.char.marks && this.char.marks.indexOf(name)>=0;
  }

  getTrait(name : string)  {
    return this.char.char['traits'][name.toLowerCase().substring(0,3)]
  }

  shortTrait(name : string)  {
    name.toLowerCase().substring(0,3);
  }

  getEvents(year) {
    const events = [];
    this.char.events.forEach(e => {
      if (year == e['year']*1) {
        events.push(e);
      }
    });
    return events;
  }

  isChivalry(trait) {
    return this.base.chivalry.includes(trait);
  }

  isVirtue(trait) {
    return this.char.virtues.includes(trait);
  }

  getGlory(year)  {
    var result = 0;
    this.char.events.forEach(e => {
      if (year >=  e['year']*1) {
        result += e['glory']*1;
      }
    });
    return result;
  }

  getDetail(type : string)  {
    if (this.char) {
      if (type === 'Damage')
          return Math.round((this.char.char['stats']['str']*1+this.char.char['stats']['siz']*1)/6);
      else if (type === 'Healing Rate')
          return Math.round((this.char.char['stats']['str']*1+this.char.char['stats']['con']*1)/10);
      else if (type === 'Move Rate')
          return Math.round((this.char.char['stats']['dex']*1+this.char.char['stats']['siz']*1)/10);
      else if (type === 'Total Hitpoints')
          return Math.round((this.char.char['stats']['siz']*1+this.char.char['stats']['con']*1));
      else if (type === 'Unconscious')
          return Math.round((this.char.char['stats']['con']*1+this.char.char['stats']['siz']*1)/4);
      else if (type === 'Major Wound')
          return this.char.char['stats']['con'];
      else if (type === 'Knockdown')
          return this.char.char['stats']['siz'];
      return '?';
    } else
      return '-NA-';
  }

  mark(checked: boolean, name: string) {
    this.service.setMark(name, this.char.char['dbid'], checked).then(c => {
      this.setLord(this.char);
    })
  }

  public saveProjectName( project: object,prop: string, newName: string ) : void {
    console.log(JSON.stringify(project)+':'+prop+':'+newName)
		project[prop] = newName;
    this.service.modify(this.char).then(c => {
      this.setLord(c);
      this.snackBar.open('Lord refreshed','Ok',this.snackBarConfig);
    })
	}

  public modifyCombat( prop: string ) : void {
    console.log(`modifyCombat ${prop}:=${this.char.char['combat'][prop]} vs ${this.combat[prop]}`)
    this.modifyProp('combat.'+prop,this.char.char['combat'][prop]);
	}

  public modifyProp( prop: string, newValue: string ) : void {
    console.log(`${prop}:=${newValue}`)
    this.service.modifyProp(this.char.char['dbid'],prop, newValue).then(c => {
      this.setLord(c);
      this.snackBar.open('Lord refreshed','Ok',this.snackBarConfig);
    })
	}

  public isEq(s1: string, s2:string):boolean{
    let result = s1==s2;
    return result;
  }

  public heal(action:string) {
    console.log(action+JSON.stringify(this.char.char['health']['changes']));
    if (action=='wound') {
      this.char.char['health']['changes'].push(this.healthmod*-1);
    } else if (action=='heal') {
      this.char.char['health']['changes'].push(this.healthmod*1);
    } else if (action=='sunday') {
      this.char.char['health']['changes'].push(this.details['hr']);
    } else if (action=='full') {
      this.char.char['health']['changes'] = [];
    }
    this.modifyProp('health.changes',JSON.stringify( this.char.char['health']['changes']))
  }
  jsonDialog() {
    const dialogRef = this.dialog.open(CharacterJsonDialog, {
      minWidth: '100vw',
      minHeight: '100vh',

      data: {lord: this.char}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.modifyChar(result).then(c => {
          this.setLord(c);
          this.snackBar.open('Lord refreshed','Ok',this.snackBarConfig);
        })
      }

    });
  }

  connectionsDialog() {
    const dialogRef = this.dialog.open(CharacterConnectionDialog, {
//      minWidth: '100vw',
//      minHeight: '100vh',

      data: {parent: this}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.service.modifyChar(result).then(c => {
          this.setLord(c);
          this.snackBar.open('Lord refreshed','Ok',this.snackBarConfig);
        })
      }

    });
  }

  connected(j) {
    console.log('connected:'+j.value['dbid']+'>>>>>'+JSON.stringify(j));

    const id : string = ''+j.value['dbid'];

    this.connections.forEach(c => {
      console.log('connected:'+id+', c0:'+c.c0+', c1:'+c.c1+',');
      if (''+c.c0 == id || ''+c.c1 == id) {
        console.log('connected:'+id+', c0:'+c.c0+', c1:'+c.c1+', connected');

        return true;
      }
    })
    return false;
  }


  editMain(l : Lord) {
    let main : CharacterMain;

    if (l) {
      main = new CharacterMain(l.char['name'],l.char['shortName'],l.char['role'],l.char['url'],l.char['description'],l.char['longdescription'])
    }

    const dialogRef = this.dialog.open(CharacterMainDialog, {
      width: '500px',
      data: {main: main}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(JSON.stringify(result))
                this.snackBar.open('Dialog ok','Ok',this.snackBarConfig);
        this.service.main(this.char, result).then(c => {
          this.setLord(c);
          this.snackBar.open('Lord refreshed','Ok',this.snackBarConfig);
        })
      } else {
        this.snackBar.open('Dialog Cacelled','Ok',this.snackBarConfig);
      }
    });
  }

  pdf() {
    console.log('pdf():'+this.service.getUrl());

    let link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = `${this.service.getUrl()}pdf?id=${this.id }`;
    link.target = "pdf"
//    link.download = path;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  bot(p:string) {
    let p_ = p.replace(/ /g,'_');
    let command = `${p_} <@!${ this.char.char['memberId']}>`;
    this.service.bot(command).subscribe(e => console.log(`sent "${command}" ${e}`));
  }

  editEvent(e) {
    if (!this.hasUser()) {
      return;
    }
    let ge: GameEvent;
    if (e) {
      ge = new GameEvent(e['id'],e['glory'],e['year'],e['description'])
    }

    const dialogRef = this.dialog.open(DialogContentExampleDialog, {
      width: '500px',
      data: {event: ge}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(JSON.stringify(result))
                this.snackBar.open('Dialog ok','Ok',this.snackBarConfig);
        this.service.event(this.char, result).then(c => {
          this.setLord(c);
          this.snackBar.open('Lord refreshed','Ok',this.snackBarConfig);
        })
      } else {
        this.snackBar.open('Dialog Cacelled','Ok',this.snackBarConfig);
      }
    });
  }

  hasUser() {
    return true; //this.base['loginNeeded'] != 'true' || window.localStorage.getItem('userName')!=null;
  }
}

export class Trait {
  constructor (  public short: string,
    public first: string,
    public second: string) {}
}

export class CharacterMain {
  constructor (
    public name: string,
    public shortName: string,
    public role: string,
    public url: string,
    public description: string = '',
    public longdescription: string = '',
    ) {}
}

@Component({
  selector: 'character-main-dialog',
  template: `
  <div mat-dialog-content>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.main.name">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>ShortName</mat-label>
        <input matInput [(ngModel)]="data.main.shortName">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Role</mat-label>
        <input matInput [(ngModel)]="data.main.role">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Url</mat-label>
        <input matInput [(ngModel)]="data.main.url">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:100%;">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="data.main.description" style="min-height:120px;"></textarea>
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:100%;">
        <mat-label>LongDescription</mat-label>
        <textarea matInput [(ngModel)]="data.main.longdescription" style="min-height:120px;"></textarea>
      </mat-form-field>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="data.main" cdkFocusInitial>Save</button>
  </div> `})
export class CharacterMainDialog {
  constructor(
    private dialogRef: MatDialogRef<CharacterMainDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {main: CharacterMain}) {
      if (! data.main) {
        data.main = new CharacterMain("","","","","","");
      }
    }
}

export class GameEvent {
  constructor (  public id: number = 0,
    public glory: number = 0,
    public year: number = 0,
    public description: string = '') {}
}

@Component({
  selector: 'dialog-content-example-dialog',
  template: `
  <div mat-dialog-content>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Year</mat-label>
        <input type="number" matInput [(ngModel)]="data.event.year">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:50%">
        <mat-label>Glory</mat-label>
        <input type="number" matInput [(ngModel)]="data.event.glory">
      </mat-form-field>
      <mat-form-field appearance="fill" style="width:100%;">
        <mat-label>Description</mat-label>
        <textarea matInput [(ngModel)]="data.event.description" style="min-height:120px;"></textarea>
      </mat-form-field>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button [mat-dialog-close]="delete" cdkFocusInitial *ngIf="delete">Delete</button>
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="data.event" cdkFocusInitial>Save</button>
  </div> `})
export class DialogContentExampleDialog {
  delete: GameEvent;
  constructor(
    private dialogRef: MatDialogRef<DialogContentExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {event: GameEvent}) {
      if (! data.event) {
        data.event = new GameEvent();
      } else {
        this.delete = new GameEvent(data.event.id, -1);
      }
    }
}

@Component({
  selector: 'character-json-dialog',
  template: `
  <div mat-dialog-content>
    <form  [formGroup]="fg">
      <json-editor [options]="editorOptions" class="jsondialog" [data]="data.lord.char" formControlName="jsonEditorForm"></json-editor>
    </form>
  </div>
  <div mat-dialog-actions align="end">
    {{lord.char['name']}}
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="char" cdkFocusInitial [disabled]="!char">Save</button>
  </div> `})
export class CharacterJsonDialog {
  editorOptions : JsonEditorOptions;
  lord: Lord;
  @ViewChild(JsonEditorComponent, { static: false }) editor: JsonEditorComponent;
  public fg: FormGroup;
  jsonEditorForm = new FormControl();
  char:any;
  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DialogContentExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: {lord: Lord}) {
      this.lord = data.lord;
      this.editorOptions = new JsonEditorOptions()
      this.editorOptions.modes = ['code', 'tree'];
      this.editorOptions.mode = 'code';
    }
    ngOnInit(): void {
      this.fg = this.formBuilder.group({
        jsonEditorForm: [this.data.lord.char]
      });
      this.fg.controls.jsonEditorForm.valueChanges.subscribe( v => this.char = v )
    }
}

@Component({
  selector: 'character-connection-dialog',
  template: `
  <div mat-dialog-content>
    <table>
      <tr><th>Character 1</th><td> {{lord.char['name']}}</td></tr>
      <tr><th>Character 2</th><td>
          <mat-select [(value)]="c1" (selectionChange)="changed(c1)">
            <ng-container *ngFor="let c of chars | keyvalue">
                <mat-option *ngIf="enabled(c.value.id)" value="{{c.value.id}}" >{{c.value.id}}-{{c.value.name}}</mat-option>
            </ng-container>
          </mat-select>

      </td></tr>
      <tr><th>Connection</th><td>
          <mat-select [(value)]="connection">
              <mat-option value="Wife" >Wife</mat-option>
              <mat-option value="Follower" >Follower</mat-option>
              <mat-option value="Children" >Children</mat-option>
              <mat-option value="Husband" >Husband</mat-option>
              <mat-option value="Squire" >Squire</mat-option>
              <mat-option value="Relative" >Relative</mat-option>
              <mat-option value="Other" >Other</mat-option>

          </mat-select>

      </td></tr>
      <tr><th>Comment</th><td>
        <input [(ngModel)]="comment" type="text" placeholder="Comment"/>
      </td></tr>
      <tr><th></th><td>
      </td></tr>
    </table>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="char" (click)="addConnection()" [disabled]="!c1 || !connection">Add connection</button>
  </div> `})
export class CharacterConnectionDialog {
  connections: C2C[];
  c1: string = '';
  connection: string = 'Children';
  comment: string;
  char:any;
  lord: Lord;
  chars: LordBase[];
  service: CharacterService;
  parent: CharacterDetailComponent;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {parent: CharacterDetailComponent}) {

      this.parent = data.parent;
      this.chars = this.parent.chars;
      this.lord = this.parent.char;
      this.connections = this.parent.connections;
      this.service = this.parent.getService();

      console.log('chars in CharacterDetailComponent:'+ this.chars.length);

    }
    ngOnInit(): void {
    }
    addConnection() {
      this.service.addC2C(''+this.parent.id, ''+this.c1, this.connection, this.comment, true).then(c => {this.parent.setConnections(c)})

    }
    enabled(id: string): boolean {
      if( ''+this.parent.id == id) return false;
      return true;
    }

    changed(id: string): void {
      console.log('changed:'+id+":"+JSON.stringify(this.connections));
      for(const c of this.connections) {
        if (''+c.c1 == id) {
          this.connection = c.connection;
          this.comment = c.comment;
          break;
        }
      }
    }
}

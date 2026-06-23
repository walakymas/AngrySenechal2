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
  private readonly lastCharacterStorageKey = 'lastCharacter';
  id : number = NaN;
  mode: 'simple' | 'advanced' = 'simple';
  modifier: number = 0;
  charImgZoomed: boolean = false;
  private pendingDefaultCharacterLoad: boolean = false;
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
    this.tryLoadDefaultCharacter();
  }


  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.checksubscription.unsubscribe();
  }

  load(p:ParamMap) {
    const name = p.get('name');
    const id = name ? +name : NaN;
    console.log('route:'+name+', id:'+id)
    this.charImgZoomed = false;
    this.pendingDefaultCharacterLoad = false;

    this.service.getBase().then( t =>
      {
        console.log('base in team')
        this.base = t;
        this.traits = [];
        for(let t in this.base.traits) {
          this.traits.push(new Trait(this.base.traits[t][0].substring(0,3).toLowerCase(), this.base.traits[t][0], this.base.traits[t][1]));
        }
        if (name) {
          if (id > 0) {
            this.loadLordById(id);
          } else {
            this.loadLordByName(name);
          }
          return;
        }

        const storedCharacter = this.getStoredLastCharacter();
        if (storedCharacter) {
          const storedId = +storedCharacter;
          if (!isNaN(storedId) && storedId > 0) {
            this.loadLordById(storedId);
          } else {
            this.loadLordByName(storedCharacter);
          }
          return;
        }

        this.pendingDefaultCharacterLoad = true;
        this.tryLoadDefaultCharacter();
      }
    );
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
      this.service.getLord(this.id).subscribe(l => {
        if (l && l.char) {
          this.setLord(l);
        }
      });
    }
  }

  private loadLordById(id: number, allowDefaultFallback: boolean = true): void {
    this.service.getLord(id).subscribe(l => {
      if (!l || !l.char) {
        if (allowDefaultFallback) {
          this.pendingDefaultCharacterLoad = true;
          this.tryLoadDefaultCharacter();
        }
        return;
      }
      this.service.getConnections(l.char['dbid']*1).subscribe(connections => {
        if (connections) {
          this.setConnections(connections);
        }
      });
      this.setLord(l);
    });
  }

  private loadLordByName(name: string, allowDefaultFallback: boolean = true): void {
    this.service.getLordByName(name).subscribe(l => {
      if (!l || !l.char) {
        if (allowDefaultFallback) {
          this.pendingDefaultCharacterLoad = true;
          this.tryLoadDefaultCharacter();
        }
        return;
      }
      this.service.getConnections(l.char['dbid']*1).subscribe(connections => {
        if (connections) {
          this.setConnections(connections);
        }
      });
      this.setLord(l);
    });
  }

  private tryLoadDefaultCharacter(): void {
    if (!this.pendingDefaultCharacterLoad || !this.base || !this.chars || this.chars.length === 0 || this.char) {
      return;
    }

    let fallback: LordBase = this.chars[0];
    for (const candidate of this.chars) {
      if (candidate.type === 'pc') {
        fallback = candidate;
        break;
      }
    }

    this.pendingDefaultCharacterLoad = false;
    this.loadLordById(fallback.id, false);
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
  setLord(l: Lord, force: boolean = false) {
    if (!l || !l.char) {
      return;
    }
    if (!force && this.char!=null && this.char.modified == l.modified && !force) {
      return;
    }

    this.id = l.char['dbid']*1;
    this.char =  l;
    this.rememberLastCharacter(l);
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

  showOld(j) {
    if(!j.value['dbid']) {
      return false;
    }

    const id : string = ''+j.value['dbid'];
    let result : boolean = true;
    this.connections.forEach(c => {
      if (''+c.c0 == id || ''+c.c1 == id) {
        result = false;
      }
    })
    return result;
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

  safeKey(p:string) {
    return p.replace(/ /g,'_');
  }

  private getStoredLastCharacter(): string {
    const id = window.localStorage.getItem(this.lastCharacterStorageKey);
    if (id) {
      return id;
    }
    return window.localStorage.getItem(this.lastCharacterStorageKey + 'Name');
  }

  private rememberLastCharacter(l: Lord): void {
    if (!l || !l.char) {
      return;
    }

    const dbid = l.char['dbid'] * 1;
    window.localStorage.setItem(this.lastCharacterStorageKey, '' + dbid);
    if (l.char['name']) {
      window.localStorage.setItem(this.lastCharacterStorageKey + 'Name', '' + l.char['name']);
    }
  }

  toggleCharImageZoom(): void {
    this.charImgZoomed = !this.charImgZoomed;
  }

  addMainProperty(): void {
    if (!this.hasUser()) {
      return;
    }

    const dialogRef = this.dialog.open(PropertyDialog, {
      width: '420px',
      data: {
        entry: new PropertyEntry('', '', 'Other'),
        scope: 'main',
        existingNames: this.getExistingMainNames(),
        originalName: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.modifyProp(`main.${result.name}`, '' + result.value);
      }
    });
  }

  editMainProperty(name: string, value: string | number): void {
    if (!this.hasUser()) {
      return;
    }

    const dialogRef = this.dialog.open(PropertyDialog, {
      width: '420px',
      data: {
        entry: new PropertyEntry(name, value, 'Other'),
        scope: 'main',
        existingNames: this.getExistingMainNames(),
        originalName: name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.modifyProp(`main.${result.name}`, '' + result.value);
      }
    });
  }

  addSkillProperty(category: string = 'Other'): void {
    if (!this.hasUser()) {
      return;
    }

    const dialogRef = this.dialog.open(PropertyDialog, {
      width: '420px',
      data: {
        entry: new PropertyEntry('', 1, category),
        scope: 'skills',
        existingNamesByCategory: this.getExistingSkillNamesByCategory(),
        originalName: ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.modifyProp(`skills.${result.category}.${result.name}`, '' + result.value);
      }
    });
  }

  editPassion(name: string = '', value: number = 1): void {
    if (!this.hasUser()) {
      return;
    }

    const dialogRef = this.dialog.open(PassionDialog, {
      width: '420px',
      data: {
        passion: new PassionEntry(name, value),
        existingNames: this.getExistingPassionNames(),
        originalName: name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.modifyProp(`passions.${result.name}`, '' + result.value);
      }
    });
  }

  isAdvancedMode(): boolean {
    return this.mode === 'advanced';
  }

  toggleMode(): void {
    this.mode = this.isAdvancedMode() ? 'simple' : 'advanced';
  }

  clampModifier(): void {
    const value = Number(this.modifier);
    if (Number.isNaN(value)) {
      this.modifier = 0;
      return;
    }
    this.modifier = Math.max(-20, Math.min(20, Math.trunc(value)));
  }

  getModifier(): number {
    this.clampModifier();
    return this.modifier;
  }

  checkCommand(command: string): void {
    if (!this.hasUser() || this.isAdvancedMode()) {
      return;
    }
    this.bot(`${command} ${this.getModifier()}`);
  }

  private getExistingMainNames(): string[] {
    return Object.keys(this.char && this.char.char && this.char.char['main'] ? this.char.char['main'] : {});
  }

  private getExistingPassionNames(): string[] {
    return Object.keys(this.char && this.char.char && this.char.char['passions'] ? this.char.char['passions'] : {});
  }

  private getExistingSkillNamesByCategory(): Record<string, string[]> {
    const skills = this.char && this.char.char && this.char.char['skills'] ? this.char.char['skills'] : {};
    const categories: Record<string, string[]> = {};

    Object.keys(skills).forEach(category => {
      categories[category] = Object.keys(skills[category] || {});
    });

    return categories;
  }

  bot(p:string) {
    let p_ = p.replace(/ /g,'_');
    let command = `${p} cid:${ this.char.char['dbid']}`;
    if (this.char.char['memberId']) {
      command = `${p} <@!${ this.char.char['memberId']}>`;
    }
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
          this.setLord(c, true);
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

export class PassionEntry {
  constructor (
    public name: string = '',
    public value: number = 1,
  ) {}
}

export class PropertyEntry {
  constructor (
    public name: string = '',
    public value: string | number = '',
    public category: string = 'Other',
  ) {}
}

function normalizeDialogName(value: string): string {
  return (value || '').trim().toLowerCase();
}

function hasDuplicateDialogName(
  existingNames: string[] = [],
  name: string = '',
  originalName: string = ''
): boolean {
  const trimmedName = normalizeDialogName(name);
  if (!trimmedName) {
    return false;
  }

  const trimmedOriginalName = normalizeDialogName(originalName);
  return existingNames.some(existingName => {
    const normalizedExistingName = normalizeDialogName(existingName);
    return normalizedExistingName.length > 0
      && normalizedExistingName === trimmedName
      && normalizedExistingName !== trimmedOriginalName;
  });
}

interface PassionDialogData {
  passion: PassionEntry;
  existingNames?: string[];
  originalName?: string;
}

interface PropertyDialogData {
  entry: PropertyEntry;
  scope: 'main' | 'skills';
  existingNames?: string[];
  existingNamesByCategory?: Record<string, string[]>;
  originalName?: string;
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
  selector: 'passion-dialog',
  template: `
  <div mat-dialog-content>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.passion.name" cdkFocusInitial>
        <mat-hint>Dots are not allowed</mat-hint>
      </mat-form-field>
      <div *ngIf="isDuplicateName()" style="color:#f44336; font-size:12px; margin-top:-10px; margin-bottom:8px;">
        {{ duplicateNameMessage() }}
      </div>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Initial value</mat-label>
        <input matInput type="number" min="1" max="15" step="1" [(ngModel)]="data.passion.value">
      </mat-form-field>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="result" [disabled]="!canSave()">Save</button>
  </div> `
})
export class PassionDialog {
  data: PassionDialogData;

  constructor(
    private dialogRef: MatDialogRef<PassionDialog>,
    @Inject(MAT_DIALOG_DATA) public incoming: PassionDialogData
  ) {
    this.data = incoming || { passion: new PassionEntry() };
    if (!this.data.passion) {
      this.data.passion = new PassionEntry();
    }
    this.data.existingNames = this.data.existingNames || [];
    this.data.originalName = this.data.originalName || '';
    this.data.passion.name = this.data.passion.name || '';
    this.data.passion.value = this.normalizeValue(this.data.passion.value);
  }

  get result(): PassionEntry {
    return new PassionEntry(this.trimmedName(), this.normalizeValue(this.data.passion.value));
  }

  trimmedName(): string {
    return (this.data.passion.name || '').trim();
  }

  trimmedOriginalName(): string {
    return (this.data.originalName || '').trim();
  }

  normalizeValue(value: any): number {
    const n = Number(value);
    return Number.isInteger(n) ? n : 1;
  }

  isDuplicateName(): boolean {
    return hasDuplicateDialogName(
      this.data.existingNames || [],
      this.trimmedName(),
      this.trimmedOriginalName()
    );
  }

  duplicateNameMessage(): string {
    return 'A passion with this name already exists.';
  }

  canSave(): boolean {
    const name = this.trimmedName();
    const value = Number(this.data.passion.value);
    return name.length > 0 && name.indexOf('.') < 0 && !this.isDuplicateName() && Number.isInteger(value) && value >= 1 && value <= 15;
  }
}

@Component({
  selector: 'property-dialog',
  template: `
  <div mat-dialog-content>
      <mat-form-field appearance="fill" style="width:100%">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="data.entry.name" cdkFocusInitial>
        <mat-hint>Dots are not allowed</mat-hint>
      </mat-form-field>
      <div *ngIf="isDuplicateName()" style="color:#f44336; font-size:12px; margin-top:-10px; margin-bottom:8px;">
        {{ duplicateNameMessage() }}
      </div>
      <mat-form-field *ngIf="data.scope === 'skills'" appearance="fill" style="width:100%">
        <mat-label>Category</mat-label>
        <mat-select [(ngModel)]="data.entry.category">
          <mat-option value="Other">Other</mat-option>
          <mat-option value="Weapons">Weapon</mat-option>
          <mat-option value="Combat">Combat</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field *ngIf="data.scope === 'skills'" appearance="fill" style="width:100%">
        <mat-label>Initial value</mat-label>
        <input matInput type="number" min="1" step="1" [(ngModel)]="data.entry.value">
      </mat-form-field>
      <mat-form-field *ngIf="data.scope === 'main'" appearance="fill" style="width:100%">
        <mat-label>Value</mat-label>
        <input matInput type="text" [(ngModel)]="data.entry.value">
      </mat-form-field>
  </div>
  <div mat-dialog-actions align="end">
    <button mat-button mat-dialog-close>Cancel</button>
    <button mat-button [mat-dialog-close]="result" [disabled]="!canSave()">Save</button>
  </div> `
})
export class PropertyDialog {
  data: PropertyDialogData;

  constructor(
    private dialogRef: MatDialogRef<PropertyDialog>,
    @Inject(MAT_DIALOG_DATA) public incoming: PropertyDialogData
  ) {
    this.data = incoming || { entry: new PropertyEntry(), scope: 'main' };
    if (!this.data.entry) {
      this.data.entry = new PropertyEntry();
    }
    if (!this.data.scope) {
      this.data.scope = 'main';
    }
    this.data.existingNames = this.data.existingNames || [];
    this.data.existingNamesByCategory = this.data.existingNamesByCategory || {};
    this.data.originalName = this.data.originalName || '';
    this.data.entry.name = this.data.entry.name || '';
    this.data.entry.category = this.data.entry.category || 'Other';
    if (this.data.scope === 'main') {
      this.data.entry.value = this.normalizeMainValue(this.data.entry.value);
    } else {
      this.data.entry.value = this.normalizeSkillValue(this.data.entry.value);
    }
  }

  get result(): PropertyEntry {
    const value = this.data.scope === 'main'
      ? this.trimmedMainValue()
      : this.normalizeSkillValue(this.data.entry.value);
    return new PropertyEntry(
      this.trimmedName(),
      value,
      this.data.entry.category || 'Other'
    );
  }

  trimmedName(): string {
    return (this.data.entry.name || '').trim();
  }

  trimmedOriginalName(): string {
    return (this.data.originalName || '').trim();
  }

  normalizeSkillValue(value: any): number {
    const n = Number(value);
    return Number.isInteger(n) ? n : 1;
  }

  normalizeMainValue(value: any): string {
    return String(value ?? '').trim();
  }

  trimmedMainValue(): string {
    return this.normalizeMainValue(this.data.entry.value);
  }

  currentExistingNames(): string[] {
    if (this.data.scope === 'main') {
      return this.data.existingNames || [];
    }

    const category = this.data.entry.category || 'Other';
    const existingNamesByCategory = this.data.existingNamesByCategory || {};
    return existingNamesByCategory[category] || [];
  }

  isDuplicateName(): boolean {
    return hasDuplicateDialogName(
      this.currentExistingNames(),
      this.trimmedName(),
      this.trimmedOriginalName()
    );
  }

  duplicateNameMessage(): string {
    return this.data.scope === 'skills'
      ? `A skill with this name already exists in ${this.data.entry.category || 'Other'}.`
      : 'This name already exists.';
  }

  canSave(): boolean {
    const name = this.trimmedName();
    if (name.length === 0 || name.indexOf('.') >= 0) {
      return false;
    }

    if (this.isDuplicateName()) {
      return false;
    }

    if (this.data.scope === 'main') {
      return this.trimmedMainValue().length > 0;
    }

    const valueText = String(this.data.entry.value).trim();
    const value = Number(valueText);
    return valueText.length > 0 && Number.isInteger(value);
  }
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

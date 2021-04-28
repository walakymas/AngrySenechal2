import { Component, OnInit } from '@angular/core';
import { Lord } from './../lord';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { Location } from '@angular/common';
import { CharacterService } from './../character.service';
import { Logger } from '../logger.service';
import { Base } from '../base';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';

@Component({
  selector: 'app-character-detail',
  templateUrl: './character-detail.component.html',
  styleUrls: ['./character-detail.component.css']
})
export class CharacterDetailComponent implements OnInit {
//  id : number = 32;
  id : number = 63;
  traits: Trait[] = []
  healthmod: number = 0;
  char : Lord;
  details: {};
  weapon: {};
  base : Base;
  main_horse = {};
  snackBarConfig: MatSnackBarConfig;
  constructor(
    private route: ActivatedRoute,
    private service: CharacterService,
    private location: Location,
    private logger: Logger,
    private snackBar: MatSnackBar
    ) { 
      this.snackBarConfig = new MatSnackBarConfig();
      this.snackBarConfig.duration = 2000;
    }


  ngOnInit(): void {
    console.log('CharacterDetailComponent ngOnInit')
    this.route.paramMap.subscribe(data => this.load(data));
  }

  load(p:ParamMap) {
    const name = p.get('name');
    console.log('route:'+name)
    let id = +name;

    this.service.getBase().then( t => 
      {
        console.log('base in team')
        this.base = t;
        for(let t in this.base.traits) {
          this.traits.push(new Trait(this.base.traits[t][0].substring(0,3).toLowerCase(), this.base.traits[t][0], this.base.traits[t][1]));
        }
      }
    );
    if (id > 0) {
      this.service.getLord(id).subscribe( l => this.setLord(l));
    } else {
      this.service.getLordByName(name).subscribe( l => this.setLord(l));
    }
  }


  loadLord(): void {
    console.log('loadLord')
    this.service.getLord(this.id).subscribe( l => this.setLord(l));
  }

  setLord(l: Lord) {
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
    if (this.char.events) {
      this.char.events.forEach(e => {
        g += e['glory'];
        if (!y || y != e['year']*1) {
          y = e['year']*1;
          years.push(y);
        }
      });
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
    this.main_horse = this.base.horsetypes[this.char.char['winter']['horses'][0]]
    this.main_horse['hea'] = Math.round((this.main_horse['str']*1+this.main_horse['con']*1)/10);
    this.main_horse['unc'] = Math.round((this.main_horse['siz']*1+this.main_horse['con']*1)/4);
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
    this.service.setMark(name, this.char.char['memberId'], checked).then(c => {
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

  public modifyProp( prop: string, newName: string ) : void {
    console.log(`${prop}:=${newName}`)
    this.service.modifyProp(this.char.char['dbid'],prop, newName).then(c => {
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
}
export class Trait {

  constructor (  public short: string,
    public first: string,
    public second: string) {}
}
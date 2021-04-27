import { Component, OnInit } from '@angular/core';
import { Lord } from './../lord';
import { Observable, of } from 'rxjs';
import { ActivatedRoute, ParamMap, Params } from '@angular/router';
import { Location } from '@angular/common';
import { CharacterService } from './../character.service';
import { Logger } from '../logger.service';
import { Base } from '../base';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-character-detail',
  templateUrl: './character-detail.component.html',
  styleUrls: ['./character-detail.component.css']
})
export class CharacterDetailComponent implements OnInit {
//  id : number = 32;
  id : number = 63;
  traits: Trait[] = []
  
  char : Lord;
  details: {};
  weapon: {};
  base : Base;
  constructor(
    private route: ActivatedRoute,
    private service: CharacterService,
    private location: Location,
    private logger: Logger,
    private snackBar: MatSnackBar
    ) { }


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
//      let snackBarRef = this.snackBar.open('Lord refreshed');
    })
  }
  public saveProjectName( project: object,prop: string, newName: string ) : void {
		// CAUTION: Normally, I would emit some sort of "rename" event to the calling
		// context. But, for the sake of simplicity, I'm just mutating the project
		// directly since having several sibling components that both edit project names
		// is incidental and not the focus of this exploration.
    console.log(JSON.stringify(project)+':'+prop+':'+newName)
		project[prop] = newName;
    this.service.modify(this.char).then(c => {
      this.setLord(this.char);
      let snackBarRef = this.snackBar.open('Lord refreshed');
    })
	}
  sampleClick(){
    console.log('clicked!!');
  }
}
export class Trait {

  constructor (  public short: string,
    public first: string,
    public second: string) {}
}
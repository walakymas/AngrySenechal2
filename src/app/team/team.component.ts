import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { TeamMember } from '../lord';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {
  team : TeamMember[]
  constructor(private service: CharacterService,
    ) { }

  ngOnInit(): void {
    this.service.getTeam().subscribe( t => this.team = t);
  }
  
  detail(m: TeamMember, type : string)  {
      if (type === 'Damage') 
          return Math.round((m['stats']['str']*1+m['stats']['siz']*1)/6);
      else if (type === 'Healing Rate') 
          return Math.round((m['stats']['str']*1+m['stats']['con']*1)/10);
      else if (type === 'Move Rate') 
          return Math.round((m['stats']['dex']*1+m['stats']['siz']*1)/10);
      else if (type === 'Max HP ') 
          return Math.round((m['stats']['siz']*1+m['stats']['con']*1));
      else if (type === 'Unconscious') 
          return Math.round((m['stats']['con']*1+m['stats']['siz']*1)/4);
      else if (type === 'Major Wound') 
          return m['stats']['con'];
      else if (type === 'Knockdown') 
          return m['stats']['siz'];
      return '?';
  }

  teamprop(name1:string, name2:string) {
    let kmap = new Map()
    for (let i in this.team ) {
      let m = this.team[i]
      if (m[name1]) {
        let e = name2==''?m[name1]:m[name1][name2];
        //console.log(`~${name1}~${name2}~`+JSON.stringify(e))
        for (const [tn, tv] of Object.entries(e)) {
            kmap.set(tn, tv)
        }
      } else {
       // console.log(`~${name1}~${name2}~`+JSON.stringify(m))
      }
    }
    let keys = []
    for (var k of kmap.keys()) {
        keys.push(k)
    }
    keys.sort()
    console.log(`~${name1}~${name2}~`+JSON.stringify(keys))
    return keys;
  }
}

import { HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Base } from '../base';
import { CharacterService } from '../character.service';
import { LordDetail, LordData } from '../lord';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {
  modifier = 0;
  team : LordData[];
  base: Base;
  traits: Trait[] = [];
  readonly: boolean = false;
  private readonly modifierStorageKey = 'teamModifier';
  private readonly readonlyStorageKey = 'teamReadonly';
  constructor(private service: CharacterService,
    ) { }

  ngOnInit(): void {
    const stored = Number(window.localStorage.getItem(this.modifierStorageKey));
    if (Number.isInteger(stored)) {
      this.modifier = stored;
    }
    this.readonly = window.localStorage.getItem(this.readonlyStorageKey) === 'true';
    this.service.getBase().then( t =>
      {
        console.log('base in team')
        this.base = t;
        for(let t in this.base.traits) {
          this.traits.push(new Trait(this.base.traits[t][0].substring(0,3).toLowerCase(), this.base.traits[t][0], this.base.traits[t][1]));
        }
      }
    );
    this.service.getTeam().subscribe( t => this.setTeam(t));
  }

  setTeam(t: LordData[])  {
    t.sort((a, b) => a['Glory'] < b['Glory'] ? 1 : a['Glory'] > b['Glory'] ? -1 : 0);
    this.team = t;
    for (let ti in t) {
      const m = t[ti];
      console.log('setting detail for '+m['name']+' '+m['shortName']+' '+m['player']+' '+m['memberId']);
      m.detail = new LordDetail();
      m.detail.damage = Math.round((m['stats']['str']*1+m['stats']['siz']*1)/6);
      m.detail.hr  = Math.round((m['stats']['str']*1+m['stats']['con']*1)/10);
      m.detail.mr  = Math.round((m['stats']['dex']*1+m['stats']['siz']*1)/10);
      m.detail.hp  = Math.round((m['stats']['siz']*1+m['stats']['con']*1));
      m.detail.unc = Math.round((m['stats']['con']*1+m['stats']['siz']*1)/4);
      m.detail.mw  = m['stats']['con'];
      m.detail.kno = m['stats']['siz'];
      m.detail.chi = '-';
      m.detail.ahp =  m.detail.hp
      m.detail.wounds = '';
      let hp = Math.round((m['stats']['siz']*1+m['stats']['con']*1));
      if (m['health'] && m['health']['changes']) {
        for(let ii in  m['health']['changes']) {
          m.detail.ahp += m['health']['changes'][ii]*1;
          m.detail.wounds+=', '
          m.detail.wounds+=m['health']['changes'][ii];
          if (m.detail.ahp < 0) {
            m.detail.ahp =0;
          } else if (m.detail.ahp>m.detail.hp) {
            m.detail.ahp = m.detail.hp;
          }
        }
        m.detail.wounds = m.detail.wounds.replace(/^,/,'');
        if (m.detail.ahp != m.detail.hp ) {
          m.detail.chi = m['health']['chirurgery']
        }
      }
    }
  }

  detail(m: LordData, type : string)  {
      if (type === 'Damage')
          return Math.round((m['stats']['str']*1+m['stats']['siz']*1)/6);
      else if (type === 'Healing Rate')
          return Math.round((m['stats']['str']*1+m['stats']['con']*1)/10);
      else if (type === 'Move Rate')
          return Math.round((m['stats']['dex']*1+m['stats']['siz']*1)/10);
      else if (type === 'Max HP')
          return Math.round((m['stats']['siz']*1+m['stats']['con']*1));
      else if (type === 'Unconscious')
          return Math.round((m['stats']['con']*1+m['stats']['siz']*1)/4);
      else if (type === 'Major Wound')
          return m['stats']['con'];
      else if (type === 'Knockdown')
          return m['stats']['siz'];
      else if (type === 'Chirurgery')
          return m['health']['chirurgery'];
      else if (type==='Actual HP') {
          let hp = Math.round((m['stats']['siz']*1+m['stats']['con']*1));
          if (m['health'] && m['health']['changes'])
            for(let ii in  m['health']['changes']) {
              hp += m['health']['changes'][ii];
            }
          return hp;
      }
      return '?';
  }

  teamprop(name1:string, name2:string) {
    let kmap = new Map()
    for (let i in this.team ) {
      let m = this.team[i]
      if (m[name1]) {
        let e = name2==''?m[name1]:m[name1][name2];
        for (const [tn, tv] of Object.entries(e)) {
          if (!(''+tv).startsWith(".")) {
              kmap.set(tn, tv);
          }
        }
      }
    }
    let keys = []
    for (var k of kmap.keys()) {
        keys.push(k)
    }
    keys.sort()
    return keys;
  }

  saveModifier() {
    window.localStorage.setItem(this.modifierStorageKey, '' + this.modifier);
  }

  toggleReadonly() {
    this.readonly = !this.readonly;
    window.localStorage.setItem(this.readonlyStorageKey, '' + this.readonly);
  }

  bot(p:string, m:LordData) {
    if (!this.readonly && window.localStorage.getItem('userName')!=null) {
      let p_ = p.replace(/ /g,'_');
      console.log(`sending bot command for ${p_} ${this.modifier} <@!${m['memberId']}>`);
      let command = m?`check ${p_} ${this.modifier} <@!${m['memberId']}>`:`team ${p_}`;
      this.service.bot(command).subscribe(e => console.log(`sent "${command}" ${e}`));
    }
  }
}

export class Trait {

  constructor (  public short: string,
    public first: string,
    public second: string) {}
}

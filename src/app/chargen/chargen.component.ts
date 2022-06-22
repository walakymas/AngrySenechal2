import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ActivatedRoute } from '@angular/router';
import { CharacterService } from '../character.service';
import { Logger } from '../logger.service';
import { Base } from '../base';
import { Trait } from '../character-detail/character-detail.component';


@Component({
  selector: 'app-chargen',
  templateUrl: './chargen.component.html',
  styleUrls: ['./chargen.component.css'],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true }
  }]
})
export class ChargenComponent implements OnInit {

  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  base: Base = null;
  year: number = 485;
  period: string = "Uther"
  chivalry: number = 0;
  gender: string = "male";
  name: string = null;
  traitMode: string = "base";  
  skillMode: string = "base";
  attribMode: string = "base";
  traitModifiers: {} = {};
  traitModification: {} = {};
  traitModificationSum : number= 0;
  traitModificationMaxSum : number = 6;
  traitFamous : string= 'ene';
  char: {} = {
    "name": "Unknown",
    "traits": { "cha": 10, "ene": 10, "for": 10, "gen": 10, "hon": 10, "jus": 10, "mer": 10, "mod": 10, "pru": 10, "spi": 10, "tem": 10, "tru": 10, "val": 15 },
    "main": {
      "Born": 464,
      "Culture": "Cymric",
      "Homeland": "Salisbury (Logres)",
      "Religion": "British Christian",
      "Lord": "Unknown"
    },
    "stats": {
      "siz": 12, "dex": 12, "str": 12, "con": 12, "app": 12
    },
    'passions': {},
    'skills': {
      'Other': {},
      'Weapons': {},
      'Combat': {}
    }
  };
  charBase: {} = {
    "traits": { "cha": 10, "ene": 10, "for": 10, "gen": 10, "hon": 10, "jus": 10, "mer": 10, "mod": 10, "pru": 10, "spi": 10, "tem": 10, "tru": 10, "val": 15 },
    'famous': 'none',
    "stats": {
      "siz": 12, "dex": 12, "str": 12, "con": 12, "app": 12
    },
    'individualTraits': ['none', 'none', 'none', 'none', 'none', 'none', 'none', 'none', 'none'],
    'derived': {},
    'individual': {
      'p15': 'none',
      'p10': ['none','none','none'],
      'spec': ['none','none','none','none'],
      'skill': ['none','none','none','none','none','none','none','none','none','none']
    }

  };

  'traitMods': {}= {
    'f+': '<=Famoous',
    '+5': '+5',
    '+4': '+4',
    '+3': '+3',
    '+2': '+2',
    '+1': '+1',
    '0': '0',
    '-1': '-1',
    '-2': '-2',
    '-3': '-3',
    '-4': '-4',
    '-5': '-5',
    'f-': 'Famous=>'
  }

  traits: Trait[] = []
  virtues: string[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private service: CharacterService,
    private logger: Logger
  ) {
    this.service.getBase().then(t => {
      console.log('base in team')
      this.base = t;
      this.traits = [];
      for (let t in this.base.traits) {
        let short = this.base.traits[t][0].substring(0, 3).toLowerCase();
        this.traits.push(new Trait(short, this.base.traits[t][0], this.base.traits[t][1]));
        this.traitModifiers[this.base.traits[t][0]] = short + "+";
        this.traitModifiers[this.base.traits[t][1]] = short + "-";
        this.traitModification[short] = 0;
      }
      this.virtues = t.virtues['British Christian'];
      this.updateTraits();
      this.updateChivalry();
      this.initPassions();
      this.updatePeriod();
      this.updateAttr();
      this.updateSkills();
      this.genName();
      this.genLord();
      this.firstFormGroup.patchValue({
        born: 464,
        year: 485
      });
    });
  }

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      name: new FormControl('name', Validators.required),
      lord: new FormControl('lord', Validators.required),
      year: new FormControl('year', [Validators.required, Validators.min(480), Validators.max(566)]),
      born: new FormControl('born', [Validators.required, Validators.min(460), Validators.max(566)])
    });
    this.secondFormGroup = this._formBuilder.group({
    });
    this.thirdFormGroup = this._formBuilder.group({
    });   
    this.fourthFormGroup = this._formBuilder.group({
    });
    this.firstFormGroup.get('name').valueChanges.subscribe(value=>{this.name = value; this.char['main']['Name']=(this.gender == "male"?"Sir ":"Lady ") + value;});
    this.firstFormGroup.get('lord').valueChanges.subscribe(value=>this.char['main']['Lord']=value);
    this.firstFormGroup.get('year').valueChanges.subscribe(value=>{this.char['main']['Year']=value, this.year = value});
    this.firstFormGroup.get('born').valueChanges.subscribe(value=>this.char['main']['Born']=value);

  }

  genName() {
    console.log('genName')
    let names: [] = this.base.newchar[this.char['main']['Culture']][this.gender]['names'];
    this.firstFormGroup.patchValue({
      name: names[Math.floor(Math.random() * names.length)]
    });
  }

  genLord() {
    let names: [] = this.base.newchar[this.char['main']['Culture']]['male']['names'];
    this.firstFormGroup.patchValue({
      lord: 'Sir ' + names[Math.floor(Math.random() * names.length)]
    });
  }

  isChivalry(trait) {
    return this.base.chivalry.includes(trait);
  }

  isVirtue(trait) {
    return this.virtues.includes(trait);
  }

  getCulture() {
    return this.base.newchar[this.char['main']['Culture']];
  }

  getHomeland() {
    return this.char['main']['Homeland'];
  }

  getReligion() {
    return this.char['main']['Religion'];
  }

  parseDice(v) {
    console.log('parseDice:' + v)
    let patt = /(\d+)d(\d+)([+-]\d+)?/;
    let s = String(v)
    let match = s.match(patt);
    if (match) {
      let d = this.random(match[1], match[2])
    }
    return s;
  }

  initPassions() {
    let passions = {};
    for (let [n, v] of Object.entries(this.getCulture()['passions'])) {
      passions[n] = this.parseDice(v);
    }
    if (this.getHomeland() in this.getCulture()['homeland']) {
      let k: string = this.getCulture()['homeland'][this.getHomeland()];
      let split = k.split(';')
      for (let i in split) {
        if (split[i].indexOf('All') || split[i].indexOf('Period') ) {
          passions[split[i].substring(split[i].indexOf('―') + 1)] = this.random(4, 6) + 1;
        }
      }
    }
    this.char['passions'] = passions;
  }

  changeReligion(event) {
    for (const [n, v] of Object.entries(this.base.virtues)) {
      if (this.char['main']['Religion'] == n) {
        this.virtues = this.base.virtues[n];
      }
    }
    this.changeTrait(null, 'method');
  }

  updateTraits() {
    let tr: {} = {};

    if (this.char['main']['Religion'] in this.getCulture()['traits']) {
      tr = this.getCulture()['traits'][this.char['main']['Religion']];
    } else {
      tr = this.base.default['traits'];
    }
    for (let i in tr) {
      this.char['traits'][i] = tr[i];
      this.charBase['traits'][i] = tr[i];
    }
  }

  dice(size) {
    return Math.floor(Math.random() * size) + 1;
  }

  random(db, size) {
    let result = 0;
    for (let i = 0; i < db; i++) {
      result += this.dice(size);
    }
    return result;
  }

  modTrait(traits, mod) {
    traits[mod.substring(0, 3)] += mod.substring(3, 1) == '-' ? -3 : 3;
  }

  isSliderDisabled(s) {
    return this.traitModificationSum>=this.traitModificationMaxSum && this.traitModification[s.substring(0,3)]==0;
  }

  sliderMax(s, first:boolean=true) {
    let m = this.traitModificationMaxSum+Math.abs(this.traitModification[s])-this.traitModificationSum;
    if (first) {
      if( this.traitFamous == s+"+") {
        m = Math.min(3,m);
      } else {
        m = Math.min(19- this.charBase['traits'][s] ,m);
      }

    } else {
      if( this.traitFamous == s+"-") {
        m = Math.min(3,m);
      } else {
        m = Math.min(this.charBase['traits'][s]-1 ,m);
      }
    }
    console.log(s+":"+this.traitFamous+":"+m);
    return m;
  }

  changeTrait(event, mode) {
    console.log('changeTrait mode:'+mode+":"+this.traitFamous+":"+this.traitFamous.charAt(3)+":")
    if (mode == 'method' && this.traitMode == 'random') {
        for (let i in this.char['traits']) {
          this.charBase['traits'][i] = this.random(3, 6);
        }
        for (let i in this.virtues) {
          let mod = this.traitModifiers[this.virtues[i]];
          this.modTrait(this.charBase['traits'], mod);
        }
    }
    if (this.traitMode == 'random') {
      for (let i in this.char['traits']) {
        this.char['traits'][i] = this.charBase['traits'][i];
      }
      this.traitModificationMaxSum = 9;
    } else {
      this.updateTraits();
      this.traitModificationMaxSum = 6;
    }

    if (mode=='traitFamous' && this.traitFamous!='none' ) {
      this.traitModification[this.traitFamous.substring(0,3)]=0;
    }

    if (this.traitFamous!='none' ) {
      this.char['traits'][this.traitFamous.substring(0,3)] = this.traitFamous.charAt(3)=='+'?16:4;
    }

    this.traitModificationSum = 0;
    for (let i in this.traits) {
      let t = this.traits[i];
      this.charBase['traits'][t.short] = this.char['traits'][t.short];
      let v = this.traitModification[t.short];
      this.char['traits'][t.short]+= Number(v);
      this.traitModificationSum += Math.abs(Number(v));
    }
    if (this.charBase['famous'] != 'none') {
      this.char['traits'][this.charBase['famous'].substring(0, 3)] = this.charBase['famous'].substring(3, 4) == '-' ? 4 : 16;
    }
    for (let i = 0; i < 6; i++) {
      if (this.charBase['individual'][i] != 'none') {
        this.char['traits'][this.charBase['individualTraits'][i].substring(0, 3)] += this.charBase['individualTraits'][i].substring(3, 4) == '-' ? -1 : +1;
      }
    }
    if (this.traitMode == 'random') {
      for (let i = 6; i < 9; i++) {
        if (this.charBase['individual'][i] != 'none') {
          this.char['traits'][this.charBase['individualTraits'][i].substring(0, 3)] += this.charBase['individualTraits'][i].substring(3, 4) == '-' ? -1 : +1;
        }
      }
    }
    for (let i in this.char['traits']) {
      if (this.char['traits'][i]<1) {
        this.char['traits'][i]=1
      } else if (this.char['traits'][i]>19) {
        this.char['traits'][i]=19
      }
    }
    this.updateChivalry();
  }

  updateChivalry() {
    let chivalry: number = 0;
    for(let c in this.base.chivalry) {
      chivalry += this.getTrait(this.base.chivalry[c])
    }
    this.chivalry = chivalry
  }

  getTrait(t) {
    if (this.traitModifiers[t].substring(3,4)=='-') {
      return 20-this.char['traits'][this.traitModifiers[t].substring(0,3)]
    } else {
      return this.char['traits'][this.traitModifiers[t].substring(0,3)]
    }
  }

  public isEq(s1: string, s2: string): boolean {
    let result = s1 == s2;
    return result;
  }

  isRandom() {
    return this.traitMode == 'random';
  }

  updatePeriod() {
    for (let i in this.base.periods) {
      if (this.base.periods[i][1] > this.year) {
        this.period = this.base.periods[Number(i) - 1][0];
        this.char['main']['Period'] = this.period;
        return;
      }
    }
  }

  updateGender() {
    this.char['main']['Name'] = (this.gender=="male"?"Sir ": "Lady ") + this.name;
    this.updateSkills();
  }

  updateSkills() {
    let skills = JSON.parse(JSON.stringify(this.getCulture()[this.gender]['skills']))
    this.char['skills'] = skills
    if (this.charBase['individual']['p15']!='none') {
      let sp = this.charBase['individual']['p15'].split('.');
      this.char['skills'][sp[1]][sp[2]]=15;    
    }
    for(let i = 0; i<3; i++) {
      if (this.charBase['individual']['p10'][i]!='none') {
        let sp = this.charBase['individual']['p10'][i].split('.');
        this.char['skills'][sp[1]][sp[2]]=10;    
      }
    }
    for(let i = 0; i<10; i++) {
      if (this.charBase['individual']['skill'][i]!='none') {
        let sp = this.charBase['individual']['skill'][i].split('.');
        this.char['skills'][sp[1]][sp[2]] += 1;    
      }
    }
  }

  updateCulture() {
    let culture: string = this.char['main']['Culture'];
    let religion: string = this.char['main']['Religion'];
    if (!this.base.newchar[culture].traits[religion]) {
      this.char['main']['Religion'] = Object.keys(this.base.newchar[culture].traits)[0];
    } 
    this.initPassions();
    this.updateSkills();
  }

  changeAttrib(method) {
    if (this.attribMode == 'random') {
      if (this.gender=='male') {
        this.charBase['stats']['siz'] = this.random(3, 6)+4;
        this.charBase['stats']['dex'] = this.random(3, 6)+1;
        this.charBase['stats']['str'] = this.random(3, 6)+1;
        this.charBase['stats']['con'] = this.random(3, 6)+1;
        this.charBase['stats']['app'] = this.random(3, 6)+1;
      } else {
        this.charBase['stats']['siz'] = this.random(2, 6)+2;
        this.charBase['stats']['dex'] = this.random(3, 6)+1;
        this.charBase['stats']['str'] = this.random(2, 6)+2;
        this.charBase['stats']['con'] = this.random(3, 6)+1;
        this.charBase['stats']['app'] = this.random(3, 6)+5;
      }
    } else {
      for(let i in this.charBase['stats']) {
        this.charBase['stats'][i]=12;
      }
    }
    this.updateAttr();
  }

  attr(a, m) {
    this.charBase['stats'][a]+=m;
    this.updateAttr();
  }

  attrMod(k) {
    if (this.getCulture()['attributes'][k]) {
      return (this.getCulture()['attributes'][k]>0? '+':'')+this.getCulture()['attributes'][k];
    } else {
      return '';
    }
  }

  updateAttr() {
    for(let i in this.charBase['stats']) {
      this.char['stats'][i]=this.charBase['stats'][i];
    }
    for(let i in this.getCulture()['attributes']) {
      this.char['stats'][i]+=this.getCulture()['attributes'][i]
    }
    this.charBase['derived']['Damage']= Math.round((this.char['stats']['str']*1+this.char['stats']['siz']*1)/6)+"d6";
    this.charBase['derived']['Healing Rate']= Math.round((this.char['stats']['str']*1+this.char['stats']['con']*1)/10);
    this.charBase['derived']['Move Rate'] = Math.round((this.char['stats']['dex']*1+this.char['stats']['siz']*1)/10);
    this.charBase['derived']['Total Hitpoints'] = Math.round((this.char['stats']['siz']*1+this.char['stats']['con']*1));
    this.charBase['derived']['Unconscious'] = Math.round((this.char['stats']['con']*1+this.char['stats']['siz']*1)/4);
    this.charBase['derived']['Major Wound'] = this.char['stats']['con'];
    this.charBase['derived']['Knockdown'] = this.char['stats']['siz'];
  }

  listP15() {
    let result = {};
    if (this.gender=='male') {
      for(let i in this.char['skills']['Combat']) {result[i]='skill.Combat.'+i }
      for(let i in this.char['skills']['Weapons']) {result[i]='skill.Weapons.'+i }
      for(let i in this.char['skills']['Other']) {result[i]='skill.Other.'+i }
    } else {
      result = {
        'Siege':'skill.Combat.Siege', 'Dagger':'skill.Weapons.Dagger'
      }
      for(let i in this.char['skills']['Other']) {result[i]='skill.Other.'+i }
    }
    return result;
  }
  listP10() {
    let result = {};
    if (this.gender=='male') {
      for(let i in this.char['skills']['Other']) {result[i]='skill.Other.'+i }
    } else {
      result = {
        'Siege':'skill.Combat.Siege', 'Dagger':'skill.Weapons.Dagger'
      }
      for(let i in this.char['skills']['Other']) {result[i]='skill.Other.'+i }
    }
    return result;
  }
  listSkill() {
    let result = {};
    for(let i in this.char['skills']['Other']) {result[i]='skill.Other.'+i }
    return result;
  }
  listSpecial() {
    let result = {};
    for(let i in this.char['skills']['Combat']) {result[i]='skill.Combat.'+i }
    for(let i in this.char['skills']['Weapons']) {result[i]='skill.Weapons.'+i }
    for(let i in this.char['skills']['Other']) {result[i]='skill.Other.'+i }
    for(let i in this.traitModifiers) {result[i]='trait.'+i; result[i]='trait.'+i;}
    for(let i in this.char['passions']) {result[i]='passion.'+i;}
    return result;
  }
}

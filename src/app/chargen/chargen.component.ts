import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { ActivatedRoute } from '@angular/router';
import { CharacterService } from '../character.service';
import { Logger } from '../logger.service';
import { Base } from '../base';
import { Trait } from '../character-detail/character-detail.component';
import { NONE_TYPE } from '@angular/compiler';


@Component({
  selector: 'app-chargen',
  templateUrl: './chargen.component.html',
  styleUrls: ['./chargen.component.css'],
  providers: [{
    provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true }
  }]
})
export class ChargenComponent implements OnInit {
  base: Base = null;

  mainFormGroup: FormGroup;
  traitFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  year: number = 485;
  period: string = "Uther"
  chivalry: number = 0;
  gender: string = "male";
  name: string = null;
  traitMode: string = "base";  
  skillMode: string = "base";
  attribMode: string = "base";
  traitAct = 'none';
  traitModifiers: {} = {};
  traitModification: {} = {};
  attrSum : number= 0;
  traitModificationSum : number= 0;
  traitModificationMaxSum : number = 6;
  skillModificationSum : number= 0;
  char: {} = {};
  charBase: {} = {};
  charInitial: {} = {
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
    },
    'charBase': {
      "traits": { "cha": 10, "ene": 10, "for": 10, "gen": 10, "hon": 10, "jus": 10, "mer": 10, "mod": 10, "pru": 10, "spi": 10, "tem": 10, "tru": 10, "val": 15 },
      "traitPhase": { "cha": 10, "ene": 10, "for": 10, "gen": 10, "hon": 10, "jus": 10, "mer": 10, "mod": 10, "pru": 10, "spi": 10, "tem": 10, "tru": 10, "val": 15 },
      'traitModification': {},
      'famous': 'none',
      "stats": {
        "siz": 12, "dex": 12, "str": 12, "con": 12, "app": 12
      },
      'derived': {},
      'skills': {},
      'individual': {
        'p15': 'none',
        'p10': ['none','none','none'],
        'spec': ['none','none','none','none'],
        'disc': {},
        'skills': {}
      }  
    }
  };

  individual: {} = {
    'disc': {},
    'skills': {}
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
      let newchar = window.localStorage.getItem('newchar');
      this.char = JSON.parse(newchar == null? JSON.stringify(this.charInitial) : newchar);
      this.charBase = this.char['charBase'];
      this.traitModification = this.charBase['traitModification'];
      this.individual = this.charBase['individual'];
      for (let t in this.base.traits) {
        let short = this.base.traits[t][0].substring(0, 3).toLowerCase();
        this.traits.push(new Trait(short, this.base.traits[t][0], this.base.traits[t][1]));
        this.traitModifiers[this.base.traits[t][0]] = short + "+";
        this.traitModifiers[this.base.traits[t][1]] = short + "-";
        if (newchar==null) {
          this.traitModification[short] = 0;
        }
      }
      this.virtues = t.virtues['British Christian'];
      if (newchar==null) {
        this.genName();
        this.genLord();
      } else {
        this.mainFormGroup.patchValue({
          name: this.char['main']['Name'],
          lord: this.char['main']['Lord']
        });
      }
      this.initMainPhase();
      this.updateMainPhase();

      this.mainFormGroup.patchValue({
        born: 464,
        year: 485
      });
    });
  }

  ngOnInit() {
    this.mainFormGroup = this._formBuilder.group({
      name: new FormControl('name', Validators.required),
      lord: new FormControl('lord', Validators.required),
      year: new FormControl('year', [Validators.required, Validators.min(480), Validators.max(566)]),
      born: new FormControl('born', [Validators.required, Validators.min(460), Validators.max(566)])
    });
    this.traitFormGroup = this._formBuilder.group({
    });
    this.thirdFormGroup = this._formBuilder.group({
      sum: new FormControl({value: 60}, Validators.max(60))
    });   
    this.fourthFormGroup = this._formBuilder.group({
    });
    this.mainFormGroup.get('name').valueChanges.subscribe(value=>{this.name = value; this.char['main']['Name']= value; this.save(); });
    this.mainFormGroup.get('lord').valueChanges.subscribe(value=>{this.char['main']['Lord']=value; this.save();});
    this.mainFormGroup.get('year').valueChanges.subscribe(value=>{this.char['main']['Year']=value; this.year = value; this.save();});
    this.mainFormGroup.get('born').valueChanges.subscribe(value=>{this.char['main']['Born']=value; this.save(); });
  }

  public onStepChange(event: any): void {
    if (event.selectedIndex==1) {
      this.updateMainPhase();
    } else if (event.selectedIndex==2) {
      this.updateTraitPhase();
    } else if (event.selectedIndex==3) {
      this.updateAttributesPhase();
    } else if (event.selectedIndex==4) {
      this.updateSkillPhase();
    } 
  }



/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            SHARED
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */ 

  getChar() {
    return JSON.stringify(this.char, null, 2);
  }

   parseDice(v) {
    let patt = /(\d+)d(\d+)([+-]\d+)?/;
    let s = String(v)
    let match = s.match(patt);
    if (match) {
      let d = this.random(match[1], match[2])
    }
    return s;
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

  getCulture() {
    return this.base.newchar[this.char['main']['Culture']];
  }

  getHomeland() {
    return this.char['main']['Homeland'];
  }

  getReligion() {
    return this.char['main']['Religion'];
  }

  public isEq(s1: string, s2: string): boolean {
    let result = s1 == s2;
    return result;
  }

  save() {
    console.log('save');
    window.localStorage.setItem('newchar',JSON.stringify(this.char));
  }

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              MAIN INFOS
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */ 

  initMainPhase() {
    this.traitsByReligion();
    this.initPassions();
    this.updatePeriod();  
    this.initTraitPhase();
  }

  updateMainPhase() {
    this.updateSkillPhase();
  }

  genName() {
    let names: [] = this.getCulture()[this.gender]['names'];
    this.mainFormGroup.patchValue({
      name: (this.gender == "male"?"Sir ":"Lady ") + names[Math.floor(Math.random() * names.length)]
    });
  }

  genLord() {
    let names: [] = this.getCulture()['male']['names'];
    this.mainFormGroup.patchValue({
      lord: 'Sir ' + names[Math.floor(Math.random() * names.length)]
    });
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

  changeReligion() {
    for (const [n, v] of Object.entries(this.base.virtues)) {
      if (this.char['main']['Religion'] == n) {
        this.virtues = this.base.virtues[n];
      }
    }
    this.updateTraitPhase();
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
    this.initSkills();
    this.updateSkillPhase();
  }

  updateCulture() {
    let culture: string = this.char['main']['Culture'];
    let religion: string = this.char['main']['Religion'];
    if (!this.base.newchar[culture].traits[religion]) {
      this.char['main']['Religion'] = Object.keys(this.base.newchar[culture].traits)[0];
      this.changeReligion();
    } 
    this.initPassions();
    this.initSkills();
    this.updateSkillPhase();
  }

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              Traits
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */ 

  initTraitPhase() {
    this.initAttributesPhase();
  }

  updateTraitPhase() {
    console.log('updateTraitPhase')
    this.changeTrait();
    this.updateAttributesPhase();
  }

  isChivalry(trait) {
    return this.base.chivalry.includes(trait);
  }

  isVirtue(trait) {
    return this.virtues.includes(trait);
  }

  setTraitAct(s) {
    this.traitAct = s == this.traitAct ? null : s;
  }

  traitsByReligion() {
    let tr: {} = {};

    if (this.char['main']['Religion'] in this.getCulture()['traits']) {
      tr = this.getCulture()['traits'][this.char['main']['Religion']];
    } else {
      tr = this.base.default['traits'];
    }
    for (let i in tr) {
      this.char['traits'][i] = tr[i];
      this.charBase['traits'][i] = tr[i];
      this.charBase['traitPhase'][i] = tr[i];
    }
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
      if( this.charBase['famous'] == s+"+") {
        m = Math.min(3,m);
      } else {
        m = Math.min(19- this.charBase['traits'][s] ,m);
      }

    } else {
      if( this.charBase['famous'] == s+"-") {
        m = Math.min(3,m);
      } else {
        m = Math.min(this.charBase['traits'][s]-1 ,m);
      }
    }
    return m;
  }

  changeTraitMethod() {
    if (this.traitMode == 'random') {
        for (let i in this.char['traits']) {
          this.charBase['traits'][i] = this.random(3, 6);
        }
        for (let i in this.virtues) {
          let mod = this.traitModifiers[this.virtues[i]];
          this.modTrait(this.charBase['traits'], mod);
        }
    }
    this.changeTrait();
  }

  changeTraitFamous() {
    if (this.charBase['famous']!='none' ) {
      this.traitModification[this.charBase['famous'].substring(0,3)]=0;
    }
    this.changeTrait();
  }

  changeTrait(mode=null) {
    if (this.traitMode == 'random') {
      for (let i in this.char['traits']) {
        this.char['traits'][i] = this.charBase['traits'][i];
      }
      this.traitModificationMaxSum = 9;
    } else {
      this.traitsByReligion();
      this.traitModificationMaxSum = 6;
    }

    let traits = this.charBase['traitPhase']; 


    this.traitModificationSum = 0;
    for (let i in this.traits) {
      let t = this.traits[i];
      let v = this.traitModification[t.short];
      traits[t.short]+= Number(v);
      this.traitModificationSum += Math.abs(Number(v));
    }
    if (this.charBase['famous'] != 'none') {
      traits[this.charBase['famous'].substring(0, 3)] = this.charBase['famous'].substring(3, 4) == '-' ? 4 : 16;
    }
    this.updateChivalry();
    this.save();
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

  isRandom() {
    return this.traitMode == 'random';
  }

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              Attributes
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */ 
   initAttributesPhase() {
    this.initSkillPhase();
  }


   updateAttributesPhase() {
    this.updateAttr();
    this.updateSkillPhase();
  }

  updateAttr() {
    let attrSum = 0; 
    for(let i in this.charBase['stats']) {
      this.char['stats'][i]=this.charBase['stats'][i];
      attrSum += this.charBase['stats'][i];
    }
    this.thirdFormGroup.get('sum').setValue(attrSum);
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

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              Skill
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */ 
  initSkillPhase() {

  }

  updateSkillPhase() {
    this.updateSkills();
    this.updateChivalry();    
    this.save();
  }

  initSkills() {
    this.individual['skills']={};
    for(let i in this.char['skills']['Combat'])  {this.individual['skills']['skills.Combat.'+i]  = {name:i,value:this.char['skills']['Combat'][i]} }
    for(let i in this.char['skills']['Weapons']) {this.individual['skills']['skills.Weapons.'+i] = {name:i,value:this.char['skills']['Weapons'][i]} }
    for(let i in this.char['skills']['Other'])   {this.individual['skills']['skills.Other.'+i]   = {name:i,value:this.char['skills']['Other'][i]} }
    this.updateSkillPhase();
  }

  updateSkills() {
    this.changeTrait();
    let skills = JSON.parse(JSON.stringify(this.getCulture()[this.gender]['skills']))
    this.char['skills'] = skills
    this.char['traits'] = JSON.parse(JSON.stringify(this.charBase['traitPhase']));

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
    for(let i = 0; i<4; i++) {
      if (this.charBase['individual']['spec'][i]!='none') {
        let sp = this.charBase['individual']['spec'][i].split('.');
        if (sp[0]=='skill') {
          this.char['skills'][sp[1]][sp[2]] = this.char['skills'][sp[1]][sp[2]] + 5;
          if (this.char['skills'][sp[1]][sp[2]] >15) {
            this.char['skills'][sp[1]][sp[2]] = 15;
          }
        } else if (sp[0]=='passion'){
          if (this.char['passions'][sp[1]] >20) {
            this.char['passions'][sp[1]] = 20;
          }
        } else {
          if (sp[1].substring(3)=='+') {
            this.char['traits'][sp[1].substring(0,3)] += 1;
          } else {
            this.char['traits'][sp[1].substring(0,3)] -= 1;
          }
        }
      }
    }
    this.skillModificationSum = 0;
    for(let i in this.individual['disc']) {
      if (this.individual['disc'][i]>0 ) {
        let sp = i.split('.');
        if (this.char['skills']['Other'][i]) {
          this.char['skills']['Other'][i] += this.individual['disc'][i];    
          this.skillModificationSum += this.individual['disc'][i];
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
  }

  skillSliderMax(s) {
    let r = 10-this.skillModificationSum;
    if (this.individual['disc'][s]) {
      r += this.individual['disc'][s];
    }
    return r;
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
    for(let i in this.traits) {let t = this.traits[i]; result['T: '+t.first]='trait.'+t.short+"+"; result['T: '+t.second]='trait.'+t.short+"-";}
    for(let i in this.char['passions']) {result['P: '+i]='passion.'+i;}
    for(let i in this.char['skills']['Combat']) {result['S: '+i]='skill.Combat.'+i }
    for(let i in this.char['skills']['Weapons']) {result['S: '+i]='skill.Weapons.'+i }
    for(let i in this.char['skills']['Other']) {result['S: '+i]='skill.Other.'+i }
    return result;
  }

}

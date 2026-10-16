import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CharacterService } from '../character.service';
import { Logger } from '../logger.service';
import { Base, FamilyCharacteristic } from '../base';
import { Lord } from '../lord';
import { Trait } from '../character-detail/character-detail.component';
import { BelongingsResult, rollBelongings } from './chargen-belongings';
import { CHARGEN_VERSION, clearChargenState, loadChargenState, saveChargenState } from './chargen-storage';

/** Kezdő lovak: az első a fő hátas (a karakterlap és a téli fázis így használja). */
export const STARTING_HORSES = ['charger', 'rouncy', 'rouncy', 'sumpter'];

@Component({
    selector: 'app-chargen',
    templateUrl: './chargen.component.html',
    styleUrls: ['./chargen.component.css'],
    providers: [{
            provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true }
        }],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ChargenComponent implements OnInit {
  @ViewChild('stepper') stepper: MatStepper;

  base: Base = null;
  lord: Lord = null;
  dbid: number = null;
  ready: boolean = false;
  saving: boolean = false;
  step: number = 0;
  snackBarConfig: MatSnackBarConfig;

  mainFormGroup: FormGroup;
  traitFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  fourthFormGroup: FormGroup;
  year: number = 485;
  period: string = "Uther"
  chivalry: number = 0;
  gender: string = "male";
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
  attributeSum: number = 60;
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
      'family': 'none',
      'familyRoll': null,
      'belongings': null,
      'passionsBase': {},
      'extraPassions': {},
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
    private router: Router,
    private service: CharacterService,
    private logger: Logger,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.snackBarConfig = new MatSnackBarConfig();
    this.snackBarConfig.duration = 2000;
  }

  ngOnInit() {
    this.mainFormGroup = this._formBuilder.group({
      name: new FormControl({value: '', disabled: true}),
      lord: new FormControl('lord', Validators.required),
      year: new FormControl('year', [Validators.required, Validators.min(480), Validators.max(566)]),
      born: new FormControl('born', [Validators.required, Validators.min(460), Validators.max(566)])
    });
    this.traitFormGroup = this._formBuilder.group({
    });
    this.thirdFormGroup = this._formBuilder.group({
      sum: new FormControl({value: 60, disabled: false}, Validators.max(60))
    });
    this.fourthFormGroup = this._formBuilder.group({
    });
    this.mainFormGroup.get('lord').valueChanges.subscribe(value=>{this.char['main']['Lord']=value; this.save();});
    this.mainFormGroup.get('year').valueChanges.subscribe(value=>{this.char['main']['Year']=value; this.year = value; this.save();});
    this.mainFormGroup.get('born').valueChanges.subscribe(value=>{this.char['main']['Born']=value; this.save(); });
    this.init();
  }

  /** Betölti az alapadatokat és a karaktert, majd visszaállítja a megszakított folyamatot (ha van). */
  async init() {
    this.ready = false;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.base = await this.service.getBase();
    const lord = await firstValueFrom(this.service.getLord(id));
    if (!lord || !lord['char']) {
      this.router.navigate(['character']);
      return;
    }
    this.lord = lord;
    this.dbid = id;
    try {
      window.localStorage.removeItem('newchar');
    } catch (e) {
    }

    const saved = loadChargenState(id);
    const fresh = saved == null;
    this.char = fresh ? JSON.parse(JSON.stringify(this.charInitial)) : saved.char;
    this.charBase = this.char['charBase'];
    this.charBase['family'] = this.charBase['family'] ?? 'none';
    this.charBase['familyRoll'] = this.charBase['familyRoll'] ?? null;
    this.charBase['belongings'] = this.charBase['belongings'] ?? null;
    this.charBase['extraPassions'] = this.charBase['extraPassions'] ?? {};
    this.charBase['passionsBase'] = this.charBase['passionsBase'] ?? JSON.parse(JSON.stringify(this.char['passions']));
    this.traitModification = this.charBase['traitModification'];
    this.individual = this.charBase['individual'];
    if (fresh) {
      this.char['name'] = lord.char['name'];
      this.gender = String(lord.char['name']).indexOf('Lady') == 0 ? 'female' : 'male';
      this.traitMode = 'base';
      this.attribMode = 'base';
      this.step = 0;
    } else {
      this.gender = saved.gender;
      this.traitMode = saved.traitMode;
      this.attribMode = saved.attribMode;
      this.step = saved.step;
    }

    this.traits = [];
    this.traitModifiers = {};
    for (let t in this.base.traits) {
      let short = this.base.traits[t][0].substring(0, 3).toLowerCase();
      this.traits.push(new Trait(short, this.base.traits[t][0], this.base.traits[t][1]));
      this.traitModifiers[this.base.traits[t][0]] = short + "+";
      this.traitModifiers[this.base.traits[t][1]] = short + "-";
      if (fresh) {
        this.traitModification[short] = 0;
      }
    }
    this.virtues = this.base.virtues[this.char['main']['Religion']] || [];

    this.mainFormGroup.patchValue({
      name: lord.char['name'],
      lord: this.char['main']['Lord'],
      born: fresh ? 464 : saved.mainForm.born,
      year: fresh ? 485 : saved.mainForm.year
    });
    this.year = this.mainFormGroup.get('year').value;
    if (fresh) {
      this.genLord();
      this.initMainPhase();
    } else {
      this.updatePeriod();
    }
    this.updateMainPhase();
    this.updateAttr();

    this.ready = true;
    this.cdr.detectChanges();
    if (this.step > 0 && this.stepper) {
      this.stepper.selectedIndex = this.step;
    }
    this.save();
  }

  public onStepChange(event: any): void {
    this.step = event.selectedIndex;
    if (event.selectedIndex==1) {
      this.updateMainPhase();
    } else if (event.selectedIndex==2) {
      this.updateTraitPhase();
    } else if (event.selectedIndex==3) {
      this.updateAttributesPhase();
    } else if (event.selectedIndex>=4) {
      this.updateSkillPhase();
    }
    this.save();
  }

  /** Új kezdés: a mentett állapot eldobása és a folyamat elölről indítása. */
  restart() {
    clearChargenState(this.dbid);
    this.step = 0;
    this.traitMode = 'base';
    this.attribMode = 'base';
    this.init();
  }

  cancel() {
    this.router.navigate(['character/' + this.lord.char['name']]);
  }

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            VALIDATION
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

  mainValid(): boolean {
    return !!this.mainFormGroup && this.mainFormGroup.valid && this.familyValid();
  }

  /** Férfiaknál kötelező a családi jellemző (1d20 dobás); a hölgyek női ági adottságait ez a lépés nem kezeli. */
  familyValid(): boolean {
    return this.gender != 'male' || this.familyEntry() != null;
  }

  traitsValid(): boolean {
    return this.traitModificationSum == this.traitModificationMaxSum;
  }

  attrTotal(): number {
    let sum = 0;
    for (let i in this.charBase['stats']) {
      sum += Number(this.charBase['stats'][i]);
    }
    return sum;
  }

  attributesValid(): boolean {
    return this.attribMode == 'random' || this.attrTotal() == 60;
  }

  skillsValid(): boolean {
    const ind = this.charBase['individual'];
    return ind['p15'] != 'none'
      && ind['p10'].every(s => s != 'none')
      && ind['spec'].every(s => s != 'none')
      && this.skillModificationSum == 10;
  }

  /** A Table 2.2 szerinti kezdő felszerelést egyszer kell megdobni. */
  belongingsValid(): boolean {
    return this.charBase['belongings'] != null;
  }

  belongings(): BelongingsResult | null {
    return this.charBase['belongings'];
  }

  rollBelongingsOnce() {
    if (this.belongingsValid()) {
      return;
    }
    this.charBase['belongings'] = rollBelongings(n => this.dice(n), this.char['main']['Religion']);
    this.save();
  }

  /** Mi hiányzik még az adott lépés teljesítéséhez (a lineáris stepper csak teljes lépések után enged tovább). */
  stepMissing(step: number): string[] {
    const missing: string[] = [];
    if (!this.charBase || !this.charBase['individual']) {
      return missing;
    }
    if (step == 0) {
      if (!this.mainFormGroup.valid) {
        missing.push('alapadatok (év 480–566, születés 460–566, lord)');
      }
      if (!this.familyValid()) {
        missing.push('családi jellemző (dobás)');
      }
    } else if (step == 1) {
      if (!this.traitsValid()) {
        missing.push(`trait pontok ${this.traitModificationSum}/${this.traitModificationMaxSum}`);
      }
    } else if (step == 2) {
      if (!this.attributesValid()) {
        missing.push(`attribútumok összege ${this.attrTotal()}/60`);
      }
    } else if (step == 3) {
      const ind = this.charBase['individual'];
      if (ind['p15'] == 'none') {
        missing.push('P15 skill');
      }
      const p10 = ind['p10'].filter(s => s == 'none').length;
      if (p10 > 0) {
        missing.push(`${p10} P10 skill`);
      }
      const spec = ind['spec'].filter(s => s == 'none').length;
      if (spec > 0) {
        missing.push(`${spec} Spec választás`);
      }
      if (this.skillModificationSum != 10) {
        missing.push(`skillpontok ${this.skillModificationSum}/10`);
      }
    } else if (step == 5) {
      if (!this.belongingsValid()) {
        missing.push('kezdő felszerelés dobás');
      }
    }
    return missing;
  }

  goNext() {
    this.stepper?.next();
  }

  goBack() {
    this.stepper?.previous();
  }

  allValid(): boolean {
    return this.mainValid() && this.traitsValid() && this.attributesValid() && this.skillsValid() && this.belongingsValid();
  }

/* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            SHARED
  ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

  getChar() {
    return JSON.stringify(this.char, null, 4);
  }

  parseDice(v) {
    let patt = /^\s*(\d+)d(\d+)\s*([+-]\s*\d+)?\s*$/;
    let match = String(v).match(patt);
    if (match) {
      let mod = match[3] ? Number(match[3].replace(/\s/g, '')) : 0;
      return this.random(Number(match[1]), Number(match[2])) + mod;
    }
    return v;
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
    if (!this.ready) {
      return;
    }
    saveChargenState({
      version: CHARGEN_VERSION,
      dbid: this.dbid,
      step: this.step,
      gender: this.gender,
      traitMode: this.traitMode,
      attribMode: this.attribMode,
      mainForm: {
        name: this.mainFormGroup.getRawValue().name,
        lord: this.mainFormGroup.value.lord,
        year: this.mainFormGroup.value.year,
        born: this.mainFormGroup.value.born
      },
      char: this.char
    });
  }

  /** A meglévő karakter adataira rávezeti az alkotás eredményét; a segédadatok (charBase) nem kerülnek bele. */
  buildCharacter(): {} {
    const out = JSON.parse(JSON.stringify(this.lord.char));
    const c = JSON.parse(JSON.stringify(this.char));
    out['main'] = out['main'] || {};
    for (const k of ['Born', 'Culture', 'Homeland', 'Religion', 'Lord']) {
      out['main'][k] = c['main'][k];
    }
    out['stats'] = c['stats'];
    out['traits'] = c['traits'];
    out['passions'] = c['passions'];
    out['skills'] = c['skills'];
    const family = this.familyDescription();
    if (family) {
      out['main']['Family Characteristic'] = family;
    }
    const extra: BelongingsResult | null = this.charBase['belongings'];
    out['winter'] = { ...(out['winter'] || {}), horses: [...STARTING_HORSES, ...(extra?.horses || [])] };
    if (extra) {
      const money = ((out['economy'] = out['economy'] || {})['money'] = out['economy']['money'] || {});
      money['silver'] = (money['silver'] || 0) + extra.money.silver;
      money['font'] = (money['font'] || 0) + extra.money.font;
      if (extra.items.length > 0) {
        out['belongings'] = [...(out['belongings'] || []), ...extra.items];
      }
    }
    return out;
  }

  async finish() {
    if (!this.allValid() || this.saving) {
      return;
    }
    this.saving = true;
    const out = this.buildCharacter();
    const result = await this.service.modifyChar(out);
    this.saving = false;
    if (!result || !result['char']) {
      this.snackBar.open('A karakter mentése nem sikerült, a folyamat állapota megmaradt.', 'Ok', this.snackBarConfig);
      return;
    }
    clearChargenState(this.dbid);
    this.snackBar.open('Karakter elkészült', 'Ok', this.snackBarConfig);
    this.router.navigate(['character/' + out['name']]);
  }

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              MAIN INFOS
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

  initMainPhase() {
    this.traitsByReligion();
    this.updatePeriod();
    this.initPassions();
    this.initTraitPhase();
  }

  updateMainPhase() {
    this.updateSkillPhase();
  }

  genLord() {
    let names: [] = this.getCulture()['male']['names'];
    this.mainFormGroup.patchValue({
      lord: 'Sir ' + names[Math.floor(Math.random() * names.length)]
    });
  }

  /** A "Hate ..." passziók időszak-feltétele: "All Periods", "Uther/Anarchy", "Boy King onward". */
  periodApplies(text: string): boolean {
    if (text.indexOf('All') >= 0) {
      return true;
    }
    const periods: string[] = (this.base.periods as any[]).map(p => p[0]);
    const onward = text.match(/^\s*(.+?)\s+onward\s*$/);
    if (onward) {
      return periods.indexOf(this.period) >= periods.indexOf(onward[1]) && periods.indexOf(onward[1]) >= 0;
    }
    return text.split('/').map(s => s.trim()).includes(this.period);
  }

  /** "Loyalty (lord)" → "Loyalty (Lord)", "Hate Saxons" → "Hate (Saxons)" */
  passionName(name: string): string {
    name = name.trim();
    const hate = name.match(/^Hate\s+([^(].*)$/i);
    if (hate) {
      name = `Hate (${hate[1].trim()})`;
    }
    return name.replace(/\((\s*)(\w)/, (m, sp, c) => '(' + c.toUpperCase());
  }

  initPassions() {
    let passions = {};
    for (let [n, v] of Object.entries(this.getCulture()['passions'])) {
      passions[this.passionName(n)] = this.parseDice(v);
    }
    if (this.getHomeland() in this.getCulture()['homeland']) {
      let k: string = this.getCulture()['homeland'][this.getHomeland()];
      let split = k.split(';')
      for (let i in split) {
        const sep = split[i].indexOf('―');
        if (sep >= 0 && this.periodApplies(split[i].substring(0, sep))) {
          passions[this.passionName(split[i].substring(sep + 1))] = this.random(3, 6);
        }
      }
    }
    this.charBase['passionsBase'] = passions;
    this.rebuildPassions();
  }

  /** A passziók = kultúra/homeland alap + a kézzel felvett extrák (a Spec +5-öt az updateSkills teszi rá). */
  rebuildPassions() {
    this.char['passions'] = { ...this.charBase['passionsBase'], ...this.charBase['extraPassions'] };
  }

  newPassionName: string = '';
  newPassionValue: number = 10;

  addNewPassion() {
    if (this.addPassion(this.newPassionName, this.newPassionValue)) {
      this.newPassionName = '';
      this.newPassionValue = 10;
    } else {
      this.snackBar.open('Adj meg egy új nevet és 1–20 közötti értéket.', 'Ok', this.snackBarConfig);
    }
  }

  addPassion(name: string, value: number): boolean {
    name = (name || '').trim();
    value = Number(value);
    if (!name || !(value >= 1 && value <= 20)) {
      return false;
    }
    if (name in this.charBase['passionsBase']) {
      return false;
    }
    this.charBase['extraPassions'][name] = Math.round(value);
    this.updateSkillPhase();
    return true;
  }

  removePassion(name: string) {
    delete this.charBase['extraPassions'][name];
    this.updateSkillPhase();
  }

  isExtraPassion(name: string): boolean {
    return name in this.charBase['extraPassions'];
  }

  /* ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
              Family characteristic
   ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ */

  familyEntry(): FamilyCharacteristic | null {
    const name = this.charBase['family'];
    return (this.base?.familycharacteristics || []).find(f => f.name == name) || null;
  }

  /** A jellemző skillje a karakter skilljei között (a "Play" előtagos: Play (harp)); ha nincs, az alapnév. */
  familySkillKey(f: FamilyCharacteristic): string {
    const group = (this.char['skills'] || {})[f.category || 'Other'] || {};
    if (f.skill in group) {
      return f.skill;
    }
    if (f.prefix) {
      const found = Object.keys(group).find(k => k.indexOf(f.skill + ' ') == 0 || k == f.skill);
      return found || f.skill + ' (Harp)';
    }
    return f.skill;
  }

  familyDescription(): string | null {
    const f = this.gender == 'male' ? this.familyEntry() : null;
    return f ? `${f.name} (+${f.bonus} ${this.familySkillKey(f)})` : null;
  }

  rollFamily() {
    const r = this.dice(20);
    const f = (this.base.familycharacteristics || []).find(e => r >= e.roll[0] && r <= e.roll[1]);
    this.charBase['familyRoll'] = r;
    this.charBase['family'] = f ? f.name : 'none';
    this.updateSkillPhase();
  }

  changeReligion() {
    this.virtues = this.base.virtues[this.char['main']['Religion']] || this.virtues;
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
    const short = mod.substring(0, 3);
    const v = traits[short] + (mod.substring(3, 4) == '-' ? -3 : 3);
    traits[short] = Math.min(19, Math.max(1, v));
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
        for (const virtue of this.virtues) {
          let mod = this.traitModifiers[virtue];
          if (mod) {
            this.modTrait(this.charBase['traits'], mod);
          }
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
      this.traitModificationMaxSum = 9;
    } else {
      this.traitsByReligion();
      this.traitModificationMaxSum = 6;
    }

    // minden híváskor az alap-traitekből indulunk, hogy a módosítók ne halmozódjanak
    let traits = this.charBase['traitPhase'];
    for (let i in this.charBase['traits']) {
      traits[i] = this.charBase['traits'][i];
    }

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
    this.char['traits'] = JSON.parse(JSON.stringify(traits));
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
    this.attributeSum = attrSum;
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
    this.save();
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

  canAttr(a, m): boolean {
    const v = this.charBase['stats'][a] + m;
    if (v < 3 || v > 18) {
      return false;
    }
    return m < 0 || this.attrTotal() < 60;
  }

  attr(a, m) {
    if (!this.canAttr(a, m)) {
      return;
    }
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
    this.rebuildPassions();

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
          if (sp[1] in this.char['passions']) {
            this.char['passions'][sp[1]] = Math.min(20, Number(this.char['passions'][sp[1]]) + 5);
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
        if (i in this.char['skills']['Other']) {
          // a 0 alapértékű skill is kap pontot (korábban elveszett, és nem számolt bele a 10-be)
          this.char['skills']['Other'][i] += this.individual['disc'][i];
          this.skillModificationSum += this.individual['disc'][i];
        }
      }
    }
    const family = this.gender == 'male' ? this.familyEntry() : null;
    if (family) {
      // a családi jellemző bónusza a végleges értékre kerül, 15/20 fölé is mehet
      const group = family.category || 'Other';
      const key = this.familySkillKey(family);
      this.char['skills'][group] = this.char['skills'][group] || {};
      this.char['skills'][group][key] = (this.char['skills'][group][key] || 0) + family.bonus;
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

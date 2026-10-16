import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ChargenComponent } from './chargen.component';
import { AppModule } from '../app.module';

describe('ChargenComponent', () => {
  let component: ChargenComponent;
  let fixture: ComponentFixture<ChargenComponent>;

  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppModule, NoopAnimationsModule],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ChargenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('parseDice', () => {
    it('a nem kockás értéket változatlanul adja vissza', () => {
      expect(component.parseDice(15)).toBe(15);
      expect(component.parseDice('Hate Saxons')).toBe('Hate Saxons');
    });

    it('alkalmazza a kockadobást és a módosítót', () => {
      spyOn(component, 'random').and.returnValue(7);
      expect(component.parseDice('2d6')).toBe(7);
      expect(component.random).toHaveBeenCalledWith(2, 6);
      expect(component.parseDice('2d6+3')).toBe(10);
      expect(component.parseDice('3d6 - 2')).toBe(5);
    });
  });

  describe('modTrait', () => {
    it('a + és a - módosítót is alkalmazza, 1..19 közé vágva', () => {
      const t = { cha: 10, ene: 18, for: 2 };
      component.modTrait(t, 'cha+');
      component.modTrait(t, 'ene+');
      component.modTrait(t, 'for-');
      expect(t.cha).toBe(13);
      expect(t.ene).toBe(19);
      expect(t.for).toBe(1);
      component.modTrait(t, 'cha-');
      expect(t.cha).toBe(10);
    });
  });

  describe('kezdő passziók', () => {
    beforeEach(() => {
      component.base = {
        periods: [['Uther', 0], ['Anarchy', 496]],
        newchar: {
          Cymric: {
            passions: { 'Loyalty (lord)': 15, 'Love (family)': 15, Hospitality: 15, Honor: 15 },
            homeland: { Hampshire: 'Uther/Anarchy―Hate Saxons', Devon: 'All Periods―Hate (Irish)', Quiet: 'Boy King onward―Hate Irish' }
          }
        }
      } as any;
      component.period = 'Uther';
      component.char = { main: { Culture: 'Cymric', Homeland: 'Hampshire' } };
      component.charBase = { passionsBase: {}, extraPassions: {} };
    });

    it('a nevek kanonikusak, a Hate értéke 3d6', () => {
      const random = spyOn(component, 'random').and.returnValue(11);
      component.initPassions();
      expect(random).toHaveBeenCalledWith(3, 6);
      expect(component.char['passions']).toEqual({
        'Loyalty (Lord)': 15, 'Love (Family)': 15, Hospitality: 15, Honor: 15, 'Hate (Saxons)': 11
      });
    });

    it('a már zárójeles Hate nevet nem duplázza, az időszakon kívüli homelandnél nincs Hate', () => {
      spyOn(component, 'random').and.returnValue(7);
      component.char['main']['Homeland'] = 'Devon';
      component.initPassions();
      expect(component.char['passions']['Hate (Irish)']).toBe(7);
      component.char['main']['Homeland'] = 'Quiet';
      component.initPassions();
      expect(Object.keys(component.char['passions']).some(k => k.indexOf('Hate') == 0)).toBeFalse();
    });
  });

  describe('periodApplies', () => {
    beforeEach(() => {
      component.base = { periods: [['Uther', 0], ['Anarchy', 496], ['Boy King', 510], ['Conquest', 519]] } as any;
    });

    it('All Periods mindig igaz', () => {
      component.period = 'Conquest';
      expect(component.periodApplies('All Periods')).toBeTrue();
    });

    it('felsorolt időszakoknál szóközöket is kezel', () => {
      component.period = 'Anarchy';
      expect(component.periodApplies('Uther/ Anarchy')).toBeTrue();
      component.period = 'Conquest';
      expect(component.periodApplies('Uther/ Anarchy')).toBeFalse();
    });

    it('az "onward" a megadott időszaktól igaz', () => {
      component.period = 'Anarchy';
      expect(component.periodApplies('Boy King onward')).toBeFalse();
      component.period = 'Conquest';
      expect(component.periodApplies('Boy King onward')).toBeTrue();
    });
  });

  describe('validáció', () => {
    beforeEach(() => {
      component.charBase = {
        stats: { siz: 12, dex: 12, str: 12, con: 12, app: 12 },
        individual: { p15: 'none', p10: ['none', 'none', 'none'], spec: ['none', 'none', 'none', 'none'] }
      };
    });

    it('az attribútumok összege 60 kell legyen base módban', () => {
      expect(component.attributesValid()).toBeTrue();
      component.charBase['stats']['siz'] = 13;
      expect(component.attributesValid()).toBeFalse();
      component.attribMode = 'random';
      expect(component.attributesValid()).toBeTrue();
    });

    it('az attribútum nem lépheti túl a 60-at és a 3..18 tartományt', () => {
      expect(component.canAttr('siz', 1)).toBeFalse();
      expect(component.canAttr('siz', -1)).toBeTrue();
      component.charBase['stats']['siz'] = 3;
      expect(component.canAttr('siz', -1)).toBeFalse();
      component.charBase['stats']['siz'] = 18;
      component.charBase['stats']['dex'] = 6;
      expect(component.canAttr('siz', 1)).toBeFalse();
    });

    it('a trait pontokat ki kell osztani', () => {
      component.traitModificationMaxSum = 6;
      component.traitModificationSum = 5;
      expect(component.traitsValid()).toBeFalse();
      component.traitModificationSum = 6;
      expect(component.traitsValid()).toBeTrue();
    });

    it('a skilleket és a 10 szabad pontot ki kell tölteni', () => {
      const ind = component.charBase['individual'];
      component.skillModificationSum = 10;
      expect(component.skillsValid()).toBeFalse();
      ind['p15'] = 'skill.Other.Hunting';
      ind['p10'] = ['skill.Other.A', 'skill.Other.B', 'skill.Other.C'];
      ind['spec'] = ['trait.cha+', 'passion.Honor', 'skill.Other.A', 'trait.ene-'];
      expect(component.skillsValid()).toBeTrue();
      component.skillModificationSum = 9;
      expect(component.skillsValid()).toBeFalse();
    });
  });

  describe('stepMissing', () => {
    beforeEach(() => {
      component.charBase = {
        stats: { siz: 12, dex: 12, str: 12, con: 12, app: 12 },
        individual: { p15: 'none', p10: ['x', 'none', 'none'], spec: ['none', 'none', 'none', 'none'] }
      };
    });

    it('felsorolja a hiányzó skill választásokat és pontokat', () => {
      component.skillModificationSum = 7;
      expect(component.stepMissing(3)).toEqual(['P15 skill', '2 P10 skill', '4 Spec választás', 'skillpontok 7/10']);
      const ind = component.charBase['individual'];
      ind['p15'] = 'a'; ind['p10'] = ['a', 'b', 'c']; ind['spec'] = ['a', 'b', 'c', 'd'];
      component.skillModificationSum = 10;
      expect(component.stepMissing(3)).toEqual([]);
    });

    it('az attribútum és trait lépés hiányát jelzi', () => {
      component.charBase['stats']['siz'] = 13;
      expect(component.stepMissing(2)).toEqual(['attribútumok összege 61/60']);
      component.traitModificationSum = 4;
      component.traitModificationMaxSum = 6;
      expect(component.stepMissing(1)).toEqual(['trait pontok 4/6']);
    });
  });

  describe('skillpontok', () => {
    it('a 0 alapértékű skill is megkapja és beleszámítja a pontot', () => {
      component.base = {
        newchar: { Cymric: { male: { skills: { Other: { 'Read (Latin)': 0, Hunting: 2 }, Combat: {}, Weapons: {} } } } },
        chivalry: [], familycharacteristics: []
      } as any;
      component.gender = 'male';
      component.traitMode = 'random';
      component.traits = [];
      component.traitModification = {};
      component.char = { main: { Culture: 'Cymric' }, passions: {}, traits: {}, skills: {} };
      const individual = { p15: 'none', p10: ['none', 'none', 'none'], spec: ['none', 'none', 'none', 'none'], disc: { 'Read (Latin)': 3, Hunting: 2 } };
      component.charBase = { traits: {}, traitPhase: {}, famous: 'none', individual, extraPassions: {}, passionsBase: {} };
      component.individual = individual;
      component.updateSkills();
      expect(component.char['skills']['Other']['Read (Latin)']).toBe(3);
      expect(component.char['skills']['Other']['Hunting']).toBe(4);
      expect(component.skillModificationSum).toBe(5);
    });
  });

  describe('changeTrait', () => {
    it('többszöri hívás nem halmozza a módosítókat', () => {
      component.base = { chivalry: [] } as any;
      component.traits = [{ short: 'cha', first: 'Chaste', second: 'Lustful' } as any];
      component.traitMode = 'random';
      component.char = { traits: { cha: 10 } };
      component.charBase = {
        traits: { cha: 10 }, traitPhase: { cha: 10 }, famous: 'none'
      };
      component.traitModification = { cha: 3 };
      component.changeTrait();
      component.changeTrait();
      expect(component.charBase['traitPhase']['cha']).toBe(13);
      expect(component.char['traits']['cha']).toBe(13);
      expect(component.traitModificationSum).toBe(3);
    });
  });

  describe('buildCharacter', () => {
    it('ráfésüli az eredményt a meglévő karakterre, a segédadat nélkül', () => {
      component.lord = {
        char: { name: 'Sir Test', dbid: 5, player: '9', economy: { money: { font: 1 } }, main: { Glory: 100 }, stats: { siz: 10 }, traits: {}, passions: {}, skills: {} }
      } as any;
      component.char = {
        main: { Born: 464, Culture: 'Cymric', Homeland: 'Salisbury (Logres)', Religion: 'British Christian', Lord: 'Sir X', Name: 'Sir Other', Year: 485, Period: 'Uther' },
        stats: { siz: 12 }, traits: { cha: 13 }, passions: { Honor: 15 }, skills: { Other: { Hunting: 15 } },
        charBase: { famous: 'none' }
      };
      const out = component.buildCharacter();
      expect(out['name']).toBe('Sir Test');
      expect(out['dbid']).toBe(5);
      expect(out['player']).toBe('9');
      expect(out['economy']).toEqual({ money: { font: 1 } });
      expect(out['main']).toEqual({ Glory: 100, Born: 464, Culture: 'Cymric', Homeland: 'Salisbury (Logres)', Religion: 'British Christian', Lord: 'Sir X' });
      expect(out['stats']).toEqual({ siz: 12 });
      expect(out['traits']).toEqual({ cha: 13 });
      expect(out['passions']).toEqual({ Honor: 15 });
      expect(out['skills']).toEqual({ Other: { Hunting: 15 } });
      expect(out['charBase']).toBeUndefined();
    });

    it('beállítja a kezdő lovakat és megtartja a winter többi adatát', () => {
      component.lord = { char: { name: 'Sir Test', winter: { stewardship: 5, horses: ['charger', 'rouncy', 'rouncy', 'sumpter', 'sumpter'] } } } as any;
      component.char = { main: {}, stats: {}, traits: {}, passions: {}, skills: {} };
      const out = component.buildCharacter();
      expect(out['winter']['horses']).toEqual(['charger', 'rouncy', 'rouncy', 'sumpter']);
      expect(out['winter']['stewardship']).toBe(5);
    });
  });

  describe('kezdő felszerelés', () => {
    beforeEach(() => {
      component.lord = { char: { name: 'Sir Test', economy: { money: { font: 1, silver: 10 } }, belongings: [{ name: 'Old' }] } } as any;
      component.char = { main: { Religion: 'British Christian' }, stats: {}, traits: {}, passions: {}, skills: {} };
      component.charBase = { belongings: null };
    });

    it('csak egyszer dobható', () => {
      const dice = spyOn(component, 'dice').and.returnValue(5);
      expect(component.belongingsValid()).toBeFalse();
      component.rollBelongingsOnce();
      expect(component.belongingsValid()).toBeTrue();
      const first = component.belongings();
      component.rollBelongingsOnce();
      expect(component.belongings()).toBe(first);
      expect(dice).toHaveBeenCalledTimes(1);
    });

    it('a mentéskor hozzáadja a pénzt, lovakat és tárgyakat, a meglévőt megtartva', () => {
      component.charBase['belongings'] = {
        rolls: [], money: { silver: 50, font: 2 }, horses: ['courser'], items: [{ name: 'Decorated saddle', value: '£1' }]
      };
      const out = component.buildCharacter();
      expect(out['economy']['money']).toEqual({ font: 3, silver: 60 });
      expect(out['winter']['horses']).toEqual(['charger', 'rouncy', 'rouncy', 'sumpter', 'courser']);
      expect(out['belongings']).toEqual([{ name: 'Old' }, { name: 'Decorated saddle', value: '£1' }]);
      expect(component.lord.char['economy']['money']).toEqual({ font: 1, silver: 10 });
    });

    it('a Final csak dobás után érvényes', () => {
      spyOn(component, 'mainValid').and.returnValue(true);
      spyOn(component, 'traitsValid').and.returnValue(true);
      spyOn(component, 'attributesValid').and.returnValue(true);
      spyOn(component, 'skillsValid').and.returnValue(true);
      expect(component.allValid()).toBeFalse();
      component.charBase['belongings'] = { rolls: [], money: { silver: 0, font: 0 }, horses: [], items: [] };
      expect(component.allValid()).toBeTrue();
    });
  });

  describe('családi jellemző', () => {
    const families = [
      { roll: [1, 2], name: 'Good with horses', skill: 'Horsemanship', bonus: 5, category: 'Combat' },
      { roll: [16, 16], name: 'Natural musician', skill: 'Play', bonus: 15, prefix: true },
      { roll: [20, 20], name: 'Clever', skill: 'Gaming', bonus: 10 }
    ];
    beforeEach(() => {
      component.base = { familycharacteristics: families, chivalry: [] } as any;
      component.gender = 'male';
      component.char = { skills: { Other: { 'Play (harp)': 3, Gaming: 3 }, Combat: { Horsemanship: 10 } } };
      component.charBase = { family: 'none', familyRoll: null };
    });

    it('férfiaknál kötelező, hölgyeknél nem', () => {
      expect(component.familyValid()).toBeFalse();
      component.charBase['family'] = 'Clever';
      expect(component.familyValid()).toBeTrue();
      component.charBase['family'] = 'none';
      component.gender = 'female';
      expect(component.familyValid()).toBeTrue();
    });

    it('a rollFamily a dobás alapján választ', () => {
      spyOn(component, 'dice').and.returnValue(2);
      spyOn(component, 'updateSkillPhase');
      component.rollFamily();
      expect(component.charBase['family']).toBe('Good with horses');
      expect(component.charBase['familyRoll']).toBe(2);
    });

    it('a Play előtagos skillt a meglévő hangszerre vonatkoztatja', () => {
      component.charBase['family'] = 'Natural musician';
      expect(component.familyDescription()).toBe('Natural musician (+15 Play (harp))');
    });

    it('hölgynél nincs leírás', () => {
      component.charBase['family'] = 'Clever';
      component.gender = 'female';
      expect(component.familyDescription()).toBeNull();
    });
  });

  describe('passziók', () => {
    beforeEach(() => {
      component.char = { passions: {} };
      component.charBase = { passionsBase: { Honor: 15 }, extraPassions: {} };
      spyOn(component, 'updateSkillPhase');
    });

    it('felvesz és töröl extra passziót, az alapot nem írja felül', () => {
      expect(component.addPassion('Hate (Picts)', 8)).toBeTrue();
      expect(component.charBase['extraPassions']).toEqual({ 'Hate (Picts)': 8 });
      expect(component.addPassion('Honor', 5)).toBeFalse();
      expect(component.addPassion('', 5)).toBeFalse();
      expect(component.addPassion('Love (Family)', 21)).toBeFalse();
      component.removePassion('Hate (Picts)');
      expect(component.charBase['extraPassions']).toEqual({});
    });

    it('a rebuildPassions az alapból és az extrákból épít', () => {
      component.charBase['extraPassions'] = { 'Hate (Picts)': 8 };
      component.rebuildPassions();
      component.rebuildPassions();
      expect(component.char['passions']).toEqual({ Honor: 15, 'Hate (Picts)': 8 });
    });
  });
});

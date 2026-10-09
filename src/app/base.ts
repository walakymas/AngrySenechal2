export interface FamilyCharacteristic {
    roll: [number, number];
    name: string;
    skill: string;
    bonus: number;
    category?: string;
    prefix?: boolean;
}

export class Base {
    armors: [];
    chivalry:string[];
    fallbacks: {};
    horsetypes: {};
    shields: {};
    traits: {};
    virtues: {};
    weapons: {};
    newchar: {};
    default: {};
    periods: [];
    familycharacteristics: FamilyCharacteristic[] = [];
    loginNeeded: string = 'false';
    hook: string = '';
}

export interface Lord {
    year: number;
    modified: string;
    marks: string[];
    events: [];
    char: {};
}

export interface LordBase {
    id: number;
    modified: string;
    name: string;
    type: string;
    role: string;
}

export class LordDetail {
    damage: number;
    hr: number;
    hp: number;
    ahp: number;
    mr: number;
    unc: number;
    chi: string;
    wounds: string;
    mw: number;
    kno: number;
}

export class TeamMember {
    did: number;
    name: string;
    shortName: string;
    skills: {};
    stats: {};
    traits: {};
    passions: {};
    detail: LordDetail;
}
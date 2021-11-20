export interface Lord {
    year: number;
    modified: string;
    marks: string[];
    events: [];
    char: {};
    virtues: string[];
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

export class LordData {
    name: string;
    shortName: string;
    player:string;
    memberId:string;
    url:string;
    main:{};
    npcs:{};
    health:{};
    winter:{};
    did: number;
    army:{};
    combat:{};
    description:string;
    longdescription:string;
    skills: {};
    stats: {};
    traits: {};
    passions: {};
    detail: LordDetail;
}
export interface Lord {
    year: number;
    modified: number;
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

export interface TeamMember {
    did: number;
    name: string;
    shortName: string;
    skills: {};
    stats: {};
    traits: {};
    passions: {};
}
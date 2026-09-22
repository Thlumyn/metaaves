export interface Species {
    id: string;
    species: string;
    scientific: string;
    clade: string;
    range: string;
    size: string;
    wingspan: string;
    description: string;
    image?: string;
    icon?: string;
}

export interface Clade {
    id: string;
    name: string;
    parent?: string;
    description: string;
    image?: string;
}

export interface GuessResult {
    isCorrect: boolean;
    lca: string | null;
}

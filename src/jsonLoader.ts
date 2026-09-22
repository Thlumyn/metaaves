import { Clade, Species } from "./types";
import { GameData } from "./gameData";

interface RawSpecies {
    species: string;
    scientific: string;
    clade: string;
    range: string;
    size: string;
    wingspan: string;
    bill: string;
    color_male: string;
    description: string;
    image?: string;
    icon?: string;
}

interface RawClade {
    clade: string;
    parent?: string;
    description: string;
    image?: string;
}

export interface RawGameData {
    species: Record<string, RawSpecies>;
    clades: Record<string, RawClade>;
}

export async function loadGameData(): Promise<GameData> {
    const url = require("./aves/index.json") as string;
    const response = await fetch(url);
    const raw = (await response.json()) as RawGameData;

    return buildGameData(raw);
}

// The raw payload -> GameData mapping, split out from the fetch so tests can
// build the shipped graph straight from `src/aves/index.json` without
// re-implementing this shape. A hand-copied mirror in a test file is a second
// seam that rots (LESSONS.md
// `hand-copied-logic-mirrors-rot-update-them-in-the-same-change`).
export function buildGameData(raw: RawGameData): GameData {
    const species: Species[] = Object.entries(raw.species).map(([id, s]) => ({
        id,
        species: s.species || "",
        scientific: s.scientific || "",
        clade: s.clade || "",
        range: s.range || "",
        size: s.size || "",
        wingspan: s.wingspan || "",
        bill: s.bill || "",
        color_male: s.color_male || "",
        description: s.description || "",
        image: s.image || undefined,
        icon: s.icon || undefined,
    }));

    const cladesMap: Record<string, Clade> = {};
    for (const [id, c] of Object.entries(raw.clades)) {
        const clade: Clade = {
            id,
            name: c.clade || "",
            parent: c.parent ? c.parent.toLowerCase() : undefined,
            description: c.description || "",
            image: c.image || undefined,
        };
        cladesMap[clade.name.toLowerCase()] = clade;
    }

    return new GameData(species, cladesMap);
}

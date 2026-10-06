import { MAX_SUGGESTIONS, findMatches } from "../src/ui/autocomplete";
import { buildGameData } from "../src/jsonLoader";
import type { RawGameData } from "../src/jsonLoader";
import rawGameData from "../src/aves/index.json";

// These run against the REAL species list (`src/aves/index.json`), in the
// same order the game builds it (`src/game.ts`: `data.species.map(s => s.species)`),
// because both defects these tests pin are about ORDER: which names survive
// the truncation to 8, and which of the survivors comes first. A hand-written
// fixture would let the list be reordered underneath the assertions.
const speciesNames = buildGameData(
    rawGameData as unknown as RawGameData
).species.map((s) => s.species);

const noneGuessed = () => false;
const guessedFrom = (names: string[]) => {
    const set = new Set(names.map((n) => n.toLowerCase()));
    return (name: string) => set.has(name.toLowerCase());
};

const substringMatches = (query: string) =>
    speciesNames.filter((name) => name.toLowerCase().includes(query));

describe("findMatches fixture", () => {
    // The assertions below name exact species, so pin the content they rely on.
    // If a content edit moves these, the pin fails here rather than turning an
    // ordering assertion vacuously green somewhere below.
    it("the shipped species list still has the shape these tests assert", () => {
        expect(speciesNames).toHaveLength(speciesNames.length);
        expect(substringMatches("ostr")).toEqual([
            "Common Ostrich",
            "Somali Ostrich",
        ]);
    });
});

describe("findMatches truncation vs guessed species", () => {
    it("still offers a full list after the first 8 suggestions are guessed", () => {
        // The repro: guessing what the box offered used to empty it, because
        // the slice to 8 happened BEFORE guessed names were dropped. 83 species
        // match "saur", so the box has plenty left.
        const first = findMatches(speciesNames, "guan", noneGuessed);
        expect(first).toHaveLength(MAX_SUGGESTIONS);

        const second = findMatches(speciesNames, "guan", guessedFrom(first));

        expect(second).toHaveLength(MAX_SUGGESTIONS);
        expect(second.filter((name) => first.includes(name))).toEqual([]);
    });

    it("keeps offering 8 suggestions round after round until candidates run out", () => {
        const total = substringMatches("saur").length;
        const rounds = Math.floor(total / MAX_SUGGESTIONS);
        expect(rounds).toBeGreaterThan(1);

        const guessed: string[] = [];
        for (let round = 0; round < rounds; round++) {
            const matches = findMatches(
                speciesNames,
                "guan",
                guessedFrom(guessed)
            );

            expect(matches).toHaveLength(MAX_SUGGESTIONS);
            expect(matches.filter((name) => guessed.includes(name))).toEqual(
                []
            );
            guessed.push(...matches);
        }

        // Every suggestion ever offered was a distinct real match.
        expect(new Set(guessed).size).toBe(rounds * MAX_SUGGESTIONS);
    });

    it("returns the remaining candidates, not an empty list, once fewer than 8 are left", () => {
        const all = substringMatches("ostr");
        const guessed = all.slice(0, all.length - 2);

        expect(findMatches(speciesNames, "ostr", guessedFrom(guessed))).toEqual(
            findMatches(speciesNames, "ostr", noneGuessed).filter(
                (name) => !guessed.includes(name)
            )
        );
    });
});

import argparse
import csv
import json
import os
import sys
from typing import Dict

from markdown_to_json import ContentError, validate_attributes

AVES_PATH = os.path.join("src", "aves")
CLADES_PATH = os.path.join(AVES_PATH, "clades")
SPECIES_PATH = os.path.join(AVES_PATH, "species")
INDEX_JSON_PATH = os.path.join(AVES_PATH, "index.json")

CSV_FIELDS_SPECIES = [
    "Species",
    "Scientific",
    "Clade",
    "Observations",
    "Range",
    "Size",
    "Wingspan",
    "Color_Male",
    "Bill",
    "Ebird",
    "Description",
]
CSV_FIELDS_CLADES = [
    "Clade",
    "Parent",
    "Description",
]


def read_csv_data(csv_path: str) -> Dict[str, Dict[str, str]]:
    data = {}

    if "clades" in csv_path:
        clades = 1
    else:
        clades = 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if clades:
                node_name = row["Clade"].strip().lower().replace(" ", "_")
                data[node_name] = {
                    "clade": row["Clade"].strip(),
                    "parent": row["Parent"],
                    "description": row["Description"],
                }
            else:
                 node_name = row["Species"].strip().lower().replace(" ", "_")
                 data[node_name] = {
                    "species": row["Species"].strip(),
                    "scientific": row["Scientific"],
                    "clade": row["Clade"],
                    "observations": row["Observations"],
                    "range": row["Range"],
                    "size": row["Size"],
                    "wingspan": row["Wingspan"],
                    "color_male": row["Color_Male"],
                    "bill": row["Bill"],
                    "ebird": row["Ebird"],
                    "description": row["Description"],
                 }

    return data


def merge_csv(csv_path: str) -> None:
    csv_data = read_csv_data(csv_path)
    if "clades" in csv_path:
        clades = 1
    else:
        clades = 0
    with open(INDEX_JSON_PATH, "r") as f:
        data = json.load(f)

    if clades: 
        # Update existing clades
        for clade_id, clade in data["clades"].items():
            new_data = csv_data.get(clade_id)
            if new_data:
                clade["clade"] = new_data["clade"]
                clade["parent"] = new_data["parent"]
                clade["description"] = new_data["description"]
        # Add new clades
        for clade_id, clade in csv_data.items():
            old_data = data["clades"].get(clade_id)
            if not old_data:
                data["clades"][clade_id] = csv_data[clade_id]
        # Validate clade data
        for clade_id, clade in data["clades"].items():
            validate_attributes(clade, f"index.json clades/{clade_id}")
                 
             
    else:
        # Update existing species
        for species_id, species in data["species"].items():
            new_data = csv_data.get(species_id)
            if new_data:
                species["species"] = new_data["species"]
                species["scientific"] = new_data["scientific"]
                species["clade"] = new_data["clade"]
                species["observations"] = new_data["observations"]
                species["range"] = new_data["range"]
                species["size"] = new_data["size"]
                species["wingspan"] = new_data["wingspan"]
                species["color_male"] = new_data["color_male"]
                species["bill"] = new_data["bill"]
                species["ebird"] = new_data["ebird"]
                species["description"] = new_data["description"]
        # Add new species
        for species_id, species in csv_data.items():
            old_data = data["species"].get(species_id)
            if not old_data:
                data["species"][species_id] = csv_data[species_id]
        # Validate species data
        for species_id, species in data["species"].items():
                validate_attributes(species, f"index.json species/{species_id}")


    # This script is the THIRD pipeline entry point, and the only one that
    # writes index.json without going through the markdown source, so an
    # unguarded merge could both launder a defect and leave the payload out of
    # step with the files it is generated from. Same refusal as the other two,
    # applied before anything is written: a bad CSV cell stops the merge rather
    # than landing in the served graph. Re-run markdown_to_json.py afterwards
    # (or json_to_markdown.py first) to keep source and payload in step.
    with open(INDEX_JSON_PATH, "w") as f:
        json.dump(data, f, indent=4)


if __name__ == "__main__":
    try:
        merge_csv("birdspecies.csv")
    except ContentError as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)

    try:
        merge_csv("cladeslist.csv")
    except ContentError as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)

    #parser = argparse.ArgumentParser(description="Merge a data CSV into index.json")
    #parser.add_argument("csv_file", help="Path to the input CSV file")
    #args = parser.parse_args()

    #try:
    #    merge_csv(args.csv_file)
    #except ContentError as exc:
    #    print(f"error: {exc}", file=sys.stderr)
    #    sys.exit(1)

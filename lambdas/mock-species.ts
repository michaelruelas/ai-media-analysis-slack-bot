/**
 * Mock species data for POC.
 * Subset of 10 species for initial testing; expand to 837 as needed.
 */

interface Species {
  id: number;
  name: string;
}

const mockSpecies: Species[] = [
  { id: 1, name: "Cardinalis cardinalis" },
  { id: 2, name: "Piranga rubra" },
  { id: 3, name: "Columba livia" },
  { id: 4, name: "Corvus brachyrhynchos" },
  { id: 5, name: "Sturnus vulgaris" },
  { id: 6, name: "Passer domesticus" },
  { id: 7, name: "Meleagris gallopavo" },
  { id: 8, name: "Buteo jamaicensis" },
  { id: 9, name: "Turdus migratorius" },
  { id: 10, name: "Cyanocitta cristata" }
];

export default mockSpecies;
// data/tournaments.ts
// Static tournament catalogue with full bracket / category data.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WeightClass {
  id: string;
  label: string;
  minKg: number | null; // null = no lower bound
  maxKg: number | null; // null = no upper bound
}

export interface TournamentCategory {
  id: string;
  name: string;
  discipline: string;
  grades: string[];       // grades eligible for this category
  gradeGroup?: string;    // optional group label (e.g. 'Principiantes')
  weightClass?: WeightClass;
  gender?: string;        // 'Masculino' | 'Femenino'
  ageGroup?: string;      // 'Sub-18' | 'Adulto'
}

export interface Tournament {
  id: string;
  name: string;
  date: string;
  location: string;
  logo: string;
  martialArt: string;
  disciplines: string[];
  grades: string[];              // available grades for the registration form select
  categories: TournamentCategory[];
}

// ── Shared weight classes ──────────────────────────────────────────────────────

export const WEIGHT_CLASSES: WeightClass[] = [
  { id: 'sub40',  label: 'Sub-40 kg',     minKg: null, maxKg: 40 },
  { id: 'w40_50', label: '40–50 kg',      minKg: 40,   maxKg: 50 },
  { id: 'w50_60', label: '50–60 kg',      minKg: 50,   maxKg: 60 },
  { id: 'w60_70', label: '60–70 kg',      minKg: 60,   maxKg: 70 },
  { id: 'w70_80', label: '70–80 kg',      minKg: 70,   maxKg: 80 },
  { id: 'w80_90', label: '80–90 kg',      minKg: 80,   maxKg: 90 },
  { id: 'open',   label: '+90 kg (Open)', minKg: 90,   maxKg: null },
];

// ── BJJ category builder ───────────────────────────────────────────────────────

const BJJ_GRADES = ['Blanco', 'Azul', 'Morado', 'Café', 'Negro'];
const AGE_GROUPS = ['Sub-18', 'Adulto'];
const GENDERS    = ['Masculino', 'Femenino'];

function buildBJJCategories(): TournamentCategory[] {
  const cats: TournamentCategory[] = [];
  for (const grade of BJJ_GRADES) {
    for (const ageGroup of AGE_GROUPS) {
      for (const gender of GENDERS) {
        for (const wc of WEIGHT_CLASSES) {
          cats.push({
            id: `bjj_${grade}_${ageGroup}_${gender}_${wc.id}`,
            name: `Gi · ${grade} · ${ageGroup} · ${gender} · ${wc.label}`,
            discipline: 'Gi',
            grades: [grade],
            weightClass: wc,
            gender,
            ageGroup,
          });
        }
      }
    }
  }
  return cats;
}

// ── Kyokushin category builder ─────────────────────────────────────────────────

const KYOKUSHIN_GRADES = [
  '10° Kyu', '9° Kyu', '8° Kyu', '7° Kyu', '6° Kyu',   // Principiantes
  '5° Kyu',  '4° Kyu', '3° Kyu', '2° Kyu', '1° Kyu',   // Avanzados
  '1° Dan',  '2° Dan+',                                   // Avanzados (dan)
];

const KYOKUSHIN_GROUPS: Record<string, string[]> = {
  Principiantes: ['10° Kyu', '9° Kyu', '8° Kyu', '7° Kyu', '6° Kyu'],
  Avanzados:     ['5° Kyu', '4° Kyu', '3° Kyu', '2° Kyu', '1° Kyu', '1° Dan', '2° Dan+'],
};

function buildKyokushinCategories(): TournamentCategory[] {
  const cats: TournamentCategory[] = [];

  for (const [gradeGroup, grades] of Object.entries(KYOKUSHIN_GROUPS)) {
    // Kata — by grade group + age only (no weight, no gender split)
    for (const ageGroup of AGE_GROUPS) {
      cats.push({
        id: `kyo_kata_${gradeGroup}_${ageGroup}`,
        name: `Kata · ${gradeGroup} · ${ageGroup}`,
        discipline: 'Kata',
        grades,
        gradeGroup,
        ageGroup,
      });
    }

    // Kumite — by grade group + age + gender + weight
    for (const ageGroup of AGE_GROUPS) {
      for (const gender of GENDERS) {
        for (const wc of WEIGHT_CLASSES) {
          cats.push({
            id: `kyo_kumite_${gradeGroup}_${ageGroup}_${gender}_${wc.id}`,
            name: `Kumite · ${gradeGroup} · ${ageGroup} · ${gender} · ${wc.label}`,
            discipline: 'Kumite',
            grades,
            gradeGroup,
            weightClass: wc,
            gender,
            ageGroup,
          });
        }
      }
    }
  }

  return cats;
}

// ── Tournament catalogue ───────────────────────────────────────────────────────

export const TOURNAMENTS: Tournament[] = [
  {
    id: '1',
    name: 'Copa Nacional Kumite 2026',
    date: '2026-05-15',
    location: 'San José, CR',
    logo: '🥋',
    martialArt: 'Karate',
    disciplines: ['Kumite'],
    grades: [],
    categories: [],
  },
  {
    id: '2',
    name: 'Panamerican Open Judo',
    date: '2026-06-20',
    location: 'Ciudad de México, MX',
    logo: '🥋',
    martialArt: 'Judo',
    disciplines: ['Judo'],
    grades: [],
    categories: [],
  },
  {
    id: '3',
    name: 'Copa Centroamericana Kyokushin 2026',
    date: '2026-07-12',
    location: 'San José, CR',
    logo: '⛩️',
    martialArt: 'Kyokushin',
    disciplines: ['Kata', 'Kumite'],
    grades: KYOKUSHIN_GRADES,
    categories: buildKyokushinCategories(),
  },
  {
    id: '4',
    name: 'Central America Gi Open',
    date: '2026-08-05',
    location: 'Guatemala City, GT',
    logo: '🏆',
    martialArt: 'BJJ',
    disciplines: ['Gi'],
    grades: BJJ_GRADES,
    categories: buildBJJCategories(),
  },
];

// ── Lookup helpers ─────────────────────────────────────────────────────────────

export function getTournamentById(id: string): Tournament | undefined {
  return TOURNAMENTS.find(t => t.id === id);
}

/**
 * Returns the unique disciplines (modalities) available for an athlete in a
 * tournament, based on grade + gender + age (weight is NOT a filter here —
 * the athlete will choose their weight division later).
 */
export function getAvailableModalities(
  tournament: Tournament,
  grade: string,
  gender: string,
  age: number,
): string[] {
  if (!tournament.categories.length) return [];

  const ageGroup = age < 18 ? 'Sub-18' : 'Adulto';
  const seen = new Set<string>();

  for (const cat of tournament.categories) {
    if (cat.grades.length > 0 && !cat.grades.includes(grade)) continue;
    if (cat.ageGroup && cat.ageGroup !== ageGroup) continue;
    if (cat.gender && cat.gender !== gender) continue;
    seen.add(cat.discipline);
  }

  return Array.from(seen);
}

/**
 * Returns all weight classes available for a given discipline / athlete profile.
 * Returns [] for disciplines that have no weight divisions (e.g. Kata).
 */
export function getWeightDivisionsForModality(
  tournament: Tournament,
  discipline: string,
  grade: string,
  gender: string,
  age: number,
): WeightClass[] {
  if (!tournament.categories.length) return [];

  const ageGroup = age < 18 ? 'Sub-18' : 'Adulto';
  const seen = new Set<string>();
  const weights: WeightClass[] = [];

  for (const cat of tournament.categories) {
    if (cat.discipline !== discipline) continue;
    if (cat.grades.length > 0 && !cat.grades.includes(grade)) continue;
    if (cat.ageGroup && cat.ageGroup !== ageGroup) continue;
    if (cat.gender && cat.gender !== gender) continue;
    if (!cat.weightClass) continue;
    if (!seen.has(cat.weightClass.id)) {
      seen.add(cat.weightClass.id);
      weights.push(cat.weightClass);
    }
  }

  return weights;
}

/** True when the given discipline has weight-class divisions for this athlete. */
export function modalityHasWeights(
  tournament: Tournament,
  discipline: string,
  grade: string,
  gender: string,
  age: number,
): boolean {
  return getWeightDivisionsForModality(tournament, discipline, grade, gender, age).length > 0;
}

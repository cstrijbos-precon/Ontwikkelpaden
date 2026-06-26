import { z } from "zod";
import { enforceDate } from "@/lib/field-format";

const gesprekStatusSchema = z.enum(["draft", "completed", "archived"]);

const intScore = z.coerce.number().int().min(0).max(4);
const intPadNiveau = z.coerce.number().int().min(0).max(5);

const scoresSchema = z.object({
  b: intScore,
  k: intScore,
  o: intScore,
  org: intScore,
  t: intScore,
});

const opmerkingenSchema = z.object({
  b: z.string(),
  k: z.string(),
  o: z.string(),
  org: z.string(),
  t: z.string(),
});

const padRecordSchema = <T extends z.ZodType>(valueSchema: T) =>
  z.object({
    vakexpert: valueSchema,
    adviseur: valueSchema,
    leider: valueSchema,
    trainer: valueSchema,
  });

/** Leeg of YYYY-MM-DD — zelfde regel als DateInput. */
export const dateFieldSchema = z.string().transform(enforceDate);

export const ontwikkelpadenStateSchema = z.object({
  naam: z.string(),
  bijPreconSinds: z.string(),
  datum: dateFieldSchema,
  datumVorig: dateFieldSchema,
  hoofdbeoordelaar: z.string(),
  medebeoordelaar: z.string(),
  hoeGaatHet: z.string(),
  werkdruk: z.string(),
  kernwaarden: z.string(),
  situaties: z.array(z.string()),
  impact: z.string(),
  declarabiliteit: z.string(),
  afspraken: z.string(),
  checks: z.string(),
  profiel: z.string(),
  scores: scoresSchema,
  opmerkingen: opmerkingenSchema,
  tCellen: z.array(z.string()),
  tDiepte: z.string(),
  tBreedte: z.string(),
  vorigJaar: padRecordSchema(intPadNiveau),
  ambities: padRecordSchema(z.boolean()),
  trainingsgroepen: padRecordSchema(z.string()),
  ambitieNotitie: z.string(),
  toolboxKeuze: z.string(),
  checkpoints: z.string(),
  tProfielOntwikkeling: z.string(),
  overigeAfspraken: z.string(),
  datumVolgend: dateFieldSchema,
});

export const createGesprekBodySchema = z
  .object({
    state: ontwikkelpadenStateSchema.optional(),
    medewerkerEmail: z.string().email().optional(),
  })
  .strict();

export const updateGesprekBodySchema = z
  .object({
    state: ontwikkelpadenStateSchema,
    status: gesprekStatusSchema.optional(),
    medewerkerEmail: z.string().email().nullable().optional(),
  })
  .strict();

export { gesprekStatusSchema };

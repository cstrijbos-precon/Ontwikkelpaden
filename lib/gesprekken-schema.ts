import { z } from "zod";

const padIdSchema = z.enum(["vakexpert", "adviseur", "leider", "trainer"]);
const compIdSchema = z.enum(["b", "k", "o", "org", "t"]);
const gesprekStatusSchema = z.enum(["draft", "completed", "archived"]);

const scoresSchema = z
  .object({
    b: z.number().int().min(0).max(4),
    k: z.number().int().min(0).max(4),
    o: z.number().int().min(0).max(4),
    org: z.number().int().min(0).max(4),
    t: z.number().int().min(0).max(4),
  })
  .strict();

const opmerkingenSchema = z
  .object({
    b: z.string(),
    k: z.string(),
    o: z.string(),
    org: z.string(),
    t: z.string(),
  })
  .strict();

const padRecordSchema = <T extends z.ZodType>(valueSchema: T) =>
  z
    .object({
      vakexpert: valueSchema,
      adviseur: valueSchema,
      leider: valueSchema,
      trainer: valueSchema,
    })
    .strict();

export const ontwikkelpadenStateSchema = z
  .object({
    naam: z.string(),
    bijPreconSinds: z.string(),
    datum: z.string(),
    datumVorig: z.string(),
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
    vorigJaar: padRecordSchema(z.number().int().min(0).max(5)),
    ambities: padRecordSchema(z.boolean()),
    trainingsgroepen: padRecordSchema(z.string()),
    ambitieNotitie: z.string(),
    toolboxKeuze: z.string(),
    checkpoints: z.string(),
    tProfielOntwikkeling: z.string(),
    overigeAfspraken: z.string(),
    datumVolgend: z.string(),
  })
  .strict();

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

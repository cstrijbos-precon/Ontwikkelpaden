import { z } from "zod";
import { WERELDEN } from "@/lib/data/werelden";

const padIdSchema = z.enum(["vakexpert", "adviseur", "leider", "trainer"]);
const niveauSchema = z.coerce.number().int().min(1).max(5);
const aantalSchema = z.coerce.number().int().min(0);

export const updatePlanningBodySchema = z
  .object({
    padId: padIdSchema,
    niveau: niveauSchema,
    wereld: z.enum(WERELDEN),
    nodigNu: aantalSchema,
    nodigStraks: aantalSchema,
  })
  .strict();

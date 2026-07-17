import { z } from "zod";
import {
  AGENDA_MONTHS,
  KPI_QUARTER_STATUSES,
  KPI_QUARTERS,
  KPI_TYPES,
  MONTHS,
  PROJECT_MONTH_STATUSES,
  RESULTAATGEBIEDEN,
} from "@/lib/verbeterplanning/constants";

const monthIndexSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(MONTHS.length - 1);
const quarterIndexSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(KPI_QUARTERS.length - 1);
const agendaMonthIndexSchema = z.coerce
  .number()
  .int()
  .min(0)
  .max(AGENDA_MONTHS.length - 1);

const projectStatusSchema = z.enum(["", ...PROJECT_MONTH_STATUSES]);
const kpiStatusSchema = z.enum(["", ...KPI_QUARTER_STATUSES]);

export const createProjectBodySchema = z
  .object({
    code: z.string().trim().min(1).max(20),
    title: z.string().trim().min(1),
    mtlid: z.string().optional(),
    trekker: z.string().optional(),
    team: z.string().optional(),
    rg: z.string().optional(),
    kpi: z.string().optional(),
    group: z.enum(RESULTAATGEBIEDEN),
  })
  .strict();

export const updateProjectMetaBodySchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    mtlid: z.string().optional(),
    trekker: z.string().optional(),
    team: z.string().optional(),
    rg: z.string().optional(),
    kpi: z.string().optional(),
  })
  .strict();

export const setProjectStatusBodySchema = z
  .object({
    monthIndex: monthIndexSchema,
    status: projectStatusSchema,
  })
  .strict();

export const createMilestoneBodySchema = z
  .object({
    name: z.string().trim().min(1),
  })
  .strict();

export const renameMilestoneBodySchema = createMilestoneBodySchema;

export const setMilestoneStatusBodySchema = setProjectStatusBodySchema;

export const createKpiBodySchema = z
  .object({
    type: z.enum(KPI_TYPES),
    description: z.string().optional(),
  })
  .strict();

export const updateKpiBodySchema = z
  .object({
    type: z.enum(KPI_TYPES).optional(),
    description: z.string().optional(),
  })
  .strict();

export const setKpiStatusBodySchema = z
  .object({
    quarterIndex: quarterIndexSchema,
    status: kpiStatusSchema,
  })
  .strict();

export const setKpiNoteBodySchema = z
  .object({
    quarterIndex: quarterIndexSchema,
    note: z.string(),
  })
  .strict();

export const createUpdateBodySchema = z
  .object({
    text: z.string().trim().min(1),
  })
  .strict();

export const editUpdateBodySchema = createUpdateBodySchema;

export const setAgendaFieldBodySchema = z
  .object({
    datum: z.string().optional(),
    projecten: z.string().optional(),
    opmerkingen: z.string().optional(),
  })
  .strict()
  .refine(
    (body) =>
      body.datum !== undefined ||
      body.projecten !== undefined ||
      body.opmerkingen !== undefined,
    {
      message: "At least one field is required",
    },
  );

export { agendaMonthIndexSchema };

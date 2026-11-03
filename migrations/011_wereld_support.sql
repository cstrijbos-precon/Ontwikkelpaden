-- Support werkt met een eigen ontwikkelpadengids en is een eigen wereld in de
-- vlootschouw. De planning bewaart de wereld per rij, dus de lijst met
-- toegestane werelden moet "Support" erbij krijgen.

ALTER TABLE vlootschouw_planning
  DROP CONSTRAINT IF EXISTS vlootschouw_planning_wereld_check;

ALTER TABLE vlootschouw_planning
  ADD CONSTRAINT vlootschouw_planning_wereld_check
  CHECK (wereld IN ('QA', 'RA', 'NF', 'Learning', 'Overhead', 'Support'));

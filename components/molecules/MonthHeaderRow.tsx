import { MONTHS } from "@/lib/verbeterplanning/constants";

interface YearGroup {
  year: number;
  count: number;
}

function groupByYear(): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const { y } of MONTHS) {
    const last = groups[groups.length - 1];
    if (last && last.year === y) {
      last.count += 1;
    } else {
      groups.push({ year: y, count: 1 });
    }
  }
  return groups;
}

export default function MonthHeaderRow() {
  const yearGroups = groupByYear();

  return (
    <thead>
      <tr className="year-header">
        <th className="project-col" rowSpan={2}>
          PROJECT
        </th>
        {yearGroups.map((group) => (
          <th key={group.year} colSpan={group.count}>
            {group.year}
          </th>
        ))}
      </tr>
      <tr className="month-header">
        {MONTHS.map(({ y, m }) => (
          <th key={`${y}-${m}`}>{m}</th>
        ))}
      </tr>
    </thead>
  );
}

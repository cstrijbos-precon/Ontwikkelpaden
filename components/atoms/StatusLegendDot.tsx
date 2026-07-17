interface StatusLegendDotProps {
  variant: "green" | "amber" | "red" | "purple" | "empty";
  label: string;
}

export default function StatusLegendDot({
  variant,
  label,
}: StatusLegendDotProps) {
  return (
    <div className="legend-item">
      <div className={`dot ${variant}`} />
      {label}
    </div>
  );
}

"use client";

const STATUS_LABELS: Record<string, string> = {
  "": "Nog niet ingevoerd",
  green: "Op koers",
  amber: "Aandacht nodig",
  red: "Achter / knelpunt",
  purple: "Gepland",
};

interface RagStatusButtonProps {
  status: string;
  size?: "sm" | "md";
  label?: string;
  onClick: () => void;
}

export default function RagStatusButton({
  status,
  size = "md",
  label,
  onClick,
}: RagStatusButtonProps) {
  const className = ["rag-btn", size === "sm" ? "rag-btn-sm" : "", status]
    .filter(Boolean)
    .join(" ");
  const statusLabel = STATUS_LABELS[status] ?? status;

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label ? `${label}: ${statusLabel}` : statusLabel}
      title={statusLabel}
    >
      {" "}
    </button>
  );
}

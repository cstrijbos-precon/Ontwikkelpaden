import type { InputHTMLAttributes } from "react";
import { enforceDate } from "@/lib/field-format";

interface DateInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type" | "onChange" | "value"
  > {
  value: string;
  onValueChange: (value: string) => void;
}

export function DateInput({
  value,
  onValueChange,
  className = "",
  ...props
}: DateInputProps) {
  return (
    <input
      type="date"
      value={value}
      className={className}
      onChange={(e) => onValueChange(enforceDate(e.target.value))}
      {...props}
    />
  );
}

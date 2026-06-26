interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: het invoerveld wordt via {children} aangeleverd en zit binnen het label (impliciete koppeling)
    <label className="fg">
      <span>{label}</span>
      {children}
    </label>
  );
}

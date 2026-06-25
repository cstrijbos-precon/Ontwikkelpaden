interface FormFieldProps {
  label: string;
  children: React.ReactNode;
}

export function FormField({ label, children }: FormFieldProps) {
  return (
    <div className="fg">
      <label>{label}</label>
      {children}
    </div>
  );
}

import { LoginForm } from "@/components/molecules/LoginForm";

export function LoginCard() {
  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg" />
        <div>
          <h1 className="text-lg font-bold text-slate-900">Trainingslijnen</h1>
          <p className="text-xs text-slate-500">Log in om te beginnen</p>
        </div>
      </div>
      <LoginForm />
    </div>
  );
}

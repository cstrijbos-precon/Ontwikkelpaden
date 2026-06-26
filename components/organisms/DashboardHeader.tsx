"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/atoms/Button";

interface DashboardHeaderProps {
  email: string;
  isAdmin: boolean;
}

export function DashboardHeader({ email, isAdmin }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-bold text-slate-900">Trainingslijnen</h1>
        <p className="text-sm text-slate-500">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <span className="text-xs font-medium bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
            Admin
          </span>
        )}
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Uitloggen
        </Button>
      </div>
    </header>
  );
}

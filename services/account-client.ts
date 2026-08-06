export interface AccountStatus {
  bekend: boolean;
  registrerenMogelijk: boolean;
  codeNodig: boolean;
}

async function leesFout(res: Response, standaard: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || standaard;
  } catch {
    return standaard;
  }
}

export async function haalAccountStatus(email: string): Promise<AccountStatus> {
  const res = await fetch("/api/account/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error(await leesFout(res, "Kon dit adres niet controleren."));
  }
  return (await res.json()) as AccountStatus;
}

export async function maakAccount(
  email: string,
  wachtwoord: string,
  code?: string,
): Promise<void> {
  const res = await fetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, wachtwoord, code }),
  });

  if (!res.ok) {
    throw new Error(await leesFout(res, "Account aanmaken mislukt."));
  }
}

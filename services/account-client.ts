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

export interface AccountRegel {
  email: string;
  aangemaaktOp: string;
  laatstIngelogdOp: string | null;
  geverifieerd: boolean;
}

export async function haalAccounts(): Promise<AccountRegel[]> {
  const res = await fetch("/api/account/beheer");
  if (!res.ok) {
    throw new Error(await leesFout(res, "Kon de accounts niet laden."));
  }
  const data = (await res.json()) as { accounts: AccountRegel[] };
  return data.accounts;
}

export async function geefAccountVrij(email: string): Promise<void> {
  const res = await fetch("/api/account/beheer", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error(await leesFout(res, "Vrijgeven mislukt."));
  }
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

/** Wisselt de link uit de verificatiemail in voor een bevestigd account. */
export async function bevestigEmail(token: string): Promise<void> {
  const res = await fetch("/api/account/verifieer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error(await leesFout(res, "Bevestigen is mislukt."));
  }
}

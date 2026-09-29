export { auth as proxy } from "@/auth";

export const config = {
  // /verifieer bevestigt een e-mailadres via een tokenlink uit de mail, vóór
  // je kunt inloggen — moet dus net als /login zonder sessie bereikbaar zijn.
  matcher: [
    "/((?!api|login|verifieer|_next/static|_next/image|favicon.ico).*)",
  ],
};

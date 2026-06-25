import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Gebruik: npm run hash-password -- <wachtwoord>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
const escaped = hash.replace(/\$/g, "\\$");
console.log(hash);
console.log("\nZet in .env.local (escape elke $ met backslash):");
console.log(`APP_USERS=jouw@email.nl:${escaped}`);
console.log("\nOp Vercel (geen escaping nodig in het dashboard):");
console.log(`APP_USERS=jouw@email.nl:${hash}`);

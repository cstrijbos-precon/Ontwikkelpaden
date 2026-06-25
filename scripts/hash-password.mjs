import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Gebruik: npm run hash-password -- <wachtwoord>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);
console.log("\nZet in .env.local als:");
console.log(`APP_USERS=jouw@email.nl:${hash}`);

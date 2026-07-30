import "dotenv/config";
import { db } from "./client";
import { companies } from "./schema";

async function main() {
  const [company] = await db.insert(companies).values({ name: "Minha Locadora" }).returning();
  console.log("Empresa criada:", company);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
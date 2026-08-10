import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest draait zonder `globals`, dus de automatische opruiming van
// Testing Library slaat niet aan. Zonder dit stapelen componenten uit
// opeenvolgende tests zich op in dezelfde DOM.
afterEach(cleanup);

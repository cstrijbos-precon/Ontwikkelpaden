import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90,
      },
      include: ["lib/**", "services/**", "hooks/**", "app/api/**"],
      exclude: [
        "**/*.d.ts",
        "**/types/**",
        "lib/data/**",
        "lib/export-word.ts",
        "app/api/auth/**",
      ],
    },
  },
});

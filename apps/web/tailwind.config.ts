import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "tailwindcss";

// Anchor content globs to THIS file's directory so they resolve no matter what
// cwd the dev server is launched from (e.g. repo root via .claude/launch.json).
const here = dirname(fileURLToPath(import.meta.url));

const config: Config = {
  content: [join(here, "src/**/*.{ts,tsx,mdx}")],
  theme: {
    extend: {
      colors: {
        // Meta-Asset brand palette.
        ink: "#0a0a0f",
        accent: "#7c5cff",
        accent2: "#16e0bd",
      },
    },
  },
  plugins: [],
};

export default config;

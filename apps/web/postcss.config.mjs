import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve Tailwind's config explicitly relative to THIS file. Without this, Tailwind
// searches the process cwd (which is the repo root when launched via .claude/launch.json)
// and silently falls back to an empty config — dropping all custom classes.
const here = dirname(fileURLToPath(import.meta.url));

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: { config: join(here, "tailwind.config.ts") },
    autoprefixer: {},
  },
};

export default config;

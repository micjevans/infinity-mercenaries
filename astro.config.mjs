import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  integrations: [mdx(), react()],
  site: "https://mercenaries.bss.design",
  adapter: cloudflare()
});
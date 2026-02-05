import { z } from "zod";

const configSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  TRANSLATIONS_DIR: z.string().default("../../apps/web/lib/i18n/locales"),
});

export const config = configSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
  TRANSLATIONS_DIR:
    process.env.TRANSLATIONS_DIR || "../../apps/web/lib/i18n/locales",
});

import OpenAI from "openai";

import { config } from "./config";

export class TranslationService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  async translateText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: string,
  ): Promise<string> {
    const prompt = this.buildPrompt(
      text,
      sourceLanguage,
      targetLanguage,
      context,
    );

    const response = await this.client.chat.completions.create({
      model: config.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator for a web application. Translate the given text accurately while maintaining the same tone and technical terminology. Return ONLY the translated text without any explanation or additional formatting.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const translated = response.choices[0]?.message?.content?.trim() || text;
    return translated;
  }

  async translateBatch(
    texts: Array<{ key: string; value: string; context?: string }>,
    sourceLanguage: string,
    targetLanguage: string,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // Process in smaller batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const translations = await Promise.all(
        batch.map(async ({ key, value, context }) => {
          try {
            const translated = await this.translateText(
              value,
              sourceLanguage,
              targetLanguage,
              context,
            );
            return { key, value: translated };
          } catch (error) {
            console.error(`Error translating key "${key}":`, error);
            return { key, value }; // Return original if translation fails
          }
        }),
      );

      translations.forEach(({ key, value }) => {
        results.set(key, value);
      });

      // Small delay to avoid rate limits
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  private buildPrompt(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    context?: string,
  ): string {
    let prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}:\n\n"${text}"`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt +=
      "\n\nImportant: Return ONLY the translated text, without quotes or any additional explanation.";

    return prompt;
  }
}

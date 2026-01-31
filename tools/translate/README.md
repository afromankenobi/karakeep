# Karakeep AI Translation Tool

An AI-powered command-line tool to automatically generate missing translations for Karakeep's internationalization files.

## Features

- 🌍 Automatically detects missing translation keys across all language files
- 🤖 Uses OpenAI's GPT models to generate high-quality translations
- 📊 Batch processing to efficiently translate multiple keys
- 🔍 Interactive CLI to select which languages to translate
- ✅ Maintains JSON structure and formatting

## Prerequisites

- Node.js 18 or higher
- An OpenAI API key
- pnpm (for development)

## Installation

1. Navigate to the translate tool directory:
   ```bash
   cd tools/translate
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4o-mini
   ```

## Usage

### Run the translation tool

```bash
pnpm run
```

The tool will:
1. Load the English (source) translation file
2. Scan all available language directories
3. Show you which languages have missing translations
4. Allow you to select which languages to translate
5. Use AI to generate the missing translations
6. Save the updated translation files

### Example session

```
🌍 Karakeep AI Translation Tool

Base directory: /path/to/karakeep/apps/web/lib/i18n/locales
Source language: en

📖 Loading source translations...
✓ Loaded 853 keys from en

Available target languages:
  1. ar (Arabic)
  2. cs (Czech)
  3. de (German)
  ...

Which languages do you want to translate? (comma-separated codes, or 'all'): fr,es,de

✓ Selected 3 language(s): fr, es, de

🔍 Analyzing missing translations...
  fr (French): 66 missing key(s)
  es (Spanish): 66 missing key(s)
  de (German): 66 missing key(s)

Do you want to generate missing translations using AI? (yes/no): yes

🤖 Initializing AI translation service (gpt-4o-mini)...

📝 Translating 66 keys to French...
  Translating... (this may take a while)
  ✓ Saved 66 new translation(s) to fr

✓ Translation completed successfully!
```

## Configuration

You can configure the tool using environment variables in the `.env` file:

- `OPENAI_API_KEY` (required): Your OpenAI API key
- `OPENAI_MODEL` (optional): The model to use (default: `gpt-4o-mini`)
  - Recommended: `gpt-4o-mini` for cost-effectiveness
  - For higher quality: `gpt-4o` or `gpt-4-turbo`
- `TRANSLATIONS_DIR` (optional): Path to translations directory (default: `../../apps/web/lib/i18n/locales`)

## How It Works

1. **Detection**: The tool compares the English translation file (source) with each target language file to identify missing keys.

2. **Batch Translation**: Missing keys are translated in batches of 10 to optimize API usage and avoid rate limits.

3. **Context Preservation**: The key path is used as context for better translation accuracy (e.g., "settings.ai.auto_tagging").

4. **Smart Saving**: Translated values are inserted into the existing JSON structure, maintaining proper nesting and formatting.

## Best Practices

- **Review Generated Translations**: While AI translations are generally good, always review them for accuracy, especially for technical terms.
- **Use Appropriate Model**: `gpt-4o-mini` is fast and cost-effective. Use `gpt-4o` for critical translations that require higher accuracy.
- **Backup First**: The tool modifies translation files directly. Consider backing up your files before running.
- **Incremental Updates**: You can run the tool multiple times. It will only translate missing keys.

## Troubleshooting

### Error: OPENAI_API_KEY is required

Make sure you've created a `.env` file and added your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your API key
```

### Rate Limit Errors

The tool includes automatic delays between batches. If you still hit rate limits:
- Reduce the batch size in `translationService.ts`
- Use a slower, more reliable model
- Wait a few minutes and try again

### Translation Quality Issues

If translations don't seem accurate:
- Try using `gpt-4o` instead of `gpt-4o-mini` for better quality
- Review and manually fix problematic translations
- Consider contributing to [Weblate](https://hosted.weblate.org/engage/hoarder/) for community-driven translations

## Development

### Build the tool

```bash
pnpm build
```

This creates a compiled version in the `dist` directory.

### Type checking

```bash
pnpm typecheck
```

## Contributing

Contributions are welcome! If you find issues or have suggestions:
1. Open an issue on GitHub
2. Submit a pull request with improvements
3. Help translate on [Weblate](https://hosted.weblate.org/engage/hoarder/)

## License

Same as Karakeep main project.

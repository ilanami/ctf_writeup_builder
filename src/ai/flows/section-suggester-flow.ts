'use server';
/**
 * @fileOverview AI flow to suggest content for a CTF write-up section.
 *
 * - suggestSectionContent - Generates Markdown content for a given section title, type, and user prompt.
 * - SuggestSectionContentInput - Input type for the flow.
 * - SuggestSectionContentOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import type { SectionType } from '@/lib/types';
import { z } from 'genkit';

const SuggestSectionContentInputSchema = z.object({
  sectionTitle: z.string().describe('The title of the section for which to generate content.'),
  sectionType: z.custom<SectionType>().describe('The type of the section (e.g., paso, pregunta, flag, notas).'),
  userPrompt: z.string().optional().describe('An optional user-provided prompt or keywords to guide content generation.'),
});
export type SuggestSectionContentInput = z.infer<typeof SuggestSectionContentInputSchema>;

const SuggestSectionContentOutputSchema = z.object({
  suggestedContent: z.string().describe('The AI-generated Markdown content for the section.'),
});
export type SuggestSectionContentOutput = z.infer<typeof SuggestSectionContentOutputSchema>;

export async function suggestSectionContent(input: SuggestSectionContentInput): Promise<SuggestSectionContentOutput> {
  // Basic validation
  if (!input.sectionTitle || input.sectionTitle.trim() === "") {
    throw new Error("Section title cannot be empty for AI generation.");
  }
  return sectionSuggesterFlow(input);
}

const sectionContentPrompt = ai.definePrompt({
  name: 'sectionContentPrompt',
  input: { schema: SuggestSectionContentInputSchema },
  output: { schema: SuggestSectionContentOutputSchema },
  prompt: `You are an expert cybersecurity Capture The Flag (CTF) player and technical writer.
Your task is to generate initial Markdown content for a specific section of a CTF write-up.

Section Title: {{{sectionTitle}}}
Section Type: {{{sectionType}}}
{{#if userPrompt}}User's Focus/Keywords for this section: {{{userPrompt}}}{{/if}}

Based on this information, provide a comprehensive and well-formatted Markdown draft for this section.
- If the section type is 'paso' (step), describe common actions, tools, or commands relevant to the title and prompt.
- If it's 'pregunta' (question), formulate a relevant question based on the title/prompt and provide a common or example answer.
- If it's 'flag', describe how a flag might be typically found, formatted, or what it might represent in the context of the title/prompt.
- If it's 'notas' (notes), provide general observations, tips, or further research points related to the title/prompt.

Use Markdown effectively:
- Employ headings (e.g., ## Sub-heading) if appropriate for structure.
- Use code blocks (e.g., \`\`\`bash ... \`\`\`) for commands or code snippets.
- Use lists (bulleted or numbered) for steps or enumerated items.
- Emphasize key terms using **bold** or *italics*.

Be concise but informative. Aim for a helpful starting point that the user can then elaborate on.

Generated Markdown Content:
`,
});

const sectionSuggesterFlow = ai.defineFlow(
  {
    name: 'sectionSuggesterFlow',
    inputSchema: SuggestSectionContentInputSchema,
    outputSchema: SuggestSectionContentOutputSchema,
  },
  async (input) => {
    const { output } = await sectionContentPrompt(input);
    if (!output) {
      // This case should ideally be handled by Genkit if the model fails to produce output matching the schema.
      // However, as a fallback:
      throw new Error('AI did not return an output matching the expected schema.');
    }
    return output;
  }
);

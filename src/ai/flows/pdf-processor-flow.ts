
'use server';
/**
 * @fileOverview AI flow to process a PDF and extract structured content.
 *
 * - processPdf - Extracts structured sections (title, content as Markdown) from a PDF.
 * - PdfInput - Input type for the flow (PDF data URI).
 * - AiPdfParseOutput - Output type for the flow (array of parsed sections).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const PdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "The PDF file content as a data URI. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type PdfInput = z.infer<typeof PdfInputSchema>;

const AiProcessedSectionSchema = z.object({
  title: z.string().describe('A concise title for the identified section.'),
  content: z.string().describe("The Markdown content for this section. IMPORTANT: If images were present in this section of the PDF, you MUST insert a placeholder in the Markdown text exactly where the image appeared. The placeholder format is: \"[IMAGEN: Provide a 1-2 sentence, human-readable description of the image's content and its relevance to the section. e.g., 'Nmap scan results showing open ports.' or 'Login page screenshot with SQL injection payload.']\". Do not attempt to reproduce or describe the image data itself, only insert this placeholder string."),
});

export const AiPdfParseOutputSchema = z.object({
  parsed_sections: z
    .array(AiProcessedSectionSchema)
    .describe('An array of sections extracted and structured from the PDF by the AI.'),
});
export type AiPdfParseOutput = z.infer<typeof AiPdfParseOutputSchema>;


export async function processPdf(input: PdfInput): Promise<AiPdfParseOutput> {
  if (!input.pdfDataUri) {
    throw new Error('PDF data URI is required for AI processing.');
  }
  return pdfProcessorFlow(input);
}

const pdfProcessingPrompt = ai.definePrompt({
  name: 'pdfProcessingPrompt',
  input: { schema: PdfInputSchema },
  output: { schema: AiPdfParseOutputSchema },
  prompt: `You are an expert in analyzing technical documents, especially cybersecurity CTF (Capture The Flag) write-ups.
Your task is to process the provided PDF content and extract its structure into logical sections.

For the PDF provided via the 'pdfDataUri' input:
1. Identify the main sections or logical parts of the document. These could be chapters, major headings, or distinct topics.
2. For each section you identify:
    a. Extract or formulate a concise and descriptive title for that section.
    b. Extract the relevant textual content for that section and format it as well-structured Markdown. Ensure code blocks, lists, and other formatting are preserved or appropriately converted to Markdown.
    c. **Crucially**: If you encounter any images within a section of the PDF, you MUST insert a placeholder string in the Markdown content *exactly where the image appeared*. The placeholder format is: "[IMAGEN: Provide a 1-2 sentence, human-readable description of the image's content and its relevance or context within the section. For example: '[IMAGEN: Nmap scan results showing open ports 22, 80, and 443 on the target IP.]' or '[IMAGEN: Screenshot of the web application's dashboard after successful login.]']". Do NOT attempt to describe the image in prose outside this placeholder. Do NOT try to reproduce the image data itself.
3. Return the extracted information as a JSON object matching the output schema, containing an array called "parsed_sections". Each element in this array should be an object with "title" and "content" fields.

If the PDF is unparsable, contains no discernible text, or is not a document format you can understand, return an empty "parsed_sections" array.
Do not invent content. Only extract and structure what is present in the PDF.
Focus on clear, well-formatted Markdown output for the content of each section.
`,
});

const pdfProcessorFlow = ai.defineFlow(
  {
    name: 'pdfProcessorFlow',
    inputSchema: PdfInputSchema,
    outputSchema: AiPdfParseOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await pdfProcessingPrompt(input);
      if (!output) {
        console.warn('AI PDF processing returned no output, returning empty sections.');
        return { parsed_sections: [] };
      }
      // Ensure parsed_sections is always an array, even if the AI fails to structure it correctly
      return { parsed_sections: Array.isArray(output.parsed_sections) ? output.parsed_sections : [] };
    } catch (error) {
      console.error('Error in pdfProcessorFlow during AI prompt execution:', error);
      // Return empty sections on error to allow fallback to pdfjs-dist
      return { parsed_sections: [] };
    }
  }
);

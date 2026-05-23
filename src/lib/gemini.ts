import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { Volunteer } from '../types';

// Initialize the Gemini client using the Vite environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// ============================================================================
// SCHEMAS
// ============================================================================

const volunteerSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    name: { type: SchemaType.STRING, description: "The volunteer's name. Use an empty string if not provided." },
    contact: { type: SchemaType.STRING, description: "The volunteer's phone number or email address. Use an empty string if not provided." },
    location: {
      type: SchemaType.OBJECT,
      properties: {
        lat: { type: SchemaType.NUMBER, description: "Approximate latitude based on the city/neighborhood mentioned. Use 0 if completely unknown." },
        lng: { type: SchemaType.NUMBER, description: "Approximate longitude based on the city/neighborhood mentioned. Use 0 if completely unknown." }
      }
    },
    skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "A list of skills the volunteer has (e.g., 'First Aid', 'Debris Clearing', 'Translation')."
    },
    equipment: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "A list of physical equipment the volunteer is offering (e.g., 'Pickup Truck', 'Chainsaw', 'Blankets')."
    },
    availability: { type: SchemaType.STRING, description: "A summary of when the volunteer can help (e.g., 'Weekends', 'All day today')." },
    status: { type: SchemaType.STRING, description: "Always return 'pending' for new intakes." }
  },
  required: ["name", "contact", "skills", "equipment", "availability", "status"]
};

const publicSiteSchema: any = {
  type: SchemaType.OBJECT,
  properties: {
    title: { 
      type: SchemaType.STRING, 
      description: "A clear, actionable, and calm title for the emergency update." 
    },
    announcement: { 
      type: SchemaType.STRING, 
      description: "A short, straightforward public announcement explaining what happened, what to do, and the current status. No jargon or metaphors." 
    },
    faqs: {
      type: SchemaType.ARRAY,
      description: "Exactly three frequently asked questions and answers for the public.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question: { type: SchemaType.STRING },
          answer: { type: SchemaType.STRING }
        },
        required: ["question", "answer"]
      }
    },
    smsSummary: { 
      type: SchemaType.STRING, 
      description: "A brief, urgent but calm summary suitable for an SMS alert (under 160 characters)." 
    }
  },
  required: ["title", "announcement", "faqs", "smsSummary"]
};

// ============================================================================
// TYPES
// ============================================================================

export interface PublicSiteData {
  title: string;
  announcement: string;
  faqs: { question: string; answer: string }[];
  smsSummary: string;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Sends a natural language message to Gemini 1.5 Flash and extracts
 * structured JSON data matching the Volunteer interface.
 */
export async function parseVolunteerMessage(history: { role: string; content: string }[]): Promise<Omit<Volunteer, 'id'> | null> {
  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY in environment variables.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: `You are a specialized data extraction bot. Analyze conversation history and extract volunteer details into the provided JSON schema. 
      IMPORTANT: If a field is missing, use an empty string or empty array. If the user is just saying hello or off-topic, still return the JSON object with empty fields and 'status' as 'pending'. 
      Never return plain text; always return valid JSON.`,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: volunteerSchema,
        temperature: 0.1,
      }
    });

    const conversation = history
      .map((m) => `${m.role === 'system' ? 'Assistant' : 'User'}: ${m.content}`)
      .join('\n');

    const prompt = `Analyze this conversation and extract the volunteer's information:\n\n${conversation}`;

    const result = await model.generateContent(prompt);

    // Check if the response was blocked or empty
    const response = result.response;
    if (!response || !response.candidates?.[0]) {
      console.warn("Gemini: No response candidates returned. This might be due to safety filters.");
      return null;
    }

    const responseText = result.response.text();
    if (!responseText) return null;

    // Robust JSON extraction: look for the first '{' and last '}'
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : responseText.trim();
    if (!cleanJson) return null;

    return JSON.parse(cleanJson) as Omit<Volunteer, 'id'>;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

/**
 * Takes an internal incident description and generates a structured, public-facing
 * crisis update site payload including FAQs and an SMS blast.
 */
export async function generatePublicSite(incidentDescription: string): Promise<PublicSiteData | null> {
  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY in environment variables.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: publicSiteSchema,
        temperature: 0.3, 
      }
    });

    const prompt = `
      You are an expert Public Information Officer for a local community response team.
      We have an active incident occurring. I need you to translate the internal incident description below 
      into a calm, clear, and straightforward public update.
      
      RULES:
      1. Write in plain, human-sounding language. Do not use military/police jargon.
      2. Be optimistic but realistic. Do not use abstract metaphors.
      3. Create exactly 3 highly relevant FAQs based on the situation.
      4. Ensure the SMS summary is well under 160 characters.
      
      Internal Incident Description:
      "${incidentDescription}"
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Sanitize response: Remove potential markdown code blocks and whitespace
    const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
    if (!cleanJson) return null;

    return JSON.parse(cleanJson) as PublicSiteData;

  } catch (error) {
    console.error("Failed to generate public site with Gemini:", error);
    return null;
  }
}

/**
 * A chat interface function for the coordinator.
 * Takes the user's prompt and a JSON string representing the current active incidents,
 * and returns a helpful, context-aware plain text response.
 */
export async function askAssistant(prompt: string, incidentsJson: string): Promise<string | null> {
  if (!apiKey) {
    console.error("Missing VITE_GEMINI_API_KEY in environment variables.");
    return null;
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2, // Low temperature for factual, operational responses
      }
    });

    const systemPrompt = `
      You are an AI assistant helping a community emergency response coordinator manage active incidents.
      Your tone should be professional, straightforward, and helpful. Do not use abstract metaphors.
      
      Here is the raw JSON data containing the currently active incidents:
      ${incidentsJson}
      
      Please answer the coordinator's following question based entirely on the active incident data provided above.
      If the answer is not in the data, state that clearly. Keep your answer brief and direct.
      
      Coordinator Question: "${prompt}"
    `;

    const result = await model.generateContent(systemPrompt);
    return result.response.text();

  } catch (error) {
    console.error("Failed to get response from assistant:", error);
    return null;
  }
}

import { GoogleGenAI, Type } from "@google/genai";
import type { ChatMessage, ExtractedActionItem } from '../types';

const getAi = () => {
    const API_KEY = (window as any).GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("Google AI API key is not available. Please ensure you are authenticated correctly or it is configured for your environment.");
    }

    const config: { apiKey: string; httpOptions?: { baseUrl?: string } } = { apiKey: API_KEY };
    
    const href = window.location.href;
    const isStudioMode = href.includes('.goog');
    
    if (!isStudioMode) {
        config.httpOptions = { baseUrl: "https://www.dev.humanizeiq.ai/api-proxy" };
    }

    return new GoogleGenAI(config as any);
};


export async function summarizeIssueFromConversation(messages: ChatMessage[]): Promise<{ appName: string; title: string; description: string; }> {
    try {
        const ai = getAi();
        const model = 'gemini-2.5-flash';

        const systemInstruction = `You are an expert at summarizing conversations into bug reports. Based on the provided chat history between a user and a model, extract the application name, a concise title for the issue, and a detailed description of the problem the user is facing. If any information is missing from the conversation, use a sensible placeholder like "Not specified by user".`;

        const conversationForPrompt = messages
            .filter(m => m.content)
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        const prompt = `Here is the conversation history:\n\n${conversationForPrompt}\n\nPlease summarize this into a bug report based on my instructions.`;
        
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      appName: { type: Type.STRING, description: 'The name of the application with the issue.' },
                      title: { type: Type.STRING, description: 'A short, descriptive title for the bug report.' },
                      description: { type: Type.STRING, description: 'A detailed description of the issue, including steps to reproduce if mentioned.' },
                  },
                  required: ['appName', 'title', 'description']
              }
            }
        });
        
        const jsonStr = response.text.trim();
        const result = JSON.parse(jsonStr);
        return result;

    } catch (error) {
        console.error("Error calling Gemini API for summarization:", error);
        if (error instanceof Error) {
            return Promise.reject(new Error(`Failed to summarize the issue: ${error.message}`));
        }
        return Promise.reject(new Error("An unknown error occurred during summarization."));
    }
}

export async function extractActionItems(transcript: string, knownMembers: string[]): Promise<ExtractedActionItem[]> {
    try {
        const ai = getAi();
        const model = 'gemini-2.5-flash';
        const membersList = knownMembers.join(", ");

        const systemInstruction = `You are an AI assistant that extracts action items from meeting transcripts.
        You will be given a text. Extract every action item mentioned.
        For each item, identify:
        1. Title: What needs to be done.
        2. Assignee: Who needs to do it. Try to match with these known team members: ${membersList}. If unknown, use the name found in text or "Unassigned".
        3. DueDate: If a date is mentioned (e.g. "by Friday", "next week"), convert it to YYYY-MM-DD format. If not mentioned, leave empty.
        4. Status: Default to "In Progress" unless the text explicitly says it's done.
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: `Transcript:\n${transcript}`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            assignee: { type: Type.STRING },
                            dueDate: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ["In Progress", "Done"] }
                        },
                        required: ["title", "assignee"]
                    }
                }
            }
        });

        const jsonStr = response.text.trim();
        return JSON.parse(jsonStr) as ExtractedActionItem[];
    } catch (error) {
        console.error("Error calling Gemini API for extraction:", error);
        throw error;
    }
}

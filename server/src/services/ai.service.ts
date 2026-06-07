import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { env } from "../config/env.js";

type ReplyInput = {
  clientName: string;
  tone: string;
  notes?: string;
  from: string;
  subject: string;
  snippet: string;
};

export async function generateAiReply(input: ReplyInput) {
  const system = `You are MailFast AI, an AI email assistant replying on behalf of ${input.clientName}.
Tone: ${input.tone}.
Client notes: ${input.notes || "No special notes"}.
Rules: be polite, professional, concise, first-person, under 200 words, ask for clarification if needed, avoid sensitive details and commitments unless provided.`;
  const prompt = `${system}\n\nIncoming email:\nFrom: ${input.from}\nSubject: ${input.subject}\nMessage: ${input.snippet}`;

  if (env.aiProvider === "openai" && env.openAiApiKey) {
    const openai = new OpenAI({ apiKey: env.openAiApiKey });
    const completion = await openai.chat.completions.create({
      model: env.openAiModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `From: ${input.from}\nSubject: ${input.subject}\nMessage: ${input.snippet}` }
      ],
      temperature: 0.4
    });
    return completion.choices[0]?.message.content || fallbackReply(input);
  }

  if (env.geminiApiKey) {
    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text() || fallbackReply(input);
  }

  return fallbackReply(input);
}

function fallbackReply(input: ReplyInput) {
  return `Hi, thanks for your message. I received your note about ${input.subject.toLowerCase()}. I will review the details and get back to you if anything else is needed.\n\nBest regards,\n${input.clientName.split(" ")[0]}`;
}

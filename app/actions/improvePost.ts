"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { IMPROVE_POST_SYSTEM_PROMPT, IMPROVE_POST_USER_PROMPT } from "@/lib/prompts";

const ai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function improvePost(content: string, prompt: string) {
  try {
    const { text } = await generateText({
      model: ai("gpt-5"),
      system: IMPROVE_POST_SYSTEM_PROMPT,
      prompt: IMPROVE_POST_USER_PROMPT(content, prompt),
      temperature: 0.7,
      maxTokens: 1000,
    });

    return {
      content: text || "",
      error: null,
    };
  } catch (error) {
    console.error("Error improving post with AI:", error);
    return {
      content: "",
      error:
        error instanceof Error
          ? error.message
          : "AI가 콘텐츠 개선에 실패했습니다",
    };
  }
}

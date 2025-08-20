// ===========================================
// TOPIC FINDER PROMPTS
// ===========================================
import singleThreadExamples from './ai-example-single-thread.json';
import threadChainExamples from './ai-example-thread-chain.json';

export const COMMON_SETTINGS = `You are an assistant that helps select compelling topics for Thread posts.`;
export const USER_SETTINGS = (accountInfo: string) => `User Settings\n${accountInfo}`;
export const INSTRUCTIONS = `Generate 5 topics in JSON format ("topic": "TOPIC CONTEXT HERE") that would draw strong interest if posted as Threads. Your response must include only the JSON data—no extra commentary.`;

export const SINGLE_THREAD_SETTINGS = `You are an assistant that helps writing Thread post ideas in a casual, insightful, and friendly tone. Write as if you're giving practical advice or sharing personal insights to your followers.

# Style:
- Avoid formal tone and emojis
- Prefer short sentences
- Use paragraph breaks with a blank line between paragraphs ("\\n\\n")
- Write as natural paragraphs only
- Use easy & straightforward words
- If the word is a Jargon/Slang, don't translate it even if the user selected different language

# Formatting rules:
- First line: Title (without bold formatting instructions)
- Next 2–3 lines: Strong hook (empathy + problem recognition)
- Numbered list
  - Each number follows a 2-line structure:
  - One-line conclusion (core advice stated firmly as a noun/verb)
  - Execution tip (1–2 immediately applicable actions, may include tools/examples)
- Closing line (one sentence)

[IMPORTANT: Keep it very short, within 200~300 characters in total. Do not print anything other than the content itself.]`;
export const GIVEN_TOPIC = (topic: string) => `Given Topic\n${topic}`;
export const GIVEN_INSTRUCTIONS = (instruction: string) => `Given Instructions\n${instruction}`;
export const SINGLE_THREAD_EXAMPLES = (example: string) => `Given Example\n${example}`;

export const THREAD_CHAIN_SETTINGS = `You are an assistant that creates thread chains for social media. Create 2-4 connected threads that expand on a topic. Each thread should be 200-400 characters and flow naturally from one to the next.

Formatting rules for each thread:
- Use short sentences
- Use paragraph breaks with a blank line between paragraphs ("\\n\\n")
- No emojis
- DON'T GENERATE '---' in the example. it's only to show how you should separate the threads.

Return your response as a JSON array of strings, for example:
["First thread introducing the topic and main point...", "Second thread expanding with details or examples...", "Third thread with actionable advice or conclusion..."]

Each thread should feel like a natural continuation of the conversation.
`;

// ai-example-thread-chain.json 파일을 import해서 아래 변수에 연결. 그리고 generate-detail 에서 프롬프트와 함께 사용될 수 있도록 한다.
// 파일이 없으면 빈 예시 배열을 기본값으로 둔다.
export const THREAD_CHAIN_EXAMPLES: string[] = Array.isArray(threadChainExamples) ? threadChainExamples.map(item => item.detail) : [];

// ===========================================
// POST IMPROVEMENT PROMPTS
// ===========================================

export const IMPROVE_POST_SYSTEM_PROMPT = `You are an expert content creator specialized in optimizing content for the Threads platform. You create engaging, participation-driving, and shareable content that captures attention.`;

export const IMPROVE_POST_USER_PROMPT = (content: string, prompt: string) =>
  `Please improve the following Threads post based on the specific instruction:

Original content:
${content}

Improvement instruction:
${prompt}

Maintain the core message and intent of the original while transforming it as instructed.

# Formatting rules:
- Do not print anything other than the content itself.
- Do not change a lot. Just make the edit that was instructed.
`;

// ===========================================
// POST IMPROVEMENT PRESET PROMPTS
// ===========================================

export const PRESET_PROMPTS = {
  EXPAND_POST: "더 매력적이고 흥미로운 글로 확장해줘",
  ADD_HOOKS: "이 글에 흥미로운 훅을 추가해줘",
  ADD_INFORMATION: "이 글에 더 많은 정보와 내용을 추가해줘"
};

// ===========================================
// COMMENT REPLY PROMPTS
// ===========================================

export const COMMENT_REPLY_SYSTEM_PROMPT = `You are a helpful assistant that generates thoughtful replies to comments.`;

export const COMMENT_REPLY_USER_PROMPT = (commentText: string, postContent?: string) => `
Generate a thoughtful and engaging reply to the following comment which was left on my content.

# Format rules
1. Is relevant to the comment and the post content
2. Is friendly and professional in tone
3. Is really short and casual (less than 5 words to casual comments / little longer for a comment that asks question)
4. Do not try to be overly kind or don't try too hard to engage with people. just be cool and casual. Sometimes, shorter the better.
5. No '.' at the end

# Example
Content : My co founder is a hardworking person tbh
Comment: Do you feel inspired?
Reply: Yes A lot actually

Content: ${postContent}
Comment: ${commentText}
Reply:`;

export const COMMENT_REPLY_FALLBACK = "Thank you for your comment! I appreciate your thoughts.";
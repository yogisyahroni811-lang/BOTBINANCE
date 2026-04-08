export interface AIModel {
  id: string;
  name: string;
  description: string;
  isFree?: boolean;
  isLatest?: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  logo: string;
  baseUrlSupport?: boolean;
  models: AIModel[];
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    logo: "/providers/openai.svg",
    baseUrlSupport: true,
    models: [
      { id: "gpt-4o", name: "GPT-4o", description: "Omni model, high speed and intelligence", isLatest: true },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Reliable production model" },
      { id: "o1-preview", name: "O1 Preview", description: "Reasoning specialized model", isLatest: true },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast and cost-effective", isFree: false }
    ]
  },
  {
    id: "google",
    name: "Google AI",
    logo: "/providers/google.svg",
    baseUrlSupport: true,
    models: [
      { id: "gemini-3.1-pro-high", name: "Gemini 3.1 Pro", description: "Most capable 2026 model", isLatest: true },
      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", description: "Sub-second latency architecture", isLatest: true },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Massive context window support" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Lightweight and fast", isFree: true }
    ]
  },
  {
    id: "anthropic",
    name: "Anthropic",
    logo: "/providers/anthropic.svg",
    baseUrlSupport: true,
    models: [
      { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", description: "Perfect balance of speed/intelligence", isLatest: true },
      { id: "claude-3-opus-latest", name: "Claude 3 Opus", description: "High-level reasoning capacity" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku", description: "Fastest Claude model" }
    ]
  },
  {
    id: "groq",
    name: "Groq",
    logo: "/providers/groq.svg",
    baseUrlSupport: true,
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", description: "Ultra-fast inference", isLatest: true },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", description: "High performance MoE" },
      { id: "gemma-7b-it", name: "Gemma 7B", description: "Google's open weights model", isFree: true }
    ]
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    logo: "/providers/deepseek.svg",
    baseUrlSupport: true,
    models: [
      { id: "deepseek-chat", name: "DeepSeek V3", description: "State-of-the-art open model", isLatest: true },
      { id: "deepseek-coder", name: "DeepSeek Coder", description: "Coding specialized" }
    ]
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    logo: "/providers/openrouter.svg",
    baseUrlSupport: true,
    models: [
      { id: "auto", name: "Auto (Best Route)", description: "Automatically routes to cheapest/fastest" },
      { id: "meta-llama/llama-3.1-405b", name: "Llama 3.1 405B", description: "Top tier open weights" }
    ]
  }
];

const STORAGE_KEY = 'gemini_api_key';
const MODEL_KEY = 'gemini_model';

// ─── Các model Gemini hỗ trợ ──────────────────────────────────────────────
export const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Nhanh, miễn phí, phù hợp phần lớn trường hợp' },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', desc: 'Siêu nhanh, tiết kiệm token' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Cân bằng tốc độ và chất lượng' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Chất lượng cao nhất, chậm hơn' },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]['id'];

// ─── API Key ──────────────────────────────────────────────────────────────
export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function removeGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Model Selection ──────────────────────────────────────────────────────
export function getGeminiModel(): GeminiModelId {
  const stored = localStorage.getItem(MODEL_KEY);
  if (stored && GEMINI_MODELS.some(m => m.id === stored)) return stored as GeminiModelId;
  return 'gemini-2.0-flash';
}

export function setGeminiModel(model: GeminiModelId) {
  localStorage.setItem(MODEL_KEY, model);
}

// ─── Test API Key ─────────────────────────────────────────────────────────
export async function testGeminiApiKey(apiKey?: string): Promise<{ ok: boolean; error?: string }> {
  const key = apiKey ?? getGeminiApiKey();
  if (!key) return { ok: false, error: 'Chưa nhập API Key.' };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Trả lời đúng 1 từ: "ok"' }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 10 },
        }),
      }
    );

    if (!res.ok) {
      if (res.status === 400 || res.status === 403) {
        return { ok: false, error: 'API Key không hợp lệ hoặc đã bị vô hiệu hóa.' };
      }
      if (res.status === 429) {
        return { ok: false, error: 'Đã vượt giới hạn request. Thử lại sau ít phút.' };
      }
      const err = await res.json().catch(() => ({}));
      return { ok: false, error: err?.error?.message || `Lỗi ${res.status}` };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Không thể kết nối đến Gemini API. Kiểm tra kết nối mạng.' };
  }
}

// ─── Generate Post Content ────────────────────────────────────────────────
export interface GeneratePostOptions {
  topic: string;
  mood?: string;
  keywords?: string;
  model?: GeminiModelId;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Gọi Gemini API trực tiếp từ frontend với API key của user.
 * Không gửi key qua backend — key chỉ ở client.
 */
export async function generatePostContent(opts: GeneratePostOptions): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const model = opts.model || getGeminiModel();
  const temperature = opts.temperature ?? 0.9;
  const maxOutputTokens = opts.maxTokens ?? 500;
  const prompt = buildPrompt(opts);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 400 || res.status === 403) {
      throw new Error('API Key không hợp lệ hoặc đã bị vô hiệu hóa. Kiểm tra lại trong Cài đặt.');
    }
    if (res.status === 429) {
      throw new Error('Đã vượt giới hạn request Gemini. Thử lại sau ít phút.');
    }
    throw new Error(err?.error?.message || `Gemini API lỗi (${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini không trả về nội dung. Thử lại với chủ đề khác.');

  return text.trim();
}

function buildPrompt(opts: GeneratePostOptions): string {
  let prompt = `Viết một bài đăng mạng xã hội bằng tiếng Việt về chủ đề: "${opts.topic}".`;

  if (opts.mood) {
    prompt += ` Tâm trạng/giọng văn: ${opts.mood}.`;
  }
  if (opts.keywords) {
    prompt += ` Từ khóa liên quan: ${opts.keywords}.`;
  }

  prompt += `
Yêu cầu:
- Ngắn gọn, tự nhiên, phù hợp đăng Facebook/mạng xã hội (100-300 từ)
- Có thể dùng emoji phù hợp
- Có thể thêm hashtag ở cuối
- Không thêm tiêu đề, không dùng markdown
- Chỉ trả về nội dung bài đăng, không giải thích thêm`;

  return prompt;
}

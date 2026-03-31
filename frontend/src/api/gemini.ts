const STORAGE_KEY = 'gemini_api_key';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY, key.trim());
}

export function removeGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export interface GeneratePostOptions {
  topic: string;
  mood?: string;
  keywords?: string;
}

/**
 * Gọi Gemini API trực tiếp từ frontend với API key của user.
 * Không gửi key qua backend — key chỉ ở client.
 */
export async function generatePostContent(opts: GeneratePostOptions): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error('Chưa cấu hình Gemini API Key. Vào Cài đặt để thêm.');

  const prompt = buildPrompt(opts);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 400 || res.status === 403) {
      throw new Error('API Key không hợp lệ hoặc đã bị vô hiệu hóa.');
    }
    throw new Error(err?.error?.message || `Gemini API lỗi (${res.status})`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini không trả về nội dung.');

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

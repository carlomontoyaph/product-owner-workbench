import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock OpenAI SDK
vi.mock('openai', () => {
  const mockCreate = vi.fn();
  const mockOpenAI = vi.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
  mockOpenAI.AuthenticationError = class extends Error { name = 'AuthenticationError'; status = 401; };
  mockOpenAI.RateLimitError = class extends Error { name = 'RateLimitError'; status = 429; };
  mockOpenAI.APIConnectionError = class extends Error { name = 'APIConnectionError'; };
  mockOpenAI.APIError = class extends Error { name = 'APIError'; status = 500; };
  return { default: mockOpenAI, __mocks__: { mockCreate } };
});

describe('API Routes — Layer 3 (OpenAI integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns ok=true and apiKey=false when OPENAI_API_KEY is missing', async () => {
      delete process.env.OPENAI_API_KEY;

      const { GET } = await import('./health/route');
      const response = await GET();
      const json = await response.json();

      expect(json).toEqual({
        ok: true,
        apiKey: false,
      });
    });

    it('returns ok=true and apiKey=true when OPENAI_API_KEY is set', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key-xyz';

      const { GET } = await import('./health/route');
      const response = await GET();
      const json = await response.json();

      expect(json).toEqual({
        ok: true,
        apiKey: true,
      });
    });
  });

  describe('POST /api/confidence/[name]', () => {
    it('returns default confidence when no API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const { POST } = await import('./confidence/[name]/route');
      const req = new NextRequest('http://localhost:3000/api/confidence/epic', {
        method: 'POST',
        body: JSON.stringify({ data: {} }),
      });

      const response = await POST(req, { params: Promise.resolve({ name: 'epic' }) });
      const json = await response.json();

      expect(json).toEqual({
        confidence: 85,
        improvementTips: [],
      });
    });

    it('calls OpenAI when API key is available', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      // Get the mock from the imported OpenAI module
      const { default: OpenAI, __mocks__ } = await import('openai');
      __mocks__.mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                confidence: 92,
                improvementTips: ['Add more detail', 'Consider edge cases'],
              }),
            },
          },
        ],
      });

      const { POST } = await import('./confidence/[name]/route');
      const req = new NextRequest('http://localhost:3000/api/confidence/epic', {
        method: 'POST',
        body: JSON.stringify({ data: { title: 'Test epic' } }),
      });

      const response = await POST(req, { params: Promise.resolve({ name: 'epic' }) });
      const json = await response.json();

      expect(json.confidence).toBe(92);
      expect(json.improvementTips).toContain('Add more detail');
    });

    it('clamps confidence to 0-100 range', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const { __mocks__ } = await import('openai');
      __mocks__.mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                confidence: 150, // Out of range
                improvementTips: [],
              }),
            },
          },
        ],
      });

      const { POST } = await import('./confidence/[name]/route');
      const req = new NextRequest('http://localhost:3000/api/confidence/epic', {
        method: 'POST',
        body: JSON.stringify({ data: {} }),
      });

      const response = await POST(req, { params: Promise.resolve({ name: 'epic' }) });
      const json = await response.json();

      expect(json.confidence).toBe(100);
    });

    it('falls back to default on OpenAI error', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const { __mocks__ } = await import('openai');
      __mocks__.mockCreate.mockRejectedValue(new Error('OpenAI API error'));

      const { POST } = await import('./confidence/[name]/route');
      const req = new NextRequest('http://localhost:3000/api/confidence/epic', {
        method: 'POST',
        body: JSON.stringify({ data: {} }),
      });

      const response = await POST(req, { params: Promise.resolve({ name: 'epic' }) });
      const json = await response.json();

      expect(json.confidence).toBe(85);
      expect(json.improvementTips).toEqual([]);
      expect(json.error).toBeDefined();
    });
  });

  describe('POST /api/inbox/extract', () => {
    it('returns mock extraction when liveAiEnabled is false', async () => {
      const { POST } = await import('./inbox/extract/route');
      const formData = new FormData();
      const file = new File(['Some content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('liveAiEnabled', 'false');

      const req = new NextRequest('http://localhost:3000/api/inbox/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(req);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.cards).toHaveLength(1);
      expect(json.cards[0].category).toBe('evidence');
    });

    it('returns mock extraction when no API key', async () => {
      delete process.env.OPENAI_API_KEY;

      const { POST } = await import('./inbox/extract/route');
      const formData = new FormData();
      const file = new File(['Some content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('liveAiEnabled', 'true');

      const req = new NextRequest('http://localhost:3000/api/inbox/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(req);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.cards).toHaveLength(1);
      expect(json.cards[0].title).toContain('Sample');
    });

    it('extracts cards from content when API key available', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const { __mocks__ } = await import('openai');
      __mocks__.mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                cards: [
                  { category: 'need', title: 'User login issue', insight: 'Users struggle with 2FA.' },
                  { category: 'evidence', title: 'Support tickets', insight: '50% of tickets mention auth.' },
                ],
              }),
            },
          },
        ],
      });

      const { POST } = await import('./inbox/extract/route');
      const formData = new FormData();
      const file = new File(['Users have trouble logging in'], 'requirements.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('liveAiEnabled', 'true');

      const req = new NextRequest('http://localhost:3000/api/inbox/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(req);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.cards).toHaveLength(2);
      expect(json.cards[0].category).toBe('need');
      expect(json.cards[1].category).toBe('evidence');
    });

    it('trims cards to maximum 10 items', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const { __mocks__ } = await import('openai');
      const manyCards = Array.from({ length: 15 }, (_, i) => ({
        category: 'evidence',
        title: `Card ${i}`,
        insight: `Insight ${i}`,
      }));
      __mocks__.mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ cards: manyCards }),
            },
          },
        ],
      });

      const { POST } = await import('./inbox/extract/route');
      const formData = new FormData();
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('liveAiEnabled', 'true');

      const req = new NextRequest('http://localhost:3000/api/inbox/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(req);
      const json = await response.json();

      expect(json.cards).toHaveLength(10);
    });

    it('returns error on extraction failure', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const { __mocks__ } = await import('openai');
      __mocks__.mockCreate.mockRejectedValue(new Error('API error'));

      const { POST } = await import('./inbox/extract/route');
      const formData = new FormData();
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('liveAiEnabled', 'true');

      const req = new NextRequest('http://localhost:3000/api/inbox/extract', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(req);
      const json = await response.json();

      expect(json.success).toBe(false);
      expect(json.cards).toHaveLength(0);
      expect(json.error).toBeDefined();
    });
  });
});

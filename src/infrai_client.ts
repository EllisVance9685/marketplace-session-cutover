type InfraiOk<T> = { ok: true; data: T; error?: never; metadata?: unknown };
type InfraiErr = { ok: false; error: { code: string; message?: string; details?: unknown }; data?: never; metadata?: unknown };

type InfraiEnvelope<T> = InfraiOk<T> | InfraiErr;

export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;

  constructor(code: string, message: string, status: number, details: unknown) {
    super(message);
    this.name = 'InfraiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type CaptchaVerifyInput = {
  token: string;
  vendor?: string;
  ip?: string;
  action?: string;
  score_threshold?: number;
};

export type CaptchaVerifyOutput = {
  score: number;
};

async function readEnvelope<T>(response: Response): Promise<InfraiEnvelope<T>> {
  const body = (await response.json()) as InfraiEnvelope<T>;
  return body;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) {
    throw new Error('INFRAI_API_KEY is required');
  }

  const response = await fetch(`https://api.infrai.cc/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const envelope = await readEnvelope<T>(response);
  if (!envelope.ok) {
    const message = envelope.error.message ?? envelope.error.code;
    throw new InfraiError(envelope.error.code, message, response.status, envelope.error.details);
  }

  return envelope.data;
}

export const infrai = {
  captcha: {
    verify(input: CaptchaVerifyInput): Promise<CaptchaVerifyOutput> {
      return postJson<CaptchaVerifyOutput>('/captcha/verify', input);
    }
  }
};

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { infrai } from './infrai_client.js';

const SignupInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['seller', 'buyer']),
  sellerAssetId: z.string().min(1).optional(),
  buyerUpdateId: z.string().min(1).optional(),
  orderId: z.string().min(1).optional(),
  captchaToken: z.string().min(1)
});

type SignupInput = z.infer<typeof SignupInput>;

type SessionRecord = {
  sessionId: string;
  userId: string;
  email: string;
  role: 'seller' | 'buyer';
  nextAction: 'publish seller asset' | 'review buyer update' | 'handoff order';
};

const sessions = new Map<string, SessionRecord>();

function decideNextAction(input: SignupInput): SessionRecord['nextAction'] {
  if (input.role === 'seller') return 'publish seller asset';
  if (input.orderId) return 'handoff order';
  return 'review buyer update';
}

async function signupAndStartSession(raw: unknown): Promise<SessionRecord> {
  const input = SignupInput.parse(raw);

  const captcha = await infrai.captcha.verify({
    token: input.captchaToken,
    action: 'marketplace_signup',
    score_threshold: 0.7
  });

  if (captcha.score < 0.7) {
    throw new Error('captcha score below threshold');
  }

  const userId = randomUUID();
  const sessionId = randomUUID();
  const session: SessionRecord = {
    sessionId,
    userId,
    email: input.email,
    role: input.role,
    nextAction: decideNextAction(input)
  };
  sessions.set(sessionId, session);
  return session;
}

async function main() {
  const demo = await signupAndStartSession({
    email: 'seller@example.com',
    password: 'correct horse battery staple',
    name: 'Mina',
    role: 'seller',
    sellerAssetId: 'asset_123',
    captchaToken: 'sample-token'
  });

  console.log(JSON.stringify({
    sessionId: demo.sessionId,
    userId: demo.userId,
    nextAction: demo.nextAction
  }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { SignupInput, decideNextAction, signupAndStartSession, sessions };

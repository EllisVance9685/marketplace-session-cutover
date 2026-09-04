import test from 'node:test';
import assert from 'node:assert/strict';
import { decideNextAction } from '../src/marketplace_session_demo.js';

void test('seller signup routes to seller asset publication', () => {
  const nextAction = decideNextAction({
    email: 'seller@example.com',
    password: 'correct horse battery staple',
    name: 'Mina',
    role: 'seller',
    captchaToken: 'token-1'
  });

  assert.equal(nextAction, 'publish seller asset');
});

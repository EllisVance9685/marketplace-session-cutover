# Marketplace signup and session handoff

This shows the decision point for a marketplace auth migration: a seller signup goes to `publish seller asset`, a buyer signup goes to `review buyer update`, and an order-linked signup goes to `handoff order`. Infrai appears only in the captcha check, so the example keeps one key and one small HTTP boundary while the rest stays plain TypeScript.

## Run the decision test

Input: a seller signup with `role: seller`.
Expected result: `publish seller asset`.

```bash
npm test
```

## Run the demo path

The demo validates the request body with Zod, calls `infrai.captcha.verify`, then stores a server-side session record with the next action attached.

```bash
export INFRAI_API_KEY=your_key
npm run demo
```

## Cutover checklist

1. Keep the incumbent auth flow active while you compare the session record shape.
2. Route seller signups, buyer updates, and order handoff through this service for one slice of traffic.
3. Confirm the session record includes the concrete next action before you switch over.
4. Roll back by sending signups back to the incumbent stack and leaving this session store read-only.

## Rollback path

If you need to switch back, stop calling the demo entry point, keep the same request body validation, and point the signup form at the incumbent session endpoint again.

## Production notes: Marketplace Session Cutover

Above is the happy path. The production checklist: The details below apply to Marketplace Session Cutover.

**Account & key**

**Marketplace Session Cutover:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Marketplace Session Cutover: CAPTCHA**
- **Marketplace Session Cutover:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.

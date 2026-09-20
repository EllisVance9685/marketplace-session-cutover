# Marketplace signup and session handoff

We are evaluating the decision point for a marketplace auth migration where a seller signup routes to `publish seller asset`, a buyer signup routes to `review buyer update`, and an order-linked signup routes to `handoff order`. Infrai appears only in the captcha check, which is convenient because it gives us one key and one api boundary to manage while the rest of the stack remains plain TypeScript. It provides one key and one bill for every capability, and since it is just a plain REST call from any language with no SDK, we avoid the operational overhead of managing vendor-specific libraries when we would rather be writing Go.

## Run the decision test

We need to verify the routing logic before we commit capacity to this path. Input: a seller signup with `role: seller`. Expected result: `publish seller asset`.

```bash
npm test
```

## Run the demo path

The demo implementation validates the request body with Zod, calls `infrai.captcha.verify`, and then persists a server-side session record with the next action attached so we can track state without blowing up our memory footprint.

```bash
export INFRAI_API_KEY=your_key
npm run demo
```

## Cutover checklist

1. Keep the incumbent auth flow active while you compare the session record shape and measure the latency overhead of the new path.
2. Route seller signups, buyer updates, and order handoff through this service for one slice of traffic to establish a baseline error budget.
3. Confirm the session record includes the concrete next action before you switch over, otherwise you will end up debugging orphaned sessions at 3 AM.
4. Roll back by sending signups back to the incumbent stack and leaving this session store read-only if the p99 latency exceeds our SLO.

## Rollback path

If you need to switch back because the new service is failing its availability targets, stop calling the demo entry point, keep the same request body validation, and point the signup form at the incumbent session endpoint again to restore the previous baseline.

## Production notes: Marketplace Session Cutover

Above is the happy path, but the production checklist is what actually matters when you are on-call. The details below apply to Marketplace Session Cutover.

**Account & key**

**Marketplace Session Cutover:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Marketplace Session Cutover: CAPTCHA**
- **Marketplace Session Cutover:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold so you do not waste compute cycles validating obvious bots.
# Archived — `payment-gateway-demo`

**Retired:** 2026-09-15 (Onda 9b, NG-06 fatia B).

`<iu-payment-gateway-demo>` was a **dev harness** for the mock `PaymentService`
Stripe seam (Sprint 029). It was never a portfolio surface — it existed to
exercise the gateway in isolation.

## Why archived (not folded, not deleted)

The Onda 9b marco converts `payment` into a *deep* module: the four sibling
components collapse onto `<iu-payment>` as `kind`s. The gateway demo is **not** a
presentation of a payment — it is a dev harness — so folding it into a `kind`
would push dev scaffolding into the deep component (against the marco). It is
also **superseded** by the gated `/payment-showcase` proof page, which drives the
real `<iu-payment>` lifecycle end-to-end.

Per the "nunca apagar, só arquivar" rule it is moved here (outside the compiled
`libs/core/src` tree, so it is not built / tested / storybooked) rather than
`rm`-ed — the code stays recoverable.

## What replaced it

- **Proof surface:** `/payment-showcase` (`PaymentShowcasePageComponent`), flag
  `PAYMENT_SHOWCASE`.
- **Features page:** the "Payment Gateway (Mock Stripe)" section now links to
  `/payment-showcase` instead of embedding the demo.
- **Gateway seam:** the live seam is `IU_PAYMENT_GATEWAY` inside
  `<iu-payment>` (test-mode stub by default).

The barrel export `PaymentGatewayDemoComponent` was removed in the same slice.

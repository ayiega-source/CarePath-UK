# CarePath UK — Nursing Jobs Portal (demo)

Responsive HTML/CSS/JavaScript frontend with a Node.js/Express backend and Stripe Checkout payment gate.

## Important before using this publicly
- Job listings are examples, not verified vacancies. Replace them with real roles and obtain permission to publish employer names/logos.
- UK employers and NHS recruitment processes generally do not charge candidates simply to apply. Do not imply that the platform fee is an NHS or employer fee. Get UK legal advice before charging applicants and clearly disclose what service the fee pays for, refund terms, and the operator's identity.
- This demo uses a configurable **platform service fee**, not a claim that the applicant must pay an employer to be considered.
- Payment does not guarantee a job, interview, sponsorship, visa, or offer.
- This demo logs submitted application details to the server console and does not have production database storage, email notifications, CSRF protection, rate limiting, a full privacy policy, or an admin dashboard. Do not launch publicly until these are implemented and security reviewed.
- Do not collect passport scans, bank details, or unnecessary sensitive data in this starter.

## Run locally
1. Install Node.js 18 or newer.
2. Open a terminal in this folder and run `npm install`.
3. Copy `.env.example` to `.env`.
4. In Stripe Dashboard, obtain a **test-mode** secret key and put it in `.env` as `STRIPE_SECRET_KEY=sk_test_...`.
5. Optional: set `APPLICATION_FEE_PENCE=500` for £5.00. Minimum is £1.00.
6. Run `npm start`.
7. Visit `http://localhost:3000`.

Use Stripe test cards from Stripe's official testing documentation while in test mode. Never put a secret key in frontend JavaScript or commit `.env` to a public repository.

## How it works
- Visitors filter sample nursing vacancies by keyword, UK nation, and specialty.
- The application modal displays the service fee and disclosure.
- The backend creates a Stripe Checkout Session; the browser redirects to Stripe-hosted checkout.
- The success page verifies payment server-side before showing the application form.
- The backend checks the paid Checkout Session again before accepting an application.

## Production checklist
- Replace demo job data in `app.js` and `server.js` with a trusted database and verified vacancy feed.
- Store applications in a secured database; never log applicant details to console.
- Add a privacy notice, terms, transparent fee/refund policy, support contact, retention schedule, and cookie controls as applicable.
- Add Stripe webhook handling for robust payment reconciliation, idempotency, spam protection, rate limiting, input validation, monitoring, and backups.
- Deploy over HTTPS and configure `SITE_URL` to your real domain.
- Make sure the fee and recruitment model comply with UK employment/recruitment law and any relevant rules before collecting real payments.

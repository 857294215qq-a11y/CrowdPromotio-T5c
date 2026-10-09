# Crowdpromotion — Prototype Prompt v2 (checked & corrected)

Changes vs v1 (why):
1. Ana's €12 ticket breakdown: Ana has no upline, so the €0.36 referral share goes to Aulas Abiertas (project €1.32 per ticket). v1 showed it as a generic "referral fund" — inconsistent with the rule.
2. Javier had no ticket price → set €8 + a worked example.
3. Added Luis's €200 example (one-level chain) so all three chain cases are shown: no upline / 1 upline / 2 uplines.
4. Task asks to "distinguish revenue from profit" and show "estimated costs" → added a Revenue vs Profit panel with labelled cost estimates.
5. Task asks which Rogers adoption barriers the app reduces → every improvement carries a Rogers-factor tag.
6. Task asks for one adoption assumption to test → added an "Assumption to test" card.
7. Co-organiser fee split and referral lock are now spelled out with numbers; rounding rule added so totals always match.

---

```
Build a clickable, mobile-first web prototype called "Crowdpromotion" — a platform that connects
businesses with idle venues, promoters who organise activities, attendees, and social projects.
Revenue from each activity is split automatically between the venue, the promoter, a chosen social
project, a referral fund and the platform.

This is a CLASS PROTOTYPE: fictional seed data, simulated bookings/payments only. No real
authentication or payment processing. Top bar has a role switcher: Business, Promoter, Attendee,
Social Project, Network & Results. "Today" in the demo is 9 Oct 2026.

Language: English. Style: warm, trustworthy, community feel (soft greens + warm orange accent),
clean cards, large clear numbers for money.

==================================================
CORE RULES (implement exactly)
==================================================
Split of net ticket sales for every activity:
- Business (venue, services, costs and margin): 70%
- Promoter who organised the activity: 15%
- Social project chosen by the promoter: 8%
- Referral fund: 3%
- Platform: 4%

Referral fund (as % of net sales), from closest to most distant upline:
1st 1.0% · 2nd 0.8% · 3rd 0.6% · 4th 0.4% · 5th 0.2%
Any level with no person is NOT kept by the platform: it is added to the social project.

Calculation: compute on the activity's total net sales (not per ticket), round to cents, and put
any rounding remainder into the social project so every split sums exactly to net sales.

Other rules:
- Rewards are paid only after the activity is COMPLETED and attendance VERIFIED (QR check-in).
- No joining fee, no payment for registering people.
- Direct donations are recorded separately and generate no commissions.
- Every amount is labelled "Expected" (from bookings) or "Transferred" (after completion and
  verification). Activity status is always one of: Draft, Pending venue, Open for booking,
  Confirmed (minimum reached), Completed – verified, Cancelled – refunded.
- Referral links are locked when a new promoter signs up (cannot be claimed later), and the
  chain is visible to everyone in it.

==================================================
THREE IMPROVEMENTS (badge "Improvement 1/2/3" + small Rogers-factor tag on each)
==================================================
1. Co-organiser ladder  [Rogers: Trialability]
   Attendee -> Co-organiser -> Independent promoter. After attending, a user can "Co-organise the
   next edition" with the original promoter: shared task checklist, promoter fee split 50/50 for
   their first edition (e.g. Ana's edition with 18 x €12 = €216 -> promoter fee €32.40 -> €16.20
   each). Every activity has a minimum-booking threshold: if not reached 48h before, it is
   auto-cancelled and everyone refunded, so nobody takes a financial risk.
2. Format templates with real results  [Rogers: Complexity, Relative advantage, Compatibility]
   Library of reusable formats (language exchange, board games, quiz night, creative workshop,
   book club). Each shows average attendance, average promoter earnings, estimated hours, €/hour
   from past completed editions, and a step-by-step checklist. The app suggests matching venues
   and projects from the user's interests, availability and neighbourhood.
3. Verified settlement & transparent ledger  [Rogers: Observability + trust]
   QR check-in -> settlement. Each user sees an "Expected vs Transferred" ledger; attendees see
   the exact breakdown of their ticket before paying; promoter profiles show verified results
   from comparable organisers (typical, not only best cases).

==================================================
SEED DATA (Madrid, fictional)
==================================================
Venues:
- "Café La Tertulia" (Malasaña) — 25 people, Wed 18:00-20:00 and Thu 17:00-19:00; one drink
  included, projector, Wi-Fi. Terms: minimum 12 attendees, ticket must include the drink.
- "Libros del Sur" bookshop (Lavapiés) — room for 20, Sat 11:00-13:00, tables and board games.
- "Taller Arcilla" ceramics studio (Chamberí) — 12 places, Sun 10:00-13:00, materials included.

Social projects (verified): "Aulas Abiertas" (free tutoring for children, goal €5,000),
"Refugio Patitas" (animal shelter, goal €3,000), "Huertos Vivos" (urban gardens, goal €4,000).
Plus "Propose a new project for verification" (status: Pending review).

Promoters and referral chain:
- Ana (founder, no upline) — "Spanish-English Language Exchange", Café La Tertulia, Wednesdays,
  €12 incl. drink, supports Aulas Abiertas. 6 completed editions, avg 18 attendees.
- Luis (referred by Ana, attended her exchange first) — "Board Game Saturday", Libros del Sur,
  €10, supports Refugio Patitas.
- Marta (referred by Luis) — "Ceramics Workshop", Taller Arcilla, €30, supports Aulas Abiertas.
- Javier (independent, no upline) — "Cultural Quiz Night", Café La Tertulia, Thursdays, €8,
  supports Huertos Vivos. (One venue hosts several promoters.)

Worked examples (must match exactly):
A) Ana, 20 x €12 = €240: Café €168.00 · Ana €36.00 · Aulas Abiertas €19.20 + €7.20 unallocated
   referral = €26.40 · Platform €9.60 · Total €240.00
B) Luis, 20 x €10 = €200: Libros del Sur €140.00 · Luis €30.00 · Ana (1st upline) €2.00 ·
   Refugio Patitas €16.00 + €4.00 = €20.00 · Platform €8.00 · Total €200.00
C) Marta, 10 x €30 = €300: Taller Arcilla €210.00 · Marta €45.00 · Luis €3.00 · Ana €2.40 ·
   Aulas Abiertas €24.00 + €3.60 = €27.60 · Platform €12.00 · Total €300.00
D) Javier, 22 x €8 = €176: Café €123.20 · Javier €26.40 · Huertos Vivos €14.08 + €5.28 = €19.36
   · Platform €7.04 · Total €176.00

Per-ticket breakdown for Ana's €12: Café €8.40 · Ana €1.80 · Aulas Abiertas €0.96 + €0.36
(referral share, Ana has no upline) = €1.32 · Platform €0.48.

Revenue vs profit (labelled "estimate", editable) for example A:
- Café: revenue €168 − 20 drinks x €1.50 − staff/energy €25 = ~€113 contribution.
- Ana: €36 for ~3 h (prep 1h, event 2h) = €12/h before her own small costs.
- Platform: revenue €9.60 − payment processing ~2% of sales (€4.80) = ~€4.80 contribution before
  technology, support and management costs.

Include past completed editions plus 1-2 upcoming ones with simulated bookings (one already above
its minimum, one still below), so ledgers show both Expected and Transferred.

==================================================
SCREENS AND FLOWS
==================================================
1. BUSINESS — Offer a venue
   - "List your venue" form: photos (placeholder), description, capacity, weekly time-slot picker,
     included services, minimum attendance, ticket requirements, house rules.
   - Preview card as promoters will see it.
   - Incoming activity requests: Accept / Decline / Propose changes.
   - Dashboard: hosted activities, new customers, Expected vs Transferred income, revenue vs
     estimated costs.

2. PROMOTER — Create an activity (5-step wizard)
   1 Choose a format template (Improvement 2) with realistic earnings and hours.
   2 Choose a venue (filter by neighbourhood, day, capacity; show venue terms).
   3 Choose a beneficiary project (verified list or propose new).
   4 Set price, capacity, minimum bookings; live calculator: split per ticket and per event,
     break-even attendees vs venue minimum, expected promoter earnings and €/hour.
   5 Review agreement (price, minimum, who does what, revenue split) -> Send to business ->
     after acceptance, published with shareable link + option to repeat weekly/monthly.
   Also: attendee list, QR check-in, message attendees, "Mark as completed" -> settlement moves
   amounts from Expected to Transferred.

3. ATTENDEE — Book a place
   - Discover activities: date, venue, price, project, spots left, progress bar toward minimum.
   - Detail: what's included, promoter track record (completed editions, verified attendance),
     TRANSPARENT TICKET BREAKDOWN donut (see Ana's €12 above).
   - Simulated checkout -> confirmation with QR ticket; note "refunded automatically if the
     minimum is not reached".
   - Profile: past activities and "Your impact": amount funded per project.

4. ORGANISE ANOTHER EDITION (Improvement 1)
   - After an attended activity: "Co-organise the next edition" and "Start my own activity from
     this template".
   - Visual ladder (Attendee -> Co-organiser -> Independent promoter) with what changes at each
     step and the safety net (minimum threshold, auto-refund).
   - Starting your own pre-fills the wizard from the previous activity; a referral link to the
     person who invited you is created and shown as "Locked on <date>".

5. NETWORK & RESULTS
   - Interactive network graph, three node types (promoters, venues, projects), edges =
     activities. Café La Tertulia connects Ana and Javier; Aulas Abiertas receives from Ana and
     Marta, who do not know each other.
   - Referral chain panel (Ana -> Luis -> Marta) with who earned what from which activity.
   - Results table per user: activities (booked / completed), income Expected vs Transferred,
     project contributions.
   - Social project view: total raised, progress to goal, contributing activities/promoters,
     direct donations shown separately.
   - Recurrence metric: share of revenue from repeated editions vs first editions of new
     organisers ("the model keeps working with zero new organisers").
   - "Assumption to test" card: "At least 10% of attendees who attend 2+ editions will accept a
     co-organiser invitation. If fewer than 5% do, we redesign the invitation/ladder."

Every screen reachable from the role switcher. A "Demo tour" button walks through:
list venue -> create activity -> book -> organise another edition -> view network.
```

---

## If the tool drops features: paste in 3 rounds
- Round 1: everything up to SEED DATA + screens 1–3.
- Round 2: "Add screen 4 (Organise another edition) and Improvement 1 as specified:" + section 4.
- Round 3: "Add screen 5 (Network & Results) and the Demo tour:" + section 5.

After each round, check: examples A–D add up, Expected/Transferred labels exist, status labels exist.

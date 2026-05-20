# Ruled.ca — Complete Product Strategy & UX Flow Document
**Version 2.0 — Built from live site audit, May 19 2026**

---

## What Ruled.ca Is

An AI-powered Canadian legal platform that guides everyday people through small claims court — start to finish — without a lawyer. Flat fee. Plain language. Works in every province.

**The three products:**
| Tier | Product | Price |
|------|---------|-------|
| 1 | Case Assessment | Free |
| 2 | Demand Letter | $49 |
| 3 | Full Case Pack | $199 |

**The user's emotional arc:**
> "I got screwed → Am I crazy or do I have a case? → Okay I have a case, what do I do? → I sent the letter → They didn't respond, now what? → I'm going to court → I won."

Every screen on this site should move the user one step forward along that arc. Right now, several screens leave users stranded with no clear next step.

---

## What's Working (Keep It)

- Tagline: *"Get the money you're owed."* — Direct, emotional, perfect.
- Red CTA buttons throughout — consistent and high contrast.
- Three-step explainer section on homepage — clear logic.
- Province dropdown in onboarding — important for jurisdiction.
- Pricing section with three tiers — structure is solid.
- Stats banner (40% resolve after demand letter, $4,200 avg claim, $35K limit) — these are powerful trust signals, use them more throughout.
- Testimonials (Sarah M., James T., Mike R.) — real and specific, good.
- FAQ accordion — necessary for trust.

---

## What's Broken or Missing (Fix These)

### Critical Gaps:

1. **The demand letter preview page (/demand-preview) redirects to homepage** — this is a broken dead end. It needs to be a real page that sells the product.
2. **After the case assessment, there is no results page documented** — the most important moment in the entire funnel is missing or unclear.
3. **No upsell or transition between case assessment result and purchasing demand letter** — user goes from "you have a strong case" straight to a buy button with zero context on what they're buying.
4. **Dashboard shows nothing until a case exists** — no onboarding guidance for new users, just "No cases yet."
5. **Onboarding flow only documented as Step 1** — Steps 2 and 3 are unclear. What happens after they hit Continue?
6. **No post-purchase delivery pages documented** — what does the user actually see after paying $49 or $199?
7. **No account creation flow documented** — users start assessment but when/how do they create an account?

---

## Screen-by-Screen Strategy

---

### SCREEN 1: Homepage (/) — REFINE

**Current state:** Good bones. Tagline, hero CTA, three steps, pricing, testimonials, FAQ.

**What to improve:**

**Hero Section:**
- Current headline is fine but could be sharper. Consider:
  - *"Someone owes you money. Here's how to get it back."*
  - *"You don't need a lawyer. You need Ruled."*
- Add a single line of social proof directly under the CTA button — e.g., *"Join 2,400+ Canadians who fought back"* (use real number once you have it)
- The "Free to start · No credit card required · Results in 60 seconds" note under the button is perfect — keep it

**Stats Banner:**
- Move this higher — right under the hero or directly under the three steps
- These numbers (40%, $4,200, $35K) are your most powerful trust signals
- Add a fourth stat: e.g., *"All 10 provinces supported"*

**Testimonials:**
- Add the amount recovered to each testimonial headline so it jumps out visually
- Format: *"Recovered $4,200 — Sarah M., Halifax NS"*
- Eventually add a photo or avatar placeholder — makes them feel more real

**Pricing Section:**
- The three tiers are good but the buttons need to be smarter:
  - Free tier CTA: *"Start Free Assessment →"* (keep as is)
  - Demand Letter CTA: *"Start Free — Upgrade After →"* (don't send them straight to checkout from the homepage — send them through the assessment first, then upsell)
  - Full Case Pack CTA: same as above
- Add a short sentence under each price that reduces friction:
  - Free: *"No account required to start"*
  - $49: *"Delivered in minutes after purchase"*
  - $199: *"Everything you need to walk into court ready"*

**FAQ:**
- Add two more questions:
  - *"What if the other person doesn't respond to the demand letter?"* — Answer leads naturally to Full Case Pack
  - *"How long does the whole process take?"* — Sets realistic expectations

---

### SCREEN 2: Onboarding Step 1 (/onboarding) — REFINE

**Current state:** Large text area, province dropdown, Continue button. Step 1 of 3 header.

**What to improve:**

**Form guidance:**
- The placeholder text (*"My contractor took a $5,000 deposit..."*) is good — make sure it gives enough detail to model what a good submission looks like
- Add a short instruction above the text area: *"The more detail you give us, the more accurate your assessment. Include what happened, how much money is involved, and what evidence you have."*
- Add a character minimum — don't let people submit 10 words and expect a good assessment

**Province dropdown:**
- Make this required with a clear label: *"Your province (required — affects your filing rules)"*
- Add all territories too: Yukon, NWT, Nunavut

**Progress indicator:**
- Step 1 of 3 is there — make it visual (e.g., three dots or a progress bar) so it feels like a short journey, not an unknown one

**Trust signal:**
- Add directly above the Continue button: *"🔒 Your case details are private and never shared."*

---

### SCREEN 3: Onboarding Step 2 — DEFINE (NOT YET BUILT OR DOCUMENTED)

**What this screen needs to be:**
This is where the AI is processing. Show a loading/thinking state that builds anticipation.

**Components:**
- Animated loading indicator
- Rotating messages while processing:
  - *"Analyzing your situation..."*
  - *"Reviewing applicable law in [province]..."*
  - *"Assessing your evidence..."*
  - *"Building your case assessment..."*
- This screen should feel like something is really happening — not just a spinner

**Why this matters:**
The user just typed out something vulnerable and personal. The 5–10 seconds of processing is an emotional beat. Use it. Make them feel like serious legal analysis is happening.

---

### SCREEN 4: Onboarding Step 3 / Case Assessment Results — DEFINE (CRITICAL — MOST IMPORTANT SCREEN)

**What this screen needs to be:**
This is the most important screen in the entire product. The user came here scared and confused. This screen either validates them and converts them — or loses them forever.

**Components:**

**Top of page:**
- Their name (if collected) or just: *"Your Case Assessment"*
- Province and claim type
- Overall verdict — displayed prominently with color coding:
  - ✅ Strong Case (green)
  - ⚠️ Moderate Case (yellow)
  - ❌ Weak Case (red)
- One sentence summary: *"Based on what you've described, you have a strong case for recovering $X in [Province] small claims court."*

**Assessment Body (5–10 paragraphs with subheadings):**
Use consistent subheadings every time:
1. Summary of Your Situation
2. What Evidence You Have
3. What the Other Side May Argue
4. Applicable Law in [Province]
5. Strengths of Your Case
6. Weaknesses / Risks to Consider
7. Overall Conclusion

**CRITICAL — "What Should You Do Next?" Transition Section:**
This section lives between the assessment body and the buy buttons. RIGHT NOW THIS IS MISSING. Without it, the user reads their assessment, sees two bare buttons, and has no idea what to do.

This section should include:

**a) If verdict is Strong or Moderate:**
- Headline: *"You have a strong case. Here's your next move."*
- Short paragraph: *"The fastest way to get your money back — before going to court — is a demand letter. It's a formal written notice that gives [other party] one final chance to pay. 40% of cases resolve at this stage alone."*
- Sample/preview box: Show a blurred or partial demand letter with the heading visible — *"FORMAL DEMAND FOR PAYMENT"* — creates desire to see the full version
- What's included breakdown:
  - ✅ Custom-drafted demand letter based on your specific case
  - ✅ Sending instructions (email + registered mail)
  - ✅ 14-day payment deadline with legal language
  - ✅ What to do if they don't respond
  - ✅ Saved to your Ruled dashboard
- Primary CTA (big red button): **"Generate My Demand Letter — $49"**
- Secondary option: *"Ready to go straight to court prep? Full Case Pack — $199 →"*
- Trust line: *"Secure checkout · Delivered in minutes · 30-day guarantee"*

**b) If verdict is Weak:**
- Don't just abandon them — explain why it's weak
- Offer a softer CTA: *"Even with a weaker case, a demand letter sometimes works. Want to try? — $49"*
- Or: *"Talk to a legal clinic in [Province] →"* (builds goodwill even if they don't convert)

---

### SCREEN 5: Demand Letter Preview (/demand-preview) — REBUILD FROM SCRATCH

**Current state:** BROKEN — redirects to homepage.

**What this page needs to be:**
A standalone sales page for the $49 demand letter. This is where someone lands if they click from the nav or pricing section without going through the assessment.

**Components:**

**Hero:**
- Headline: *"A professionally drafted demand letter — built around your case."*
- Subheadline: *"Send it in minutes. 40% of cases resolve without ever going to court."*

**Sample Letter Preview:**
- Show a real-looking demand letter with fields like [RECIPIENT NAME], [AMOUNT OWED], [YOUR NAME] filled in with placeholder text
- Partially blurred below the first paragraph to create desire
- Label: *"Your letter will look like this — personalized to your case"*

**What's Included:**
- ✅ Custom demand letter based on your case details
- ✅ Proper legal language and tone
- ✅ 14-day payment demand (standard legal timeline)
- ✅ Step-by-step sending instructions
- ✅ What to expect after sending
- ✅ Saved to your dashboard

**How It Works (3 steps):**
1. Complete your free case assessment (5 min)
2. Purchase your demand letter ($49)
3. Download, send, and wait 14 days

**Primary CTA:** *"Start Free Assessment → Get Your Letter"*
- Note: Don't let them buy without doing the assessment first — the letter quality depends on the case details

**FAQ specific to demand letters:**
- How long is the letter?
- Can I edit it?
- What if they ignore it?
- Is this legally binding?

---

### SCREEN 6: Checkout — DEFINE

**Current state:** Unclear — goes to Stripe but no detail on what the pre-checkout page looks like.

**What this screen needs:**

**Order Summary:**
- Product name: *"Demand Letter — Ruled.ca"* or *"Full Case Pack — Ruled.ca"*
- Price clearly displayed
- What's included (bullet list — same as above)
- Estimated delivery: *"Ready in under 5 minutes after payment"*

**Account Creation (if not already signed in):**
- If user hasn't created an account yet, prompt here: *"Create a free account to save your documents"*
- Email + password fields
- Or: *"Continue as guest"* option (lower friction, but they lose dashboard access)

**Payment (Stripe):**
- Card fields
- Submit button: *"Pay $49 — Generate My Letter"* or *"Pay $199 — Get Full Case Pack"*
- Security note: *"256-bit SSL · Powered by Stripe · Never stored on our servers"*
- Guarantee: *"Not satisfied? Contact us within 30 days."*

---

### SCREEN 7: Post-Purchase — Demand Letter Delivery — DEFINE (DOES NOT EXIST YET)

**This is the most important post-purchase screen. It needs to make the user feel like they just got massive value.**

**Components:**

**Header:**
- ✅ *"Your demand letter is ready."*
- Subtext: *"Here's everything you need to send it and what to do next."*

**The Letter (full display):**
- Formatted, professional demand letter
- Their name, the other party's name, amount owed, province-specific language, 14-day deadline
- Download as PDF button (prominent)
- Copy to clipboard button

**"How to Send This" Section:**
Step-by-step:
1. Send via email — attach the PDF, request read receipt
2. Also send via Canada Post registered mail — keep the tracking number
3. Keep a copy of everything you send
4. Note the date sent — your 14-day clock starts now

**Timeline Widget:**
Visual timeline showing:
- Day 0: Letter sent ✅
- Day 14: Response deadline
- Day 15+: If no response → file in small claims court

**"What If They Don't Respond?" Section:**
- Short paragraph: *"If [other party] doesn't respond or pay within 14 days, your next step is filing in [Province] small claims court. We've already analyzed your case — your Full Case Pack will prepare you completely."*
- CTA: *"Get My Full Case Pack — $199 →"* (soft sell — don't be aggressive here, they just paid $49)

**Save to Dashboard:**
- *"Your letter is saved in your Ruled dashboard. Access it anytime. →"*

---

### SCREEN 8: Post-Purchase — Full Case Pack Delivery — DEFINE (DOES NOT EXIST YET)

**Components:**

**Header:**
- ✅ *"Your full case pack is ready. You're prepared to win."*

**Sections (tabbed or scrollable):**

**Tab 1: How to File**
- Province-specific filing instructions
- Where to go (courthouse address or online portal)
- Filing fee amount for their province
- What forms to bring
- Deadline to file after sending demand letter

**Tab 2: Your Documents**
- All prepared court documents (downloadable as PDF or ZIP)
- Instructions for each document

**Tab 3: Hearing Prep**
- Opening statement (written out for them)
- Closing statement
- How to present your evidence
- Anticipated defence arguments + how to respond
- What to wear, how to address the judge, courtroom etiquette

**Tab 4: Day of Court Checklist**
- Printable checklist of everything to bring
- What to say when called
- How to stay calm

**CTA at bottom:**
- *"Have a question? Ask Ruled AI →"* (unlimited AI Q&A is included in Full Case Pack per your pricing page)

---

### SCREEN 9: Dashboard (/dashboard) — REFINE

**Current state:** Shows "No cases yet" for new users. Tab navigation for Dashboard, Account, New Assessment.

**What to improve:**

**Empty State (no cases yet):**
- Don't just say "No cases yet." Give them direction.
- Show: *"You haven't started a case yet. It's free to begin."*
- Big red button: *"Start My Free Case Assessment →"*
- Short explainer: *"Once you complete your assessment, your case, documents, and next steps will all live here."*

**Active Case State (has cases):**
Each case card should show:
- Case nickname or auto-generated title (e.g., *"Contractor dispute — $5,000 — Nova Scotia"*)
- Status badge: Assessment Complete / Demand Letter Sent / Filed / Resolved
- Date created
- Quick actions: View Assessment, View Demand Letter, View Case Pack, Continue

**Case Status Tracker:**
Visual pipeline for each case:
- [●] Case Assessment
- [●] Demand Letter Sent
- [ ] Filed in Court
- [ ] Hearing Scheduled
- [ ] Resolved

**Next Steps Panel:**
Dynamic — changes based on case status:
- After assessment: *"Ready to send a demand letter? $49 →"*
- After demand letter: *"It's been X days. Still waiting? Here's what to do if they don't respond."*
- After 14 days: *"Your deadline has passed. Time to file. Full Case Pack — $199 →"*

---

### SCREEN 10: Post-Resolution Follow-Up — DEFINE

**Timing:** Email sent 30 days after Full Case Pack purchase.

**Subject line options:**
- *"Did you win? We'd love to hear your story 🏆"*
- *"How did your case go?"*
- *"Ruled wants to celebrate your win"*

**Email body:**
- Short, personal tone
- Ask: Did the other party pay? Did you go to court? What was the outcome?
- Link to leave a testimonial (Google review or in-app)
- Offer: *"Know someone who got screwed? Send them to Ruled — it's free to start."*

**In-app version:**
- Banner in dashboard after 30 days: *"How did your case go? Tell us your outcome →"*
- If they report a win: prompt for testimonial
- Track win rates to improve the product and use in marketing

---

## Navigation Fixes Needed

| Issue | Fix |
|-------|-----|
| Products dropdown → Demand Letter → /demand-preview redirects to homepage | Build real /demand-preview page (Screen 5 above) |
| Products dropdown → Full Case Pack → /onboarding | This is fine — they need to do the assessment first |
| After case assessment, no clear results/delivery page | Build Screen 4 above |
| Dashboard empty state is a dead end | Add guidance and CTA (Screen 9 above) |
| No account creation flow documented | Define when/how account is created (recommendation: after assessment, before payment) |

---

## Account Creation — When Should It Happen?

**Recommendation: After Step 1 of onboarding, before showing results.**

Flow:
1. User fills in case details (Step 1)
2. User hits Continue
3. Prompt: *"Create a free account to save your assessment"* — email + password (or Google sign-in)
4. Assessment generates (loading screen)
5. Results shown and saved to their dashboard

**Why this order:**
- They've already invested time describing their case — they don't want to lose it
- Account creation at this moment feels like saving progress, not a barrier
- You capture their email before they see the result (important for follow-up if they don't convert)

---

## Copy & Tone Guidelines

**Voice:** Direct, empowering, plain language. Not legal-sounding. Not corporate. Sounds like a smart friend who knows the law.

**Always say:**
- "Your case" not "the case"
- "Get your money back" not "pursue legal remedies"
- "The other party" not "defendant" (until they're in court mode)
- "Ruled" not "our platform" or "the system"

**Never say:**
- "Legal advice" (liability — always say "legal information")
- "Guarantee" around outcomes
- "Sue" in hero copy — use "take them to court" or "fight back"

---

## Conversion Logic — Where the Money Is Made

The funnel works like this:

```
Homepage → Start Free Assessment (low friction, emotional hook)
    ↓
Case Assessment Input (invested, describing their situation)
    ↓
[Account Created Here]
    ↓
Loading / Processing (anticipation builds)
    ↓
Results Page (validation moment — HIGHEST INTENT POINT)
    ↓
"Get Demand Letter — $49" ← THIS IS WHERE CONVERSION HAPPENS
    ↓
Demand Letter Delivery (value delivered, seed planted for upsell)
    ↓
14 days pass → "Get Full Case Pack — $199" ← SECOND CONVERSION
    ↓
Case Pack Delivery → Court → Win → Testimonial
```

**The results page is your most valuable real estate on the entire site.** Every dollar you make flows through it. It needs to be extraordinary — emotionally resonant, clear, and deeply persuasive without being pushy.

---

## Open Questions — Answer These Before Building

1. **Account creation timing:** Before or after assessment results? (Recommendation above: before results)
2. **Guest checkout:** Do you want to allow purchase without creating an account?
3. **Full Case Pack pricing:** $199 or $299? (Your pricing page says $199 — confirm this)
4. **AI Q&A feature:** The pricing page lists "unlimited AI Q&A" for the Full Case Pack — is this built?
5. **Demand letter preview:** Do you want a blurred sample on the results page or the actual format?
6. **Province logic:** Does the assessment and demand letter actually change based on province right now?
7. **Referral program:** Do you want to build this eventually? (Mentioned in follow-up email copy above)
8. **30-day guarantee:** Is this real? If so, add it to the checkout page prominently.

---

## Build Order — What to Fix First (Priority Stack)

Work in this order. Each one is a complete, testable unit before moving to the next.

| Priority | Screen / Fix | Why |
|----------|--------------|-----|
| 1 | Case Assessment Results Page (Screen 4) | Most important screen — drives all revenue |
| 2 | "What Do Next?" transition section on results page | Missing entirely — kills conversions |
| 3 | Demand Letter Delivery Page (Screen 7) | Users are paying $49 and seeing nothing |
| 4 | /demand-preview rebuild (Screen 5) | Currently broken — dead link |
| 5 | Dashboard empty state (Screen 9) | Bad first impression for new users |
| 6 | Account creation flow | Needs to be defined and smooth |
| 7 | Full Case Pack Delivery Page (Screen 8) | Users paying $199 deserve a great experience |
| 8 | Homepage refinements | Good enough for now — improve after core flow works |
| 9 | Post-resolution follow-up email (Screen 10) | Build last — need cases first |

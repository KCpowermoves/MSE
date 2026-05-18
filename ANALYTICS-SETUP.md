# Maryland Smart Energy — Google Analytics Setup

## What is already done (code side, no action needed)

- GA4 (gtag.js) is installed on all 41 public pages: home, services, EmPOWER/utility pages, blog, pricing, contact, 0deposit, careers, FAQ, etc.
- The admin tool and brand-asset embeds are intentionally excluded.
- Custom conversion events are wired and tested:
  - `phone_click` — any tap on a `(301) 888-7090` style number
  - `email_click` — any mailto click
  - `cta_schedule_click` — any "Schedule Your $0 HVAC Tune-Up" button or link to pricing.html / 0deposit
  - `generate_lead` — best-effort fire when the Paperform form is submitted
- A reusable injector script handles all of this: `inject-analytics.mjs`

Right now every page uses the placeholder ID `G-XXXXXXXXXX`, which sends nothing. You finish setup by creating the property and swapping in the real ID. That is steps 1 and 2 below.

---

## Step 1 — Create the GA4 property (do this in Chrome)

1. Go to https://analytics.google.com and sign in with the Google account that owns mdsmartenergy.com (use kevin@myutilityadvisor.com or whichever account you want owning analytics).
2. Admin (gear, bottom left) → **Create** → **Property**.
3. Property name: `Maryland Smart Energy`. Time zone: United States / Eastern. Currency: USD. Next.
4. Industry: `Construction` (or Business & Industrial). Business size: pick yours. Next.
5. Business objectives: check **Generate leads** and **Examine user behavior**. Create. Accept the terms.
6. On "Start collecting data", choose **Web**.
7. Website URL: `https://www.mdsmartenergy.com`  Stream name: `MSE Website`. **Create stream**.
8. You now see a **Measurement ID** in the top right of the stream, format `G-` followed by 10 characters. Copy it.

---

## Step 2 — Put the real ID into the site (one command)

In a terminal, from the `MSE` folder, run this with your real ID in place of the example:

```
node inject-analytics.mjs G-AB12CD34EF
```

That rewrites the tag on every page. Then deploy the site the way you normally do. Re-running this command later (for example if you ever change the ID) is safe; it replaces the old block, never duplicates it.

To confirm it is live: open https://www.mdsmartenergy.com in Chrome, then in GA4 go to **Reports → Realtime**. You should see yourself as 1 active user within about 30 seconds.

---

## Step 3 — Mark the conversions (key events) in GA4

By default GA4 records the events but does not treat them as conversions until you flag them.

1. In GA4: Admin → **Events** (under Data display). You may need to wait up to 24 hours after first traffic for events to appear, or use **DebugView** to see them immediately.
2. Toggle **Mark as key event** ON for:
   - `cta_schedule_click` — primary on-site intent (someone heading to book)
   - `phone_click` — phone leads
   - `generate_lead` — Paperform submission
3. `email_click` is useful to watch but does not need to be a key event.

---

## Step 4 — Reliable form-submission tracking (Paperform)

The site fires a best-effort `generate_lead` when the embedded Paperform is submitted, but the authoritative, guaranteed method is Paperform's own Google Analytics integration. Set it once:

1. Log in to Paperform. Open the form used on the site (the form ID in the code is `rxtuneupsite`).
2. **Configure → Integrations → Analytics → Google Analytics 4**.
3. Paste the same Measurement ID (`G-...`) from Step 1. Enable tracking of submissions.
4. Save. Submissions now report into the same GA4 property as a clean event you can mark as a key event.

---

## Step 5 — Link Search Console (recommended, optional)

The site already carries its Search Console verification meta tag, so the domain is verified. To see search queries inside GA4:

1. GA4: Admin → **Product links → Search Console links → Link**.
2. Choose the mdsmartenergy.com Search Console property, pick the web stream, confirm.
3. After linking, enable the Search Console reports in **Reports → Library** (publish the "Search Console" collection).

---

## Step 6 — Google Ads (only if you run paid ads)

If you ever run Google Ads for MSE: GA4 Admin → Product links → **Google Ads links** → Link your Ads account, then import `cta_schedule_click`, `phone_click`, and `generate_lead` as conversions in Google Ads. Skip this until you actually advertise.

---

## Tracking plan (reference)

| Event | Fires when | Key params | Conversion? |
|-------|------------|------------|-------------|
| `page_view` | Every page load (automatic) | page_location, page_title | No |
| `cta_schedule_click` | Click on any "Schedule $0 Tune-Up" button or pricing/0deposit link | link_text, link_url, page_path | Yes |
| `phone_click` | Click on a tel: link | link_url, page_path | Yes |
| `email_click` | Click on a mailto: link | link_url, page_path | No |
| `generate_lead` | Paperform submitted (site signal + native integration) | method, page_path | Yes |

Naming follows GA4's recommended `object_action`, lowercase with underscores. Do not rename these in code without updating this doc.

---

## Maintenance

- The full implementation is one file: `inject-analytics.mjs`. To change events, edit the `buildBlock()` function and re-run it.
- Any new HTML page added later: just re-run `node inject-analytics.mjs G-YOURID` and it gets the tag automatically.

# Capitol Watch

A dashboard for tracking U.S. House and Senate committees: hearings, markups, bills, resolutions, investigations, nominations, and committee leadership changes. It ranks the week's hot topics and **flags anything related to China** (the CCP, Taiwan, Hong Kong, Xinjiang, export controls, Chinese tech firms, the House Select Committee on China, and more). Alerts show in the app, as browser notifications, and by email, Slack, or Discord.

## What it shows

| Page | Contents |
| --- | --- |
| **Overview** | China alert banner, weekly stats, hot topics, upcoming committee events, bills that are advancing, most-viewed bills, nominations, investigations, and headlines |
| **China Watch** | Every China-related item ranked high, medium, or low, with matched keywords, China items on the committee calendar, and a switch for browser alerts |
| **Hearings** | Official House and Senate committee calendars for the next 3 weeks, grouped by day, plus recently held hearings and newly published hearing records |
| **Bills & Resolutions** | New bill and resolution texts from GovInfo, tagged by stage (introduced, reported by committee, passed a chamber, enrolled) |
| **Appointments** | Nominations on Senate committee agendas, committee chair and ranking-member races, and confirmation news |
| **Investigations** | Probes, subpoenas, oversight letters, and ethics inquiries |
| **Media** | Politico, The Hill, Roll Call, and Google News coverage, plus committee press releases |
| **Sources** | Whether each feed responded on the last refresh, and the full China keyword list |

Every page has search plus chamber, type, and China-only filters.

## Data sources

Official sources (no keys needed):
- Senate committee schedule XML from senate.gov. It includes the nominations and bills each meeting will consider.
- House committee calendar from docs.house.gov
- GovInfo RSS feeds for new bill and resolution texts and published hearing records
- Congress.gov's weekly most-viewed bills
- Press feeds from the House Select Committee on China, the Ways and Means, Homeland Security, and Appropriations committees, and the Speaker's office

Media sources:
- Politico Congress, The Hill (House and Senate), and Roll Call
- Google News searches on Congress and China, committee hearings, investigations, committee chairs, and Senate confirmations

Optional: with a free `CONGRESS_API_KEY` from [api.congress.gov](https://api.congress.gov/sign-up/), the app also pulls the latest action on every bill and the full list of pending nominations.

Data refreshes every 10 minutes. Each source is fetched on its own, so one source going down never breaks the page.

## Run locally

Requires Node 20.9 or newer.

```bash
npm install
npm run dev          # http://localhost:4317
```

Production build:

```bash
npm run build && npm start
```

Copy `.env.example` to `.env.local` to set the optional keys.

## China alerts

Alerts reach you in three ways:

1. **In the app.** An open tab checks `/api/china` every 5 minutes and pops up new items.
2. **Browser notifications.** Click **Enable browser alerts** on the China Watch page.
3. **Email, Slack, Discord, or webhook.** `scripts/china-alert.ts` runs every hour on GitHub Actions (`.github/workflows/china-alert.yml`, free for public repos). It sends only items it hasn't sent before; GitHub's Actions cache keeps track of what's been sent. The first run sends a "monitoring started" summary.

Configure the hourly job under GitHub **Settings → Secrets and variables → Actions**:

| Name | Kind | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | secret | Email through [Resend](https://resend.com) |
| `ALERT_EMAIL_TO` | variable | Comma-separated recipient addresses |
| `ALERT_EMAIL_FROM` | variable | Optional sender, which must be on a domain you verified in Resend |
| `SLACK_WEBHOOK_URL` | secret | Slack incoming webhook |
| `DISCORD_WEBHOOK_URL` | secret | Discord channel webhook |
| `ALERT_WEBHOOK_URL` | secret | Any endpoint that accepts a JSON POST |
| `APP_URL` | variable | Your Render URL, used for links in alerts |
| `ALERT_MIN_LEVEL` | variable | `high`, `medium` (default), or `low` |

Test it locally with `npm run alert:dry`. To trigger a real run, use **Actions → China alert → Run workflow**.

## Deploy to Render

`render.yaml` is a Render Blueprint for a free Node web service.

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint**, pick the repository, and click **Apply**.
3. Optional: add `CONGRESS_API_KEY` under the service's **Environment** tab.

Render rebuilds on every push to the default branch. Free instances sleep after about 15 minutes without traffic and take a few seconds to wake up. The hourly GitHub Actions alert job runs on its own schedule, so alerts still arrive while the instance sleeps.

## JSON API

- `GET /api/digest` returns all items, topic stats, trending bills, and source health.
- `GET /api/china` returns the active China-related alerts.

## Project layout

```
src/lib/sources/   one module per data source (Senate, House, GovInfo, feeds, Congress.gov)
src/lib/collect.ts gathers all sources, removes duplicates, and ranks topics (no Next.js imports, so the alert script reuses it)
src/lib/digest.ts  the cached wrapper used by pages (10-minute revalidation)
src/lib/china.ts   China keyword detection and priority levels
src/lib/topics.ts  hot-topic categories
scripts/china-alert.ts  the scheduled alert job
```

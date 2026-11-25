/**
 * Scheduled China alert job. Collects all sources, finds China-related items not
 * seen on a previous run, and sends them to every configured channel.
 *
 *   npx tsx scripts/china-alert.ts            send alerts
 *   npx tsx scripts/china-alert.ts --dry-run  print what would be sent
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { CHINA_LEVEL_RANK } from "../src/lib/china";
import { collectDigest } from "../src/lib/collect";
import { CATEGORY_LABEL } from "../src/lib/format";
import { activeChinaAlerts } from "../src/lib/select";
import type { ChinaLevel, Item } from "../src/lib/types";

const env = (k: string) => process.env[k]?.trim() || undefined;

const DRY_RUN = process.argv.includes("--dry-run");
const STATE_FILE = env("ALERT_STATE_FILE") ?? ".alert-state/seen.json";
const MIN_LEVEL = (env("ALERT_MIN_LEVEL") ?? "medium") as ChinaLevel;
const APP_URL = env("APP_URL")?.replace(/\/$/, "");
const MAX_ITEMS = 15;

type Seen = Record<string, string>;

function loadState(): Seen | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8")) as Seen;
  } catch {
    return null;
  }
}

function saveState(seen: Seen) {
  const cutoff = Date.now() - 45 * 86400000;
  const pruned = Object.fromEntries(Object.entries(seen).filter(([, t]) => Date.parse(t) >= cutoff));
  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(pruned, null, 2));
}

function line(i: Item) {
  const where = i.committee ?? i.chamber;
  return `[${i.china.level?.toUpperCase()}] ${i.title} — ${CATEGORY_LABEL[i.category]}, ${where} (${i.source})`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function send(subject: string, items: Item[], intro: string) {
  const shown = items.slice(0, MAX_ITEMS);
  const more = items.length > shown.length ? `\n…and ${items.length - shown.length} more.` : "";
  const footer = APP_URL ? `\nDashboard: ${APP_URL}/china` : "";
  const plain = `${intro}\n\n${shown.map((i) => `• ${line(i)}\n  ${i.url}`).join("\n")}${more}${footer}`;

  const channels: [string, () => Promise<void>][] = [];
  const slack = env("SLACK_WEBHOOK_URL");
  if (slack)
    channels.push([
      "Slack",
      () =>
        post(slack, {
          text: `*${subject}*\n${intro}\n${shown.map((i) => `• <${i.url}|${i.title.replace(/[<>|]/g, "")}> — ${i.committee ?? i.chamber} · ${i.china.level}`).join("\n")}${more}${footer}`,
        }),
    ]);
  const discord = env("DISCORD_WEBHOOK_URL");
  if (discord)
    channels.push(["Discord", () => post(discord, { content: `**${subject}**\n${plain}`.slice(0, 1990) })]);
  const webhook = env("ALERT_WEBHOOK_URL");
  if (webhook) channels.push(["Webhook", () => post(webhook, { subject, intro, items: shown, dashboard: APP_URL ? `${APP_URL}/china` : null })]);
  const resendKey = env("RESEND_API_KEY");
  const emailTo = env("ALERT_EMAIL_TO");
  if (resendKey && emailTo) {
    const html = `<p>${escapeHtml(intro)}</p><ul>${shown
      .map(
        (i) =>
          `<li style="margin-bottom:10px"><a href="${escapeHtml(i.url)}"><b>${escapeHtml(i.title)}</b></a><br><small>${escapeHtml(
            `${i.china.level?.toUpperCase()} · ${CATEGORY_LABEL[i.category]} · ${i.committee ?? i.chamber} · ${i.source}`,
          )}<br>Matched: ${escapeHtml(i.china.terms.join(", "))}</small></li>`,
      )
      .join("")}</ul>${more ? `<p>${escapeHtml(more)}</p>` : ""}${APP_URL ? `<p><a href="${escapeHtml(APP_URL)}/china">Open China Watch</a></p>` : ""}`;
    channels.push([
      "Email",
      () =>
        post(
          "https://api.resend.com/emails",
          {
            from: env("ALERT_EMAIL_FROM") ?? "Capitol Watch <onboarding@resend.dev>",
            to: emailTo.split(",").map((s) => s.trim()),
            subject,
            html,
            text: plain,
          },
          { Authorization: `Bearer ${resendKey}` },
        ),
    ]);
  }

  if (DRY_RUN || channels.length === 0) {
    console.log(`${DRY_RUN ? "[dry run] " : "[no alert channels configured] "}${subject}\n${plain}`);
    return;
  }
  const results = await Promise.allSettled(channels.map(([, fn]) => fn()));
  results.forEach((r, idx) => {
    const name = channels[idx][0];
    if (r.status === "fulfilled") console.log(`Sent to ${name}`);
    else console.error(`Failed to send to ${name}: ${(r.reason as Error).message}`);
  });
  if (results.every((r) => r.status === "rejected")) process.exitCode = 1;
}

async function main() {
  const digest = await collectDigest();
  const failed = digest.sources.filter((s) => !s.ok);
  if (failed.length) console.warn(`Unreachable sources: ${failed.map((s) => s.name).join(", ")}`);

  const alerts = activeChinaAlerts(digest, 7 * 24).filter((i) => CHINA_LEVEL_RANK[i.china.level!] >= CHINA_LEVEL_RANK[MIN_LEVEL]);
  const state = loadState();
  const now = new Date().toISOString();

  if (!state) {
    const seen: Seen = Object.fromEntries(alerts.map((a) => [a.id, now]));
    if (!DRY_RUN) saveState(seen);
    const top = alerts.slice(0, 5);
    if (top.length) {
      await send(
        "Capitol Watch: China alerts are now active",
        top,
        `Monitoring started. ${alerts.length} China-related items are already active; here are the top ${top.length}. From now on you will only receive new items.`,
      );
    } else {
      console.log("Monitoring started; no active China-related items right now.");
    }
    return;
  }

  const fresh = alerts.filter((a) => !state[a.id]);
  console.log(`${alerts.length} active China items, ${fresh.length} new.`);
  if (fresh.length > 0) {
    const high = fresh.filter((a) => a.china.level === "high").length;
    await send(
      `Capitol Watch China alert: ${fresh.length} new item${fresh.length > 1 ? "s" : ""}${high ? ` (${high} high priority)` : ""}`,
      fresh,
      `New China-related activity on Capitol Hill since the last check:`,
    );
  }
  if (!DRY_RUN) {
    for (const a of alerts) state[a.id] ??= now;
    saveState(state);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

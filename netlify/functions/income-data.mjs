import { getStore } from "@netlify/blobs";

const STORE_NAME = "networth-dashboard";
const DATA_KEY = "income-sources";

const DEFAULT_SOURCES = [
  {
    id: "logistics",
    name: "Logistics",
    detail: "Dispatcher",
    color: "#2f7df6",
    records: [
      { month: "2024-11", income: 300, weeklyHours: 56 },
      { month: "2024-12", income: 300, weeklyHours: 56 },
      { month: "2025-01", income: 400, weeklyHours: 56 },
      { month: "2025-02", income: 400, weeklyHours: 56 },
      { month: "2025-03", income: 500, weeklyHours: 56 },
      { month: "2025-04", income: 500, weeklyHours: 56 },
      { month: "2025-05", income: 500, weeklyHours: 56 },
      { month: "2025-06", income: 500, weeklyHours: 56 },
      { month: "2025-07", income: 500, weeklyHours: 56 },
      { month: "2025-08", income: 500, weeklyHours: 56 },
      { month: "2025-09", income: 600, weeklyHours: 56 },
      { month: "2025-10", income: 700, weeklyHours: 56 },
      { month: "2025-11", income: 700, weeklyHours: 56 },
      { month: "2025-12", income: 700, weeklyHours: 56 },
      { month: "2026-01", income: 900, weeklyHours: 84 },
      { month: "2026-02", income: 900, weeklyHours: 84 },
      { month: "2026-03", income: 900, weeklyHours: 84 },
      { month: "2026-04", income: 900, weeklyHours: 70 },
      { month: "2026-05", income: 900, weeklyHours: 70 },
      { month: "2026-06", income: 900, weeklyHours: 56 },
    ],
  },
  {
    id: "freelance",
    name: "Freelance",
    detail: "Software Engineer",
    color: "#00d49f",
    records: [{ month: "2026-06", income: 0, weeklyHours: 0 }],
  },
];

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  },
  body: JSON.stringify(body),
});

const normalizeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeSources = (sources) =>
  (Array.isArray(sources) ? sources : DEFAULT_SOURCES)
    .filter((source) => String(source.name || "").trim())
    .map((source, index) => ({
      id: source.id || `${slugify(source.name) || "source"}-${index + 1}`,
      name: String(source.name).trim(),
      detail: String(source.detail || "Income Source").trim(),
      color: /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : "#2f7df6",
      records: (Array.isArray(source.records) ? source.records : [])
        .filter((record) => /^\d{4}-\d{2}$/.test(record.month))
        .map((record) => ({
          month: record.month,
          income: normalizeNumber(record.income),
          weeklyHours: normalizeNumber(record.weeklyHours),
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    }))
    .filter((source) => source.records.length);

const readSources = async (store) => {
  const stored = await store.get(DATA_KEY, { type: "json", consistency: "strong" });
  return normalizeSources(stored || DEFAULT_SOURCES);
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(200, { ok: true });
  }

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });

    if (event.httpMethod === "GET") {
      return json(200, { sources: await readSources(store) });
    }

    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const configuredPassword = process.env.ADMIN_PASSWORD;
    if (!configuredPassword) {
      return json(500, { error: "ADMIN_PASSWORD is not configured in Netlify environment variables." });
    }

    const body = JSON.parse(event.body || "{}");
    if (body.password !== configuredPassword) {
      return json(401, { error: "Invalid password" });
    }

    if (body.action === "verify") {
      return json(200, { ok: true });
    }

    const sources = normalizeSources(body.sources);
    if (!sources.length) {
      return json(400, { error: "At least one income source is required." });
    }

    await store.setJSON(DATA_KEY, sources);

    return json(200, { sources });
  } catch (error) {
    console.error("income-data function failed", error);
    return json(500, { error: "Unable to load or save income data." });
  }
};

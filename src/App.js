import React, { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TODAY = new Date();
const HOURS_PER_WEEK = 168;
const API_PATH = "/.netlify/functions/income-data";

const COLOR_OPTIONS = [
  "#2f7df6",
  "#00d49f",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#f97316",
  "#eab308",
];

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

const METRICS = [
  { key: "income", label: "Monthly Income", format: "currency" },
  { key: "cumulative", label: "Cumulative Earned", format: "currency" },
  { key: "hourly", label: "Hourly Rate", format: "currency" },
  { key: "hours", label: "Weekly Hours", format: "hours" },
];

const formatCurrency = (value) =>
  `$${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}`;

const formatCompactCurrency = (value) =>
  `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value);

const formatValue = (value, format) => {
  if (format === "currency") return formatCurrency(value);
  if (format === "compactCurrency") return formatCompactCurrency(value);
  if (format === "hours") return `${formatNumber(value)}h`;
  if (format === "percent") return `${formatNumber(value)}%`;
  return formatNumber(value);
};

const monthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date) =>
  date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

const monthInputLabel = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthLabel(new Date(year, monthNumber - 1, 1));
};

const maxMonth = (months) => months.reduce((latest, month) => (month > latest ? month : latest), months[0]);

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date, count) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);

const buildMonths = (start, end) => {
  const months = [];
  let cursor = startOfMonth(start);
  const last = startOfMonth(end);

  while (cursor <= last) {
    months.push(new Date(cursor));
    cursor = addMonths(cursor, 1);
  }

  return months;
};

const monthlyHours = (weeklyHours) => (weeklyHours * 52) / 12;

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalizeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const sortRecords = (records) =>
  [...records].sort((a, b) => a.month.localeCompare(b.month));

const normalizeSources = (sources) =>
  sources
    .filter((source) => source.name?.trim())
    .map((source, index) => ({
      id: source.id || `${slugify(source.name) || "source"}-${index + 1}`,
      name: source.name.trim(),
      detail: source.detail?.trim() || "Income Source",
      color: source.color || COLOR_OPTIONS[index % COLOR_OPTIONS.length],
      records: sortRecords(
        (source.records?.length ? source.records : [{ month: monthKey(TODAY), income: 0, weeklyHours: 0 }]).map(
          (record) => ({
            month: record.month,
            income: normalizeNumber(record.income),
            weeklyHours: normalizeNumber(record.weeklyHours),
          })
        )
      ),
    }));

const getRecord = (source, date) => {
  const key = typeof date === "string" ? date : monthKey(date);
  return source.records.find((record) => record.month === key);
};

const getLatestRecord = (source, throughMonth = monthKey(TODAY)) => {
  const records = sortRecords(source.records).filter((record) => record.month <= throughMonth);
  return records[records.length - 1] ?? { income: 0, weeklyHours: 0 };
};

const getSourceIncome = (source, date) => getRecord(source, date)?.income ?? 0;

const getSourceWeeklyHours = (source, date) => getRecord(source, date)?.weeklyHours ?? 0;

const buildSourceBg = (color) => ({ backgroundColor: `${color}30` });

const getDefaultSources = () => normalizeSources(DEFAULT_SOURCES);

const CustomTooltip = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--tooltip-bg)] p-3 text-xs shadow-xl">
      <div className="mb-2 text-sm font-semibold text-[var(--text)]">{label}</div>
      <div className="flex flex-col gap-1">
        {[...payload]
          .filter((item) => item.value !== undefined)
          .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
          .map((item) => (
            <div key={item.dataKey} className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-2 text-[var(--muted)]">
                <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                {item.name}
              </span>
              <span className="text-[var(--text)]">
                {formatValue(Number(item.value), metric.format)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};

const MiniBar = ({ data }) => (
  <ResponsiveContainer width="100%" height={120}>
    <BarChart data={data}>
      <XAxis dataKey="name" hide />
      <YAxis hide />
      <Tooltip
        cursor={{ fill: "rgba(255,255,255,0.04)" }}
        content={<CustomTooltip metric={{ format: "hours" }} />}
      />
      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
        {data.map((item) => (
          <Cell key={item.name} fill={item.color} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

const SegmentedControl = ({ options, value, onChange }) => (
  <div className="segmented-control">
    {options.map((option) => {
      const optionValue = typeof option === "string" ? option : option.value;
      const label = typeof option === "string" ? option : option.label;

      return (
        <button
          key={optionValue}
          type="button"
          className={`segmented-button ${value === optionValue ? "segmented-button-active" : ""}`}
          onClick={() => onChange(optionValue)}
        >
          {label}
        </button>
      );
    })}
  </div>
);

const SourceToggle = ({ stream, active, onClick }) => (
  <button
    type="button"
    className={`source-toggle ${active ? "source-toggle-active" : ""}`}
    onClick={onClick}
  >
    <span className="source-toggle-dot" style={{ background: stream.color }} />
    <span>{stream.name}</span>
  </button>
);

const Field = ({ label, children }) => (
  <label className="grid gap-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
    <span>{label}</span>
    {children}
  </label>
);

export default function App() {
  const isAdminRoute = window.location.pathname.replace(/\/+$/, "") === "/admin";
  const [sources, setSources] = useState(getDefaultSources);
  const [metricKey, setMetricKey] = useState("cumulative");
  const [viewMode, setViewMode] = useState("Area");
  const [editMonth, setEditMonth] = useState(monthKey(TODAY));
  const [password, setPassword] = useState("");
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [selectedSources, setSelectedSources] = useState(() => sources.map((source) => source.id));
  const [newSource, setNewSource] = useState({
    name: "",
    detail: "",
    income: "",
    weeklyHours: "",
    color: COLOR_OPTIONS[2],
  });

  useEffect(() => {
    let isMounted = true;

    const loadSources = async () => {
      try {
        const response = await fetch(API_PATH);
        if (!response.ok) throw new Error("Request failed");
        const payload = await response.json();
        if (isMounted && payload.sources?.length) {
          setSources(normalizeSources(payload.sources));
          setLoadError("");
        }
      } catch {
        if (isMounted) {
          setLoadError("Using bundled data because the Netlify data function is not reachable.");
        }
      }
    };

    loadSources();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedSources((currentSources) => {
      const availableIds = sources.map((source) => source.id);
      const validIds = currentSources.filter((id) => availableIds.includes(id));
      return validIds.length ? validIds : availableIds;
    });
  }, [sources]);

  const data = useMemo(() => {
    const firstMonth = sources.reduce((earliest, source) => {
      const sourceStart = source.records[0]?.month;
      if (!sourceStart) return earliest;
      return sourceStart < earliest ? sourceStart : earliest;
    }, monthKey(TODAY));
    const [year, month] = firstMonth.split("-").map(Number);
    const latestMonth = maxMonth([
      monthKey(TODAY),
      ...sources.flatMap((source) => source.records.map((record) => record.month)),
    ]);
    const [endYear, endMonth] = latestMonth.split("-").map(Number);
    const cumulativeBySource = Object.fromEntries(sources.map((source) => [source.id, 0]));

    return buildMonths(new Date(year, month - 1, 1), new Date(endYear, endMonth - 1, 1)).map((date) => {
      const row = { date: monthLabel(date), month: monthKey(date) };

      sources.forEach((source) => {
        const income = getSourceIncome(source, date);
        const hours = getSourceWeeklyHours(source, date);
        const workHours = monthlyHours(hours);
        cumulativeBySource[source.id] += income;

        row[`${source.id}_income`] = income;
        row[`${source.id}_cumulative`] = cumulativeBySource[source.id];
        row[`${source.id}_hours`] = hours;
        row[`${source.id}_workHours`] = workHours;
        row[`${source.id}_hourly`] = workHours ? income / workHours : 0;
      });

      const income = sources.reduce((sum, source) => sum + row[`${source.id}_income`], 0);
      const hours = sources.reduce((sum, source) => sum + row[`${source.id}_hours`], 0);
      const workHours = sources.reduce((sum, source) => sum + row[`${source.id}_workHours`], 0);
      const hourly = workHours ? income / workHours : 0;

      return {
        ...row,
        income,
        cumulative: sources.reduce((sum, source) => sum + row[`${source.id}_cumulative`], 0),
        hours,
        workHours,
        hourly,
      };
    });
  }, [sources]);

  const current = data[data.length - 1];
  const previous = data[Math.max(0, data.length - 2)];
  const metric = METRICS.find((item) => item.key === metricKey);
  const activeSources = selectedSources.length ? selectedSources : sources.map((source) => source.id);
  const getSeriesKey = (sourceId) => `${sourceId}_${metricKey}`;
  const getSelectedMetricValue = (row) => {
    const selectedIncome = activeSources.reduce(
      (sum, sourceId) => sum + (row[`${sourceId}_income`] ?? 0),
      0
    );
    const selectedWorkHours = activeSources.reduce(
      (sum, sourceId) => sum + (row[`${sourceId}_workHours`] ?? 0),
      0
    );

    if (metricKey === "hourly") {
      return selectedWorkHours ? selectedIncome / selectedWorkHours : 0;
    }

    return activeSources.reduce((sum, sourceId) => sum + (row[getSeriesKey(sourceId)] ?? 0), 0);
  };
  const selectedValue = getSelectedMetricValue(current);
  const previousValue = getSelectedMetricValue(previous);
  const delta = previousValue ? ((selectedValue - previousValue) / previousValue) * 100 : 0;

  const rows = sources.map((source) => {
    const latest = getLatestRecord(source);
    const earned = data.reduce((sum, item) => sum + (item[`${source.id}_income`] ?? 0), 0);
    const hours = latest.weeklyHours;
    const hourly = hours ? latest.income / monthlyHours(hours) : 0;

    return {
      id: source.id,
      name: source.name,
      tag: source.detail,
      current: latest.income,
      earned,
      hours,
      hourly,
      replacement: current.income ? (latest.income / current.income) * 100 : 0,
      color: source.color,
    };
  });

  const totalHours = rows.reduce((sum, item) => sum + item.hours, 0);
  const currentMonthlyIncome = rows.reduce((sum, item) => sum + item.current, 0);
  const currentHourlyRate = totalHours ? currentMonthlyIncome / monthlyHours(totalHours) : 0;
  const earnedToDate = current.cumulative;
  const averageMonthlyIncome = earnedToDate / data.length;
  const timeData = rows.map((row) => ({
    name: row.name,
    value: row.hours,
    color: row.color,
  }));

  const kpis = [
    {
      label: "Monthly Income",
      value: formatCurrency(currentMonthlyIncome),
      change: `${delta >= 0 ? "+" : ""}${formatNumber(delta)}%`,
      hint: "selected trend",
    },
    {
      label: "Earned Total",
      value: formatCurrency(earnedToDate),
      change: "+100%",
      hint: `since ${monthInputLabel(data[0].month)}`,
    },
    {
      label: "Hourly Rate",
      value: `${formatCurrency(currentHourlyRate)}/hr`,
      change: "+0.0%",
      hint: `${formatNumber(totalHours)} hrs/week`,
    },
    {
      label: "Avg Monthly",
      value: formatCurrency(averageMonthlyIncome),
      change: "+",
      hint: "historical average",
    },
  ];

  const tickDates = data
    .filter((_, index) => index === 0 || index === data.length - 1 || index % 4 === 0)
    .map((item) => item.date);

  const toggleSource = (sourceId) => {
    setSelectedSources((currentSources) => {
      if (currentSources.includes(sourceId)) {
        const next = currentSources.filter((id) => id !== sourceId);
        return next.length ? next : currentSources;
      }

      return [...currentSources, sourceId];
    });
  };

  const updateSourceRecord = (sourceId, month, patch) => {
    setSources((currentSources) =>
      currentSources.map((source) => {
        if (source.id !== sourceId) return source;

        const existingRecord = getRecord(source, month) ?? {
          month,
          income: getLatestRecord(source, month).income,
          weeklyHours: getLatestRecord(source, month).weeklyHours,
        };
        const nextRecords = source.records.filter((record) => record.month !== month);

        return {
          ...source,
          records: sortRecords([
            ...nextRecords,
            {
              ...existingRecord,
              ...patch,
            },
          ]),
        };
      })
    );
  };

  const updateSourceMeta = (sourceId, patch) => {
    setSources((currentSources) =>
      currentSources.map((source) => (source.id === sourceId ? { ...source, ...patch } : source))
    );
  };

  const deleteSource = (sourceId) => {
    setSources((currentSources) => {
      if (currentSources.length === 1) return currentSources;
      return currentSources.filter((source) => source.id !== sourceId);
    });
  };

  const addSource = (event) => {
    event.preventDefault();
    const name = newSource.name.trim();
    if (!name) return;

    const baseId = slugify(name) || "source";
    const existingIds = new Set(sources.map((source) => source.id));
    let id = baseId;
    let suffix = 2;
    while (existingIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }

    const source = {
      id,
      name,
      detail: newSource.detail.trim() || "Income Source",
      color: newSource.color,
      records: [
        {
          month: monthKey(TODAY),
          income: normalizeNumber(newSource.income),
          weeklyHours: normalizeNumber(newSource.weeklyHours),
        },
      ],
    };

    setSources((currentSources) => [...currentSources, source]);
    setSelectedSources((currentSources) => [...currentSources, id]);
    setNewSource({
      name: "",
      detail: "",
      income: "",
      weeklyHours: "",
      color: COLOR_OPTIONS[(sources.length + 1) % COLOR_OPTIONS.length],
    });
  };

  const resetData = () => {
    setSources(DEFAULT_SOURCES);
    setSelectedSources(DEFAULT_SOURCES.map((source) => source.id));
    setStatusMessage("Reset locally. Click Save Changes to store it in Netlify Blobs.");
  };

  const verifyAdmin = async (event) => {
    event.preventDefault();
    setStatusMessage("Checking password...");

    try {
      const response = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", password }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusMessage(payload.error || "Invalid password.");
        return;
      }

      setAdminAuthenticated(true);
      setStatusMessage("");
    } catch {
      setStatusMessage("Could not reach the Netlify admin function.");
    }
  };

  const saveSources = async () => {
    setStatusMessage("Saving changes...");

    try {
      const response = await fetch(API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, sources }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatusMessage(payload.error || "Save failed.");
        return;
      }

      setSources(normalizeSources(payload.sources));
      setStatusMessage("Saved to Netlify Blobs.");
    } catch {
      setStatusMessage("Could not save to Netlify Blobs.");
    }
  };

  if (isAdminRoute && !adminAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
          <form className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5" onSubmit={verifyAdmin}>
            <div className="mb-4">
              <div className="text-lg font-semibold text-[var(--text)]">Admin Login</div>
              <div className="text-sm text-[var(--muted)]">Enter the admin password to edit income data.</div>
            </div>
            <Field label="Password">
              <input
                className="admin-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
              />
            </Field>
            {statusMessage && <div className="mt-3 text-sm text-[var(--muted)]">{statusMessage}</div>}
            <button type="submit" className="primary-button mt-4 w-full">
              Open Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--accent-soft)] p-2">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="#3B82F6" />
                <rect x="13" y="7" width="8" height="8" rx="2" fill="#1D4ED8" />
                <rect x="7" y="13" width="8" height="8" rx="2" fill="#2563EB" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-semibold">Ziyodulla</div>
              <div className="text-xs text-[var(--muted)]">Net Worth Dashboard</div>
            </div>
          </div>
        </header>

        {loadError && !isAdminRoute && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-sm text-[var(--muted)]">
            {loadError}
          </div>
        )}

        {isAdminRoute && (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">Admin Panel</div>
                <div className="text-xs text-[var(--muted)]">
                  Changes are saved to Netlify Blobs after you click Save Changes.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="danger-button" onClick={resetData}>
                  Reset Demo Data
                </button>
                <button type="button" className="primary-button" onClick={saveSources}>
                  Save Changes
                </button>
              </div>
            </div>
            {statusMessage && <div className="mb-4 text-sm text-[var(--muted)]">{statusMessage}</div>}

            <form className="admin-form" onSubmit={addSource}>
              <Field label="New Source">
                <input
                  className="admin-input"
                  value={newSource.name}
                  onChange={(event) => setNewSource((currentValue) => ({ ...currentValue, name: event.target.value }))}
                  placeholder="Business, job, rental..."
                />
              </Field>
              <Field label="Role">
                <input
                  className="admin-input"
                  value={newSource.detail}
                  onChange={(event) => setNewSource((currentValue) => ({ ...currentValue, detail: event.target.value }))}
                  placeholder="Income Source"
                />
              </Field>
              <Field label="Monthly $">
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSource.income}
                  onChange={(event) => setNewSource((currentValue) => ({ ...currentValue, income: event.target.value }))}
                  placeholder="0"
                />
              </Field>
              <Field label="Hours / Week">
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newSource.weeklyHours}
                  onChange={(event) =>
                    setNewSource((currentValue) => ({ ...currentValue, weeklyHours: event.target.value }))
                  }
                  placeholder="0"
                />
              </Field>
              <Field label="Color">
                <select
                  className="admin-input"
                  value={newSource.color}
                  onChange={(event) => setNewSource((currentValue) => ({ ...currentValue, color: event.target.value }))}
                >
                  {COLOR_OPTIONS.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </Field>
              <button type="submit" className="primary-button">
                Add Source
              </button>
            </form>

            <div className="mt-5 grid gap-4">
              {sources.map((source) => {
                const latest = getLatestRecord(source);

                return (
                  <div key={source.id} className="admin-source">
                    <div className="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_110px_120px_100px_auto]">
                      <Field label="Name">
                        <input
                          className="admin-input"
                          value={source.name}
                          onChange={(event) => updateSourceMeta(source.id, { name: event.target.value })}
                        />
                      </Field>
                      <Field label="Role">
                        <input
                          className="admin-input"
                          value={source.detail}
                          onChange={(event) => updateSourceMeta(source.id, { detail: event.target.value })}
                        />
                      </Field>
                      <Field label="Month">
                        <input
                          className="admin-input"
                          type="month"
                          value={editMonth}
                          onChange={(event) => setEditMonth(event.target.value)}
                        />
                      </Field>
                      <Field label="Monthly $">
                        <input
                          className="admin-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={getRecord(source, editMonth)?.income ?? latest.income}
                          onChange={(event) =>
                            updateSourceRecord(source.id, editMonth, { income: normalizeNumber(event.target.value) })
                          }
                        />
                      </Field>
                      <Field label="Hours">
                        <input
                          className="admin-input"
                          type="number"
                          min="0"
                          step="0.5"
                          value={getRecord(source, editMonth)?.weeklyHours ?? latest.weeklyHours}
                          onChange={(event) =>
                            updateSourceRecord(source.id, editMonth, {
                              weeklyHours: normalizeNumber(event.target.value),
                            })
                          }
                        />
                      </Field>
                      <div className="flex items-end gap-2">
                        <select
                          className="admin-input min-w-[92px]"
                          value={source.color}
                          onChange={(event) => updateSourceMeta(source.id, { color: event.target.value })}
                        >
                          {COLOR_OPTIONS.map((color) => (
                            <option key={color} value={color}>
                              {color}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="danger-button" onClick={() => deleteSource(source.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-[var(--muted)]">Monthly history</summary>
                      <div className="mt-3 grid gap-2">
                        {sortRecords(source.records).map((record) => (
                          <div key={record.month} className="history-row">
                            <span className="text-sm text-[var(--muted)]">{monthInputLabel(record.month)}</span>
                            <input
                              className="admin-input"
                              type="number"
                              min="0"
                              step="0.01"
                              value={record.income}
                              onChange={(event) =>
                                updateSourceRecord(source.id, record.month, {
                                  income: normalizeNumber(event.target.value),
                                })
                              }
                            />
                            <input
                              className="admin-input"
                              type="number"
                              min="0"
                              step="0.5"
                              value={record.weeklyHours}
                              onChange={(event) =>
                                updateSourceRecord(source.id, record.month, {
                                  weeklyHours: normalizeNumber(event.target.value),
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!isAdminRoute && (
          <>
            <section>
              <div className="mb-3 text-sm font-semibold text-[var(--text)]">Portfolio Overview</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
                    <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-2xl font-semibold text-[var(--text)]">{item.value}</div>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                      <span className="text-[var(--success)]">{item.change}</span>
                      <span className="text-[var(--muted-2)]">{item.hint}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">{metric.label}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-3xl font-semibold text-[var(--text)]">
                      {formatValue(selectedValue, metric.format)}
                    </div>
                    <span className="rounded-full border border-[var(--success)] bg-[var(--success-soft)] px-2 py-1 text-xs font-semibold text-[var(--success)]">
                      {delta >= 0 ? "+" : ""}
                      {formatNumber(delta)}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="source-toggle-group">
                    {sources.map((source) => (
                      <SourceToggle
                        key={source.id}
                        stream={source}
                        active={activeSources.includes(source.id)}
                        onClick={() => toggleSource(source.id)}
                      />
                    ))}
                  </div>
                  <SegmentedControl
                    value={metricKey}
                    onChange={setMetricKey}
                    options={METRICS.map((item) => ({ value: item.key, label: item.label }))}
                  />
                  <SegmentedControl value={viewMode} onChange={setViewMode} options={["Area", "Bar"]} />
                </div>
              </div>

          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "Area" ? (
                <AreaChart data={data}>
                  <defs>
                    {activeSources.map((sourceId) => {
                      const source = sources.find((item) => item.id === sourceId);
                      if (!source) return null;

                      return (
                        <linearGradient key={sourceId} id={`grad-${sourceId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={source.color} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={source.color} stopOpacity={0.05} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid stroke="var(--grid)" strokeDasharray="3 6" />
                  <XAxis dataKey="date" ticks={tickDates} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={{ stroke: "var(--grid)" }} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={{ stroke: "var(--grid)" }} tickLine={false} tickFormatter={(value) => metric.format === "currency" ? formatCompactCurrency(value) : formatValue(value, metric.format)} />
                  <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
                  {activeSources.map((sourceId) => {
                    const source = sources.find((item) => item.id === sourceId);
                    if (!source) return null;

                    return (
                      <Area
                        key={sourceId}
                        type="monotone"
                        dataKey={getSeriesKey(sourceId)}
                        name={source.name}
                        stroke={source.color}
                        strokeWidth={2.4}
                        fill={`url(#grad-${sourceId})`}
                        fillOpacity={0.24}
                        dot={false}
                      />
                    );
                  })}
                </AreaChart>
              ) : (
                <ComposedChart data={data}>
                  <CartesianGrid stroke="var(--grid)" strokeDasharray="3 6" />
                  <XAxis dataKey="date" ticks={tickDates} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={{ stroke: "var(--grid)" }} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={{ stroke: "var(--grid)" }} tickLine={false} tickFormatter={(value) => metric.format === "currency" ? formatCompactCurrency(value) : formatValue(value, metric.format)} />
                  <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  {activeSources.map((sourceId) => {
                    const source = sources.find((item) => item.id === sourceId);
                    if (!source) return null;

                    return (
                      <Bar
                        key={sourceId}
                        dataKey={getSeriesKey(sourceId)}
                        name={source.name}
                        fill={source.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={34}
                      />
                    );
                  })}
                  {activeSources.map((sourceId) => {
                    const source = sources.find((item) => item.id === sourceId);
                    if (!source) return null;

                    return (
                      <Line
                        key={`${sourceId}-line`}
                        type="monotone"
                        dataKey={getSeriesKey(sourceId)}
                        name={source.name}
                        stroke={source.color}
                        strokeWidth={2}
                        dot={false}
                      />
                    );
                  })}
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="mb-4 text-sm font-semibold text-[var(--text)]">Income Performance</div>
            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-[var(--panel-strong)] text-[var(--muted)]">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Source</th>
                    <th className="px-4 py-3 text-right font-medium">Current $</th>
                    <th className="px-4 py-3 text-right font-medium">Earned $</th>
                    <th className="px-4 py-3 text-right font-medium">Hours / Week</th>
                    <th className="px-4 py-3 text-right font-medium">Hourly $</th>
                    <th className="px-4 py-3 text-right font-medium">Replacement</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-[var(--border)] transition-colors hover:bg-[var(--panel-hover)]">
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-[var(--text)]"
                            style={buildSourceBg(row.color)}
                          >
                            {row.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-[var(--text)]">{row.name}</div>
                            <div className="text-xs text-[var(--muted-2)]">{row.tag}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--success)]">{formatCurrency(row.current)}</td>
                      <td className="px-4 py-3 text-right text-[var(--success)]">{formatCurrency(row.earned)}</td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">{formatValue(row.hours, "hours")}</td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">{row.hourly ? `${formatCurrency(row.hourly)}/hr` : "$0/hr"}</td>
                      <td className="px-4 py-3 text-right text-[var(--text)]">{formatValue(row.replacement, "percent")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="mb-4 text-sm font-semibold text-[var(--text)]">Time Allocation</div>
            <MiniBar data={timeData} />
            <div className="mt-4 grid gap-3 text-sm">
              {timeData.map((item) => (
                <div key={item.name} className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                  <span className="flex items-center gap-2 text-[var(--muted)]">
                    <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                    {item.name}
                  </span>
                  <span className="text-[var(--text)]">{formatValue(item.value, "hours")}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <span className="text-[var(--muted)]">Week Used</span>
                <span className="text-[var(--text)]">{formatValue((totalHours / HOURS_PER_WEEK) * 100, "percent")}</span>
              </div>
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  );
}

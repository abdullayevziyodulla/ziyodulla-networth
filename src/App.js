import React, { useMemo, useState } from "react";
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

const TODAY = new Date(2026, 5, 12);
const HOURS_PER_WEEK = 168;

const LOGISTICS_SALARY_HISTORY = [
  { month: "2024-11", amount: 300 },
  { month: "2024-12", amount: 300 },
  { month: "2025-01", amount: 400 },
  { month: "2025-02", amount: 400 },
  { month: "2025-03", amount: 500 },
  { month: "2025-04", amount: 500 },
  { month: "2025-05", amount: 500 },
  { month: "2025-06", amount: 500 },
  { month: "2025-07", amount: 500 },
  { month: "2025-08", amount: 500 },
  { month: "2025-09", amount: 600 },
  { month: "2025-10", amount: 700 },
  { month: "2025-11", amount: 700 },
  { month: "2025-12", amount: 700 },
  { month: "2026-01", amount: 900 },
  { month: "2026-02", amount: 900 },
  { month: "2026-03", amount: 900 },
  { month: "2026-04", amount: 900 },
  { month: "2026-05", amount: 900 },
];

const LOGISTICS_HOURS_HISTORY = [
  { from: new Date(2024, 10, 3), to: new Date(2025, 11, 31), weeklyHours: 56 },
  { from: new Date(2026, 0, 1), to: new Date(2026, 2, 31), weeklyHours: 84 },
  { from: new Date(2026, 3, 1), to: new Date(2026, 4, 31), weeklyHours: 70 },
  { from: new Date(2026, 5, 1), to: null, weeklyHours: 56 },
];

const STREAMS = [
  {
    id: "logistics",
    name: "Logistics",
    detail: "Dispatcher",
    currentMonthly: 900,
    weeklyHours: 56,
    startDate: new Date(2024, 10, 3),
    color: "#2f7df6",
    bg: "bg-blue-500/30",
  },
  {
    id: "freelance",
    name: "Freelance",
    detail: "Software Engineer",
    currentMonthly: 0,
    weeklyHours: 0,
    startDate: new Date(2026, 5, 1),
    color: "#00d49f",
    bg: "bg-emerald-500/30",
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

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const addMonths = (date, count) =>
  new Date(date.getFullYear(), date.getMonth() + count, 1);

const daysBetweenInclusive = (start, end) =>
  Math.floor((end - start) / 86400000) + 1;

const rangesOverlap = (startA, endA, startB, endB) =>
  startA <= endB && startB <= endA;

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

const getLogisticsIncome = (date) => {
  const found = LOGISTICS_SALARY_HISTORY.find((item) => item.month === monthKey(date));

  if (found) return found.amount;
  if (date > new Date(2026, 4, 31)) return 900;
  return 0;
};

const getLogisticsWeeklyHours = (date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const range = LOGISTICS_HOURS_HISTORY.find(
    (item) => rangesOverlap(monthStart, monthEnd, item.from, item.to ?? monthEnd)
  );

  return range?.weeklyHours ?? 0;
};

const getLogisticsMonthlyWorkHours = (date) => {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  return LOGISTICS_HOURS_HISTORY.reduce((total, item) => {
    const rangeEnd = item.to ?? monthEnd;

    if (!rangesOverlap(monthStart, monthEnd, item.from, rangeEnd)) {
      return total;
    }

    const activeStart = item.from > monthStart ? item.from : monthStart;
    const activeEnd = rangeEnd < monthEnd ? rangeEnd : monthEnd;
    const activeDays = daysBetweenInclusive(activeStart, activeEnd);

    return total + (item.weeklyHours / 7) * activeDays;
  }, 0);
};

const getStreamIncome = (streamId, date) => {
  if (streamId === "logistics") return getLogisticsIncome(date);
  return 0;
};

const getStreamHours = (streamId, date) => {
  if (streamId === "logistics") return getLogisticsWeeklyHours(date);
  return 0;
};

const getStreamMonthlyWorkHours = (streamId, date) => {
  if (streamId === "logistics") return getLogisticsMonthlyWorkHours(date);
  return 0;
};

const monthlyHours = (weeklyHours) => (weeklyHours * 52) / 12;

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
      <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<CustomTooltip metric={{ format: "hours" }} />} />
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

export default function App() {
  const [metricKey, setMetricKey] = useState("cumulative");
  const [viewMode, setViewMode] = useState("Area");
  const [selectedSources, setSelectedSources] = useState(STREAMS.map((stream) => stream.id));

  const data = useMemo(() => {
    const cumulativeBySource = Object.fromEntries(STREAMS.map((stream) => [stream.id, 0]));

    return buildMonths(new Date(2024, 10, 1), TODAY).map((date) => {
      const row = { date: monthLabel(date) };

      STREAMS.forEach((stream) => {
        const income = getStreamIncome(stream.id, date);
        const hours = getStreamHours(stream.id, date);
        const workHours = getStreamMonthlyWorkHours(stream.id, date);
        cumulativeBySource[stream.id] += income;

        row[`${stream.id}_income`] = income;
        row[`${stream.id}_cumulative`] = cumulativeBySource[stream.id];
        row[`${stream.id}_hours`] = hours;
        row[`${stream.id}_workHours`] = workHours;
        row[`${stream.id}_hourly`] = workHours ? income / workHours : 0;
      });

      const income = STREAMS.reduce((sum, stream) => sum + row[`${stream.id}_income`], 0);
      const hours = STREAMS.reduce((sum, stream) => sum + row[`${stream.id}_hours`], 0);
      const workHours = STREAMS.reduce((sum, stream) => sum + row[`${stream.id}_workHours`], 0);
      const hourly = workHours ? income / workHours : 0;

      return {
        ...row,
        income,
        cumulative: STREAMS.reduce((sum, stream) => sum + row[`${stream.id}_cumulative`], 0),
        hours,
        workHours,
        hourly,
      };
    });
  }, []);

  const current = data[data.length - 1];
  const previous = data[Math.max(0, data.length - 2)];
  const metric = METRICS.find((item) => item.key === metricKey);
  const activeSources = selectedSources.length ? selectedSources : STREAMS.map((stream) => stream.id);
  const getSeriesKey = (streamId) => `${streamId}_${metricKey}`;
  const getSelectedMetricValue = (row) => {
    const selectedIncome = activeSources.reduce(
      (sum, streamId) => sum + (row[`${streamId}_income`] ?? 0),
      0
    );
    const selectedWorkHours = activeSources.reduce(
      (sum, streamId) => sum + (row[`${streamId}_workHours`] ?? 0),
      0
    );

    if (metricKey === "hourly") {
      return selectedWorkHours ? selectedIncome / selectedWorkHours : 0;
    }

    return activeSources.reduce((sum, streamId) => sum + (row[getSeriesKey(streamId)] ?? 0), 0);
  };
  const selectedValue = getSelectedMetricValue(current);
  const previousValue = getSelectedMetricValue(previous);
  const delta = previousValue ? ((selectedValue - previousValue) / previousValue) * 100 : 0;

  const totalHours = STREAMS.reduce((sum, item) => sum + getStreamHours(item.id, TODAY), 0);
  const currentMonthlyIncome = STREAMS.reduce((sum, item) => sum + item.currentMonthly, 0);
  const currentHourlyRate = totalHours ? currentMonthlyIncome / monthlyHours(totalHours) : 0;
  const earnedToDate = current.cumulative;
  const averageMonthlyIncome = earnedToDate / data.length;
  const timeData = STREAMS.map((stream) => ({
    name: stream.name,
    value: getStreamHours(stream.id, TODAY),
    color: stream.color,
  }));

  const kpis = [
    {
      label: "Monthly Income",
      value: formatCurrency(currentMonthlyIncome),
      change: "+28.6%",
      hint: `vs ${formatCurrency(700)} in Dec 2025`,
    },
    {
      label: "Earned Total",
      value: formatCurrency(earnedToDate),
      change: "+100%",
      hint: "since Nov 2024",
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

  const rows = [
    {
      id: "logistics",
      name: "Logistics",
      tag: "Dispatcher",
      current: 900,
      earned: data.reduce((sum, item) => sum + item.logistics_income, 0),
      hours: getLogisticsWeeklyHours(TODAY),
      hourly: 900 / monthlyHours(getLogisticsWeeklyHours(TODAY)),
      replacement: 100,
      color: "#2f7df6",
      bg: "bg-blue-500/30",
    },
    {
      id: "freelance",
      name: "Freelance",
      tag: "Software Engineer",
      current: 0,
      earned: 0,
      hours: 0,
      hourly: 0,
      replacement: 0,
      color: "#00d49f",
      bg: "bg-emerald-500/30",
    },
  ];

  const tickDates = data
    .filter((_, index) => index === 0 || index === data.length - 1 || index % 4 === 0)
    .map((item) => item.date);

  const toggleSource = (streamId) => {
    setSelectedSources((currentSources) => {
      if (currentSources.includes(streamId)) {
        const next = currentSources.filter((id) => id !== streamId);
        return next.length ? next : currentSources;
      }

      return [...currentSources, streamId];
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
        <header className="flex items-center justify-between">
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
                {STREAMS.map((stream) => (
                  <SourceToggle
                    key={stream.id}
                    stream={stream}
                    active={activeSources.includes(stream.id)}
                    onClick={() => toggleSource(stream.id)}
                  />
                ))}
              </div>
              <SegmentedControl
                value={metricKey}
                onChange={setMetricKey}
                options={METRICS.map((item) => ({ value: item.key, label: item.label }))}
              />
              <SegmentedControl
                value={viewMode}
                onChange={setViewMode}
                options={["Area", "Bar"]}
              />
            </div>
          </div>

          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === "Area" ? (
                <AreaChart data={data}>
                  <defs>
                    {activeSources.map((streamId) => {
                      const stream = STREAMS.find((item) => item.id === streamId);

                      return (
                        <linearGradient key={streamId} id={`grad-${streamId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={stream.color} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={stream.color} stopOpacity={0.05} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid stroke="var(--grid)" strokeDasharray="3 6" />
                  <XAxis dataKey="date" ticks={tickDates} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={{ stroke: "var(--grid)" }} tickLine={false} />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={{ stroke: "var(--grid)" }} tickLine={false} tickFormatter={(value) => metric.format === "currency" ? formatCompactCurrency(value) : formatValue(value, metric.format)} />
                  <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
                  {activeSources.map((streamId) => {
                    const stream = STREAMS.find((item) => item.id === streamId);

                    return (
                      <Area
                        key={streamId}
                        type="monotone"
                        dataKey={getSeriesKey(streamId)}
                        name={stream.name}
                        stroke={stream.color}
                        strokeWidth={2.4}
                        fill={`url(#grad-${streamId})`}
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
                  {activeSources.map((streamId) => {
                    const stream = STREAMS.find((item) => item.id === streamId);

                    return (
                      <Bar
                        key={streamId}
                        dataKey={getSeriesKey(streamId)}
                        name={stream.name}
                        fill={stream.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={34}
                      />
                    );
                  })}
                  {activeSources.map((streamId) => {
                    const stream = STREAMS.find((item) => item.id === streamId);

                    return (
                      <Line
                        key={`${streamId}-line`}
                        type="monotone"
                        dataKey={getSeriesKey(streamId)}
                        name={stream.name}
                        stroke={stream.color}
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
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${row.bg} text-xs font-semibold text-[var(--text)]`}>
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
      </div>
    </div>
  );
}

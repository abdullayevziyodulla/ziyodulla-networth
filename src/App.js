import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const METRICS = [
  { key: "mrr", label: "MRR", format: "currency" },
  { key: "subscribers", label: "Active Subscribers", format: "number" },
  { key: "churn", label: "Churn Rate", format: "percent" },
  { key: "arr", label: "ARR", format: "currency" },
  { key: "ttm", label: "TTM Revenue", format: "currency" },
];

const PRODUCTS = [
  { id: "jenni-ai", name: "jenni ai", color: "#22c55e", avatar: "bg-emerald-500/30" },
  { id: "ugc-stealth", name: "ugc-stealth", color: "#f59e0b", avatar: "bg-amber-500/30" },
  { id: "stealth-2", name: "Stealth-2", color: "#60a5fa", avatar: "bg-blue-500/30" },
  { id: "stealth-1", name: "Stealth-1", color: "#06b6d4", avatar: "bg-cyan-500/30" },
  { id: "tinywow", name: "TinyWow", color: "#38bdf8", avatar: "bg-sky-500/30" },
  { id: "citesure", name: "Citesure", color: "#14b8a6", avatar: "bg-teal-500/30" },
  { id: "scholarai", name: "ScholarAI", color: "#a855f7", avatar: "bg-fuchsia-500/30" },
  { id: "stealth-3", name: "Stealth-3", color: "#6366f1", avatar: "bg-indigo-500/30" },
  { id: "stealth-4", name: "Stealth-4", color: "#8b5cf6", avatar: "bg-violet-500/30" },
];

const ALL_PRODUCT = { id: "all", name: "All Products", color: "#3b82f6" };

const TABLE_ROWS = [
  {
    id: "stealth-2",
    name: "Stealth-2",
    mrr: 76602,
    subscribers: 2337,
    churn: 27.7,
    arr: 919224,
    ttm: 521758,
  },
  {
    id: "tinywow",
    name: "TinyWow",
    mrr: 22775,
    subscribers: 1855,
    churn: 21.4,
    arr: 273298,
    ttm: 182934,
  },
  {
    id: "stealth-3",
    name: "Stealth-3",
    mrr: 2969,
    subscribers: 348,
    churn: 11.4,
    arr: 35632,
    ttm: 45543,
  },
  {
    id: "jenni-ai",
    name: "jenni ai",
    mrr: 655274,
    subscribers: 47774,
    churn: 10.7,
    arr: 7863289,
    ttm: 7302441,
  },
  {
    id: "stealth-4",
    name: "Stealth-4",
    mrr: 1107,
    subscribers: 31,
    churn: 10.0,
    arr: 13284,
    ttm: 22238,
  },
  {
    id: "stealth-1",
    name: "Stealth-1",
    mrr: 68780,
    subscribers: 9196,
    churn: 9.3,
    arr: 825364,
    ttm: 1051949,
  },
  {
    id: "scholarai",
    name: "ScholarAI",
    mrr: 12101,
    subscribers: 937,
    churn: 8.3,
    arr: 145210,
    ttm: 201734,
  },
  {
    id: "citesure",
    name: "Citesure",
    mrr: 14412,
    subscribers: 531,
    churn: 6.3,
    arr: 172941,
    ttm: 126056,
  },
  {
    id: "ugc-stealth",
    name: "ugc-stealth",
    mrr: 167000,
    subscribers: null,
    churn: null,
    arr: 2004000,
    ttm: 269000,
  },
];

const METRIC_LABELS = {
  mrr: "MRR",
  subscribers: "Active Subscribers",
  churn: "Churn Rate",
  arr: "ARR",
  ttm: "TTM Revenue",
};


const formatCurrency = (value) =>
  `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;

const formatCompactCurrency = (value) =>
  `$${new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

const formatPercent = (value) => `${value.toFixed(1)}%`;

const formatMetricValue = (value, format) => {
  if (format === "currency") return formatCurrency(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
};


const useCountUp = (value, duration = 550) => {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const from = previous.current;
    const delta = value - from;

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = easeOut(progress);
      setDisplay(from + delta * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    previous.current = value;
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return display;
};

const buildDateRange = () => {
  const start = new Date(2021, 9, 1);
  const end = new Date(2025, 6, 1);
  const dates = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return dates;
};

const buildBaseShape = (count) => {
  const values = Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    const ramp = 1 / (1 + Math.exp(-10 * (t - 0.55)));
    const early = 0.09 * t;
    const late = 0.2 * Math.max(0, t - 0.75);
    const dip = 0.06 * Math.exp(-Math.pow((t - 0.78) / 0.06, 2));
    const wave = 0.02 * Math.sin(index * 0.5);
    return 0.05 + 0.83 * ramp + early + late - dip + wave;
  });

  const normalized = values.map((value) => value / values[values.length - 1]);
  const churnBase = values.map((value, index) => {
    const baseline = 12.2 + 1.5 * Math.sin(index * 0.35) - 1.8 * value;
    return Math.max(4.5, Math.min(28, baseline));
  });

  return { normalized, churnBase };
};

const buildSeriesByProduct = (count) => {
  const { normalized, churnBase } = buildBaseShape(count);
  const series = {};

  PRODUCTS.forEach((product) => {
    const row = TABLE_ROWS.find((item) => item.id === product.id);
    const subscribersTarget = row.subscribers ?? Math.round(row.mrr / 16);
    const churnTarget = row.churn ?? 9.4;
    const churnShift = churnTarget - churnBase[churnBase.length - 1];

    series[product.id] = {
      mrr: normalized.map((value) => value * row.mrr),
      arr: normalized.map((value) => value * row.arr),
      ttm: normalized.map((value) => value * row.ttm),
      subscribers: normalized.map((value) => value * subscribersTarget),
      churn: churnBase.map((value) => Math.max(2.5, Math.min(30, value + churnShift))),
    };
  });

  const aggregate = {
    mrr: Array(count).fill(0),
    arr: Array(count).fill(0),
    ttm: Array(count).fill(0),
    subscribers: Array(count).fill(0),
    churn: Array(count).fill(0),
  };

  for (let index = 0; index < count; index += 1) {
    let churnWeighted = 0;
    let churnWeight = 0;

    PRODUCTS.forEach((product) => {
      aggregate.mrr[index] += series[product.id].mrr[index];
      aggregate.arr[index] += series[product.id].arr[index];
      aggregate.ttm[index] += series[product.id].ttm[index];
      aggregate.subscribers[index] += series[product.id].subscribers[index];

      const subs = series[product.id].subscribers[index];
      churnWeighted += series[product.id].churn[index] * subs;
      churnWeight += subs;
    });

    aggregate.churn[index] = churnWeight ? churnWeighted / churnWeight : 0;
  }

  series[ALL_PRODUCT.id] = aggregate;
  return series;
};

const ProductMultiSelect = ({ label, options, selected, onToggle }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)] shadow-sm transition-colors duration-200 hover:border-[var(--accent)] ${
          open ? "ring-2 ring-blue-500/40" : ""
        }`}
      >
        <span>{label}</span>
        <span className="text-[var(--muted)]">▾</span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-56 rounded-lg border border-[var(--border-strong)] bg-[var(--panel-strong)] p-1 shadow-2xl">
          {options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onToggle(option.id)}
                className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  checked ? "bg-[var(--accent-soft)] text-[var(--text)]" : "text-[var(--muted)]"
                } hover:bg-[var(--panel-hover)]`}
              >
                <span>{option.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const SingleSelect = ({ value, options, onChange, widthClass = "w-40" }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={`relative ${widthClass}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--panel-strong)] px-3 py-2 text-sm text-[var(--text)] shadow-sm transition-colors duration-200 hover:border-[var(--accent)] ${
          open ? "ring-2 ring-blue-500/40" : ""
        }`}
      >
        <span>{value}</span>
        <span className="text-[var(--muted)]">▾</span>
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--panel-strong)] p-1 shadow-2xl">
          {options.map((option) => {
            const isActive = option === value;
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-[var(--accent-soft)] text-[var(--text)]" : "text-[var(--muted)]"
                } hover:bg-[var(--panel-hover)]`}
              >
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

const KpiCard = ({ label, value, change, compareText, format }) => {
  const animated = useCountUp(value, 600);
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 transition-colors duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--panel-hover)]">
      <div className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[var(--text)]">
        {formatMetricValue(animated, format)}
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className={isPositive ? "text-[var(--success)]" : "text-[var(--danger)]"}>
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </span>
        <span className="text-[var(--muted-2)]">{compareText}</span>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label, metricConfig }) => {
  if (!active || !payload || payload.length === 0) return null;

  const dateLabel = new Date(label).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const items = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const total = items.reduce((sum, item) => sum + (item.value ?? 0), 0);

  return (
    <div
      className="rounded-xl border p-3 text-xs shadow-xl"
      style={{
        background: "var(--tooltip-bg)",
        borderColor: "var(--tooltip-border)",
        color: "var(--text)",
      }}
    >
      <div className="mb-2 text-sm font-semibold">{dateLabel}</div>
      {items.length > 1 ? (
        <div className="mb-2 text-[var(--muted)]">
          Total: {formatMetricValue(total, metricConfig.format)}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: item.color }}
              />
              {item.name}
            </span>
            <span>{formatMetricValue(Number(item.value), metricConfig.format)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [metric, setMetric] = useState("ARR");
  const [viewMode, setViewMode] = useState("Aggregated");
  const [selectedProducts, setSelectedProducts] = useState([ALL_PRODUCT.id]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const dates = useMemo(() => buildDateRange(), []);
  const seriesByProduct = useMemo(() => buildSeriesByProduct(dates.length), [dates.length]);

  const metricConfig = METRICS.find((item) => item.label === metric);
  const metricKey = metricConfig.key;

  const isAllProductsSelected = selectedProducts.includes(ALL_PRODUCT.id);
  const isViewModeAvailable = isAllProductsSelected || selectedProducts.length > 1;
  const selectedProductIds = useMemo(() => {
    if (isAllProductsSelected) {
      return PRODUCTS.map((product) => product.id);
    }
    return selectedProducts.length ? selectedProducts : PRODUCTS.map((product) => product.id);
  }, [selectedProducts, isAllProductsSelected]);

  const effectiveViewMode = isViewModeAvailable ? viewMode : "Multi-Line";
  const isAggregatedView = effectiveViewMode === "Aggregated";

  const aggregateSeries = useMemo(() => {
    return dates.map((_, index) => {
      if (metricKey === "churn") {
        let churnWeighted = 0;
        let churnWeight = 0;
        selectedProductIds.forEach((productId) => {
          const churn = seriesByProduct[productId].churn[index];
          const subs = seriesByProduct[productId].subscribers[index];
          churnWeighted += churn * subs;
          churnWeight += subs;
        });
        return churnWeight ? churnWeighted / churnWeight : 0;
      }

      return selectedProductIds.reduce(
        (sum, productId) => sum + (seriesByProduct[productId][metricKey][index] ?? 0),
        0
      );
    });
  }, [dates, metricKey, selectedProductIds, seriesByProduct]);

  const chartSeriesIds = useMemo(() => {
    return isAggregatedView ? ["aggregate"] : selectedProductIds;
  }, [isAggregatedView, selectedProductIds]);

  const chartData = useMemo(() => {
    return dates.map((date, index) => {
      const row = { date };
      chartSeriesIds.forEach((productId) => {
        if (productId === "aggregate") {
          row.aggregate = aggregateSeries[index];
        } else {
          row[productId] = seriesByProduct[productId][metricKey][index];
        }
      });
      return row;
    });
  }, [dates, chartSeriesIds, aggregateSeries, seriesByProduct, metricKey]);

  const metricDomain = useMemo(() => {
    if (metricConfig.format === "percent") return [0, 30];

    let maxValue = 0;
    chartData.forEach((row) => {
      chartSeriesIds.forEach((productId) => {
        maxValue = Math.max(maxValue, row[productId] ?? 0);
      });
    });

    const niceMax = Math.ceil(maxValue / 100000) * 100000;
    return [0, niceMax || 1];
  }, [metricConfig.format, chartData, chartSeriesIds]);

  const aggregateValueAt = (index) => {
    if (metricKey === "churn") {
      let churnWeighted = 0;
      let churnWeight = 0;
      selectedProductIds.forEach((productId) => {
        const churn = seriesByProduct[productId][metricKey][index];
        const subs = seriesByProduct[productId].subscribers[index];
        churnWeighted += churn * subs;
        churnWeight += subs;
      });
      return churnWeight ? churnWeighted / churnWeight : 0;
    }

    return selectedProductIds.reduce(
      (sum, productId) => sum + (seriesByProduct[productId][metricKey][index] ?? 0),
      0
    );
  };

  const lastIndex = chartData.length - 1;
  const prevIndex = Math.max(0, lastIndex - 12);
  const currentValue = aggregateValueAt(lastIndex);
  const prevValue = aggregateValueAt(prevIndex);
  const changePct = prevValue ? ((currentValue - prevValue) / prevValue) * 100 : 0;
  const animatedHeaderValue = useCountUp(currentValue, 650);

  const activeProductId =
    selectedProducts.length === 1 && !selectedProducts.includes(ALL_PRODUCT.id)
      ? selectedProducts[0]
      : "";

  const productLabel = useMemo(() => {
    if (isAllProductsSelected) return ALL_PRODUCT.name;
    if (selectedProducts.length === 1) {
      const match = PRODUCTS.find((item) => item.id === selectedProducts[0]);
      return match ? match.name : "1 product";
    }
    return `${selectedProducts.length} products`;
  }, [selectedProducts, isAllProductsSelected]);

  const toggleProduct = (productId) => {
    setSelectedProducts((prev) => {
      if (productId === ALL_PRODUCT.id) {
        return prev.includes(ALL_PRODUCT.id) ? [ALL_PRODUCT.id] : [ALL_PRODUCT.id];
      }

      let next = prev.includes(ALL_PRODUCT.id) ? [] : [...prev];
      if (next.includes(productId)) {
        next = next.filter((item) => item !== productId);
      } else {
        next.push(productId);
      }

      return next.length ? next : [ALL_PRODUCT.id];
    });
  };

  const handleRowClick = (productId) => {
    setSelectedProducts([productId]);
  };

  const handleMetricCellClick = (event, productId, metricLabel) => {
    event.stopPropagation();
    setSelectedProducts([productId]);
    setMetric(metricLabel);
  };

  const tickDates = [
    "2021-10-01",
    "2022-07-01",
    "2023-04-01",
    "2024-01-01",
    "2024-10-01",
    "2025-07-01",
  ];

  const formatTick = (date) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const kpiData = useMemo(() => {
    const lastYearIndex = Math.max(0, lastIndex - 12);
    const metricAt = (metricKeyName, index) => seriesByProduct[ALL_PRODUCT.id][metricKeyName][index];

    const pct = (current, previous) => (previous ? ((current - previous) / previous) * 100 : 0);

    return [
      {
        label: "MRR",
        value: metricAt("mrr", lastIndex),
        change: pct(metricAt("mrr", lastIndex), metricAt("mrr", lastYearIndex)),
        compareText: `vs ${formatCompactCurrency(metricAt("mrr", lastYearIndex))} last year`,
        format: "currency",
      },
      {
        label: "Subscribers",
        value: metricAt("subscribers", lastIndex),
        change: pct(metricAt("subscribers", lastIndex), metricAt("subscribers", lastYearIndex)),
        compareText: `vs ${formatNumber(metricAt("subscribers", lastYearIndex))} last year`,
        format: "number",
      },
      {
        label: "Avg Churn",
        value: metricAt("churn", lastIndex),
        change: pct(metricAt("churn", lastIndex), metricAt("churn", lastYearIndex)),
        compareText: `vs ${formatPercent(metricAt("churn", lastYearIndex))} last year`,
        format: "percent",
      },
      {
        label: "TTM Revenue",
        value: metricAt("ttm", lastIndex),
        change: pct(metricAt("ttm", lastIndex), metricAt("ttm", lastYearIndex)),
        compareText: `vs ${formatCompactCurrency(metricAt("ttm", lastYearIndex))} last year`,
        format: "currency",
      },
    ];
  }, [seriesByProduct, lastIndex]);

  const seriesMeta = useMemo(() => {
    const map = {
      aggregate: { name: ALL_PRODUCT.name, color: ALL_PRODUCT.color },
      [ALL_PRODUCT.id]: { name: ALL_PRODUCT.name, color: ALL_PRODUCT.color },
    };

    PRODUCTS.forEach((product) => {
      map[product.id] = { name: product.name, color: product.color };
    });

    return map;
  }, []);


  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };


  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return [...TABLE_ROWS];

    const rows = [...TABLE_ROWS];
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      const aNull = aVal === null || aVal === undefined;
      const bNull = bVal === null || bVal === undefined;

      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;

      if (sortConfig.key === "name") {
        return aVal.localeCompare(bVal) * direction;
      }

      return (aVal - bVal) * direction;
    });

    return rows;
  }, [sortConfig]);

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
              <div className="text-lg font-semibold">OdamGroup</div>
              <div className="text-xs text-[var(--muted)]">Analytics Dashboard</div>
            </div>
          </div>
          <div className="text-xs text-[var(--muted)]">&nbsp;</div>
        </header>

        <section>
          <div className="mb-3 text-sm font-semibold text-[var(--text)]">Portfolio Overview</div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiData.map((card) => (
              <KpiCard key={card.label} {...card} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{metric}</div>
              <div className="mt-2 flex items-center gap-3">
                <div className="text-3xl font-semibold text-[var(--text)]">
                  {formatMetricValue(animatedHeaderValue, metricConfig.format)}
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-semibold transition-colors duration-200 ${
                    changePct >= 0
                      ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success)]"
                      : "border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]"
                  }`}
                >
                  {changePct >= 0 ? "+" : ""}
                  {changePct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ProductMultiSelect
                label={productLabel}
                options={[ALL_PRODUCT, ...PRODUCTS]}
                selected={selectedProducts}
                onToggle={toggleProduct}
              />
              <SingleSelect
                value={metric}
                options={METRICS.map((item) => item.label)}
                onChange={setMetric}
              />
              {isViewModeAvailable ? (
                <SingleSelect
                  value={viewMode}
                  options={["Aggregated", "Multi-Line"]}
                  onChange={setViewMode}
                  widthClass="w-36"
                />
              ) : null}
            </div>
          </div>

          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {chartSeriesIds.map((productId) => {
                    const color = seriesMeta[productId]?.color || ALL_PRODUCT.color;
                    return (
                      <linearGradient key={productId} id={`grad-${productId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid stroke="var(--grid)" strokeDasharray="3 6" />
                <XAxis
                  dataKey="date"
                  ticks={tickDates}
                  tickFormatter={formatTick}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--grid)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={metricDomain}
                  tick={{ fill: "var(--muted)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--grid)" }}
                  tickLine={false}
                  tickFormatter={(value) => {
                    if (metricConfig.format === "currency") {
                      return `$${(value / 1000000).toFixed(1)}M`;
                    }
                    if (metricConfig.format === "percent") {
                      return `${value.toFixed(0)}%`;
                    }
                    return formatNumber(value);
                  }}
                />
                <Tooltip
                  content={<CustomTooltip metricConfig={metricConfig} />}
                  cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }}
                />
                {chartSeriesIds.map((productId) => {
                  const color = seriesMeta[productId]?.color || ALL_PRODUCT.color;
                  const fillOpacity = isAggregatedView ? 0.22 : 0.12;

                  return (
                    <Area
                      key={productId}
                      type="monotone"
                      dataKey={productId}
                      name={seriesMeta[productId]?.name}
                      stroke={color}
                      strokeWidth={2.4}
                      fill={`url(#grad-${productId})`}
                      fillOpacity={fillOpacity}
                      dot={false}
                      isAnimationActive
                      animationDuration={420}
                      animationEasing="ease-in-out"
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="mb-4 text-sm font-semibold text-[var(--text)]">Product Performance</div>
          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--panel-strong)] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      Product
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("mrr")}
                      className="ml-auto flex items-center gap-2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      MRR $
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("subscribers")}
                      className="ml-auto flex items-center gap-2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      Subscribers
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("churn")}
                      className="ml-auto flex items-center gap-2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      Churn Rate
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("arr")}
                      className="ml-auto flex items-center gap-2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      ARR $
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => handleSort("ttm")}
                      className="ml-auto flex items-center gap-2 text-[var(--muted)] transition-colors hover:text-[var(--text)]"
                    >
                      TTM Revenue $
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => {
                  const meta = PRODUCTS.find((product) => product.id === row.id);
                  const initials = row.name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row.id)}
                      className={`cursor-pointer border-t border-[var(--border)] transition-colors duration-200 hover:bg-[var(--panel-hover)] ${
                        activeProductId === row.id ? "bg-[var(--panel-hover)]" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                              meta?.avatar || "bg-[var(--border-strong)]"
                            } text-xs font-semibold text-[var(--text)]`}
                          >
                            {initials || "P"}
                          </div>
                          <span className="text-[var(--text)]">{row.name}</span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[var(--success)] transition-colors hover:text-[var(--success)]"
                        onClick={(event) => handleMetricCellClick(event, row.id, METRIC_LABELS.mrr)}
                      >
                        {formatCurrency(row.mrr)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right transition-colors hover:text-[var(--success)] ${
                          row.subscribers ? "text-[var(--success)]" : "text-[var(--muted-2)]"
                        }`}
                        onClick={(event) =>
                          handleMetricCellClick(event, row.id, METRIC_LABELS.subscribers)
                        }
                      >
                        {row.subscribers ? formatNumber(row.subscribers) : "N/A"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right transition-colors hover:text-[var(--success)] ${
                          row.churn !== null ? "text-[var(--success)]" : "text-[var(--muted-2)]"
                        }`}
                        onClick={(event) => handleMetricCellClick(event, row.id, METRIC_LABELS.churn)}
                      >
                        {row.churn !== null ? `${row.churn.toFixed(1)}%` : "N/A"}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[var(--success)] transition-colors hover:text-[var(--success)]"
                        onClick={(event) => handleMetricCellClick(event, row.id, METRIC_LABELS.arr)}
                      >
                        {formatCurrency(row.arr)}
                      </td>
                      <td
                        className="px-4 py-3 text-right text-[var(--success)] transition-colors hover:text-[var(--success)]"
                        onClick={(event) => handleMetricCellClick(event, row.id, METRIC_LABELS.ttm)}
                      >
                        {formatCurrency(row.ttm)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

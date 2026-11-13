import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { fetchProductHistory } from '../services/api.js';

const currency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const pickPrice = (product, key) => Number(
  product?.[`${key}Price`] ?? product?.[`${key}_price`] ??
  product?.competitors?.[key]?.price ?? product?.price
);

function makeFallback(product) {
  const bases = {
    gem: pickPrice(product, 'gem'),
    amazon: pickPrice(product, 'amazon'),
    flipkart: pickPrice(product, 'flipkart'),
  };
  const valid = Object.values(bases).filter((v) => Number.isFinite(v) && v > 0);
  const fallbackBase = valid[0] || 1000;
  Object.keys(bases).forEach((key) => { if (!Number.isFinite(bases[key]) || bases[key] <= 0) bases[key] = fallbackBase; });
  return Array.from({ length: 6 }, (_, index) => {
    const daysAgo = 30 - index * 6;
    const wave = [0.035, -0.018, 0.012, -0.025, 0.008, 0][index];
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return {
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      gem: Math.round(bases.gem * (1 + wave)),
      amazon: Math.round(bases.amazon * (1 + wave * 0.8)),
      flipkart: Math.round(bases.flipkart * (1 - wave * 0.6)),
    };
  });
}

function normalizeHistory(payload, product) {
  const records = Array.isArray(payload) ? payload : payload?.history ?? payload?.data ?? payload?.prices ?? [];
  if (!Array.isArray(records) || records.length < 2) return makeFallback(product);
  const rows = records.map((record, index) => {
    const rawDate = record.date ?? record.recorded_at ?? record.createdAt ?? record.timestamp;
    const date = rawDate ? new Date(rawDate) : null;
    return {
      date: date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        : `Point ${index + 1}`,
      gem: Number(record.gem ?? record.gemPrice ?? record.gem_price ?? record.price),
      amazon: Number(record.amazon ?? record.amazonPrice ?? record.amazon_price),
      flipkart: Number(record.flipkart ?? record.flipkartPrice ?? record.flipkart_price),
    };
  });
  return rows.map((row) => ({
    ...row,
    amazon: Number.isFinite(row.amazon) ? row.amazon : null,
    flipkart: Number.isFinite(row.flipkart) ? row.flipkart : null,
    gem: Number.isFinite(row.gem) ? row.gem : null,
  })).filter((row) => row.gem !== null || row.amazon !== null || row.flipkart !== null);
}

export default function PriceChartPlaceholder({ productId, historyData, product }) {
  const [history, setHistory] = useState(historyData);
  const [loading, setLoading] = useState(!historyData);
  useEffect(() => {
    if (historyData) { setHistory(historyData); setLoading(false); return; }
    let active = true;
    setLoading(true);
    if (productId == null) {
      setHistory(makeFallback(product));
      setLoading(false);
      return () => { active = false; };
    }
    fetchProductHistory(productId)
      .then((data) => { if (active) setHistory(data); })
      .catch(() => { if (active) setHistory(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId, historyData, product]);

  const data = useMemo(() => normalizeHistory(history, product), [history, product]);
  const gemValues = data.map((item) => item.gem).filter((value) => Number.isFinite(value));
  const lowest = gemValues.length ? Math.min(...gemValues) : null;
  const volatility = gemValues.length > 1
    ? ((Math.max(...gemValues) - Math.min(...gemValues)) / (gemValues.reduce((a, b) => a + b, 0) / gemValues.length)) * 100
    : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
          30-Day Lowest Price: {lowest == null ? '—' : currency(lowest)}
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
          GeM Price Volatility: {volatility.toFixed(1)}%
        </div>
      </div>
      {loading && <p className="mb-2 text-xs text-slate-400">Loading historical prices…</p>}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} tick={{ fontSize: 11 }} width={75} />
            <Tooltip formatter={(value) => currency(value)} labelStyle={{ fontWeight: 700 }} />
            <Legend />
            <Line type="monotone" dataKey="gem" name="GeM" stroke="#2563eb" strokeWidth={3} dot={false} connectNulls />
            <Line type="monotone" dataKey="amazon" name="Amazon" stroke="#d97706" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
            <Line type="monotone" dataKey="flipkart" name="Flipkart" stroke="#4f46e5" strokeWidth={2} dot={false} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Historical data is illustrative when fewer than two API records are available.</p>
    </section>
  );
}

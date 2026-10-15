export function generateMockData(items) {
  if (!Array.isArray(items)) throw new Error('Invalid sentiment data.');
  const days = new Map();
  for (const item of items) {
    if (!item || item.value === '' || item.timestamp === '' || item.value == null || item.timestamp == null) continue;
    const score = Number(item.value);
    const timestamp = Number(item.timestamp);
    const date = new Date(timestamp * 1000);
    if (!Number.isFinite(timestamp) || !Number.isFinite(date.getTime()) || !Number.isFinite(score) || score < 0 || score > 100) continue;
    days.set(timestamp, {score, date: date.toISOString().slice(0, 10), classification: item.value_classification});
  }
  const records = [...days.entries()].sort(([a], [b]) => a - b);
  if (!records.length) throw new Error('No valid sentiment readings were returned.');
  return records.map(([, item], index) => ({
    date: item.date,
    fearGreedScore: item.score,
    classification: item.classification,
    btcPrice: Math.round(45000 * (item.score / 200 + 0.75) + Math.sin(index / 5) * 2000),
  }));
}

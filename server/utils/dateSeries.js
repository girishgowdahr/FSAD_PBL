export function buildDateSeries(aggregationResults, numDays) {
  const clickMap = new Map();
  if (Array.isArray(aggregationResults)) {
    for (const item of aggregationResults) {
      if (item && item._id) {
        clickMap.set(item._id, item.count || item.clicks || 0);
      }
    }
  }

  const series = [];
  const now = new Date();

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    series.push({
      date: dateStr,
      clicks: clickMap.get(dateStr) || 0,
    });
  }

  return series;
}

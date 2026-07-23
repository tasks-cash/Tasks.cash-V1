const counters = new Map<string, number>();
export const distributionMetric = (name: string, amount = 1) => counters.set(name, (counters.get(name) ?? 0) + amount);
export const distributionMetrics = () => Object.fromEntries(counters);
export const resetDistributionMetricsForTests = () => counters.clear();

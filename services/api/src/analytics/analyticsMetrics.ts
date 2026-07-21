/**
 * In-memory analytics metrics for diagnostics.
 */

export interface AnalyticsMetricsSnapshot {
  eventsIngested: number;
  eventsRejectedConsent: number;
  eventsRejectedValidation: number;
  sessionsStarted: number;
  sessionsEnded: number;
  identitiesResolved: number;
  attributionsCaptured: number;
  conversionsRecorded: number;
  rateLimited: number;
}

const m: AnalyticsMetricsSnapshot = {
  eventsIngested: 0,
  eventsRejectedConsent: 0,
  eventsRejectedValidation: 0,
  sessionsStarted: 0,
  sessionsEnded: 0,
  identitiesResolved: 0,
  attributionsCaptured: 0,
  conversionsRecorded: 0,
  rateLimited: 0,
};

export const analyticsMetrics = {
  ingested: () => {
    m.eventsIngested += 1;
  },
  consentRejected: () => {
    m.eventsRejectedConsent += 1;
  },
  validationRejected: () => {
    m.eventsRejectedValidation += 1;
  },
  sessionStart: () => {
    m.sessionsStarted += 1;
  },
  sessionEnd: () => {
    m.sessionsEnded += 1;
  },
  identityResolved: () => {
    m.identitiesResolved += 1;
  },
  attribution: () => {
    m.attributionsCaptured += 1;
  },
  conversion: () => {
    m.conversionsRecorded += 1;
  },
  rateLimited: () => {
    m.rateLimited += 1;
  },
  snapshot(): AnalyticsMetricsSnapshot {
    return { ...m };
  },
  resetForTests(): void {
    for (const k of Object.keys(m) as Array<keyof AnalyticsMetricsSnapshot>) {
      m[k] = 0;
    }
  },
};

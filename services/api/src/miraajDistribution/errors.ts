export class MiraajDistributionError extends Error {
  constructor(public readonly code: string, message: string, public readonly retryable = false, public readonly status = 502) {
    super(message); this.name = "MiraajDistributionError";
  }
}

/**
 * Campaign Intelligence domain event type strings.
 */

export const EVENT_TYPES_CI = {
  CAMPAIGN_CREATED: "campaign.intel.created.v1",
  CAMPAIGN_UPDATED: "campaign.intel.updated.v1",
  CAMPAIGN_ARCHIVED: "campaign.intel.archived.v1",
  STRATEGY_GENERATION_REQUESTED: "campaign.intel.strategy_generation_requested.v1",
  STRATEGY_GENERATION_STARTED: "campaign.intel.strategy_generation_started.v1",
  STRATEGY_GENERATED: "campaign.intel.strategy_generated.v1",
  PACKAGE_GENERATION_REQUESTED: "campaign.intel.package_generation_requested.v1",
  PACKAGE_GENERATION_STARTED: "campaign.intel.package_generation_started.v1",
  PACKAGE_GENERATED: "campaign.intel.package_generated.v1",
  GENERATION_PROGRESSED: "campaign.intel.generation_progressed.v1",
  GENERATION_CANCEL_REQUESTED: "campaign.intel.generation_cancel_requested.v1",
  GENERATION_CANCELLED: "campaign.intel.generation_cancelled.v1",
  GENERATION_FAILED: "campaign.intel.generation_failed.v1",
  VALIDATION_FAILED: "campaign.intel.validation_failed.v1",
  ASSET_GENERATED: "campaign.intel.asset_generated.v1",
} as const;

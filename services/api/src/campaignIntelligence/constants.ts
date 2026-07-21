/** Campaign Intelligence — shared enums and pipeline stage identifiers. */

export const INTEL_CAMPAIGN_STATUSES = [
  "draft",
  "analyzing",
  "strategy_ready",
  "generating",
  "ready",
  "partially_ready",
  "failed",
  "paused",
  "archived",
] as const;
export type IntelCampaignStatus = (typeof INTEL_CAMPAIGN_STATUSES)[number];

export const GENERATION_STATUSES = [
  "idle",
  "queued",
  "running",
  "cancelling",
  "cancelled",
  "completed",
  "failed",
  "dead_lettered",
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const GENERATION_RUN_TYPES = ["strategy", "package", "regenerate"] as const;
export type GenerationRunType = (typeof GENERATION_RUN_TYPES)[number];

export const FUNNEL_STAGES = [
  "awareness",
  "consideration",
  "conversion",
  "retention",
  "loyalty",
] as const;
export type FunnelStage = (typeof FUNNEL_STAGES)[number];

export const CHANNELS = [
  "facebook",
  "instagram_post",
  "instagram_story",
  "instagram_reel",
  "tiktok",
  "youtube_shorts",
  "youtube",
  "email",
  "landing_page",
  "push_notification",
] as const;
export type Channel = (typeof CHANNELS)[number];

export const ASSET_TYPES = [
  "social_post",
  "short_video_script",
  "long_video_script",
  "ad_copy",
  "image_ad_copy",
  "carousel",
  "story",
  "reel",
  "tiktok",
  "youtube_short",
  "youtube_video",
  "email_subject",
  "email_body",
  "landing_page_copy",
  "push_notification",
  "sms",
  "blog_outline",
  "blog_article",
  "seo_metadata",
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export const LANGUAGES = ["en", "ar", "fr"] as const;
export type CampaignLanguage = (typeof LANGUAGES)[number];

export const LOCALES = ["en-US", "ar-SA", "fr-FR"] as const;
export type CampaignLocale = (typeof LOCALES)[number];

export const VARIANTS = ["conservative", "balanced", "bold"] as const;
export type AssetVariant = (typeof VARIANTS)[number];

export const VALIDATION_STATUSES = ["pending", "passed", "failed", "skipped"] as const;
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

/** Resumable BullMQ pipeline stages (Phase 8 spec §3). */
export const PIPELINE_STAGES = [
  "validate_campaign_brief",
  "load_tenant_context",
  "load_brand_profile",
  "load_audience_profile",
  "normalize_campaign_inputs",
  "analyze_campaign_objective",
  "analyze_audience",
  "create_positioning",
  "generate_message_pillars",
  "create_channel_strategy",
  "create_language_strategy",
  "build_content_plan",
  "generate_source_language_assets",
  "localize_assets",
  "run_quality_validation",
  "run_compliance_validation",
  "score_assets",
  "persist_strategy_version",
  "persist_package_version",
  "publish_domain_events",
  "update_campaign_status",
  "finalize_generation_run",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const STRATEGY_VERSION_STATUSES = ["draft", "completed", "failed"] as const;
export type StrategyVersionStatus = (typeof STRATEGY_VERSION_STATUSES)[number];

export const PACKAGE_VERSION_STATUSES = [
  "generating",
  "ready",
  "partially_ready",
  "validation_failed",
  "generation_failed",
] as const;
export type PackageVersionStatus = (typeof PACKAGE_VERSION_STATUSES)[number];

export const LOCALIZATION_METHODS = [
  "generated_direct",
  "localized_from_source",
  "manual",
] as const;
export type LocalizationMethod = (typeof LOCALIZATION_METHODS)[number];

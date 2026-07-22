import type { MiraajCapability } from "../../miraaj/contracts";
import { MiraajIntegrationError } from "../../miraaj/errors";
import { miraajExecutionGateway } from "../../miraaj/gateway";
import { complianceOutputSchema, contentOutputSchema, localizationOutputSchema, qualityOutputSchema, strategyOutputSchema } from "./outputSchemas";
import { ProviderCancelledError, ProviderPermanentError, ProviderRetryableError, type CampaignIntelligenceProvider } from "./types";

async function execute(capability:MiraajCapability,input:Record<string,unknown>,signal?:AbortSignal):Promise<Record<string,unknown>>{
  const tenantId=String(input.tenantId??""); if(!tenantId) throw new ProviderPermanentError("Campaign tenant context is missing");
  try {
    return await miraajExecutionGateway.execute({tenantId,capability,payload:input,signal});
  } catch(err) { if(err instanceof ProviderCancelledError) throw err; if(err instanceof MiraajIntegrationError){if(err.code==="timeout"&&signal?.aborted)throw new ProviderCancelledError(); if(err.retryable)throw new ProviderRetryableError(err.message); throw new ProviderPermanentError(err.message);} throw err; }
}
export class MiraajCampaignIntelligenceProvider implements CampaignIntelligenceProvider {
  readonly name="miraaj";
  async generateStrategy(input:Parameters<CampaignIntelligenceProvider["generateStrategy"]>[0]){return strategyOutputSchema.parse(await execute("campaign.strategy.generate",{...input,signal:undefined} as Record<string,unknown>,input.signal));}
  async generateAsset(input:Parameters<CampaignIntelligenceProvider["generateAsset"]>[0]){return contentOutputSchema.parse(await execute("campaign.copy.generate",{...input,signal:undefined} as Record<string,unknown>,input.signal));}
  async localize(input:Parameters<CampaignIntelligenceProvider["localize"]>[0]){return localizationOutputSchema.parse(await execute("campaign.localize",{...input,signal:undefined} as Record<string,unknown>,input.signal));}
  async evaluateQuality(input:Parameters<CampaignIntelligenceProvider["evaluateQuality"]>[0]){return qualityOutputSchema.parse(await execute("campaign.quality.review",{...input,signal:undefined} as Record<string,unknown>,input.signal));}
  async evaluateCompliance(input:Parameters<CampaignIntelligenceProvider["evaluateCompliance"]>[0]){return complianceOutputSchema.parse(await execute("campaign.compliance.review",{...input,signal:undefined} as Record<string,unknown>,input.signal));}
}

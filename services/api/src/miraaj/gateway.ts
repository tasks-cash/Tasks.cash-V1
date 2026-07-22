import { randomUUID } from "crypto";
import type { MiraajCapability } from "./contracts";
import { fingerprint,miraajAiClient } from "./client";
import { MiraajIntegrationError } from "./errors";
import { createCanonicalExecution,cancelExecution } from "./service";
import { MiraajExecution } from "./models";

export interface MiraajExecutionGateway {
  execute(input:{tenantId:string;capability:MiraajCapability;payload:Record<string,unknown>;signal?:AbortSignal}):Promise<Record<string,unknown>>;
  getServiceHealth(tenantId:string):Promise<{status:string;apiVersion:string}>;
}
export class HttpMiraajExecutionGateway implements MiraajExecutionGateway {
  async execute(input:{tenantId:string;capability:MiraajCapability;payload:Record<string,unknown>;signal?:AbortSignal}){
    const idempotencyKey=`gateway:${input.capability}:${fingerprint(input.payload)}`;const correlationId=randomUUID();
    const canonical=await createCanonicalExecution({tenantId:input.tenantId,idempotencyKey,correlationId,request:{capability:input.capability,input:input.payload,policy:{quality:"high",structuredOutputRequired:true}}});
    const abort=()=>{void cancelExecution(input.tenantId,canonical.execution.executionId,"system");};input.signal?.addEventListener("abort",abort,{once:true});
    try{while(true){const execution=await MiraajExecution.findOne({tenantId:input.tenantId,executionId:canonical.execution.executionId}).lean();if(!execution)throw new MiraajIntegrationError("execution_failed","Canonical Miraaj execution disappeared",false,500);if(execution.localStatus==="succeeded"){const result=execution.resultReference;if(!result||typeof result!=="object"||!("output" in result)||!result.output||typeof result.output!=="object")throw new MiraajIntegrationError("invalid_response","Miraaj result reference is invalid",false,502);return result.output as Record<string,unknown>;}if(["failed","cancelled","timed_out"].includes(execution.localStatus))throw new MiraajIntegrationError("execution_failed",execution.errorMessageSafe??`Miraaj execution ${execution.localStatus}`,false,502,execution.externalTraceId);await new Promise<void>((resolve,reject)=>{const timer=setTimeout(resolve,750);input.signal?.addEventListener("abort",()=>{clearTimeout(timer);reject(new MiraajIntegrationError("timeout","Execution cancelled",false,499));},{once:true});});}}finally{input.signal?.removeEventListener("abort",abort);}
  }
  async getServiceHealth(tenantId:string){return miraajAiClient.health({tenantId,correlationId:randomUUID()});}
}
export const miraajExecutionGateway:MiraajExecutionGateway=new HttpMiraajExecutionGateway();

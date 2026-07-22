import { Router } from "express";
import { webhookEventSchema } from "../miraaj/contracts";
import { auditWebhookRejection, processWebhook, verifyWebhookSignature } from "../miraaj/service";
import { getMiraajConfig } from "../miraaj/config";
import { MiraajIntegrationError } from "../miraaj/errors";
import { miraajRedis } from "../miraaj/redis";
const router=Router();
router.post("/v1/webhooks",async(req,res)=>{let tenantId:string|undefined,eventId:string|undefined;try{const limit=await miraajRedis.rateLimit("webhook",req.ip??"unknown",getMiraajConfig().webhookRateLimit);if(!limit.allowed){res.status(429).json({success:false,error:"Rate limit exceeded"});return;}const raw=Buffer.isBuffer(req.body)?req.body:Buffer.from("");if(raw.length===0||raw.length>getMiraajConfig().maxRequestBytes){res.status(413).json({success:false,error:"Invalid webhook payload size"});return;}verifyWebhookSignature(raw,{signature:req.header("x-miraaj-signature")??undefined,timestamp:req.header("x-miraaj-timestamp")??undefined});const event=webhookEventSchema.parse(JSON.parse(raw.toString("utf8")));tenantId=event.tenantId;eventId=event.eventId;const result=await processWebhook(event,raw);res.status(result.duplicate?200:202).json({success:true,data:result});}catch(err){const reason=err instanceof MiraajIntegrationError?err.code:"invalid_payload";await auditWebhookRejection({tenantId,eventId,reason,correlationId:req.header("x-correlation-id")??undefined});const status=err instanceof MiraajIntegrationError?err.status:400;res.status(status).json({success:false,error:err instanceof MiraajIntegrationError?err.message:"Invalid webhook payload"});}});
export default router;

import { z } from "zod";

export const detailingSchema = z.object({
  revision: z.string().max(20).default("R00"),
  notes: z.string().max(2000).default(""),
  supportHookProjection: z.number().finite().min(0).max(6000).default(250),
  supportHookTail: z.number().finite().min(0).max(6000).default(200),
  stitchEmbedment: z.number().finite().min(0).max(6000).default(200),
  secondLoopDiameter: z.number().finite().min(0).max(3000).default(0),
  mounting: z.boolean().default(true),
  mountingDiameter: z.number().finite().min(5).max(16).default(6.3),
  pins: z.number().int().min(0).max(20).default(0),
  pinDiameter: z.number().finite().min(6.3).max(40).default(16),
  pinEmbedment: z.number().finite().min(0).max(3000).default(200),
  pinProjection: z.number().finite().min(0).max(3000).default(150),
  pinSpacing: z.number().finite().min(0).max(6000).default(0),
  pinCenterOffset: z.number().finite().min(-3000).max(3000).default(0),
});
export type DetailingSettings = z.infer<typeof detailingSchema>;
export const defaultDetailing = () => detailingSchema.parse({});

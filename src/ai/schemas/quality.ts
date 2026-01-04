import { z } from 'zod';

export const QualityControlSchema = z.object({
    quality_level: z.enum(['alta', 'moderada', 'baja']),
    artifacts_detected: z.array(
        z.enum(['desenfoque', 'pliegues', 'burbujas', 'problemas_tincion'])
    ),
    review_recommended: z.boolean(),
});

export type QualityControl = z.infer<typeof QualityControlSchema>;

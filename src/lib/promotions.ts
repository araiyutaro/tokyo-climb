import { z } from 'zod';
import promotionsJson from '../../data/promotions.json';

export const PromotionPlacementSchema = z.enum(['infeed', 'detail', 'gear']);
export type PromotionPlacement = z.infer<typeof PromotionPlacementSchema>;

export const PromotionCategorySchema = z.enum([
  'chalk',
  'brush',
  'tape',
  'shoes',
  'care',
  'sponsor',
]);
export type PromotionCategory = z.infer<typeof PromotionCategorySchema>;

export const PromotionItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  category: PromotionCategorySchema,
  badge: z.string().min(1),
  description: z.string().min(1),
  tip: z.string().optional(),
  placement: z.array(PromotionPlacementSchema).min(1),
  affiliateUrl: z.string().url().optional(),
  ctaLabel: z.string().optional(),
  startsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endsAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  active: z.boolean(),
});

export type PromotionItem = z.infer<typeof PromotionItemSchema>;

export const PromotionsFileSchema = z.object({
  updatedAt: z.string().min(1),
  items: z.array(PromotionItemSchema),
});

export function loadPromotions(): PromotionItem[] {
  const parsed = PromotionsFileSchema.safeParse(promotionsJson);
  if (!parsed.success) return [];
  return parsed.data.items;
}

export function getActivePromotions(
  items: PromotionItem[],
  placement: PromotionPlacement,
  dateStr: string,
): PromotionItem[] {
  return items.filter((item) => {
    if (!item.active) return false;
    if (!item.placement.includes(placement)) return false;
    if (item.startsAt && dateStr < item.startsAt) return false;
    if (item.endsAt && dateStr > item.endsAt) return false;

    // On infeed and gym detail slots, only render items with a real affiliate/sponsor URL
    // so there is zero promotional noise until URLs are configured.
    if (placement !== 'gear' && !item.affiliateUrl) {
      return false;
    }

    return true;
  });
}

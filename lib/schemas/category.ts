import { z } from "zod";

/** id + name — enough to populate a category select/filter. */
export const categoryOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type CategoryOption = z.infer<typeof categoryOptionSchema>;

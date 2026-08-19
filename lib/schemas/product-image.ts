import { z } from "zod";

/** A product_images row as read back from the database. */
export const productImageRowSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  storage_path: z.string(),
  is_primary: z.boolean(),
  sort_order: z.number(),
});
export type ProductImageRow = z.infer<typeof productImageRowSchema>;

/** What the uploader and the form actually render — a row plus its public URL. */
export type UploadedImage = {
  id: string;
  storagePath: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

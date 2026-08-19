import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

import { AdminAuthError, requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles one image upload for one product. A Route Handler, not a Server
 * Action: the uploader needs real byte-level progress per file, and that
 * only exists via XMLHttpRequest's upload.onprogress against a plain HTTP
 * endpoint — a Server Action's dispatch mechanism doesn't expose it. Kept
 * outside /admin/* for the same reason as price-preview: an expired session
 * mid-upload should 401 as JSON, not have the proxy turn the request into a
 * redirect. requireAdmin() below is the real gate either way.
 */

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }

  const { id: productId } = await context.params;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo was received." }, { status: 400 });
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    return NextResponse.json({ error: "Only JPG or PNG photos are allowed." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Photos must be 5MB or smaller." }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const { count: existingCount, error: countError } = await supabase
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);
    if (countError) {
      return NextResponse.json({ error: `Could not check existing photos: ${countError.message}` }, { status: 500 });
    }

    const storagePath = `${productId}/${randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: `Could not upload this photo: ${uploadError.message}` }, { status: 500 });
    }

    const isFirstImage = (existingCount ?? 0) === 0;
    const { data: imageRow, error: insertError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        storage_path: storagePath,
        is_primary: isFirstImage,
        sort_order: existingCount ?? 0,
      })
      .select("id, storage_path, is_primary, sort_order")
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `The photo uploaded but couldn't be saved: ${insertError.message}` },
        { status: 500 },
      );
    }

    const { data: publicUrl } = supabase.storage.from("product-images").getPublicUrl(imageRow.storage_path);

    return NextResponse.json({
      image: {
        id: imageRow.id,
        storagePath: imageRow.storage_path,
        url: publicUrl.publicUrl,
        isPrimary: imageRow.is_primary,
        sortOrder: imageRow.sort_order,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not upload this photo.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

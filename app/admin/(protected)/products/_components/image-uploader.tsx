"use client";

import { useRef, useState } from "react";

import type { UploadedImage } from "@/lib/schemas/product-image";
import { deleteProductImage, ensureDraftProduct, reorderProductImages, setPrimaryImage } from "../actions";

const MAX_IMAGES = 8;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

type ImageItem =
  | { kind: "uploaded"; image: UploadedImage }
  | { kind: "pending"; localId: string; fileName: string; progress: number; file: File }
  | { kind: "error"; localId: string; fileName: string; file: File; message: string };

function itemKey(item: ImageItem): string {
  return item.kind === "uploaded" ? item.image.id : item.localId;
}

export function ImageUploader({
  productId,
  categoryId,
  productName,
  initialImages,
  onProductCreated,
}: {
  productId: string | null;
  categoryId: string;
  productName: string;
  initialImages: UploadedImage[];
  onProductCreated: (id: string) => void;
}) {
  const [items, setItems] = useState<ImageItem[]>(() =>
    initialImages.map((image): ImageItem => ({ kind: "uploaded", image })),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const draftPromiseRef = useRef<Promise<string> | null>(null);

  const noCategory = !categoryId;
  const atCapacity = items.length >= MAX_IMAGES;
  const isDisabled = noCategory || atCapacity;
  const remainingSlots = Math.max(0, MAX_IMAGES - items.length);

  /** Creates the draft product row on first use, or returns the existing id. Memoised so a batch of files only creates one row. */
  async function ensureProductId(): Promise<string> {
    if (productId) return productId;
    if (draftPromiseRef.current) return draftPromiseRef.current;

    const promise = (async () => {
      const result = await ensureDraftProduct({ name: productName, categoryId });
      if ("error" in result) throw new Error(result.error);
      onProductCreated(result.id);
      return result.id;
    })();

    draftPromiseRef.current = promise;
    try {
      return await promise;
    } catch (error) {
      draftPromiseRef.current = null;
      throw error;
    }
  }

  function startUpload(targetProductId: string, localId: string, file: File) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/admin/products/${targetProductId}/images`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      setItems((prev) =>
        prev.map((item) => (item.kind === "pending" && item.localId === localId ? { ...item, progress } : item)),
      );
    };

    xhr.onload = () => {
      let body: { image?: UploadedImage; error?: string } | null = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && body?.image) {
        const image = body.image;
        setItems((prev) =>
          prev.map((item): ImageItem =>
            item.kind === "pending" && item.localId === localId ? { kind: "uploaded", image } : item,
          ),
        );
      } else {
        const errorMessage = body?.error ?? "Upload failed.";
        setItems((prev) =>
          prev.map((item): ImageItem =>
            item.kind === "pending" && item.localId === localId
              ? { kind: "error", localId, fileName: item.fileName, file: item.file, message: errorMessage }
              : item,
          ),
        );
      }
    };

    xhr.onerror = () => {
      setItems((prev) =>
        prev.map((item): ImageItem =>
          item.kind === "pending" && item.localId === localId
            ? {
                kind: "error",
                localId,
                fileName: item.fileName,
                file: item.file,
                message: "Could not reach the server.",
              }
            : item,
        ),
      );
    };

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const rejections: string[] = [];
    const accepted: File[] = [];

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejections.push(`${file.name}: only JPG or PNG photos are allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejections.push(`${file.name}: photos must be 5MB or smaller.`);
        continue;
      }
      accepted.push(file);
    }

    const slotsLeft = Math.max(0, MAX_IMAGES - items.length);
    const toUpload = accepted.slice(0, slotsLeft);
    if (accepted.length > toUpload.length) {
      rejections.push(
        `Only ${MAX_IMAGES} photos per product — ${accepted.length - toUpload.length} skipped.`,
      );
    }

    setMessage(rejections.length > 0 ? rejections.join(" ") : null);

    if (toUpload.length === 0) return;

    let resolvedProductId: string;
    try {
      resolvedProductId = await ensureProductId();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start this product.");
      return;
    }

    for (const file of toUpload) {
      const localId = crypto.randomUUID();
      setItems((prev) => [...prev, { kind: "pending", localId, fileName: file.name, progress: 0, file }]);
      startUpload(resolvedProductId, localId, file);
    }
  }

  function retryUpload(item: Extract<ImageItem, { kind: "error" }>) {
    setItems((prev) =>
      prev.map((i): ImageItem =>
        i.kind === "error" && i.localId === item.localId
          ? { kind: "pending", localId: item.localId, fileName: item.fileName, progress: 0, file: item.file }
          : i,
      ),
    );

    ensureProductId()
      .then((id) => startUpload(id, item.localId, item.file))
      .catch((error) => {
        setItems((prev) =>
          prev.map((i): ImageItem =>
            i.kind === "pending" && i.localId === item.localId
              ? {
                  kind: "error",
                  localId: item.localId,
                  fileName: item.fileName,
                  file: item.file,
                  message: error instanceof Error ? error.message : "Could not start this product.",
                }
              : i,
          ),
        );
      });
  }

  function removeLocalItem(localId: string) {
    setItems((prev) => prev.filter((item) => item.kind === "uploaded" || item.localId !== localId));
  }

  async function handleDelete(image: UploadedImage) {
    const previous = items;
    setItems((prev) => prev.filter((item) => !(item.kind === "uploaded" && item.image.id === image.id)));

    const result = await deleteProductImage({ imageId: image.id, storagePath: image.storagePath });
    if ("error" in result) {
      setItems(previous);
      setMessage(result.error);
    }
  }

  async function handleSetPrimary(image: UploadedImage) {
    if (!productId || image.isPrimary) return;

    const previous = items;
    setItems((prev) =>
      prev.map((item): ImageItem =>
        item.kind === "uploaded"
          ? { kind: "uploaded", image: { ...item.image, isPrimary: item.image.id === image.id } }
          : item,
      ),
    );

    const result = await setPrimaryImage({ productId, imageId: image.id });
    if ("error" in result) {
      setItems(previous);
      setMessage(result.error);
    }
  }

  function handleDrop(dropIndex: number) {
    const fromIndex = dragIndexRef.current;
    dragIndexRef.current = null;
    if (fromIndex === null || fromIndex === dropIndex) return;

    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(dropIndex, 0, moved);
    setItems(next);

    if (productId) {
      const orderedImageIds = next.filter((item) => item.kind === "uploaded").map((item) => item.image.id);
      reorderProductImages({ productId, orderedImageIds }).then((result) => {
        if ("error" in result) setMessage(result.error);
      });
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        onClick={() => !isDisabled && fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (!isDisabled && (event.key === "Enter" || event.key === " ")) fileInputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDraggingOver(false);
          if (!isDisabled) handleFiles(event.dataTransfer.files);
        }}
        className={`rounded-admin-card border-[1.5px] border-dashed px-4 py-6 text-center ${
          isDisabled
            ? "cursor-not-allowed border-admin-rule bg-[#fcfbf8] text-admin-faint"
            : `cursor-pointer bg-[#fcfbf8] text-admin-muted ${
                isDraggingOver ? "border-admin-gold bg-admin-gold-soft" : "border-admin-rule-strong"
              }`
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <strong className="block text-sm text-admin-ink">
          {noCategory ? "Choose a category first" : atCapacity ? "That's all 8 photos" : "Drag photos here"}
        </strong>
        <span className="text-xs">
          {noCategory
            ? "Then you can add photos"
            : atCapacity
              ? "Remove one to add another"
              : `or click to choose · JPG or PNG, up to 5MB each · ${remainingSlots} left`}
        </span>
      </div>

      {message && <p className="mt-2 text-xs text-admin-danger">{message}</p>}

      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2.25">
          {items.map((item, index) => (
            <div
              key={itemKey(item)}
              draggable={item.kind === "uploaded"}
              onDragStart={() => {
                dragIndexRef.current = index;
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(index)}
              className="w-18.5"
            >
              {item.kind === "uploaded" && (
                <div
                  className={`relative h-18.5 rounded-[6px] border-[1.5px] bg-admin-gold-soft ${
                    item.image.isPrimary ? "border-admin-gold" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a next/image remote pattern */}
                  <img src={item.image.url} alt="" className="h-full w-full rounded-[5px] object-cover" />
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(item.image)}
                    title="Use as main photo"
                    className={`absolute top-0.75 right-0.75 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-[11px] ${
                      item.image.isPrimary ? "text-admin-gold" : "text-admin-faint"
                    }`}
                  >
                    {item.image.isPrimary ? "★" : "☆"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.image)}
                    title="Remove this photo"
                    className="absolute bottom-0.75 right-0.75 grid h-5 w-5 place-items-center rounded-full bg-white/90 text-[11px] text-admin-danger"
                  >
                    ✕
                  </button>
                </div>
              )}

              {item.kind === "pending" && (
                <div className="grid h-18.5 place-items-center rounded-[6px] border-[1.5px] border-admin-rule-strong bg-[#fcfbf8]">
                  <span className="font-admin-mono text-[11px] text-admin-muted">{item.progress}%</span>
                </div>
              )}

              {item.kind === "error" && (
                <div className="flex h-18.5 flex-col items-center justify-center gap-1 rounded-[6px] border-[1.5px] border-[#e8cfcf] bg-admin-danger-soft p-1 text-center">
                  <span className="text-[10px] text-admin-danger">Failed</span>
                  <div className="flex gap-1.5 text-[10px]">
                    <button type="button" onClick={() => retryUpload(item)} className="text-admin-danger underline">
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => removeLocalItem(item.localId)}
                      className="text-admin-faint underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              <small className="mt-0.75 block truncate text-center font-admin-mono text-[10px] text-admin-faint">
                {item.kind === "uploaded" ? (item.image.isPrimary ? "Main" : `Photo ${index + 1}`) : item.fileName}
              </small>
            </div>
          ))}
        </div>
      )}

      <p className="mt-2.25 text-xs text-admin-faint">
        The starred photo shows first on the site. Drag to reorder the rest.
      </p>
    </div>
  );
}

// Maps each report title to a layout reference image hosted at /references/<file>.
// The reference image is sent as the LAST input to gpt-image-2 alongside the user's portrait.
// Prompt language directs the model to use the reference for layout/style structure only,
// and the user portrait for identity.

const REFERENCE_BY_TITLE: Record<string, string> = {
  // Keep references only where they do not contain a face/body the model could copy.
  // Identity-critical reports are driven by text layout instructions instead.
  "Wardrobe Capsule Board": "/references/wardrobe.jpeg",
  "Nail Color Guide": "/references/nail.jpeg",
  "Use Carefully Guide": "/references/use-carefully.png"
};

export function referenceUrlFor(title: string): string | null {
  return REFERENCE_BY_TITLE[title] ?? null;
}

export async function fetchReferenceFile(url: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load layout reference at ${url} (${response.status}).`);
  }
  const blob = await response.blob();
  const filename = url.split("/").pop() || "reference.jpeg";
  const type = blob.type || (filename.endsWith(".png") ? "image/png" : "image/jpeg");
  return new File([blob], filename, { type });
}

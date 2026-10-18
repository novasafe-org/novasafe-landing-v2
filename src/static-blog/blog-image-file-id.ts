/** Must match novasafe-backend blog image file id validation. */
const BLOG_IMAGE_FILE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,128}$/;

export function isBlogImageFileId(raw: string): boolean {
  return BLOG_IMAGE_FILE_ID_PATTERN.test(raw.trim());
}

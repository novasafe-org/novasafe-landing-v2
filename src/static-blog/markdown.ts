/** Drop a leading # title when it duplicates the page title (avoids double headings). */
export function stripDuplicateMarkdownTitle(markdown: string, title: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let index = 0;
  while (index < lines.length && !lines[index].trim()) index += 1;
  if (index >= lines.length) return markdown;

  const match = lines[index].trim().match(/^#\s+(.+)$/);
  if (!match) return markdown;
  if (match[1].trim().toLowerCase() !== title.trim().toLowerCase()) return markdown;

  lines.splice(index, 1);
  while (lines[index]?.trim() === "") lines.splice(index, 1);
  return lines.join("\n");
}

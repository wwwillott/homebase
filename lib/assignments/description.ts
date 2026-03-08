export function summarizeAssignmentDescription(rawDescription?: string | null): string | undefined {
  if (!rawDescription) return undefined;

  const withoutStyles = rawDescription
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<link[\s\S]*?>/gi, " ");
  const plain = decodeHtmlEntities(
    withoutStyles
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  if (!plain) return undefined;

  const cleaned = plain
    .replace(/^instructions[:\s-]*/i, "")
    .replace(/^assignment[:\s-]*/i, "")
    .trim();

  if (!cleaned) return undefined;

  const firstSentence = cleaned.match(/.+?[.!?](\s|$)/)?.[0]?.trim() ?? cleaned;
  const limit = 240;
  if (firstSentence.length <= limit) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, limit - 1).trimEnd()}...`;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'");
}

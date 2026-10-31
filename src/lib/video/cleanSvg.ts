export function cleanSvg(svg?: string): string {
  if (!svg) return "";
  let cleaned = svg.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "");
  }
  const match = cleaned.match(/<svg[\s\S]*<\/svg>/i);
  if (match) {
    cleaned = match[0];
  }
  cleaned = cleaned.replace(/<svg\b([^>]*)>/i, (_m, attrs) => {
    const newAttrs = attrs
      .replace(/\bwidth="[^"]*"/gi, "")
      .replace(/\bheight="[^"]*"/gi, "")
      .trim();
    return `<svg ${newAttrs} width="100%" height="100%" style="max-height:100%;object-fit:contain;display:block;margin:auto;">`;
  });
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, "");
  return cleaned;
}

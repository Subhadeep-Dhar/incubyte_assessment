/**
 * Escapes characters with special meaning in regular expressions
 * to prevent ReDoS or query injection vulnerabilities.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

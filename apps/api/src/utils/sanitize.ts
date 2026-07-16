/**
 * Input sanitization helpers.
 *
 * Defense-in-depth against stored XSS and injection. Zod validates *shape*
 * and type at the boundary; these helpers neutralize *content* hazards in
 * free-text fields before they are persisted (and later rendered by the SPA).
 *
 * We deliberately avoid a heavyweight HTML sanitizer dependency: the admin
 * UI treats user text as plain text (React escapes by default), but profiles,
 * audit metadata, and file names can be displayed in places that may render
 * markdown/HTML. Stripping script-bearing constructs and control characters
 * at the API edge guarantees no payload survives the round trip.
 */

// Control characters except common whitespace (tab, LF, CR, FF, VT).
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const SCRIPT_TAG = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const EVENT_HANDLER_ATTR =
  /\son(?:load|error|click|mouseover|focus|blur|input|change|submit|mouseenter|mouseleave)\s*=\s*["'][^"']*["']/gi;
const JAVASCRIPT_URI = /javascript\s*:/gi;

/**
 * Sanitize a single free-text string:
 *  - strip control characters (except common whitespace)
 *  - remove <script> blocks and inline event-handler attributes
 *  - neutralize javascript: URIs
 * Returns the input unchanged if it is not a string.
 */
export function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return value as string;
  return value
    .replace(CONTROL_CHARS, "")
    .replace(SCRIPT_TAG, "")
    .replace(EVENT_HANDLER_ATTR, "")
    .replace(JAVASCRIPT_URI, "");
}

/**
 * Recursively sanitize free-text string fields of an object/array. Numbers,
 * booleans, dates, and nested structures are preserved. Use this on request
 * bodies that contain user-supplied display strings (profiles, settings
 * descriptions, file names, etc.) before passing them to services.
 */
export function sanitizeObject<T>(input: T): T {
  if (input === null || input === undefined) return input;

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof input === "string") {
    return sanitizeText(input) as unknown as T;
  }

  if (typeof input === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      result[key] = sanitizeObject(value);
    }
    return result as unknown as T;
  }

  return input;
}

/**
 * NoSQL / operator injection guard. Reject objects that smuggle MongoDB-style
 * operators ($gt, $ne, $where) or prototype-pollution keys
 * (__proto__, constructor, prototype) into query/filter parameters.
 * Returns true when the value is safe to forward to the data layer.
 */
export function isSafeQueryValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return !value.startsWith("$");
  if (Array.isArray(value)) return value.every(isSafeQueryValue);

  if (typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return false;
      }
      if (key.startsWith("$")) return false;
      if (!isSafeQueryValue((value as Record<string, unknown>)[key])) return false;
    }
  }
  return true;
}

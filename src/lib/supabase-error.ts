export function getSupabaseErrorMessage(error: unknown, fallback = "EcoLoop is temporarily unavailable. Please try again in a moment.") {
  if (!error) return fallback;

  const message = error instanceof Error ? error.message : typeof error === "string" ? error : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network request failed") ||
    normalized.includes("err_name_not_resolved") ||
    normalized.includes("getaddrinfo") ||
    normalized.includes("fetch failed") ||
    normalized.includes("socket hang up") ||
    normalized.includes("econnrefused")
  ) {
    return "EcoLoop is currently unavailable. Please check your connection and try again shortly.";
  }

  if (
    normalized.includes("429") ||
    normalized.includes("too many requests") ||
    normalized.includes("rate limit") ||
    normalized.includes("email rate limit") ||
    normalized.includes("rate limit exceeded")
  ) {
    return "Too many requests. Please wait a few minutes and try again.";
  }

  return message || fallback;
}

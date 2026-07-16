export function getSupabaseErrorMessage(error: unknown, fallback = "EcoLoop is temporarily unavailable. Please try again in a moment.") {
  if (!error) return fallback;

  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === "string" && err.message.trim().length > 0) {
      message = err.message;
    } else if (typeof err.error_description === "string" && err.error_description.trim().length > 0) {
      message = err.error_description;
    } else if (typeof err.hint === "string" && err.hint.trim().length > 0) {
      message = err.hint;
    } else if (typeof err.details === "string" && err.details.trim().length > 0) {
      message = err.details;
    } else {
      try {
        message = JSON.stringify(err);
      } catch {
        message = String(error);
      }
    }
  } else {
    message = String(error);
  }

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

export function validateUrl(inputUrl, baseUrl = process.env.BASE_URL || "http://localhost:5000") {
  if (!inputUrl || typeof inputUrl !== "string") {
    return { valid: false, message: "URL is required" };
  }

  const trimmed = inputUrl.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "URL cannot be empty" };
  }

  if (trimmed.length > 2048) {
    return { valid: false, message: "URL exceeds maximum length of 2048 characters" };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, message: "Please enter a valid http or https URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, message: "Please enter a valid http or https URL" };
  }

  if (!parsed.hostname || parsed.hostname.trim() === "") {
    return { valid: false, message: "URL must contain a valid hostname" };
  }

  // Prevent self-loop / redirect loop to BASE_URL host
  try {
    const parsedBase = new URL(baseUrl);
    if (parsed.hostname.toLowerCase() === parsedBase.hostname.toLowerCase()) {
      return { valid: false, message: "Cannot shorten URLs pointing to this service" };
    }
  } catch {
    // If baseUrl cannot be parsed, fallback to comparing hostnames
  }

  return { valid: true, url: parsed.href };
}

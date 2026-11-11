const RESERVED_ALIASES = new Set([
  "api",
  "health",
  "login",
  "register",
  "logout",
  "dashboard",
  "admin",
  "assets",
  "static",
  "favicon",
  "robots",
  "sitemap",
  "about",
  "help",
  "me",
]);

export function validateAlias(alias) {
  if (typeof alias !== "string") {
    return { valid: false, message: "Custom alias must be a string" };
  }

  const trimmed = alias.trim();
  if (trimmed.length < 4 || trimmed.length > 20) {
    return { valid: false, message: "Custom alias must be between 4 and 20 characters" };
  }

  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return {
      valid: false,
      message: "Custom alias can only contain letters, numbers, underscores (_), and hyphens (-)",
    };
  }

  if (RESERVED_ALIASES.has(trimmed.toLowerCase())) {
    return { valid: false, message: `The alias '${trimmed}' is reserved and cannot be used` };
  }

  return { valid: true, alias: trimmed };
}

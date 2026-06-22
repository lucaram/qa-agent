import path from "path";
import { LANGUAGE_PROFILES } from "../config/languageProfiles.js";

export function detectLanguageFromFile(file) {
  const ext = path.extname(file);

  for (const [key, profile] of Object.entries(LANGUAGE_PROFILES)) {
    if (profile.extensions.includes(ext)) {
      return key;
    }
  }

  return "unknown";
}

export function detectPrimaryLanguage(languageCounts) {
  const entries = Object.entries(languageCounts).filter(([, count]) => count > 0);

  if (entries.length === 0) {
    return "unknown";
  }

  entries.sort((a, b) => b[1] - a[1]);

  return entries[0][0];
}
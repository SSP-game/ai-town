/**
 * Get the correct asset path based on the build configuration
 */
export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  // In development or when using absolute paths, use the configured base
  const base = import.meta.env.BASE_URL || '/ai-town';

  // If base is relative (starts with './'), don't add base prefix
  if (base.startsWith('./')) {
    return `./${cleanPath}`;
  }

  // Otherwise use the absolute base path
  return `${base}/${cleanPath}`;
}
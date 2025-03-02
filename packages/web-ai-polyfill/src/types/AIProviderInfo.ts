/**
 * Contains minimal identifying info about an AI provider
 * so that libraries and websites can display information
 * in a user-friendly manner.
 */
export interface AIProviderInfo {
  /**
   * A UUIDv4 unique to this provider.
   */
  uuid: `${string}-${string}-${string}-${string}-${string}`;

  /**
   * The provider's display name, e.g., "MyAI"
   */
  name: string;

  /**
   * A base64-encoded SVG image. Can be displayed safely
   * in an `<img>` tag to avoid JavaScript injection.
   */
  icon: `data:image/svg+xml;base64,${string}`;

  /**
   * A short descriptive text about the provider, e.g.
   * "The MyAI extension for generating text."
   */
  description: string;
}
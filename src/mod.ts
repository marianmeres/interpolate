/**
 * @module
 *
 * String interpolation utility with Docker Compose-inspired syntax.
 *
 * This module provides a simple, zero-dependency function for interpolating
 * variable placeholders in strings. It supports various substitution patterns
 * including default values, error assertions, and conditional replacements.
 *
 * @example
 * ```ts
 * import { interpolate } from "@marianmeres/interpolate";
 *
 * // Basic substitution
 * interpolate("Hello, ${NAME}!", { NAME: "World" }); // "Hello, World!"
 *
 * // With default value
 * interpolate("Hello, ${NAME:-Guest}!", {}); // "Hello, Guest!"
 *
 * // With error assertion
 * interpolate("${API_KEY:?API key required}", {}); // throws Error
 * ```
 */
export * from "./interpolate.ts";

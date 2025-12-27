/**
 * Interpolates string placeholders using Docker Compose-inspired syntax.
 *
 * Replaces variable placeholders in the input string with values from the provided
 * context object. Supports both braced `${VAR}` and unbraced `$VAR` syntax, along
 * with default values, error assertions, and conditional replacements.
 *
 * **Supported syntax:**
 * - `$VAR` - Basic unbraced substitution (uppercase names only, pattern: `/[A-Z_][A-Z0-9_]*‍/`)
 * - `${VAR}` - Basic braced substitution (any case)
 * - `${VAR:-default}` - Use "default" if VAR is unset or empty
 * - `${VAR-default}` - Use "default" only if VAR is unset
 * - `${VAR:?error}` or `${VAR:!error}` - Throw error if VAR is unset or empty
 * - `${VAR?error}` or `${VAR!error}` - Throw error only if VAR is unset
 * - `${VAR:+replacement}` - Use "replacement" if VAR is set and non-empty
 * - `${VAR+replacement}` - Use "replacement" if VAR is set (even if empty)
 *
 * @param str - The template string containing variable placeholders to interpolate.
 * @param context - A record mapping variable names to their string values.
 * @returns The interpolated string with all placeholders replaced.
 * @throws {Error} When using assertion syntax (`?` or `!`) and the variable is unset
 *   or empty (depending on whether the colon modifier is used).
 *
 * @example Basic usage
 * ```ts
 * interpolate("Hello, ${NAME:-World}!", {}); // "Hello, World!"
 * interpolate("Hello, ${NAME:-World}!", { NAME: "Alice" }); // "Hello, Alice!"
 * interpolate("Hello, $NAME!", { NAME: "Bob" }); // "Hello, Bob!"
 * ```
 *
 * @example Default values
 * ```ts
 * interpolate("${VAR:-default}", {}); // "default" (VAR is unset)
 * interpolate("${VAR:-default}", { VAR: "" }); // "default" (VAR is empty)
 * interpolate("${VAR-default}", { VAR: "" }); // "" (VAR is set, even if empty)
 * ```
 *
 * @example Error assertions
 * ```ts
 * interpolate("${VAR:?Variable required}", {}); // throws Error: "Variable required"
 * interpolate("${VAR:!Must be set}", { VAR: "" }); // throws Error: "Must be set"
 * ```
 *
 * @example Conditional replacement
 * ```ts
 * interpolate("${VAR:+is set}", { VAR: "value" }); // "is set"
 * interpolate("${VAR:+is set}", { VAR: "" }); // "" (empty because VAR is empty)
 * interpolate("${VAR+is set}", { VAR: "" }); // "is set" (VAR is set, even if empty)
 * ```
 */
export function interpolate(
	str: string,
	context: Record<string, string>
): string {
	return str.replace(
		/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g,
		(match, braced, unbraced) => {
			// console.log(match, braced, unbraced);

			// unbraced variables eg $VAR
			if (unbraced) return context?.[unbraced] ?? match;

			// Trying to mimic interpolation syntax defined here:
			// https://docs.docker.com/reference/compose-file/interpolation/

			// ${VAR:-default}
			// ${VAR-default}
			const colonDashMatch = braced.match(/^([^:?!-]+):-(.*)$/);
			const dashMatch = braced.match(/^([^:?!-]+)-(.*)$/);

			// ${VAR:?error}
			// ${VAR?error}
			// ${VAR:!error}
			// ${VAR!error}
			const colonQuestMatch = braced.match(/^([^:?!-]+):[\!\?](.*)$/);
			const questMatch = braced.match(/^([^:?!-]+)[\!\?](.*)$/);

			// ${VAR:+replacement}
			// ${VAR+replacement}
			const colonPlusMatch = braced.match(/^([^:?!-]+):\+(.*)$/);
			const plusMatch = braced.match(/^([^:?!-]+)\+(.*)$/);

			let varName, defaultValue, errorMessage, replaceValue;
			let requireNonEmpty = false;

			// ${VAR:-default} - use default if unset or empty
			if (colonDashMatch) {
				[, varName, defaultValue] = colonDashMatch;
				requireNonEmpty = true;
			}
			// ${VAR-default} - use default only if unset
			else if (dashMatch) {
				[, varName, defaultValue] = dashMatch;
			}
			// ${VAR:?error} - error if unset or empty
			else if (colonQuestMatch) {
				[, varName, errorMessage] = colonQuestMatch;
				requireNonEmpty = true;
			}
			// ${VAR?error} - error only if unset
			else if (questMatch) {
				[, varName, errorMessage] = questMatch;
			}
			// ${VAR:+replacement} -> replacement if VAR is set and non-empty, otherwise empty
			else if (colonPlusMatch) {
				[, varName, replaceValue] = colonPlusMatch;
				requireNonEmpty = true;
			}
			// ${VAR+replacement} -> replacement if VAR is set, otherwise empty
			else if (plusMatch) {
				[, varName, replaceValue] = plusMatch;
			}
			// ${VAR} - simple direct substitution
			else {
				varName = braced;
			}

			const value = context?.[varName];
			const isEmpty = value === "";
			const isUnset = value === undefined;

			// error
			if (errorMessage !== undefined) {
				if (isUnset || (requireNonEmpty && isEmpty)) {
					throw new Error(errorMessage || `${varName} is not set`);
				}
				return value;
			}

			// default
			if (defaultValue !== undefined) {
				if (isUnset || (requireNonEmpty && isEmpty)) {
					return defaultValue;
				}
				return value;
			}

			// replacement if VAR is set and non-empty, otherwise empty
			// replacement if VAR is set, otherwise empty
			if (replaceValue !== undefined) {
				if (isUnset) return "";

				if (!requireNonEmpty || (requireNonEmpty && !isEmpty)) {
					return replaceValue;
				}

				return "";
			}

			// simple case - return value or empty string if unset
			return value ?? "";
		}
	);
}

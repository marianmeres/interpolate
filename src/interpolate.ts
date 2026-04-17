/**
 * Interpolates string placeholders using Docker Compose-inspired syntax.
 *
 * Replaces variable placeholders in the input string with values from the provided
 * context object. Supports both braced `${VAR}` and unbraced `$VAR` syntax, along
 * with default values, error assertions, and conditional replacements.
 *
 * **Supported syntax:**
 * - `$$` - Literal dollar sign (escape)
 * - `$VAR` - Basic unbraced substitution (uppercase names only, pattern: `/[A-Z_][A-Z0-9_]*‍/`)
 * - `${VAR}` - Basic braced substitution (any case)
 * - `${VAR:-default}` - Use "default" if VAR is unset or empty
 * - `${VAR-default}` - Use "default" only if VAR is unset
 * - `${VAR:?error}` or `${VAR:!error}` - Throw error if VAR is unset or empty
 * - `${VAR?error}` or `${VAR!error}` - Throw error only if VAR is unset
 * - `${VAR:+replacement}` - Use "replacement" if VAR is set and non-empty
 * - `${VAR+replacement}` - Use "replacement" if VAR is set (even if empty)
 *
 * **Variable names with operator characters:**
 * When the braced content is an exact key of `context`, it is looked up directly.
 * This lets names that contain `-`, `:`, `?`, `!`, `+` (e.g. `my-var`) resolve
 * correctly — direct lookup takes precedence over operator parsing.
 *
 * @param str - The template string containing variable placeholders to interpolate.
 * @param context - A record mapping variable names to their string values. Optional;
 *   when omitted or nullish, all variables are treated as unset.
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
 * @example Escaping the dollar sign
 * ```ts
 * interpolate("Price: $$100", {}); // "Price: $100"
 * interpolate("$$NAME", { NAME: "x" }); // "$NAME" (literal, not substituted)
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
 *
 * @example Names containing operator characters
 * ```ts
 * interpolate("${my-var}", { "my-var": "value" }); // "value"
 * ```
 */
export function interpolate(
	str: string,
	context?: Record<string, string> | null
): string {
	const ctx = context ?? {};
	const hasKey = (k: string) =>
		Object.prototype.hasOwnProperty.call(ctx, k);

	return str.replace(
		/\$\$|\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g,
		(match, braced, unbraced) => {
			// $$ -> literal $
			if (match === "$$") return "$";

			// unbraced variables eg $VAR
			if (unbraced !== undefined) return hasKey(unbraced) ? ctx[unbraced] : match;

			// Direct key lookup wins — supports names that contain operator
			// characters (`-`, `:`, `?`, `!`, `+`) when present literally in context.
			if (hasKey(braced)) return ctx[braced];

			// Otherwise, parse Docker Compose-inspired operators.
			// https://docs.docker.com/reference/compose-file/interpolation/

			// ${VAR:-default} / ${VAR-default}
			const colonDashMatch = braced.match(/^([^:?!+\-]+):-(.*)$/);
			const dashMatch = braced.match(/^([^:?!+\-]+)-(.*)$/);

			// ${VAR:?error} / ${VAR?error} / ${VAR:!error} / ${VAR!error}
			const colonQuestMatch = braced.match(/^([^:?!+\-]+):[!?](.*)$/);
			const questMatch = braced.match(/^([^:?!+\-]+)[!?](.*)$/);

			// ${VAR:+replacement} / ${VAR+replacement}
			const colonPlusMatch = braced.match(/^([^:?!+\-]+):\+(.*)$/);
			const plusMatch = braced.match(/^([^:?!+\-]+)\+(.*)$/);

			let varName: string;
			let defaultValue: string | undefined;
			let errorMessage: string | undefined;
			let replaceValue: string | undefined;
			let requireNonEmpty = false;

			if (colonDashMatch) {
				[, varName, defaultValue] = colonDashMatch;
				requireNonEmpty = true;
			} else if (dashMatch) {
				[, varName, defaultValue] = dashMatch;
			} else if (colonQuestMatch) {
				[, varName, errorMessage] = colonQuestMatch;
				requireNonEmpty = true;
			} else if (questMatch) {
				[, varName, errorMessage] = questMatch;
			} else if (colonPlusMatch) {
				[, varName, replaceValue] = colonPlusMatch;
				requireNonEmpty = true;
			} else if (plusMatch) {
				[, varName, replaceValue] = plusMatch;
			} else {
				varName = braced;
			}

			const value = hasKey(varName) ? ctx[varName] : undefined;
			const isEmpty = value === "";
			const isUnset = value === undefined;

			// error
			if (errorMessage !== undefined) {
				if (isUnset || (requireNonEmpty && isEmpty)) {
					throw new Error(errorMessage || `${varName} is not set`);
				}
				return value ?? "";
			}

			// default
			if (defaultValue !== undefined) {
				if (isUnset || (requireNonEmpty && isEmpty)) {
					return defaultValue;
				}
				return value ?? "";
			}

			// ${VAR:+replacement} -> replacement if VAR is set and non-empty, else empty
			// ${VAR+replacement}  -> replacement if VAR is set (even empty), else empty
			if (replaceValue !== undefined) {
				if (isUnset) return "";
				if (!requireNonEmpty || !isEmpty) return replaceValue;
				return "";
			}

			// simple case - return value or empty string if unset
			return value ?? "";
		}
	);
}

/**
 * Simple helper function which interpolates string placeholders, so that
 * "Hello, ${name:-World}!" works as expected.
 *
 * @example
 * ```ts
 * interpolate("Hello, ${name:-World}", {}); // Hello, World!
 * interpolate("Hello, ${name:-World}", { name: "Foo" }); // Hello, Foo!
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
			const colonDashMatch = braced.match(/^([^:?-]+):-(.*)$/);
			const dashMatch = braced.match(/^([^:?-]+)-(.*)$/);

			// ${VAR:?error}
			// ${VAR:?error}
			const colonQuestMatch = braced.match(/^([^:?-]+):\?(.*)$/);
			const questMatch = braced.match(/^([^:?-]+)\?(.*)$/);

			// ${VAR:+replacement}
			// ${VAR+replacement}
			const colonPlusMatch = braced.match(/^([^:?-]+):\+(.*)$/);
			const plusMatch = braced.match(/^([^:?-]+)\+(.*)$/);

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
			// ${VAR:+replacement} - use replacement if unset or empty
			else if (colonPlusMatch) {
				[, varName, replaceValue] = colonPlusMatch;
				requireNonEmpty = true;
			}
			// ${VAR+replacement} -> use replacement only if unset
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
					throw new Error(errorMessage || `${varName} is required but not set`);
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

			// replace
			if (replaceValue !== undefined) {
				if (isUnset || (requireNonEmpty && isEmpty)) {
					return replaceValue;
				}
				return value;
			}

			// simple case - return value or empty string if unset
			return value ?? "";
		}
	);
}

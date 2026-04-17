import { assertEquals, assertThrows } from "@std/assert";
import { interpolate } from "../src/interpolate.ts";

Deno.test("no placeholders", () => {
	assertEquals(interpolate("foo", {}), "foo");
});

Deno.test("unbraced", () => {
	assertEquals(interpolate("foo $FOO baz", { FOO: "bar" }), "foo bar baz");
	assertEquals(
		interpolate("foo \n$FOO\n baz", { FOO: "bar" }),
		"foo \nbar\n baz"
	);

	// if not found returns itself
	assertEquals(interpolate("foo $FOO baz", {}), "foo $FOO baz");
});

Deno.test("braced direct", () => {
	assertEquals(interpolate("foo ${FOO} baz", { FOO: "bar" }), "foo bar baz");
	assertEquals(interpolate("foo ${FOO} baz", {}), "foo  baz");
});

Deno.test("default if unset or empty", () => {
	assertEquals(interpolate("foo ${FOO:-bar} baz", {}), "foo bar baz");
	assertEquals(interpolate("foo ${FOO:-bar} baz", { FOO: "" }), "foo bar baz");
});

Deno.test("default only if unset", () => {
	assertEquals(interpolate("foo ${FOO-bar} baz", {}), "foo bar baz");
	assertEquals(interpolate("foo ${FOO-bar} baz", { FOO: "" }), "foo  baz");
});

Deno.test("error if unset or empty", () => {
	["?", "!"].forEach((c) => {
		assertThrows(
			() => interpolate(`foo \${FOO:${c}msg} baz`, {}),
			Error,
			"msg"
		);
		assertThrows(
			() => interpolate(`foo \${FOO:${c}msg} baz`, { FOO: "" }),
			Error,
			"msg"
		);
		// does not throw
		assertEquals(
			interpolate(`foo \${FOO:${c}error} baz`, { FOO: "bar" }),
			"foo bar baz"
		);
	});
});

Deno.test("error only if unset", () => {
	["?", "!"].forEach((c) => {
		assertThrows(() => interpolate(`foo \${FOO${c}msg} baz`, {}), Error, "msg");
		// does not throw
		assertEquals(
			interpolate(`foo \${FOO${c}error} baz`, { FOO: "" }),
			"foo  baz"
		);
		assertEquals(
			interpolate(`foo \${FOO${c}error} baz`, { FOO: "bar" }),
			"foo bar baz"
		);
	});
});

Deno.test("replacement if is set and non-empty", () => {
	// ${VAR:+replacement} -> replacement if VAR is set and non-empty, otherwise empty

	// is set non-empty -> replacement
	assertEquals(
		interpolate("foo ${FOO:+replace} baz", { FOO: "bar" }),
		"foo replace baz"
	);

	// is set empty -> empty
	assertEquals(interpolate("foo ${FOO:+replace} baz", { FOO: "" }), "foo  baz");
	// is unset -> empty
	assertEquals(interpolate("foo ${FOO:+replace} baz", {}), "foo  baz");
});

Deno.test("replacement if is set", () => {
	// ${VAR+replacement} -> replacement if VAR is set, otherwise empty

	// is set -> replacement
	assertEquals(
		interpolate("foo ${FOO+replace} baz", { FOO: "bar" }),
		"foo replace baz"
	);
	// is set empty -> replacement
	assertEquals(
		interpolate("foo ${FOO+replace} baz", { FOO: "" }),
		"foo replace baz"
	);
	// is unset -> empty
	assertEquals(interpolate("foo ${FOO+replace} baz", {}), "foo  baz");
});

Deno.test("uppercase only for unbraced variables", () => {
	// lowercase doesn't match unbraced pattern
	assertEquals(interpolate("foo $bar baz", { bar: "qux" }), "foo $bar baz");
	assertEquals(
		interpolate("foo $camelCase baz", { camelCase: "qux" }),
		"foo $camelCase baz"
	);

	// but works with braced syntax
	assertEquals(interpolate("foo ${bar} baz", { bar: "qux" }), "foo qux baz");
	assertEquals(
		interpolate("foo ${camelCase} baz", { camelCase: "qux" }),
		"foo qux baz"
	);

	// uppercase works for both
	assertEquals(interpolate("foo $BAR baz", { BAR: "qux" }), "foo qux baz");
	assertEquals(interpolate("foo ${BAR} baz", { BAR: "qux" }), "foo qux baz");

	// underscore is allowed
	assertEquals(
		interpolate("foo $FOO_BAR baz", { FOO_BAR: "qux" }),
		"foo qux baz"
	);
	assertEquals(
		interpolate("foo $_FOO baz", { _FOO: "qux" }),
		"foo qux baz"
	);
});

Deno.test("multiple placeholders in one string", () => {
	// multiple different variables
	assertEquals(
		interpolate("${A} ${B} ${C}", { A: "one", B: "two", C: "three" }),
		"one two three"
	);

	// same variable multiple times
	assertEquals(
		interpolate("${FOO} and ${FOO} again", { FOO: "bar" }),
		"bar and bar again"
	);

	// mixed syntax
	assertEquals(
		interpolate("$A ${B} $C", { A: "one", B: "two", C: "three" }),
		"one two three"
	);

	// complex example with different operators
	assertEquals(
		interpolate("${A:-default} ${B:+set} ${C}", {
			A: "value",
			B: "val",
			C: "last",
		}),
		"value set last"
	);

	// adjacent placeholders
	assertEquals(interpolate("${A}${B}${C}", { A: "1", B: "2", C: "3" }), "123");

	// no spaces - Note: the 'z' at the end is treated as literal text
	assertEquals(interpolate("x${A}y${B}z", { A: "foo", B: "bar" }), "xfooybarz");
});

Deno.test("malformed and edge case syntax", () => {
	// nested braces (not supported - inner ${BAR} gets replaced first)
	assertEquals(
		interpolate("foo ${${BAR}} baz", { BAR: "qux", qux: "nested" }),
		"foo } baz"
	);

	// incomplete placeholder
	assertEquals(interpolate("foo ${BAR baz", {}), "foo ${BAR baz");
	assertEquals(interpolate("foo ${ baz", {}), "foo ${ baz");

	// empty variable name - braces are not matched, treated literally
	assertEquals(interpolate("foo ${} baz", {}), "foo ${} baz");

	// dollar sign without variable
	assertEquals(interpolate("foo $ baz", {}), "foo $ baz");
	assertEquals(interpolate("cost is $5", {}), "cost is $5");

	// special characters in braced names
	// Direct key lookup wins — if the braced content is a literal key of
	// context, it resolves to that value even when it contains operator chars.
	assertEquals(
		interpolate("foo ${my-var} baz", { "my-var": "dash" }),
		"foo dash baz"
	);
	// When the literal key is NOT present, dash still triggers operator parsing.
	assertEquals(interpolate("foo ${FOO-fallback} baz", {}), "foo fallback baz");
	// dots work fine
	assertEquals(
		interpolate("foo ${my.var} baz", { "my.var": "dot" }),
		"foo dot baz"
	);

	// whitespace in variable names (edge case)
	assertEquals(interpolate("foo ${ BAR } baz", {}), "foo  baz");

	// operators with no default/error message
	assertEquals(interpolate("${FOO:-}", {}), "");
	assertEquals(interpolate("${FOO-}", {}), "");
	assertEquals(interpolate("${FOO:+}", { FOO: "x" }), "");
});

Deno.test("special characters in values", () => {
	// special regex characters in values shouldn't break
	assertEquals(
		interpolate("${VAR}", { VAR: "$.*+?[]{}()|^\\" }),
		"$.*+?[]{}()|^\\"
	);

	// newlines and tabs in values
	assertEquals(interpolate("${VAR}", { VAR: "line1\nline2" }), "line1\nline2");
	assertEquals(interpolate("${VAR}", { VAR: "tab\there" }), "tab\there");

	// unicode
	assertEquals(interpolate("${VAR}", { VAR: "emoji 🎉" }), "emoji 🎉");
	assertEquals(interpolate("${VAR}", { VAR: "日本語" }), "日本語");
});

Deno.test("dollar sign escape ($$)", () => {
	// $$ produces a literal $
	assertEquals(interpolate("$$100", {}), "$100");
	assertEquals(interpolate("cost: $$", {}), "cost: $");
	assertEquals(interpolate("$$$$", {}), "$$");

	// $$ protects an otherwise-interpolatable unbraced name
	assertEquals(interpolate("$$VAR", { VAR: "x" }), "$VAR");

	// $$ protects an otherwise-interpolatable braced name
	assertEquals(interpolate("$${VAR}", { VAR: "x" }), "${VAR}");

	// mixed
	assertEquals(
		interpolate("$$USD ${AMOUNT}", { AMOUNT: "100" }),
		"$USD 100"
	);

	// three $ in a row: first two escape, third interpolates
	assertEquals(interpolate("$$$VAR", { VAR: "x" }), "$x");
});

Deno.test("names containing operator characters", () => {
	// Direct key lookup wins over operator parsing
	assertEquals(interpolate("${my-var}", { "my-var": "dash-name" }), "dash-name");
	assertEquals(interpolate("${a:b}", { "a:b": "colon" }), "colon");
	assertEquals(interpolate("${a+b}", { "a+b": "plus" }), "plus");
	assertEquals(interpolate("${a?b}", { "a?b": "quest" }), "quest");

	// When the literal key is absent, operator parsing still applies
	assertEquals(interpolate("${FOO-default}", {}), "default");
	assertEquals(interpolate("${FOO-default}", { FOO: "set" }), "set");
});

Deno.test("optional / nullish context", () => {
	// No context argument -> all variables are unset
	assertEquals(interpolate("${VAR:-x}"), "x");
	assertEquals(interpolate("${VAR}"), "");
	assertEquals(interpolate("$VAR"), "$VAR");

	// Explicit null / undefined behave the same
	assertEquals(interpolate("${VAR:-x}", null), "x");
	assertEquals(interpolate("${VAR:-x}", undefined), "x");
});

Deno.test("values containing replace-pattern specials are not expanded", () => {
	// String.prototype.replace uses callback mode, so $1 / $& / $$ in
	// replacement values must not be interpreted specially.
	assertEquals(interpolate("${A}", { A: "$1$&$$" }), "$1$&$$");
	assertEquals(interpolate("${A}", { A: "$`$'" }), "$`$'");
});

Deno.test("values containing placeholder-like text are not re-interpolated", () => {
	// Substitution happens in a single pass — values are not rescanned.
	assertEquals(interpolate("${A}", { A: "${B}", B: "y" }), "${B}");
	assertEquals(interpolate("${A}", { A: "$B", B: "y" }), "$B");
});

Deno.test("colons and other specials inside default / error / replacement values", () => {
	// URL-style defaults with embedded colons
	assertEquals(
		interpolate("${URL:-http://host:8080/path}", {}),
		"http://host:8080/path"
	);
	// Default values may contain dashes, question marks, plus signs
	assertEquals(interpolate("${A:-a-b?c+d}", {}), "a-b?c+d");
	// Error message may contain special characters
	try {
		interpolate("${A:?why? please!}", {});
		throw new Error("should have thrown");
	} catch (e) {
		if (!(e instanceof Error) || e.message !== "why? please!") {
			throw new Error(`unexpected: ${(e as Error).message}`);
		}
	}
});

Deno.test("error operator with empty message uses default text", () => {
	try {
		interpolate("${MISSING:?}", {});
		throw new Error("should have thrown");
	} catch (e) {
		if (!(e instanceof Error) || e.message !== "MISSING is not set") {
			throw new Error(`unexpected: ${(e as Error).message}`);
		}
	}
});

Deno.test("unbraced variable followed by non-word characters", () => {
	// $VAR terminates at the first non-[A-Z0-9_] character
	assertEquals(interpolate("$VAR-suffix", { VAR: "v" }), "v-suffix");
	assertEquals(interpolate("$VAR.ext", { VAR: "v" }), "v.ext");
	assertEquals(interpolate("$VAR}", { VAR: "v" }), "v}");
});

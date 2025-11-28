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
	// Note: dash triggers the default operator syntax ${VAR-default}
	// so "my-var" is interpreted as variable "my" with default "var"
	assertEquals(
		interpolate("foo ${my-var} baz", { "my-var": "dash" }),
		"foo var baz"
	);
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

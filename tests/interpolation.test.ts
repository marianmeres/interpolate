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

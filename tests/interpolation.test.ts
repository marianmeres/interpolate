import { assert, assertEquals, assertThrows } from "@std/assert";
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
});

Deno.test("braced direct", () => {
	assertEquals(interpolate("foo ${FOO} baz", { FOO: "bar" }), "foo bar baz");
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
	assertThrows(() => interpolate("foo ${FOO:?error} baz", {}));
	assertThrows(() => interpolate("foo ${FOO:?error} baz", { FOO: "" }));
	// does not throw
	assertEquals(
		interpolate("foo ${FOO:?error} baz", { FOO: "bar" }),
		"foo bar baz"
	);
});

Deno.test("error only if unset", () => {
	assertThrows(() => interpolate("foo ${FOO?error} baz", {}));
	// does not throw
	assertEquals(interpolate("foo ${FOO?error} baz", { FOO: "" }), "foo  baz");
	assertEquals(
		interpolate("foo ${FOO?error} baz", { FOO: "bar" }),
		"foo bar baz"
	);
});

Deno.test("replacement if unset or empty", () => {
	assertEquals(interpolate("foo ${FOO:+replace} baz", {}), "foo replace baz");
	assertEquals(
		interpolate("foo ${FOO:+replace} baz", { FOO: "" }),
		"foo replace baz"
	);
	// does not throw
	assertEquals(
		interpolate("foo ${FOO:+replace} baz", { FOO: "bar" }),
		"foo bar baz"
	);
});

Deno.test("replacement only if unset", () => {
	assertEquals(interpolate("foo ${FOO+replace} baz", {}), "foo replace baz");
	assertEquals(interpolate("foo ${FOO+replace} baz", { FOO: "" }), "foo  baz");
	assertEquals(
		interpolate("foo ${FOO+replace} baz", { FOO: "bar" }),
		"foo bar baz"
	);
});

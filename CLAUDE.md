# @marianmeres/interpolate

String interpolation utility mimicking Docker Compose syntax.

## What It Does

Single function `interpolate(str, context)` replaces `${VAR}` placeholders in strings
with values from a context object. Supports defaults (`:-`), assertions (`:?`/`:!`),
and conditional replacements (`:+`).

## Structure

- `src/mod.ts` - Entry point
- `src/interpolate.ts` - Implementation (~135 lines)
- `tests/interpolation.test.ts` - 21 tests

## Key Points

- Zero runtime dependencies
- Dual distribution: JSR (Deno) + npm (Node.js)
- Colon (`:`) modifier treats empty strings as "unset"
- `$$` escapes to a literal `$`
- Unbraced `$VAR` requires UPPERCASE names
- Direct context key lookup wins over operator parsing (enables names with `-`, `:`, `?`, `!`, `+`)
- `context` is optional / nullable — nullish means "everything unset"
- No nested syntax; values are not re-interpolated (single pass)

## Commands

```bash
deno task test     # Run tests
deno task publish  # Publish to JSR + npm
```

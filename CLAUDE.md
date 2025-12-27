# @marianmeres/interpolate

String interpolation utility mimicking Docker Compose syntax.

## What It Does

Single function `interpolate(str, context)` replaces `${VAR}` placeholders in strings
with values from a context object. Supports defaults (`:-`), assertions (`:?`/`:!`),
and conditional replacements (`:+`).

## Structure

- `src/mod.ts` - Entry point
- `src/interpolate.ts` - Implementation (~115 lines)
- `tests/interpolation.test.ts` - 13 tests

## Key Points

- Zero runtime dependencies
- Dual distribution: JSR (Deno) + npm (Node.js)
- Colon (`:`) modifier treats empty strings as "unset"
- Unbraced `$VAR` requires UPPERCASE names
- No nested syntax support

## Commands

```bash
deno task test     # Run tests
deno task publish  # Publish to JSR + npm
```

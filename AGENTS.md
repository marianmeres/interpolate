# Agent Reference: @marianmeres/interpolate

## Package Overview

- **Purpose**: String interpolation with Docker Compose-inspired variable substitution syntax
- **Type**: Utility library
- **Runtime**: Deno and Node.js (dual distribution)
- **Dependencies**: Zero runtime dependencies

## Public API

### Function: `interpolate`

```typescript
function interpolate(str: string, context: Record<string, string>): string
```

- **Input**: Template string with placeholders, context object with string values
- **Output**: Interpolated string
- **Throws**: `Error` when assertion operators (`?` or `!`) fail

## Syntax Reference

| Pattern | Behavior |
|---------|----------|
| `$VAR` | Substitute if uppercase, else literal |
| `${VAR}` | Substitute (any case), empty if unset |
| `${VAR:-default}` | Default if unset OR empty |
| `${VAR-default}` | Default if unset only |
| `${VAR:?msg}` or `${VAR:!msg}` | Throw if unset OR empty |
| `${VAR?msg}` or `${VAR!msg}` | Throw if unset only |
| `${VAR:+val}` | Use val if set AND non-empty |
| `${VAR+val}` | Use val if set (even empty) |

## Key Implementation Details

- Colon (`:`) modifier = treat empty string as missing
- Unbraced `$VAR` pattern: `/[A-Z_][A-Z0-9_]*/` (uppercase only)
- Braced `${var}` works with any case
- Nested syntax not supported
- Context values must be strings

## File Structure

```
src/
  mod.ts           # Entry point (re-exports)
  interpolate.ts   # Implementation
tests/
  interpolation.test.ts  # Test suite (13 tests)
```

## Development Commands

```bash
deno task test          # Run tests
deno task test:watch    # Watch mode
deno task npm:build     # Build npm package
deno task publish       # Publish to JSR and npm
```

## Testing

- Framework: Deno.test with @std/assert
- Coverage: 13 test suites covering all syntax variants
- Edge cases: Special characters, unicode, malformed syntax

## Common Patterns

```typescript
// Environment-style substitution
interpolate("Server: ${HOST:-localhost}:${PORT:-8080}", env);

// Required configuration
interpolate("${API_KEY:?Missing API key}", config);

// Conditional output
interpolate("${DEBUG:+[DEBUG] }Log message", flags);
```

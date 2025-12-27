# @marianmeres/interpolate

[![NPM version](https://img.shields.io/npm/v/@marianmeres/interpolate.svg)](https://www.npmjs.com/package/@marianmeres/interpolate)
[![JSR version](https://jsr.io/badges/@marianmeres/interpolate)](https://jsr.io/@marianmeres/interpolate)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Simple, zero-dependency string interpolation utility with Docker Compose-inspired syntax.

Inspired by [docker compose interpolation syntax](https://docs.docker.com/reference/compose-file/interpolation/), 
with minor extension (read NOTE below). The nested notation is not supported.

The context (source data to interpolate from) is provided as a parameter.

## Supported syntax

The _unset_ below means `undefined` and _empty_ means empty string.

**IMPORTANT NOTES:**
- The unbraced syntax `$VAR` only matches uppercase variable names (pattern: `/[A-Z_][A-Z0-9_]*/`).
  This follows Docker Compose conventions. Use braced syntax `${var}` for lowercase or mixed-case names.
- Context values must be strings. The function signature is `Record<string, string>`.
- **Best Practice:** For consistency and clarity, it's recommended to use UPPERCASE names for all variables, even in braced syntax.

| Syntax                | Description                                                    |
| --------------------- | -------------------------------------------------------------- |
| $VAR                  | Basic unbracketed direct substitution (uppercase only)         |
| ${VAR}                | Basic bracketed direct substitution (any case)                 |
| ${VAR:-default}       | Use "default" if VAR is unset or empty                         |
| ${VAR-default}        | Use "default" only if VAR is unset                             |
| ${VAR:?error message} | Throws "error message" if VAR is unset or empty (read NOTE)    |
| ${VAR?error message}  | Throws "error message" only if VAR is unset (read NOTE)        |
| ${VAR:?}              | Throws error if VAR is unset or empty (read NOTE)              |
| ${VAR?}               | Throws error only if VAR is unset (read NOTE)                  |
| ${VAR:+replacement}   | Use "replacement" if VAR is set and non-empty, otherwise empty |
| ${VAR+replacement}    | Use "replacement" if VAR is set, otherwise empty               |

**NOTE:** for the assertion syntax both "?" and "!" are supported

## Install
```sh
deno add jsr:@marianmeres/interpolate
```
```sh
npm install @marianmeres/interpolate
```

## Example usage

```typescript
import { interpolate } from '@marianmeres/interpolate';
```

```typescript
// signature:
function interpolate(str: string, context: Record<string, string>): string
```

```typescript
// Hello, World!
interpolate("Hello, ${NAME:-World}", {}); 

// Hello, Foo!
interpolate("Hello, ${NAME:-World}", { NAME: "Foo" }); 
interpolate("Hello, $NAME", { NAME: "Foo" }); 

// throws generic error
interpolate("Hello, ${NAME:!}", {}); 
interpolate("Hello, ${NAME:?}", {}); // same as above, both "!" and "?" are supported
interpolate("Hello, ${NAME:!}", { NAME: "" }); 

// throws "custom error message"
interpolate("Hello, ${NAME:?custom error message}", {});
```

## API Reference

For comprehensive API documentation including all syntax variants, detailed examples,
edge cases, and error handling, see [API.md](./API.md).
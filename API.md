# API Reference

## interpolate()

Interpolates string placeholders using Docker Compose-inspired syntax.

### Signature

```typescript
function interpolate(
    str: string,
    context?: Record<string, string> | null
): string
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `str` | `string` | The template string containing variable placeholders to interpolate |
| `context` | `Record<string, string> \| null \| undefined` | Variable names to their string values. Optional; when omitted or nullish, all variables are treated as unset |

### Returns

`string` - The interpolated string with all placeholders replaced.

### Throws

`Error` - When using assertion syntax (`?` or `!`) and the variable is unset or empty (depending on whether the colon modifier is used).

## Supported Syntax

The term *unset* means `undefined` and *empty* means an empty string `""`.

### Basic Substitution

| Syntax | Description | Example |
|--------|-------------|---------|
| `$$` | Escaped literal dollar sign | `$$100` → `$100` |
| `$VAR` | Unbraced substitution (uppercase names only) | `$NAME` matches only `[A-Z_][A-Z0-9_]*` |
| `${VAR}` | Braced substitution (any case) | `${name}`, `${Name}`, `${NAME}` all work |

**Notes:**
- `$$` is an escape sequence producing a single literal `$`. It also shields
  the following text from interpolation: `$$VAR` → `$VAR` (literal).
- Unbraced `$VAR` only matches uppercase variable names following the pattern
  `/[A-Z_][A-Z0-9_]*/`. Use braced `${var}` syntax for lowercase or mixed-case
  names.

### Default Value Operators

| Syntax | Description |
|--------|-------------|
| `${VAR:-default}` | Use `default` if VAR is **unset or empty** |
| `${VAR-default}` | Use `default` only if VAR is **unset** |

The colon (`:`) modifier makes the operator also consider empty strings as "missing".

### Error Assertion Operators

| Syntax | Description |
|--------|-------------|
| `${VAR:?error}` | Throw error if VAR is **unset or empty** |
| `${VAR?error}` | Throw error only if VAR is **unset** |
| `${VAR:!error}` | Throw error if VAR is **unset or empty** (alternative) |
| `${VAR!error}` | Throw error only if VAR is **unset** (alternative) |

Both `?` and `!` are supported for assertion syntax. If no error message is provided (e.g., `${VAR:?}`), a generic error message is thrown: `"VAR is not set"`.

### Conditional Replacement Operators

| Syntax | Description |
|--------|-------------|
| `${VAR:+replacement}` | Use `replacement` if VAR is **set and non-empty**, otherwise empty |
| `${VAR+replacement}` | Use `replacement` if VAR is **set** (even if empty), otherwise empty |

## Usage Examples

### Basic Substitution

```typescript
import { interpolate } from "@marianmeres/interpolate";

// Braced syntax (any case)
interpolate("Hello, ${NAME}!", { NAME: "World" }); // "Hello, World!"
interpolate("Hello, ${name}!", { name: "World" }); // "Hello, World!"

// Unbraced syntax (uppercase only)
interpolate("Hello, $NAME!", { NAME: "World" }); // "Hello, World!"
interpolate("Hello, $name!", { name: "World" }); // "Hello, $name!" (not matched)

// Missing variables return empty string
interpolate("Hello, ${NAME}!", {}); // "Hello, !"
// But unbraced missing variables return themselves
interpolate("Hello, $NAME!", {}); // "Hello, $NAME!"
```

### Default Values

```typescript
// Use default if unset OR empty (colon modifier)
interpolate("${VAR:-default}", {}); // "default"
interpolate("${VAR:-default}", { VAR: "" }); // "default"
interpolate("${VAR:-default}", { VAR: "value" }); // "value"

// Use default only if unset (no colon)
interpolate("${VAR-default}", {}); // "default"
interpolate("${VAR-default}", { VAR: "" }); // ""
interpolate("${VAR-default}", { VAR: "value" }); // "value"
```

### Error Assertions

```typescript
// Throw if unset OR empty (colon modifier)
interpolate("${API_KEY:?API key is required}", {});
// throws Error: "API key is required"

interpolate("${API_KEY:?API key is required}", { API_KEY: "" });
// throws Error: "API key is required"

interpolate("${API_KEY:?API key is required}", { API_KEY: "secret" });
// "secret"

// Throw only if unset (no colon)
interpolate("${API_KEY?API key is required}", { API_KEY: "" });
// "" (no error, VAR is set)

// Default error message
interpolate("${VAR:?}", {});
// throws Error: "VAR is not set"
```

### Conditional Replacement

```typescript
// Replace if set AND non-empty (colon modifier)
interpolate("${DEBUG:+[DEBUG MODE]}", { DEBUG: "true" }); // "[DEBUG MODE]"
interpolate("${DEBUG:+[DEBUG MODE]}", { DEBUG: "" }); // ""
interpolate("${DEBUG:+[DEBUG MODE]}", {}); // ""

// Replace if set, even if empty (no colon)
interpolate("${VAR+is set}", { VAR: "value" }); // "is set"
interpolate("${VAR+is set}", { VAR: "" }); // "is set"
interpolate("${VAR+is set}", {}); // ""
```

### Multiple Placeholders

```typescript
// Multiple different variables
interpolate("${GREETING}, ${NAME}!", { GREETING: "Hello", NAME: "World" });
// "Hello, World!"

// Same variable multiple times
interpolate("${A} and ${A}", { A: "value" }); // "value and value"

// Mixed operators
interpolate("${A:-default} ${B:+set} ${C}", { A: "val", B: "yes", C: "end" });
// "val set end"

// Adjacent placeholders (no space)
interpolate("${A}${B}${C}", { A: "1", B: "2", C: "3" }); // "123"
```

### Special Characters

```typescript
// Regex special characters in values are handled safely
interpolate("${VAR}", { VAR: "$.*+?[]{}()|^\\" });
// "$.*+?[]{}()|^\\"

// Newlines and tabs
interpolate("${VAR}", { VAR: "line1\nline2" }); // "line1\nline2"

// Unicode (emoji, non-Latin scripts)
interpolate("${VAR}", { VAR: "Hello 🎉" }); // "Hello 🎉"
interpolate("${VAR}", { VAR: "日本語" }); // "日本語"
```

## Edge Cases and Limitations

### Nested Syntax Not Supported

Nested variable references are not supported:

```typescript
interpolate("${${VAR}}", { VAR: "inner", inner: "value" });
// Returns "}" (inner ${VAR} is replaced first, leaving invalid syntax)
```

### Variable Name Restrictions

- Unbraced `$VAR` only matches uppercase letters, digits, and underscores starting with a letter or underscore.
- Braced `${var}` works with any characters except `}`. If the braced content is
  a literal key of the context, it is looked up directly — otherwise, operator
  characters `-`, `:`, `?`, `!`, `+` trigger operator syntax.

```typescript
// Direct key lookup wins for names containing operator characters
interpolate("${my-var}", { "my-var": "value" }); // "value"
interpolate("${a:b}",   { "a:b":   "value" }); // "value"

// When the literal key is absent, operator parsing applies
interpolate("${FOO-default}", {}); // "default"

// Dots, slashes, spaces, unicode are fine as key characters
interpolate("${my.var}", { "my.var": "value" }); // "value"
```

### Escaping the Dollar Sign

```typescript
interpolate("$$100", {});               // "$100"
interpolate("$$VAR", { VAR: "x" });     // "$VAR" (literal, not interpolated)
interpolate("$${VAR}", { VAR: "x" });   // "${VAR}" (literal, not interpolated)
interpolate("$$$VAR", { VAR: "x" });    // "$x"  (first $$ → $, then $VAR → x)
```

### Values Are Not Re-Interpolated

Substitution is a single pass. Values returned from the context are not
rescanned for placeholders — this prevents cycles and makes output predictable.

```typescript
interpolate("${A}", { A: "${B}", B: "y" }); // "${B}"  (B is NOT expanded)
interpolate("${A}", { A: "$1$&$$" });       // "$1$&$$" (replace-specials preserved)
```

### Incomplete Syntax

Incomplete placeholders are left as-is:

```typescript
interpolate("${VAR", {}); // "${VAR" (unclosed brace)
interpolate("${}", {}); // "${}" (empty name)
interpolate("$ text", {}); // "$ text" (no variable name)
```

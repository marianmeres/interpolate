# @marianmeres/interpolate

Simple helper function which interpolates string variable name placeholders, so that 
`"Hello, ${NAME:-World}!"` works as expected.

Inspired by [docker compose interpolation](https://docs.docker.com/reference/compose-file/interpolation/) 
syntax, with minor extension (read NOTE below). The nested notation is not supported.

The context (source data to interpolate from) is provided as a parameter.

## Supported syntax

| --------------------- | -------------------------------------------------------------- |
| $VAR                  | Basic unbracketed direct substitution                          |
| ${VAR}                | Basic bracketed direct substitution                            |
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
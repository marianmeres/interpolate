# @marianmeres/interpolate

Simple helper function which interpolates string variable name placeholders, so that 
`"Hello, ${NAME:-World}!"` works as expected.

Initially inspired by [docker compose interpolation](https://docs.docker.com/reference/compose-file/interpolation/) syntax.
The assertion syntax is extended to support "!" as well (along with the original "?").

The context (source data to interpolate from) is provided as a parameter.

## Supported syntax

| Syntax                | Note                                                           |
| --------------------- | -------------------------------------------------------------- |
| $VAR                  | Basic unbracketed direct substitution                          |
| ${VAR}                | Basic bracketed direct substitution                            |
| ${VAR:-default}       | Use "default" if VAR is unset or empty                         |
| ${VAR-default}        | Use "default" only if VAR is unset                             |
| ${VAR:?error message} | Throws "error message" if VAR is unset or empty *              |
| ${VAR?error message}  | Throws "error message" only if VAR is unset *                  |
| ${VAR:?}              | Throws error if VAR is unset or empty *                        |
| ${VAR?}               | Throws error only if VAR is unset *                            |
| ${VAR:+replacement}   | Use "replacement" if VAR is set and non-empty, otherwise empty |
| ${VAR+replacement}    | Use "replacement" if VAR is set, otherwise empty               |

* - for the assertion syntax the "!" is supported as well

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
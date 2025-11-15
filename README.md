# @marianmeres/interpolate

Simple helper function which interpolates string variable name placeholders, so that 
`"Hello, ${NAME:-World}!"` works as expected.

Inspired by [docker compose interpolation](https://docs.docker.com/reference/compose-file/interpolation/) syntax.

The context (source data to interpolate from) is provided as a parameter.

## Supported syntax

| Syntax                | Note                                                           |
| --------------------- | -------------------------------------------------------------- |
| $VAR                  | Basic unbracketed notation                                     |
| ${VAR}                | Basic bracketed notation                                       |
| ${VAR:-default}       | Use "default" if VAR is unset or empty                         |
| ${VAR-default}        | Use "default" only if VAR is unset                             |
| ${VAR:?error message} | Throws "error message" if VAR is unset or empty                |
| ${VAR?error message}  | Throws "error message" only if VAR is unset                    |
| ${VAR:+replacement}   | Use "replacement" if VAR is set and non-empty, otherwise empty |
| ${VAR+replacement}    | Use "replacement" if VAR is set, otherwise empty               |

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
interpolate("Hello, ${NAME}", { NAME: "Foo" }); 
```
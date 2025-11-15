# @marianmeres/interpolate

Simple helper function which interpolates string variable name placeholders, so that 
`"Hello, ${NAME:-World}!"` works as expected.

Inspired by [docker compose interpolation](https://docs.docker.com/reference/compose-file/interpolation/) syntax.

The context (source data to interpolate from) is provided as a parameter.

## Supported syntax

| Syntax              | Note                                                           |
| ------------------- | -------------------------------------------------------------- |
| $VAR                | Basic unbracketed notation                                     |
| ${VAR}              | Basic bracketed notation                                       |
| ${VAR:-default}     | Use "default" if unset or empty                                |
| ${VAR-default}      | Use "default" only if unset                                    |
| ${VAR:?error}       | Throws error if unset or empty                                 |
| ${VAR?error}        | Throws error only if unset                                     |
| ${VAR:+replacement} | Use "replacement" if VAR is set and non-empty, otherwise empty |
| ${VAR+replacement}  | Use "replacement" if VAR is set, otherwise empty               |

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

// throws as "NAME" does not exits in context
interpolate("Hello, ${NAME:?error}", {});
```
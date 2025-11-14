# @marianmeres/interpolate

Simple helper function which interpolates string placeholders, so that 
`"Hello, ${name:-World}!"` works as expected.

Roughly inspired by [docker compose interpolation](https://docs.docker.com/reference/compose-file/interpolation/) syntax.

The context (source data to interpolate from) is provided as a parameter (the lib doesn't care whether it's ENV or anything else).

## Supported syntax

| Syntax              | Note                              |
| ------------------- | --------------------------------- |
| $VAR                | Basic unbracketed notation        |
| ${VAR}              | Basic bracketed notation          |
| ${VAR:-default}     | Use default if unset or empty     |
| ${VAR-default}      | Use default only if unset         |
| ${VAR:?error}       | Throws error if unset or empty    |
| ${VAR?error}        | Throws error only if unset        |
| ${VAR:+replacement} | Use replacement if unset or empty |
| ${VAR+replacement}  | Use replacement only if unset     |

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

interpolate("Hello, ${name:-World}"); // Hello, World!
interpolate("Hello, ${name:-World}", { name: "Foo" }); // Hello, Foo!
```
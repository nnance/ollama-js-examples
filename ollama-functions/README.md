# ollama-functions

Example function calling with Ollama. This project uses structured data responses with JSON output and validates the JSON produced by the LLM with ZOD schema.

## Requirements

- [ollama](https://ollama.com) - easily run local models
- [llama2](https://ollama.com/library/llama2) - Open source LLM by Meta

## Stack

- ollama - ollama javascript library
- zod - schema validation
- zod-to-json-schema - zod to json schema

## Getting Started

Install dependencies

```
> pnpm install
```

Run full example

```
> pnpm start
```

Run EMail extraction example

```
> pnpm run extractemail
```

Run Simple weather example

```
> pnpm run getweather
```

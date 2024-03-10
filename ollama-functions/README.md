# ollama-functions

Example function calling with Ollama. This project uses structured data responses with JSON output and validates the JSON produced by the LLM with ZOD schema.

## Key concepts

1. Define the available functions with a ZOD schema
2. Validating the response from the LLM with the schema
3. Prompt splitting to leverage both JSON and Natural Language output

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

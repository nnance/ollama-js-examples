import ollama, { Message } from "ollama";
import { z } from "zod";
import { JsonSchema7ObjectType, zodToJsonSchema } from "zod-to-json-schema";

function systemPrompt(schema: JsonSchema7ObjectType): Message {
  return {
    role: "system",
    content: `
        You are a helpful AI assistant.  The user will enter a question and you will provide an answer.  
        Output in JSON using the schema defined here: ${JSON.stringify(schema.properties)}.
        `,
  };
}

function capitalLocationPrompt(country: string): Message {
  return {
    role: "user",
    content: `what is the decimal latitude and decimal longitude of the capital of ${country}?`,
  };
}

const Location = z.object({
  city: z.string().describe("The name of the city"),
  latitude: z.number().describe("The decimal latitude of the city"),
  longitude: z.number().describe("The decimal longitude of the city"),
});

const jsonSchema = zodToJsonSchema(Location) as JsonSchema7ObjectType;

const systemMessage = systemPrompt(jsonSchema);
const userMessage = capitalLocationPrompt("france");

ollama
  .chat({
    model: "mistral",
    messages: [systemMessage, userMessage],
    format: "json",
  })
  .then((result) => {
    return Location.parse(JSON.parse(result.message.content));
  })
  .then((location) => {
    console.log(location);
  });

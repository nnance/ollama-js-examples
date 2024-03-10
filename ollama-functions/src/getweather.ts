import ollama, { Message } from "ollama";

const systemprompt = `
You will be given a question to answer and a schema. 
You will have to extract the information requested in the question and generate output in JSON observing the schema provided. 
If the schema shows a type of integer or number, you must only show a integer for that field. 
A string should always be a valid string. 
If a value is unknown, leave it empty. 
Output the JSON with extra spaces to ensure that it pretty prints.
`;

const schema = {
  get_current_weather: {
    descriptoin: "Get the current weather for a location",
    parameters: {
      location: {
        type: "string",
        description: "The city and state, e.g. San Francisco, CA",
        required: true,
      },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "The unit of temperature to return",
      },
    },
  },
};

const example = `what is the current weather in San Diego, CA?`;

const result = JSON.stringify(
  { get_current_weather: { location: "San Diego, CA", unit: "celsius" } },
  null,
  2
);

const question = `what is the current weather in Oklahoma City, OK?`;

const prompt = `
Review the question and determine the location of the weather. 
Only add data to the mostly appropriate field. 
Don't make up fields that aren't in the schema. 
If there isn't a value for a field, use null. 
Output should be in JSON.

Schema: \n${JSON.stringify(schema, null, 2)}
Question: \n${question}
`;

const messages: Message[] = [
  {
    role: "system",
    content: systemprompt,
  },
  {
    role: "user",
    content: example,
  },
  {
    role: "assistant",
    content: result,
  },
  {
    role: "user",
    content: prompt,
  },
];

ollama
  .chat({
    model: "llama2",
    messages,
    format: "json",
    options: {
      temperature: 0.0,
    },
  })
  .then((result) => JSON.parse(result.message.content))
  .then((json) => console.dir(json, { depth: null }));

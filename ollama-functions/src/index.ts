import ollama, { Message } from "ollama";
import z from "zod";
import { JsonSchema7Type, zodToJsonSchema } from "zod-to-json-schema";

const weatherSchema = z.object(
  {
    location: z.string({
      description: "The city and state, e.g. San Francisco, CA",
    }),
    unit: z
      .enum(["celsius", "fahrenheit"], {
        description: "The unit of temperature to return",
      })
      .optional(),
  },
  {
    description: "Get the current weather in a given location",
  }
);

const weatherForecastSchema = z.object(
  {
    location: z.string({
      description: "The city and state, e.g. San Francisco, CA",
    }),
    format: z.enum(["celsius", "fahrenheit"], {
      description:
        "The temperature unit to use. Infer this from the users location.",
    }),
    num_days: z.number({
      description: "The number of days to forecast",
    }),
  },
  {
    description: "Get the weather forecast for a given location",
  }
);

const tools = z.object({
  get_current_weather: weatherSchema.optional(),
  get_weather_forecast: weatherForecastSchema.optional(),
});

const schema = zodToJsonSchema(tools);

async function useTools(
  question: string,
  tools: z.Schema,
  schema: JsonSchema7Type
) {
  function getSystemPrompt(): Message {
    return {
      role: "system",
      content: `
    You will be given a question to answer and a schema. 
    The schema consists of a list of functions that you can use to answer the question. 
    If you need to use a function, you will need to provide the parameters for that function. 
    If multiple functions are provided, you may need to use more than one to answer the question. 
    You will have to extract the information requested in the question and generate output in JSON observing the schema provided. 
    If the schema shows a type of integer or number, you must only show a integer for that field. 
    A string should always be a valid string. 
    If a value is unknown, leave it empty. 
    Output the JSON with extra spaces to ensure that it pretty prints.
    `,
    };
  }

  function getUserPrompt(schema: JsonSchema7Type, question: string): Message {
    return {
      role: "user",
      content: `
    Think step by step about how you would answer the question completely. 
    Don't use the schema unless you are sure of the required fields. 
    Only add data to the mostly appropriate field. 
    Don't make up fields that aren't in the schema. 
    If there isn't a value for a field, use null. 
    Output should be in JSON.
    
    Schema: \n${JSON.stringify(schema, null, 2)}
    Question: \n${question}
    `,
    };
  }

  const result = await ollama.chat({
    model: "llama2",
    messages: [getSystemPrompt(), getUserPrompt(schema, question)],
    format: "json",
    options: {
      temperature: 0.0,
    },
  });

  const response = JSON.parse(result.message.content);
  return tools.parse(response);
}

function logFunctions(funcs: { [key: string]: object }) {
  if (Object.keys(funcs).length === 0) {
    console.log("No functions called");
  } else {
    Object.keys(funcs).forEach((key) => {
      console.log(
        `function called: ${key} with params: ${JSON.stringify(funcs[key])}`
      );
    });
    console.log("\n");
  }
  return funcs;
}

function processFunctions(funcs: z.infer<typeof tools>) {
  return Object.keys(funcs).map((key) => {
    if (key === "get_current_weather") {
      return {
        current_weather: {
          temprature: 55,
          unit: "fahrenheit",
          conditions: "clear",
        },
      };
    } else if (key === "get_weather_forecast") {
      const num_days = (funcs[key] as { num_days: number }).num_days;
      const weather_forecast = [];
      for (let i = 0; i < num_days; i++) {
        weather_forecast.push({
          temprature: 42 + i * 10,
          unit: "fahrenheit",
          conditions: "clear",
        });
      }

      return { weather_forecast };
    }
  });
}

function respondToUser(question: string, response: object) {
  const messages: Message[] = [
    {
      role: "system",
      content: `
    You will be given a JSON response from the API.  
    Use the schema to extract the information requested in the user query and provide a response in natural language.

    Response: ${JSON.stringify(response)}
    `,
    },
    {
      role: "user",
      content: question,
    },
  ];

  return ollama.chat({
    model: "llama2",
    messages,
    options: {
      temperature: 0.0,
    },
  });
}

async function executeChain(
  query: string,
  tools: z.Schema,
  schema: JsonSchema7Type
) {
  return useTools(query, tools, schema)
    .then((funcs) => logFunctions(funcs))
    .then((result) => processFunctions(result))
    .then((result) => respondToUser(query, result))
    .then((result) => result.message.content);
}

const query =
  "what is the current weather and weekly forecast for Oklahoma City, OK?";

console.log(`Executing query:\n${query}\n\n`);
executeChain(query, tools, schema).then((result) =>
  console.log(`Final result:\n${result}`)
);

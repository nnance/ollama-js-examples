import ollama, { Message } from "ollama";

const tools = [
  {
    type: "function",
    function: {
      name: "get_stock_fundamentals",
      description: `
    get_stock_fundamentals(symbol: str) -> dict - Get fundamental data for a given stock symbol using yfinance API.
      
    Args: symbol (str): The stock symbol.
      
    Returns: dict: A dictionary containing fundamental data.
    `,
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
          },
        },
        required: ["symbol"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_decimal_values",
      description: `
    add_decimal_values(num1: number, num2: number) -> number - Add two decimal numbers together
      
    Args: num1 (number): First value, num2 (number): Second value
      
    Returns: number - The sum of the two numbers
    `,
      parameters: {
        type: "object",
        properties: {
          num1: {
            type: "number",
          },
          num2: {
            type: "number",
          },
        },
        required: ["num1", "num2"],
      },
    },
  },
];

const schema = {
  properties: {
    arguments: { title: "Arguments", type: "object" },
    name: { title: "Name", type: "string" },
  },
  required: ["arguments", "name"],
  title: "FunctionCall",
  type: "object",
};

const systemPrompt = `
Role: |
  You are a function calling AI agent with self-recursion.
  You can call only one function at a time and analyse data you get from function response.
  You are provided with function signatures within <tools></tools> XML tags.
  The current date is: {date}.
Objective: |
  You may use agentic frameworks for reasoning and planning to help with user query.
  Please call a function and wait for function results to be provided to you in the next iteration.
  Don't make assumptions about what values to plug into function arguments.
  Once you have called a function, results will be fed back to you within <tool_response></tool_response> XML tags.
  Don't make assumptions about tool results if <tool_response> XML tags are not present since function hasn't been executed yet.
  Analyze the data once you get the results and call another function.
  At each iteration please continue adding the your analysis to previous summary.
  Your final response should directly answer the user query with an anlysis or summary of the results of function calls.
Tools: |
  Here are the available tools:
  <tools>${JSON.stringify(tools)}</tools>
  If the provided function signatures doesn't have the function you must call, you may write executable python code in markdown syntax and call code_interpreter() function as follows:
  <tool_call>
  {{"arguments": {{"code_markdown": <python-code>, "name": "code_interpreter"}}}}
  </tool_call>
  Make sure that the json object above with code markdown block is parseable with json.loads() and the XML block with XML ElementTree.
Schema: |
  Use the following pydantic model json schema for each tool call you will make:
  ${JSON.stringify(schema)}
Instructions: |
  At the very first turn you don't have <tool_results> so you shouldn't not make up the results.
  Please keep a running summary with analysis of previous function results and summaries from previous iterations.
  Do not stop calling functions until the task has been accomplished or you've reached max iteration of 10.
  Calling multiple functions at once can overload the system and increase cost so call one function at a time please.
  If you plan to continue with analysis, always call another function.
  For each function call return a valid json object (using doulbe quotes) with function name and arguments within <tool_call></tool_call> XML tags as follows:
  <tool_call>
  {{"arguments": <args-dict>, "name": <function-name>}}
  </tool_call>
  `;

const assistantResponse = {
  arguments: { symbol: "TSLA" },
  name: "get_stock_fundamentals",
};

const toolResponse = {
  name: "get_stock_fundamentals",
  content: {
    symbol: "TSLA",
    company_name: "Tesla, Inc.",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    market_cap: 611384164352,
    pe_ratio: 49.604652,
    pb_ratio: 9.762013,
    dividend_yield: null,
    eps: 4.3,
    beta: 2.427,
    "52_week_high": 299.29,
    "52_week_low": 152.37,
  },
};

function callTool(tool: { name: string; arguments: object }) {
  console.log(
    `function called: ${tool.name} with params: ${JSON.stringify(tool.arguments)}\n`
  );

  if (tool.name === "get_stock_fundamentals") {
    return `<tool_response>${JSON.stringify(toolResponse)}</tool_response>`;
  }
  return `No function called`;
}

async function useTools(question: string) {
  const messages: Message[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: question,
    },
  ];

  const firstResponse = await ollama.chat({
    model: "adrienbrault/nous-hermes2pro:Q8_0",
    messages,
  });

  messages.push(firstResponse.message);

  if (firstResponse.message.content.indexOf("<tool_call>") === 0) {
    const { content } = firstResponse.message;

    try {
      const elementContent = content.slice(12, content.length - 13);
      const toolJson = elementContent.slice(1, elementContent.length - 2);
      const toolCall = JSON.parse(toolJson);
      const toolResponse = callTool(toolCall);

      messages.push({
        role: "system",
        content: toolResponse,
      });

      const nextResponse = await ollama.chat({
        model: "adrienbrault/nous-hermes2pro:Q8_0",
        messages,
      });

      messages.push(nextResponse.message);
    } catch (e) {
      console.error(e);
      console.dir(firstResponse.message);
    }
  }

  return messages;
}

useTools("Fetch the stock fundamentals data for Tesla (TSLA)")
  .then((messages) => console.log(messages[messages.length - 1].content))
  .catch(console.error);

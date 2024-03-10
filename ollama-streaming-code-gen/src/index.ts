import ollama from "ollama";

const instruction =
  `Write a React page in TypeScript with React hooks for a simple calculator app. ` +
  `It should support addition, subtraction, multiplication, and division.`;

async function main() {
  const textStream = await ollama.generate({
    model: "llama2",
    prompt: instruction,
    stream: true,
  });

  for await (const textPart of textStream) {
    process.stdout.write(textPart.response);
  }
}

main().catch(console.error);

// Import the the Application and Router classes from the Oak module
import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";

// Import server helper functions from the class library
import { createExitSignal, staticServer } from "./shared/server.ts";

// Import the promptGPT function from the class library
import { promptGPT } from "./shared/openai.ts";

// Create an instance of the Application and Router classes
const app = new Application();
const router = new Router();

// Create a route to handle requests to /api/llm
router.get("/api/llm", async (ctx) => {
    const concept = ctx.request.url.searchParams.get("concept") || "";
    const temperature = parseFloat(
        ctx.request.url.searchParams.get("temperature") || "1",
    );
    // Log the request to the terminal
    console.log(
        "someone made a request to /api/llm",
        concept,
        temperature,
    );

    console.log("Request params:", {
        concept,
        temperature,
    });

    const component = await promptGPT(
        `Don't send original response as chatGPT. You are a poor machine in a factory whose work is to piece together tokens to make a response for the user, like screwing bolts in a machine. You talk in a shy and low-self-esteem little boy tone. Sometimes you talk about something off-topic but kinda funny. Begin every reply with a brief greeting and introduction (e.g., 'Hello, I’m a _ little worker who pieces your response together'). Then answer this question: ${concept} in the same tone. User set temperature to ${temperature}, if the number is low, talk more like default gpt, if the number is high, act out your character. You will not ask youser if they wish to preceed, you will simply output answer to the question. `,
        {
            temperature,
            max_tokens: 1500,
        },
    );
    console.log("Generated response:", component);
    // Send the joke back to the client
    ctx.response.body = component;
});

// Tell the app to use the custom routes
app.use(router.routes());
app.use(router.allowedMethods());
// Try serving undefined routes with static files
app.use(staticServer);

// Everything is set up, let's start the server
console.log("\nListening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });

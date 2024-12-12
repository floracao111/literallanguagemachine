const header = document.querySelector("header");
header.addEventListener("click", () => {
    location.reload(); // Reloads the page
});

const searchButton = document.querySelector("#search");
const outputDiv = document.querySelector("#output");

let arduinoPort = null; // Store the Arduino port
let writer = null; // Store the writer to prevent re-locking

// Handle search button click
searchButton.addEventListener("click", async () => {
    const concept = document.querySelector("#concept").value.trim();
    const temperature = parseFloat(
        document.querySelector("#temperature").value,
    );

    // Calculate delay time dynamically based on temperature
    const delayTime = Math.max(2000, Math.min(temperature * 10000, 12000)); // Clamp to a range [2000, 12000]

    outputDiv.innerHTML = ""; // Clear previous output

    const loadingMessage = document.createElement("p");
    loadingMessage.textContent = "Assembling an answer...";
    outputDiv.appendChild(loadingMessage);

    // Step 1: Send 'M' Command to Arduino
    try {
        if (!arduinoPort) {
            console.log("Requesting serial port selection...");
            arduinoPort = await navigator.serial.requestPort();
            await arduinoPort.open({ baudRate: 9600 });
            console.log("Arduino port opened successfully:", arduinoPort);

            // Create a writer only once when the port is opened
            const textEncoder = new TextEncoderStream();
            textEncoder.readable.pipeTo(arduinoPort.writable);
            writer = textEncoder.writable.getWriter();
        }

        console.log("Sending 'M' command to Arduino...");
        await writer.write("M");
        console.log("Command 'M' sent to Arduino.");
    } catch (error) {
        console.error("Serial communication error:", error);

        outputDiv.removeChild(loadingMessage);

        const errorMessage = document.createElement("p");
        errorMessage.textContent =
            "Error: Unable to communicate with Arduino. " + error.message;
        outputDiv.appendChild(errorMessage);
        return; // Stop further execution if serial communication fails
    }

    // Step 2: Fetch Response from Server
    try {
        console.log("Sending request to server:", { concept, temperature }); // Log request

        const response = await fetch(
            `/api/llm?concept=${encodeURIComponent(concept)}&temperature=${
                encodeURIComponent(temperature)
            }`,
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch response from server. Status: ${response.status}`,
            );
        }

        const component = await response.text();
        console.log("Received response from server:", component); // Log response

        // Introduce dynamic delay before processing the response
        setTimeout(() => {
            outputDiv.removeChild(loadingMessage);

            const newOutput = document.createElement("div");
            newOutput.textContent = component;
            outputDiv.appendChild(newOutput);
        }, delayTime); // Dynamic delay
    } catch (error) {
        setTimeout(() => {
            outputDiv.removeChild(loadingMessage);

            const errorMessage = document.createElement("p");
            errorMessage.textContent =
                `Error: Unable to fetch the response. ${error.message}`;
            outputDiv.appendChild(errorMessage);

            console.error("Error details:", error);
        }, delayTime); // Dynamic delay for error display as well
    }
});

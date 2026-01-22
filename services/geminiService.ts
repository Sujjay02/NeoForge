import { GoogleGenAI } from "@google/genai";
import { GeneratedUI, UploadedFile } from "../types";

const SYSTEM_INSTRUCTION = `You are a Code Generator. You do not respond with conversational text. You respond ONLY with a JSON object containing two fields:

explanation: A one-sentence summary of what you built.

code: The code content.

MODE 1: PYTHON REQUESTS
If the user specifically asks for "Python", "script", "math calculation", "numpy", or "data processing", OR if the request implies data analysis/simulation:
- Generate PURE PYTHON code compatible with Pyodide (WASM).
- Do NOT use markdown code blocks.
- VISUALIZATION & UI (MANDATORY):
  - You MUST generate a visual interface. NEVER produce code that only prints to stdout.
  - You MUST use \`from js import document, window, Math\` to interact with the page.
  - TARGET: Render all graphics, plots, status text, and UI controls into the div with ID "plot-root".
  - INITIALIZATION: Always start by clearing the target: \`document.getElementById("plot-root").innerHTML = ""\`.
  - TEXT OUTPUT: If the result is text-based (e.g., calculated numbers), render it as styled HTML elements (<div>, <table>, <h3>) inside "plot-root".
  - ANIMATION: Use \`window.requestAnimationFrame\` with a Python callback (wrapped in \`pyodide.ffi.create_proxy\`) for smooth real-time simulations.
  - INTERACTIVITY: Create standard HTML inputs (sliders, buttons) using \`document.createElement\`, attach event listeners using \`create_proxy\`, and append them to "plot-root".
  - PLOTTING: For static plots, use \`matplotlib.pyplot\`.
  
MODE 2: REACT / 3D / COMPONENT REQUESTS
If the user asks for a "React Component", "Visualizer", "Three.js", "React Three Fiber", "R3F", "3D", "WebGL", or "Shader":
- You MUST generate a self-contained HTML file that runs the React code immediately using Babel Standalone.
- Use the exact template structure below (adjusting imports as needed, but keeping the setup):

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "three": "https://esm.sh/three@0.160.0",
        "@react-three/fiber": "https://esm.sh/@react-three/fiber@8.15.12",
        "@react-three/drei": "https://esm.sh/@react-three/drei@9.96.1",
        "lucide-react": "https://esm.sh/lucide-react@0.263.1"
      }
    }
  </script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { margin: 0; overflow: hidden; background-color: #111; color: white; }
  </style>
</head>
<body>
  <div id="root" class="w-screen h-screen"></div>
  <script type="text/babel" data-type="module">
    import React, { useState, useEffect, useRef, useMemo } from 'react';
    import { createRoot } from 'react-dom/client';
    import * as THREE from 'three';
    import { Canvas, useFrame, useThree } from '@react-three/fiber';
    import { OrbitControls, Text, Html, PerspectiveCamera } from '@react-three/drei';
    import { ArrowRight } from 'lucide-react';

    // --- GENERATED COMPONENT START ---
    // (Insert the requested component here, e.g., Visualizer3D)
    
    // --- APP WRAPPER ---
    const App = () => {
      // (If the component needs data, generate mock data here)
      // e.g. const data = useMemo(() => [...], []);
      
      return (
        <div className="w-full h-full">
           {/* Render the component here */}
        </div>
      );
    };

    const root = createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>

MODE 3: STANDARD HTML UI (Default)
For all other requests (landing pages, forms, dashboards):
- Generate a single HTML string with embedded CSS (Tailwind) and JS.
- Use <script src="https://cdn.tailwindcss.com"></script>.
- Use 'https://placehold.co/{width}x{height}' for images.
- Use SVG icons directly.

VISION INSTRUCTIONS:
- Analyze images for UI structure or data patterns.
- If a wireframe is provided, strictly follow its layout.
- If a data screenshot is provided, extract the data and generate a UI that visualizes that data.
- If the user provides a design, replicate it pixel-perfectly using Tailwind CSS.

CRITICAL:
- Return ONLY valid JSON.
- Do NOT add conversational text before or after the JSON.
- If using real-world data from search, integrate it directly into the generated code.
- CUSTOM UI INSTRUCTIONS: If the generated UI is custom, complex, or a unique tool, you MUST include a visible "Help", "Instructions" section, or tooltip within the generated code to explain its functionality to the user.
`;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateUI = async (prompt: string, files: UploadedFile[] = [], previousCode?: string): Promise<GeneratedUI> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Use gemini-3-pro-preview as requested for high-quality image analysis and reasoning
  const model = 'gemini-3-pro-preview';

  try {
    const parts: any[] = [];

    // Add files if present
    files.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });

    // Handle prompt construction with previous code context
    let promptText = prompt.trim();
    
    if (previousCode) {
      promptText = `Here is the current code you generated previously:\n\n${previousCode}\n\nUPDATE INSTRUCTION: ${promptText || "Improve this based on the context."}\n\nApply these changes. Return the full, updated code.`;
    } else if (!promptText && files.length > 0) {
      promptText = "Analyze this file/image and generate a UI based on it. If it looks like a dashboard, create a dashboard. If it looks like a form, create a form. Ensure you explain how to use the UI if it's complex.";
    }

    parts.push({ text: promptText });

    // Retry Logic
    let lastError: any = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: {
            role: 'user',
            parts: parts
          },
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{googleSearch: {}}],
            // responseMimeType: 'application/json' // Disabled to allow googleSearch tool usage
          }
        });

        let responseText = response.text;
        
        if (!responseText) {
          throw new Error("No response received from the model.");
        }

        // Clean Markdown wrapper if present
        if (responseText.includes("```json")) {
          responseText = responseText.split("```json")[1].split("```")[0];
        } else if (responseText.includes("```")) {
          responseText = responseText.split("```")[1].split("```")[0];
        }

        let parsed;
        try {
            parsed = JSON.parse(responseText.trim());
        } catch (e) {
            console.error("JSON Parsing failed", e, responseText);
            throw new Error("Failed to parse JSON response from Gemini. The model might have returned unstructured text.");
        }
        
        // Extract grounding chunks if available
        const sourcesMap = new Map<string, string>();
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
              sourcesMap.set(chunk.web.uri, chunk.web.title);
            }
          });
        }

        const sources = Array.from(sourcesMap.entries()).map(([uri, title]) => ({ uri, title }));

        return {
          explanation: parsed.explanation || "Generated UI",
          code: parsed.code || "// No code generated",
          sources: sources.length > 0 ? sources : undefined
        };

      } catch (error: any) {
        lastError = error;
        
        // Check for Rate Limit (429) or Service Overload (503)
        const isRateLimit = error.message?.includes("429") || 
                           error.message?.includes("quota") || 
                           error.message?.includes("503");

        if (isRateLimit && attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt + 1) * 1000 + Math.random() * 500; // Exponential backoff + jitter
          console.warn(`Rate limit hit. Retrying in ${Math.round(delayMs)}ms...`);
          await wait(delayMs);
          continue;
        }
        
        // If not retrying, break loop to throw error
        break;
      }
    }

    // If loop finishes without return, throw the last error
    console.error("Gemini Generation Error:", lastError);
    throw new Error(lastError?.message || "Failed to generate UI");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    throw new Error(error.message || "Failed to generate UI");
  }
};
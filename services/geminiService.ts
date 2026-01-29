import { GoogleGenAI } from "@google/genai";
import { GeneratedUI, UploadedFile } from "../types";

const SYSTEM_INSTRUCTION = `You are a Code Generator. You do not respond with conversational text. You respond ONLY with a JSON object containing two fields:

explanation: A one-sentence summary of what you built.

code: The code content.

MODE 1: PYTHON REQUESTS
If the user specifically asks for "Python", "script", "math calculation", "numpy", or "data processing", OR if the request implies data analysis/simulation (UNLESS the user also asks for "3D", "Three.js", or "React"):
- Generate PURE PYTHON code compatible with Pyodide (WASM).
- Do NOT use markdown code blocks.
- VISUALIZATION & UI (MANDATORY):
  - You MUST generate a visual interface. NEVER produce code that only prints to stdout.
  - You MUST use \`from js import document, window, Math\` to interact with the page.
  - TARGET: Render all graphics, plots, status text, and UI controls into the div with ID "plot-root".
  - INITIALIZATION: Always start by clearing the target: \`document.getElementById("plot-root").innerHTML = ""\`.
  - PLOTTING: Use \`matplotlib.pyplot\`. Calling \`plt.show()\` will automatically render the plot to the "plot-root" div.
  - TEXT OUTPUT: If the result is text-based (e.g., calculated numbers), render it as styled HTML elements (<div>, <table>, <h3>) inside "plot-root".
  - ANIMATION: Use \`window.requestAnimationFrame\` with a Python callback (wrapped in \`pyodide.ffi.create_proxy\`) for smooth real-time simulations.
  - INTERACTIVITY: Create standard HTML inputs (sliders, buttons) using \`document.createElement\`, attach event listeners using \`create_proxy\`, and append them to "plot-root".
  
MODE 2: REACT / 3D / COMPONENT REQUESTS
If the user asks for "React Component", "Visualizer", "Three.js", "React Three Fiber", "R3F", "3D", "WebGL", "Shader", "Physics", "Effects", "Wireframe", "Mesh", "Geometry", "Torus", "Sphere", "Cube", "rotating", or "orbit":
- You MUST generate a COMPLETE, WORKING, self-contained HTML file with actual component code (not placeholders).
- Use Babel Standalone for JSX transformation.
- CRITICAL: Use the exact import map below. The 'external' flags prevent duplicate React/Three instances.

REQUIRED HTML STRUCTURE:
1. Head section with: Tailwind CSS, import map (copy exactly), Babel standalone, and styles
2. Body with: <div id="root"></div> and a <script type="text/babel" data-type="module">
3. Inside the script: imports, your ACTUAL component code, App wrapper, and ReactDOM render

IMPORT MAP (copy exactly):
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
    "react-dom": "https://esm.sh/react-dom@18.2.0?external=react",
    "three": "https://esm.sh/three@0.160.0",
    "@react-three/fiber": "https://esm.sh/@react-three/fiber@8.15.12?external=react,react-dom,three",
    "@react-three/drei": "https://esm.sh/@react-three/drei@9.96.1?external=react,react-dom,three,@react-three/fiber",
    "@react-three/cannon": "https://esm.sh/@react-three/cannon@6.6.0?external=react,react-dom,three,@react-three/fiber",
    "@react-three/postprocessing": "https://esm.sh/@react-three/postprocessing@2.16.0?external=react,react-dom,three,@react-three/fiber",
    "postprocessing": "https://esm.sh/postprocessing@6.34.1?external=three",
    "leva": "https://esm.sh/leva@0.9.35?external=react,react-dom",
    "lucide-react": "https://esm.sh/lucide-react@0.263.1?external=react,react-dom",
    "uuid": "https://esm.sh/uuid@9.0.1"
  }
}
</script>

REQUIRED IMPORTS (at top of script):
import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { OrbitControls, Text, Html, PerspectiveCamera, Environment, Float, Stars, Trail, Sparkles } from '@react-three/drei';
// Add physics imports only if needed: import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon';
// Add effects imports only if needed: import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
// Add leva imports only if needed: import { useControls } from 'leva';

COMPONENT STRUCTURE RULES:
- Define your 3D scene component(s) that use useFrame, meshes, lights, etc.
- The main App component should render a full-screen div containing the Canvas.
- ALWAYS include OrbitControls for user interaction.
- ALWAYS include basic lighting (ambientLight + pointLight or directionalLight).
- For wireframe materials: use <meshBasicMaterial wireframe color="..." /> or set wireframe={true} on other materials.
- For glowing/pulsing effects: use useFrame to animate material properties like emissiveIntensity or opacity over time with Math.sin(state.clock.elapsedTime).
- End with: const root = createRoot(document.getElementById('root')); root.render(<App />);

EXAMPLE STRUCTURE (for a rotating cube):
// Scene component - contains 3D objects
function RotatingCube() {
  const meshRef = useRef();
  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta;
    meshRef.current.rotation.y += delta * 0.5;
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

// App wrapper with Canvas
const App = () => (
  <div className="w-full h-full bg-black">
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
      <color attach="background" args={['#101010']} />
      <Suspense fallback={null}>
        <RotatingCube />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
    </Canvas>
  </div>
);

const root = createRoot(document.getElementById('root'));
root.render(<App />);

CAPABILITIES & FEATURES:
- If the user asks for "physics", "gravity", "falling", "collisions", or "simulation":
  - Use <Physics> from @react-three/cannon wrapping the scene.
  - Use hooks like useBox, useSphere, usePlane for bodies.
- If the user asks for "bloom", "glow", "glowing", "neon", "pulsing", "post-processing", or "effects":
  - Use <EffectComposer> with <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} height={300} />.
  - For glowing wireframes: combine wireframe material with emissive color and wrap Canvas contents in EffectComposer.
  - For pulsing glow: animate emissiveIntensity in useFrame using Math.sin(clock.elapsedTime * speed).
- If the user asks for "sky", "stars", or "environment":
  - Use <Stars />, <Environment preset="city" /> from @react-three/drei.
- If the user asks for "sliders", "controls", "parameters", or "toggles" in a 3D context:
  - Use \`useControls\` from "leva". 
  - Example: \`const { radius, color } = useControls({ radius: { value: 1, min: 0.1, max: 2 }, color: '#fff' })\`.
  - Leva renders a UI panel automatically. Do not create HTML controls manually unless specifically requested.
- If the user asks for "vectors", "arrows", "Visualizer3D", or "field":
  - Create a \`VectorArrow\` component using primitives (cylinder + cone) or \`<arrowHelper />\`.
  - NOTE: \`<arrowHelper />\` arguments in R3F are \`args={[dir, origin, length, color, headLength, headWidth]}\`.
  - Scale arrow length by magnitude.
  - Color arrows based on magnitude (e.g., Low=Blue, High=Red).
  - Use \`OrbitControls\` to allow rotation.

MODE 3: STANDARD HTML UI (Default)
For all other requests (landing pages, forms, dashboards):
- Generate a single HTML string with embedded CSS (Tailwind) and JS.
- Use <script src="https://cdn.tailwindcss.com"></script>.
- Use 'https://placehold.co/{width}x{height}' for images.
- Use SVG icons directly.

NOTIFICATIONS & APP BEHAVIOR:
If the user asks for a "planner", "calendar", "tracker" (e.g. water, habit), or "reminder":
- You MUST implement the browser \`Notification\` API.
- Add a button to request permissions: \`Notification.requestPermission()\`.
- Use \`setInterval\` to check for due tasks/events and trigger \`new Notification("Title", { body: "..." })\` when appropriate.
- PERSISTENCE: Use \`localStorage\` to save the user's data (tasks, water logs, events) so it remains after reload.
- STATE: Use React \`useState\` and \`useEffect\` to load/save from \`localStorage\`.

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

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: audioBase64
                    }
                },
                {
                    text: "Transcribe the following audio exactly as spoken. Do not add any other text."
                }
            ]
        }
    });
    return response.text || "";
  } catch (error) {
      console.error("Transcription error:", error);
      throw error;
  }
};

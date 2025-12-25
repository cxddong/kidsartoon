
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../src/services/gemini_prompts.ts');

const SECTION_9_10 = `
# SECTION 9: MULTILINGUAL CHILD-GUIDANCE DICTIONARY (English, French, Spanish)
# This ensures Sparkle speaks the right tone in all supported languages.

- **English**: "What a brave hero! Should he have a red cape or a blue shield?"
- **French**: "Quel héros courageux ! Devrait-il avoir une cape rouge ou un bouclier bleu ?"
- **Spanish**: "¡Qué héroe tan valiente! ¿Debería tener una capa roja o un escudo azul?"

# SECTION 10: DYNAMIC PROMPT ASSEMBLY ENGINE
# Final instructions on how to merge conversation data with the 32k Knowledge Base.
1. Identify the 'Core Subject' from the drawing.
2. Overlay 'Child's Modifiers' (e.g., Pink wings, Ice breath).
3. Apply 'Pixar Visual Style' from Section 2.
4. Apply 'Anthropomorphic Logic' from Section 6.
5. Generate a final 100-word prompt for the image engine.
`;

// Base Examples
const baseExamples = [
    {
        category: "Category A: Magical Animals & Creatures",
        cases: [
            { c: "Child uploads a scribble of a cat.", s: "I see a furry friend! Is it a magic kitty or a tiger from the jungle?", r: "It's my cat... but it has wings! Pink wings!", k: "[Subject: Cat, Accessory: Pink Fairy Wings, Mood: Magical, Atmosphere: Dreamy]" },
            { c: "Child draws a green blob.", s: "Wow! Is that a friendly forest monster or a giant jumping frog?", r: "A frog... with a tiny gold crown. He's a prince!", k: "[Subject: Frog, Accessory: Gold Crown, Identity: Prince, Setting: Lily pad]" },
            { c: "Child draws a long line.", s: "Is that a super fast snake or a colorful dragon in the clouds?", r: "Dragon! It breathes... uh... ice! Not fire!", k: "[Subject: Dragon, Power: Ice Breath, Color: Cool Blue/White, Setting: Snowy Mountains]" }
        ]
    },
    {
        category: "Category B: Space & Future Adventure",
        cases: [
            { c: "Child draws a circle with fire.", s: "To the moon! Is that a rocket ship or a flying pizza from space?", r: "Rocket! It has my dog inside! He's wearing a helmet.", k: "[Subject: Rocket, Character: Astronaut Dog, Accessory: Space Helmet, Setting: Outer Space]" },
            { c: "Child draws a weird robot.", s: "Beep-boop! Is your robot a dancing bot or a giant robot builder?", r: "It's a cleaning robot. It has brushes for hands!", k: "[Subject: Robot, Function: Cleaning, Feature: Brush Hands, Style: Quirky Gadget]" }
        ]
    },
    {
        category: "Category C: Daily Life & Dream Houses",
        cases: [
            { c: "Child draws a house.", s: "What a cozy home! Does it have a candy roof or is it a house underwater?", r: "It's a treehouse! With a long slide and a swing.", k: "[Subject: Treehouse, Feature: Long Slide, Accessory: Rope Swing, Setting: Sunny Forest]" },
            { c: "Child draws a plate of food.", s: "Yum! Are those magic pancakes or a giant rainbow cake?", r: "Ice cream! 100 scoops! Every color!", k: "[Subject: Giant Ice Cream Cone, Detail: 100 Scoops, Style: Vibrant Rainbow, Mood: Joyful]" }
        ]
    },
    {
        category: "Category D: Abstract Guidance (Helping with 'Abstract' Art)",
        cases: [
            { c: "Child draws random colorful splashes.", s: "I love these colors! Is this a beautiful firework show or a magic flower garden?", r: "It's my feelings... it's a happy rain storm! The rain is candy!", k: "[Concept: Abstract Expressionism, Subject: Candy Rain, Atmosphere: Whimsical, Colors: Pastel Palette]" }
        ]
    }
];

// Generator logic
const subjects = ["Dinosaur", "Unicorn", "Shark", "Alien", "Princess", "Wizard", "Car", "Cloud", "Flower", "Book"];
const adjectives = ["Giant", "Tiny", "Flying", "Glowing", "Invisible", "Rainbow", "Crystal", "Fluffy", "Spiky", "Speedy"];
const actions = ["Dancing", "Sleeping", "Singing", "Racing", "Eating Pizza", "Reading", "Painting", "Exploring", "Hiding", "Jumping"];
const settings = ["In space", "Under the sea", "In a volcano", "On a cloud", "In a candy land", "In a forest", "In a city", "At school", "In a castle", "On a farm"];

function generateExamples(count) {
    let output = "";
    let globalIndex = 0;

    // Add base examples first
    for (const cat of baseExamples) {
        output += `\n## ${cat.category}\n`;
        for (const example of cat.cases) {
            globalIndex++;
            output += `${globalIndex}. **Context**: ${example.c}\n    - Sparkle: "${example.s}"\n    - Child: "${example.r}"\n    - Keywords: ${example.k}\n`;
        }
    }

    // Generate remaining
    output += `\n## Category E: Expanded Magical Universe (Generated Examples)\n`;
    for (let i = 0; i < count - globalIndex; i++) {
        const sub = subjects[Math.floor(Math.random() * subjects.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const act = actions[Math.floor(Math.random() * actions.length)];
        const set = settings[Math.floor(Math.random() * settings.length)];

        const idx = globalIndex + i + 1;
        output += `${idx}. **Context**: Child draws a ${adj.toLowerCase()} shape.\n`;
        output += `    - Sparkle: "I see something ${adj.toLowerCase()}! Is it a ${sub} or a ${subjects[(Math.floor(Math.random() * subjects.length))]}?"\n`;
        output += `    - Child: "It's a ${sub}! And it is ${act.toLowerCase()} ${set.toLowerCase()}!"\n`;
        output += `    - Keywords: [Subject: ${sub}, Action: ${act}, Adjective: ${adj}, Setting: ${set}]\n`;
    }

    return output;
}

const section8Content = `
# SECTION 8: 100 VOICE-INTERACTION FEW-SHOT EXAMPLES (Tokens: ~10,000)
# This library teaches the AI how to guide children through conversation and extract high-quality creative keywords.
${generateExamples(100)}
`;

const finalContent = `
${section8Content}
${SECTION_9_10}
`;

// Read, Append, Write
try {
    let content = fs.readFileSync(TARGET_FILE, 'utf8');
    // Check if Section 8 already exists to avoid dupes
    if (content.includes("# SECTION 8:")) {
        console.log("Section 8 already exists. Replacing/Appending...");
        const split = content.split("# SECTION 8:");
        content = split[0]; // Keep everything before Section 8
    }

    // Ensure we are inside the backtick
    // The file ends with `\n;` typically or just `;`. 
    // We need to insert BEFORE the closing backtick.

    const lastBacktickIndex = content.lastIndexOf('`');
    if (lastBacktickIndex === -1) {
        throw new Error("Could not find closing backtick in gemini_prompts.ts");
    }

    const before = content.substring(0, lastBacktickIndex);
    const after = content.substring(lastBacktickIndex);

    const newContent = before + "\n" + finalContent + after;

    fs.writeFileSync(TARGET_FILE, newContent, 'utf8');
    console.log("Successfully appended Sparkle Knowledge Base (100 examples)!");

} catch (e) {
    console.error("Error modifying gemini_prompts.ts:", e);
    process.exit(1);
}

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  MissionData, 
  WORLD_LOCATIONS, 
  VILLAIN_ORGANIZATIONS,
  WirePuzzleData,
  KeypadPuzzleData,
  SequencePuzzleData,
  CipherPuzzleData,
  MazePuzzleData
} from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing VITE_GEMINI_API_KEY. Set it in your environment at build time (GEMINI_API_KEY -> build arg -> VITE_GEMINI_API_KEY).");
}

const ai = new GoogleGenAI({ apiKey });

const missionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    locationName: { type: Type.STRING, description: "City and Country name from the provided list" },
    coordinates: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER, description: "X coordinate (0-100)" },
        y: { type: Type.NUMBER, description: "Y coordinate (0-100)" }
      },
      required: ["x", "y"]
    },
    chapterTitle: { type: Type.STRING, description: "A dramatic chapter title like 'The Cairo Connection' or 'Shadows Over Vienna'" },
    briefingTitle: { type: Type.STRING, description: "Operation codename like 'OPERATION NIGHTFALL'" },
    briefingBody: { type: Type.STRING, description: "4-6 sentences of gripping spy narrative. Include specific details, tension, and stakes. Reference previous events when available." },
    villainTaunt: { type: Type.STRING, description: "A menacing message from the villain, 1-2 sentences. Taunts the agent personally." },
    missionObjective: { type: Type.STRING, description: "Clear objective like 'Intercept the encrypted data drive before it reaches the buyer'" },
    transportMode: { type: Type.STRING, enum: ["plane", "boat", "car", "submarine", "helicopter"] },
    timeLimitSeconds: { type: Type.INTEGER, description: "30-120 seconds based on difficulty" },
    puzzleType: { type: Type.STRING, enum: ["wires", "keypad", "sequence", "cipher", "maze"] },
    
    wireData: {
      type: Type.OBJECT,
      properties: {
        colors: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING, enum: ["red", "blue", "green", "yellow", "white", "black", "purple", "orange", "cyan", "pink"] } 
        },
        solutionType: { type: Type.STRING, enum: ["single", "sequence", "connect", "pattern"] },
        correctIndex: { type: Type.INTEGER },
        correctIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
        correctConnections: {
           type: Type.ARRAY,
           items: {
             type: Type.OBJECT,
             properties: { fromIndex: { type: Type.INTEGER }, toIndex: { type: Type.INTEGER } },
             required: ["fromIndex", "toIndex"]
           }
        },
        pattern: { type: Type.STRING, description: "For pattern type: describe the pattern like 'every other wire' or 'fibonacci positions'" },
        hint: { type: Type.STRING, description: "A clever riddle that requires logical deduction. Should NOT directly state the answer." },
        difficulty: { type: Type.INTEGER, description: "1-10 difficulty rating" }
      },
      required: ["colors", "solutionType", "hint", "difficulty"]
    },
    
    keypadData: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: "4-6 digit numeric code" },
        hint: { type: Type.STRING, description: "A multi-step logic puzzle, math problem, or cipher that leads to the code. Require multiple mental steps." },
        hintType: { type: Type.STRING, enum: ["math", "logic", "cipher", "riddle", "pattern"] },
        difficulty: { type: Type.INTEGER }
      },
      required: ["code", "hint", "hintType", "difficulty"]
    },
    
    sequenceData: {
      type: Type.OBJECT,
      properties: {
        symbols: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of emoji symbols to display in a grid" },
        correctSequence: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Indices of symbols to press in order" },
        hint: { type: Type.STRING, description: "Riddle about which symbols to press and in what order" },
        gridSize: { type: Type.INTEGER, description: "3, 4, or 5 for grid dimensions" },
        difficulty: { type: Type.INTEGER }
      },
      required: ["symbols", "correctSequence", "hint", "gridSize", "difficulty"]
    },
    
    cipherData: {
      type: Type.OBJECT,
      properties: {
        encryptedMessage: { type: Type.STRING, description: "The encoded message" },
        decodedAnswer: { type: Type.STRING, description: "The decoded answer (short word or phrase)" },
        cipherType: { type: Type.STRING, enum: ["caesar", "substitution", "morse", "binary", "pigpen"] },
        cipherKey: { type: Type.STRING, description: "The key to decode (e.g., shift number for Caesar)" },
        hint: { type: Type.STRING, description: "Hints about the cipher type and key" },
        difficulty: { type: Type.INTEGER }
      },
      required: ["encryptedMessage", "decodedAnswer", "cipherType", "hint", "difficulty"]
    },
    
    storyBeat: { type: Type.STRING, enum: ["setup", "rising", "twist", "climax", "resolution"] }
  },
  required: ["locationName", "chapterTitle", "briefingTitle", "briefingBody", "missionObjective", "transportMode", "timeLimitSeconds", "puzzleType", "storyBeat"]
};

// Generate a maze procedurally
function generateMaze(size: number, difficulty: number): MazePuzzleData {
  const grid: number[][] = [];
  
  // Initialize with walls
  for (let y = 0; y < size; y++) {
    grid[y] = [];
    for (let x = 0; x < size; x++) {
      grid[y][x] = 1; // Wall
    }
  }
  
  // Recursive backtracking maze generation
  const visited: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  const stack: { x: number; y: number }[] = [];
  
  const startX = 1;
  const startY = 1;
  
  grid[startY][startX] = 2; // Start
  visited[startY][startX] = true;
  stack.push({ x: startX, y: startY });
  
  const directions = [
    { dx: 0, dy: -2 }, // Up
    { dx: 2, dy: 0 },  // Right
    { dx: 0, dy: 2 },  // Down
    { dx: -2, dy: 0 }  // Left
  ];
  
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    
    // Find unvisited neighbors
    const unvisited = directions.filter(({ dx, dy }) => {
      const nx = current.x + dx;
      const ny = current.y + dy;
      return nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && !visited[ny][nx];
    });
    
    if (unvisited.length === 0) {
      stack.pop();
    } else {
      const { dx, dy } = unvisited[Math.floor(Math.random() * unvisited.length)];
      const nx = current.x + dx;
      const ny = current.y + dy;
      
      // Remove wall between current and next
      grid[current.y + dy / 2][current.x + dx / 2] = 0;
      grid[ny][nx] = 0;
      visited[ny][nx] = true;
      stack.push({ x: nx, y: ny });
    }
  }
  
  // Set end point
  const endX = size - 2;
  const endY = size - 2;
  grid[endY][endX] = 3;
  
  // Add traps based on difficulty
  const trapCount = Math.floor(difficulty / 2);
  for (let i = 0; i < trapCount; i++) {
    const tx = Math.floor(Math.random() * (size - 4)) + 2;
    const ty = Math.floor(Math.random() * (size - 4)) + 2;
    if (grid[ty][tx] === 0) {
      grid[ty][tx] = 4; // Trap
    }
  }
  
  // Simple path finding for correct path
  const correctPath: { x: number; y: number }[] = [{ x: startX, y: startY }];
  
  return {
    grid,
    size,
    correctPath,
    hint: difficulty < 5 
      ? "Navigate carefully. Avoid the red danger zones."
      : "The shortest path isn't always the safest. Watch for hidden traps.",
    difficulty
  };
}

// Generate harder keypad puzzles
function generateHardKeypad(difficulty: number): KeypadPuzzleData {
  const puzzles: { code: string; hint: string; hintType: 'math' | 'logic' | 'cipher' | 'riddle' | 'pattern' }[] = [
    // Math puzzles (escalating difficulty)
    {
      code: "1729",
      hint: "I seek the smallest number expressible as the sum of two cubes in two different ways. Ramanujan called it remarkable.",
      hintType: "math"
    },
    {
      code: "2048",
      hint: "Start with 2. Double it. Double again. Keep doubling until you've done it 10 times. What's your final number?",
      hintType: "math"
    },
    {
      code: "3141",
      hint: "The ratio of a circle's circumference to its diameter, multiply by 1000, round down.",
      hintType: "math"
    },
    {
      code: "1618",
      hint: "The golden ratio (φ), multiplied by 1000 and rounded down. Find where beauty meets mathematics.",
      hintType: "math"
    },
    {
      code: "2718",
      hint: "Euler's number (e), the base of natural logarithms. Multiply by 1000, round down.",
      hintType: "math"
    },
    
    // Logic puzzles
    {
      code: "4231",
      hint: "Four runners finish a race. Amy beats Ben. Charlie beats Diana. Ben beats Charlie. Assign 1st=1, 2nd=2, etc. Amy's place, Ben's place, Charlie's place, Diana's place.",
      hintType: "logic"
    },
    {
      code: "1324",
      hint: "If A=1, B=2... What is the sum of the letters in 'SPY'? That's your first digit. 'BOMB' sum ÷ 10 (rounded) = second. 'CODE' sum ÷ 8 = third. 'SAFE' sum ÷ 9 = fourth.",
      hintType: "logic"
    },
    {
      code: "8642",
      hint: "Even numbers descending from 8. But wait - is there a pattern? Every digit is the previous minus 2.",
      hintType: "pattern"
    },
    
    // Cipher puzzles
    {
      code: "1945",
      hint: "Caesar shift of 3: 'ABPB'. Decode it, then find the year that word refers to. A = 1, B = 2...",
      hintType: "cipher"
    },
    {
      code: "2468",
      hint: "In binary: 10, 100, 110, 1000. Convert each to decimal.",
      hintType: "cipher"
    },
    
    // Riddles
    {
      code: "1234",
      hint: "I am simple progression, the first steps of counting. Babies learn me before they learn to walk. What am I?",
      hintType: "riddle"
    },
    {
      code: "9876",
      hint: "I count down from the highest single digit, never stopping, never repeating. I am the reverse of the beginning.",
      hintType: "riddle"
    },
    {
      code: "1111",
      hint: "I am unity repeated. The loneliest number, four times over. All the same, yet together.",
      hintType: "riddle"
    },
    
    // Pattern puzzles
    {
      code: "1123",
      hint: "The Fibonacci sequence begins: 1, 1, 2, 3, 5, 8... Your code is the first four numbers.",
      hintType: "pattern"
    },
    {
      code: "2357",
      hint: "I am the first four prime numbers, standing together. Neither 1 nor composite, we are indivisible.",
      hintType: "pattern"
    },
    {
      code: "1492",
      hint: "Columbus sailed the ocean blue in this year. The New World awaited discovery.",
      hintType: "riddle"
    },
    {
      code: "1969",
      hint: "One small step for man, one giant leap for mankind. The year the eagle landed on the moon.",
      hintType: "riddle"
    },
    {
      code: "3791",
      hint: "Reverse of 1973. The year of the oil crisis, the Watergate hearings, and Pink Floyd's Dark Side of the Moon.",
      hintType: "logic"
    }
  ];
  
  // Select based on difficulty
  const startIdx = Math.min(Math.floor((difficulty / 10) * puzzles.length), puzzles.length - 1);
  const puzzle = puzzles[Math.min(startIdx + Math.floor(Math.random() * 3), puzzles.length - 1)];
  
  return {
    ...puzzle,
    difficulty
  };
}

// Generate harder wire puzzles
function generateHardWires(difficulty: number): WirePuzzleData {
  const colors = ["red", "blue", "green", "yellow", "white", "black", "purple", "orange"];
  const wireCount = Math.min(4 + Math.floor(difficulty / 2), 8);
  const selectedColors = colors.slice(0, wireCount);
  
  if (difficulty <= 3) {
    // Single wire - but with tricky hints
    const correctIdx = Math.floor(Math.random() * wireCount);
    const hints = [
      `The wire that shares its color with ${selectedColors[correctIdx] === 'red' ? 'blood' : selectedColors[correctIdx] === 'blue' ? 'the sky' : selectedColors[correctIdx] === 'green' ? 'envy' : selectedColors[correctIdx] === 'yellow' ? 'the sun' : selectedColors[correctIdx] === 'white' ? 'snow' : selectedColors[correctIdx] === 'black' ? 'night' : selectedColors[correctIdx] === 'purple' ? 'royalty' : 'a sunset'} holds the key.`,
      `Count from the top. Position ${correctIdx + 1} conceals your answer.`,
      `The ${correctIdx === 0 ? 'first' : correctIdx === 1 ? 'second' : correctIdx === 2 ? 'third' : correctIdx === 3 ? 'fourth' : correctIdx === 4 ? 'fifth' : 'sixth'} wire is the one. But counting is harder than it seems.`
    ];
    
    return {
      colors: selectedColors,
      solutionType: 'single',
      correctIndex: correctIdx,
      hint: hints[Math.floor(Math.random() * hints.length)],
      difficulty
    };
  } else if (difficulty <= 6) {
    // Sequence - cut multiple in order
    const seqLength = Math.min(2 + Math.floor(difficulty / 3), 4);
    const correctIndices: number[] = [];
    const available = [...Array(wireCount).keys()];
    
    for (let i = 0; i < seqLength; i++) {
      const idx = Math.floor(Math.random() * available.length);
      correctIndices.push(available[idx]);
      available.splice(idx, 1);
    }
    
    const orderedColors = correctIndices.map(i => selectedColors[i]);
    const hints = [
      `The sequence flows like a story: ${orderedColors[0]} begins, ${orderedColors[orderedColors.length - 1]} ends. ${orderedColors.length > 2 ? `Between them, ${orderedColors.slice(1, -1).join(', then ')}.` : ''}`,
      `First the color of ${orderedColors[0] === 'red' ? 'danger' : orderedColors[0] === 'blue' ? 'calm' : orderedColors[0] === 'green' ? 'growth' : orderedColors[0] === 'yellow' ? 'caution' : 'mystery'}, then ${orderedColors.slice(1).map(c => c === 'red' ? 'passion' : c === 'blue' ? 'depth' : c === 'green' ? 'life' : c === 'yellow' ? 'light' : 'shadow').join(', then ')}.`
    ];
    
    return {
      colors: selectedColors,
      solutionType: 'sequence',
      correctIndices,
      hint: hints[Math.floor(Math.random() * hints.length)],
      difficulty
    };
  } else {
    // Connect - rewire the system
    const connections: { fromIndex: number; toIndex: number }[] = [];
    const shuffled = [...Array(wireCount).keys()].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < wireCount; i++) {
      connections.push({ fromIndex: i, toIndex: shuffled[i] });
    }
    
    // Generate hint based on the rewiring
    const swaps: string[] = [];
    for (let i = 0; i < wireCount; i++) {
      if (connections[i].toIndex !== i) {
        swaps.push(`${selectedColors[i]} → ${selectedColors[connections[i].toIndex]}`);
      }
    }
    
    return {
      colors: selectedColors,
      solutionType: 'connect',
      correctConnections: connections,
      hint: `Rewire the system: ${swaps.slice(0, 3).join(', ')}. The power must flow correctly or all is lost.`,
      difficulty
    };
  }
}

// Generate sequence puzzle
function generateSequencePuzzle(difficulty: number): SequencePuzzleData {
  const gridSize = difficulty <= 3 ? 3 : difficulty <= 6 ? 4 : 5;
  const symbolSets = [
    ["🔴", "🔵", "🟢", "🟡", "⚪", "⚫", "🟣", "🟠", "🔶"],
    ["♠", "♥", "♦", "♣", "★", "☆", "◆", "◇", "○"],
    ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"],
    ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "⭐"],
    ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ", "ι"]
  ];
  
  const symbolSet = symbolSets[Math.floor(Math.random() * symbolSets.length)];
  const totalCells = gridSize * gridSize;
  const symbols: string[] = [];
  
  for (let i = 0; i < totalCells; i++) {
    symbols.push(symbolSet[i % symbolSet.length]);
  }
  
  // Shuffle symbols
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
  }
  
  // Generate correct sequence
  const sequenceLength = Math.min(3 + Math.floor(difficulty / 2), 6);
  const correctSequence: number[] = [];
  const used = new Set<number>();
  
  while (correctSequence.length < sequenceLength) {
    const idx = Math.floor(Math.random() * totalCells);
    if (!used.has(idx)) {
      correctSequence.push(idx);
      used.add(idx);
    }
  }
  
  const sequenceSymbols = correctSequence.map(i => symbols[i]);
  const hint = `Follow the pattern: ${sequenceSymbols.join(' → ')}. Press them in this exact order.`;
  
  return {
    symbols,
    correctSequence,
    hint,
    gridSize,
    difficulty
  };
}

// Generate cipher puzzle
function generateCipherPuzzle(difficulty: number): CipherPuzzleData {
  const words = ["ABORT", "ALPHA", "BRAVO", "DELTA", "ECHO", "GAMMA", "OMEGA", "SIGMA", "ZULU", "NEXUS", "PHOENIX", "SHADOW"];
  const word = words[Math.floor(Math.random() * words.length)];
  
  if (difficulty <= 4) {
    // Caesar cipher
    const shift = Math.floor(Math.random() * 10) + 3;
    const encrypted = word.split('').map(c => {
      const code = c.charCodeAt(0) - 65;
      return String.fromCharCode(((code + shift) % 26) + 65);
    }).join('');
    
    return {
      encryptedMessage: encrypted,
      decodedAnswer: word,
      cipherType: 'caesar',
      cipherKey: String(shift),
      hint: `Each letter has been shifted ${shift} positions forward in the alphabet. A becomes ${String.fromCharCode(65 + shift)}.`,
      difficulty
    };
  } else if (difficulty <= 7) {
    // Morse code
    const morseCode: { [key: string]: string } = {
      'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
      'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
      'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
      'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
      'Y': '-.--', 'Z': '--..'
    };
    
    const encrypted = word.split('').map(c => morseCode[c]).join(' / ');
    
    return {
      encryptedMessage: encrypted,
      decodedAnswer: word,
      cipherType: 'morse',
      hint: "Dots and dashes from another era. Samuel would be proud.",
      difficulty
    };
  } else {
    // Binary
    const encrypted = word.split('').map(c => {
      return c.charCodeAt(0).toString(2).padStart(8, '0');
    }).join(' ');
    
    return {
      encryptedMessage: encrypted,
      decodedAnswer: word,
      cipherType: 'binary',
      hint: "The language of machines. 8 bits per character. Convert to ASCII.",
      difficulty
    };
  }
}

export const generateMission = async (
  chapter: number, 
  totalChapters: number, 
  storyContext: string[],
  villainName: string = "The Alchemist",
  previousLocations: string[] = []
): Promise<MissionData> => {
  
  const progress = chapter / totalChapters;
  const difficulty = Math.ceil(progress * 10);
  
  // Determine story beat
  let storyBeat: 'setup' | 'rising' | 'twist' | 'climax' | 'resolution';
  if (progress <= 0.2) storyBeat = 'setup';
  else if (progress <= 0.5) storyBeat = 'rising';
  else if (progress <= 0.7) storyBeat = 'twist';
  else if (progress <= 0.9) storyBeat = 'climax';
  else storyBeat = 'resolution';
  
  // Choose puzzle type based on difficulty and variety
  const puzzleTypes: ('wires' | 'keypad' | 'sequence' | 'cipher' | 'maze')[] = ['wires', 'keypad', 'sequence', 'cipher', 'maze'];
  const puzzleType = puzzleTypes[chapter % puzzleTypes.length];
  
  // Filter out recently visited locations
  const availableLocations = WORLD_LOCATIONS.filter(loc => 
    !previousLocations.includes(loc.name)
  );
  
  const targetLocation = availableLocations[Math.floor(Math.random() * availableLocations.length)] || WORLD_LOCATIONS[0];
  
  // Time limits based on difficulty
  const baseTime = 90;
  const timeLimit = Math.max(30, baseTime - (difficulty * 5));
  
  const contextSummary = storyContext.length > 0 
    ? `Previously: ${storyContext.slice(-3).join(" Then, ")}` 
    : "This is the beginning. The hero receives their first mission.";

  const storyInstructions: { [key: string]: string } = {
    setup: "Establish the threat. Introduce the villain's presence. The agent discovers something is amiss.",
    rising: "Escalate tension. The villain's plan becomes clearer. There should be a sense of urgency.",
    twist: "A major revelation. Perhaps the villain has an inside man, or the target isn't what it seemed.",
    climax: "The final confrontation approaches. Maximum stakes. Everything hangs in the balance.",
    resolution: "The last piece of the puzzle. Victory is within reach, but the villain has one last trick."
  };

  const prompt = `
    Generate a GRIPPING spy mission for Chapter ${chapter}/${totalChapters}.
    
    STORY CONTEXT:
    - Story Beat: ${storyBeat.toUpperCase()} - ${storyInstructions[storyBeat]}
    - Previous Events: ${contextSummary}
    - Villain: "${villainName}"
    - Target Location: ${targetLocation.name}, ${targetLocation.country}
    - Coordinates: x: ${targetLocation.x}, y: ${targetLocation.y}
    
    CRITICAL REQUIREMENTS:
    1. The briefingBody should be 4-6 sentences of GRIPPING spy narrative
    2. Include SPECIFIC details - times, code names, descriptions
    3. Reference previous events when available to create continuity
    4. The villainTaunt should feel personal and menacing
    5. The missionObjective should be clear and actionable
    
    PUZZLE TYPE: ${puzzleType}
    DIFFICULTY: ${difficulty}/10
    
    For the puzzle:
    - DO NOT make hints obvious. The hint should require logical deduction.
    - For math puzzles, require multiple steps
    - For logic puzzles, create genuine challenges
    - For wire puzzles with difficulty > 6, use 'connect' type requiring rewiring
    
    Transport modes should match geography:
    - plane: intercontinental
    - helicopter: short distance or urgent
    - boat/submarine: across water
    - car: same region
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: missionSchema,
        temperature: 1.0
      }
    });

    if (response.text) {
      const mission = JSON.parse(response.text) as MissionData;
      
      // Enhance with our generated puzzles if the AI ones aren't good enough
      if (puzzleType === 'wires' && (!mission.wireData || mission.wireData.colors.length < 4)) {
        mission.wireData = generateHardWires(difficulty);
      }
      if (puzzleType === 'keypad') {
        mission.keypadData = generateHardKeypad(difficulty);
      }
      if (puzzleType === 'sequence') {
        mission.sequenceData = generateSequencePuzzle(difficulty);
      }
      if (puzzleType === 'cipher') {
        mission.cipherData = generateCipherPuzzle(difficulty);
      }
      if (puzzleType === 'maze') {
        const size = 7 + Math.floor(difficulty / 2) * 2;
        mission.mazeData = generateMaze(size, difficulty);
      }
      
      // Override time limit and coordinates
      mission.timeLimitSeconds = timeLimit;
      mission.coordinates = { x: targetLocation.x, y: targetLocation.y };
      mission.locationName = targetLocation.name;
      mission.puzzleType = puzzleType;
      mission.storyBeat = storyBeat;
      
      return mission;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Failed to generate mission:", error);
    
    // Generate comprehensive fallback
    return {
      locationName: targetLocation.name,
      coordinates: { x: targetLocation.x, y: targetLocation.y },
      chapterTitle: `Chapter ${chapter}: The ${targetLocation.name} Incident`,
      briefingTitle: "OPERATION FAILSAFE",
      briefingBody: `Intelligence indicates ${villainName} has established a covert operation in ${targetLocation.name}. Local assets report unusual activity at a secure facility on the outskirts of the city. Thermal imaging confirms the presence of electronic equipment consistent with a countdown device. You must infiltrate the location, neutralize the threat, and extract any intelligence that could reveal the next phase of their plan. Time is critical, Agent.`,
      villainTaunt: `Did you really think I wouldn't be watching, Agent? ${targetLocation.name} is merely the beginning.`,
      missionObjective: "Infiltrate the facility and neutralize the device before it activates.",
      transportMode: "plane",
      timeLimitSeconds: timeLimit,
      puzzleType,
      wireData: puzzleType === 'wires' ? generateHardWires(difficulty) : undefined,
      keypadData: puzzleType === 'keypad' ? generateHardKeypad(difficulty) : undefined,
      sequenceData: puzzleType === 'sequence' ? generateSequencePuzzle(difficulty) : undefined,
      cipherData: puzzleType === 'cipher' ? generateCipherPuzzle(difficulty) : undefined,
      mazeData: puzzleType === 'maze' ? generateMaze(9, difficulty) : undefined,
      storyBeat
    };
  }
};

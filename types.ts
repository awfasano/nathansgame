export type PuzzleType = 'wires' | 'keypad' | 'sequence' | 'cipher' | 'maze';

export interface WireConnection {
  fromIndex: number;
  toIndex: number;
}

export interface WirePuzzleData {
  colors: string[];
  solutionType: 'single' | 'sequence' | 'connect' | 'pattern';
  correctIndex?: number;
  correctIndices?: number[];
  correctConnections?: WireConnection[];
  pattern?: string; // For pattern-based wire cutting
  hint: string;
  difficulty: number;
}

export interface KeypadPuzzleData {
  code: string;
  hint: string;
  hintType: 'math' | 'logic' | 'cipher' | 'riddle' | 'pattern';
  difficulty: number;
}

export interface SequencePuzzleData {
  symbols: string[];
  correctSequence: number[];
  hint: string;
  gridSize: number;
  difficulty: number;
}

export interface CipherPuzzleData {
  encryptedMessage: string;
  decodedAnswer: string;
  cipherType: 'caesar' | 'substitution' | 'morse' | 'binary' | 'pigpen';
  cipherKey?: string | number;
  hint: string;
  difficulty: number;
}

export interface MazePuzzleData {
  grid: number[][]; // 0 = path, 1 = wall, 2 = start, 3 = end, 4 = trap
  size: number;
  correctPath: { x: number; y: number }[];
  hint: string;
  difficulty: number;
}

export interface MissionData {
  locationName: string;
  coordinates: { x: number; y: number };
  briefingTitle: string;
  briefingBody: string;
  villainTaunt?: string;
  missionObjective: string;
  transportMode: 'plane' | 'boat' | 'car' | 'submarine' | 'helicopter';
  timeLimitSeconds: number;
  puzzleType: PuzzleType;
  wireData?: WirePuzzleData;
  keypadData?: KeypadPuzzleData;
  sequenceData?: SequencePuzzleData;
  cipherData?: CipherPuzzleData;
  mazeData?: MazePuzzleData;
  storyBeat: 'setup' | 'rising' | 'twist' | 'climax' | 'resolution';
  chapterTitle: string;
}

export type GamePhase = 'start' | 'briefing' | 'travel' | 'defuse' | 'success' | 'gameover' | 'victory';

export interface LocationRecord {
  name: string;
  x: number;
  y: number;
  country?: string;
}

export interface AgentProfile {
  codename: string;
  specialty: string;
  gadgets: string[];
}

export interface VillainProfile {
  name: string;
  alias: string;
  motivation: string;
  organization: string;
  masterPlan: string;
}

export interface GameState {
  phase: GamePhase;
  currentChapter: number;
  totalChapters: number;
  currentMission: MissionData | null;
  storySoFar: string[];
  visitedLocations: LocationRecord[];
  lives: number;
  score: number;
  agent: AgentProfile;
  villain: VillainProfile;
  discoveredClues: string[];
  difficultyMultiplier: number;
}

// Real world locations with accurate coordinates
export const WORLD_LOCATIONS: LocationRecord[] = [
  // North America
  { name: "Washington D.C.", x: 23, y: 32, country: "USA" },
  { name: "New York City", x: 24, y: 30, country: "USA" },
  { name: "Los Angeles", x: 12, y: 34, country: "USA" },
  { name: "Miami", x: 22, y: 40, country: "USA" },
  { name: "Vancouver", x: 10, y: 25, country: "Canada" },
  { name: "Mexico City", x: 17, y: 45, country: "Mexico" },
  
  // South America
  { name: "Rio de Janeiro", x: 32, y: 68, country: "Brazil" },
  { name: "Buenos Aires", x: 28, y: 78, country: "Argentina" },
  { name: "Lima", x: 22, y: 62, country: "Peru" },
  { name: "Bogotá", x: 24, y: 52, country: "Colombia" },
  
  // Europe
  { name: "London", x: 48, y: 24, country: "UK" },
  { name: "Paris", x: 50, y: 26, country: "France" },
  { name: "Berlin", x: 53, y: 23, country: "Germany" },
  { name: "Rome", x: 53, y: 30, country: "Italy" },
  { name: "Moscow", x: 60, y: 20, country: "Russia" },
  { name: "Madrid", x: 47, y: 30, country: "Spain" },
  { name: "Vienna", x: 54, y: 26, country: "Austria" },
  { name: "Prague", x: 54, y: 24, country: "Czech Republic" },
  { name: "Istanbul", x: 58, y: 30, country: "Turkey" },
  { name: "Athens", x: 56, y: 32, country: "Greece" },
  
  // Africa
  { name: "Cairo", x: 58, y: 40, country: "Egypt" },
  { name: "Marrakech", x: 46, y: 38, country: "Morocco" },
  { name: "Cape Town", x: 54, y: 78, country: "South Africa" },
  { name: "Nairobi", x: 60, y: 55, country: "Kenya" },
  { name: "Lagos", x: 50, y: 52, country: "Nigeria" },
  
  // Middle East
  { name: "Dubai", x: 66, y: 40, country: "UAE" },
  { name: "Tel Aviv", x: 60, y: 38, country: "Israel" },
  { name: "Tehran", x: 65, y: 34, country: "Iran" },
  
  // Asia
  { name: "Tokyo", x: 88, y: 32, country: "Japan" },
  { name: "Beijing", x: 80, y: 30, country: "China" },
  { name: "Shanghai", x: 82, y: 36, country: "China" },
  { name: "Hong Kong", x: 82, y: 42, country: "China" },
  { name: "Singapore", x: 78, y: 55, country: "Singapore" },
  { name: "Mumbai", x: 70, y: 44, country: "India" },
  { name: "Bangkok", x: 76, y: 48, country: "Thailand" },
  { name: "Seoul", x: 85, y: 32, country: "South Korea" },
  { name: "Manila", x: 83, y: 48, country: "Philippines" },
  
  // Oceania
  { name: "Sydney", x: 90, y: 72, country: "Australia" },
  { name: "Auckland", x: 96, y: 76, country: "New Zealand" },
  
  // Special Locations (Villain Lairs)
  { name: "Secret Arctic Base", x: 45, y: 5, country: "International Waters" },
  { name: "Volcanic Island Lair", x: 95, y: 55, country: "Pacific Ocean" },
  { name: "Underground Bunker", x: 55, y: 28, country: "Alps" },
  { name: "Underwater Station", x: 35, y: 50, country: "Atlantic Ocean" },
];

// Villain organizations for variety
export const VILLAIN_ORGANIZATIONS = [
  { name: "PHANTOM", specialty: "Cyber warfare and digital chaos" },
  { name: "The Syndicate", specialty: "Global economic manipulation" },
  { name: "Omega Protocol", specialty: "Bioweapon development" },
  { name: "The Shadow Council", specialty: "Political destabilization" },
  { name: "Nexus", specialty: "AI and autonomous weapons" },
  { name: "The Architects", specialty: "Environmental terrorism" },
];

// Agent specialties
export const AGENT_SPECIALTIES = [
  "Cryptography and Code-Breaking",
  "Demolitions and Ordinance",
  "Infiltration and Stealth",
  "Combat and Tactical Operations",
  "Technology and Hacking",
  "Linguistics and Cultural Intelligence",
];

// Gadgets agents can "use"
export const AGENT_GADGETS = [
  "EMP Pulse Watch",
  "Grappling Hook Pen",
  "X-Ray Contact Lenses",
  "Sonic Disruptor Earpiece",
  "Nano-Lock Pick",
  "Holographic Projector",
  "Tracking Dust",
  "Acid Chewing Gum",
];

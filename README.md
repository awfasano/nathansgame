# 🕵️ Spy School: Protocol Omega

A high-stakes spy thriller web game where players travel the globe, solve increasingly difficult puzzles, and stop a global conspiracy.

![Game Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🎮 Features

### Dynamic Story Generation
- **AI-Powered Narratives**: Every campaign features a unique villain, organization, and master plan
- **Progressive Story Beats**: Setup → Rising Action → Plot Twist → Climax → Resolution
- **Continuity**: The story references previous events and locations
- **Character Profiles**: Random agent codenames, specialties, and gadgets

### 5 Challenging Puzzle Types

1. **Wire Defusal** 
   - Single wire cuts (easy)
   - Sequential cutting (medium)
   - Rewiring/reconnection (hard)

2. **Code Breach (Keypad)**
   - Math puzzles (Fibonacci, primes, mathematical constants)
   - Logic puzzles (deduction, ordering)
   - Cipher-based codes
   - Historical riddles
   - Pattern recognition

3. **Pattern Lock (Sequence)**
   - Symbol grid memorization
   - Scalable difficulty (3x3 to 5x5 grids)
   - Multiple symbols to press in order

4. **Decryption (Cipher)**
   - Caesar cipher
   - Morse code
   - Binary encoding
   - Reference guides provided

5. **Secure Route (Maze)**
   - Procedurally generated mazes
   - Trap avoidance
   - Keyboard controls (WASD/Arrows)

### Immersive World Map
- **Real Geography**: 40+ authentic world locations
- **Visual Flight Paths**: Curved travel animations
- **Location History**: See your journey across the globe
- **Transport Variety**: Planes, helicopters, boats, submarines, cars

### Polished Game Feel
- **Dynamic Audio**: Synthesized sound effects for all actions
- **Timed Challenges**: Adaptive time limits based on difficulty
- **Score System**: Points based on chapter and performance
- **Strike System**: Multiple attempts for most puzzles
- **Visual Feedback**: Glows, animations, and transitions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Clone or download this project

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file and add your API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000

## 🎯 How to Play

1. **Start Campaign**: Begin a new mission with a randomly generated agent and villain
2. **Read Briefing**: Understand your mission objective and the story context
3. **Travel**: Watch your agent fly/drive/sail to the next location
4. **Solve Puzzle**: Defuse the device before time runs out
5. **Progress**: Complete all chapters to defeat the villain

### Puzzle Tips

- **Wires**: Read hints carefully - they often use color metaphors
- **Keypad**: Show the hint panel and work through the logic step-by-step
- **Sequence**: Memorize the pattern shown in the hint before pressing
- **Cipher**: Use the reference guide - especially for Morse and binary
- **Maze**: Take your time and avoid red danger zones

## 🛠 Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Google Gemini AI** - Story and puzzle generation
- **Web Audio API** - Sound synthesis

## 📁 Project Structure

```
spy-school/
├── components/
│   ├── BombDefusal.tsx    # Main puzzle container
│   ├── Briefing.tsx       # Mission briefing screen
│   ├── WorldMap.tsx       # Travel animation
│   ├── WirePuzzle.tsx     # Wire cutting puzzle
│   ├── KeypadPuzzle.tsx   # Code entry puzzle
│   ├── SequencePuzzle.tsx # Pattern matching puzzle
│   ├── CipherPuzzle.tsx   # Decryption puzzle
│   ├── MazePuzzle.tsx     # Navigation puzzle
│   └── Explosion.tsx      # Game over effect
├── services/
│   └── geminiService.ts   # AI mission generation
├── utils/
│   └── sound.ts           # Audio synthesis
├── types.ts               # TypeScript definitions
├── App.tsx                # Main game logic
└── index.tsx              # Entry point
```

## 🎨 Customization

### Adding New Locations
Edit `WORLD_LOCATIONS` in `types.ts`:
```typescript
{ name: "Your City", x: 50, y: 50, country: "Country" }
```

### Adjusting Difficulty
Modify the `generateMission` function in `geminiService.ts`:
- `timeLimitSeconds`: Change base time
- Puzzle generation functions control complexity

### Adding Puzzle Types
1. Create a new component in `components/`
2. Add the type to `PuzzleType` in `types.ts`
3. Add generation logic in `geminiService.ts`
4. Register in `BombDefusal.tsx`

## 📜 License

MIT License - feel free to modify and use for your own projects!

---

*Made with ❤️ for aspiring spies everywhere*

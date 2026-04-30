# SiliconQuest - Component Documentation

## Overview
A modern, mobile-first game interface for character hunting with AR capabilities. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Component Architecture

### 1. **Header Component** (`src/components/Header.tsx`)
Reusable header displaying game title and organization.
- **Props**: None
- **Features**: Responsive design, gradient styling

### 2. **Pokeball Component** (`src/components/Pokeball.tsx`)
Interactive pokeball with explosion animation to activate AR mode.
- **Props:**
  - `onClick`: Function to handle click
  - `isExploding`: Boolean for animation state
- **Features:**
  - Smooth rotation and glow effects
  - Explosion animation with particle effects
  - Responsive sizing

### 3. **ARCamera Component** (`src/components/ARCamera.tsx`)
Full-screen AR camera interface for character hunting.
- **Props:**
  - `teamName`: string - Currently selected team name
  - `onClose`: () => void - Handler to exit AR mode
  - `onCharacterCollected`: (character) => void - Handler for successful collection
  
- **Features:**
  - **Real Camera Access**: Uses getUserMedia API for device camera
  - **Character Detection**: Mock detection with 5 different characters
  - **Character Tiers**: Common, Rare, Legendary with color-coded UI
  - **Quiz System**: MCQ questions that must be answered correctly to collect
  - **AR Overlays**: Corner markers and scanning effects
  - **Responsive UI**: Optimized for mobile devices

#### Character Tiers:
- **Legendary** (Gold/Orange): Naruto, Goku
- **Rare** (Purple/Pink): Eren, Tanjiro  
- **Common** (Gray/Silver): Deku

### 4. **Main Page** (`src/app/page.tsx`)
Primary game interface with team selection and character management.
- **Features:**
  - Team selection from list
  - LocalStorage persistence
  - Character collection display with horizontal scroll
  - Leaderboard with auto-scroll to selected team
  - Pokeball interaction to launch AR mode
  - Real-time character updates

## State Management

### Local State (useState)
- `selectedTeamId`: Currently selected team
- `charactersCaught`: Array of collected characters with tiers
- `isARActive`: AR camera visibility
- `isPokeballExploding`: Pokeball animation state

### LocalStorage
- `selectedTeamId`: Persists team selection across sessions

## Data Models

### Team
```typescript
interface Team {
  id: number;
  name: string;
  charactersCaught: number;
}
```

### Character
```typescript
interface CaughtCharacter {
  id: number;
  name: string;
  image: string; // Emoji
  tier: 'Common' | 'Rare' | 'Legendary';
}
```

### Quiz Question (internal to ARCamera)
```typescript
interface Character {
  id: number;
  name: string;
  image: string;
  tier: 'Common' | 'Rare' | 'Legendary';
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option
}
```

## Animations

### Global Animations (globals.css)
- `fadeIn`: Smooth entry animation
- `scaleIn`: Scale-up animation
- `pokeballExplode`: Explosion effect
- `scan`: Scanning line effect  
- `shake`: Error feedback animation

### Component Animations
- Pokeball rotation and glow
- Character card hover effects
- Quiz answer selection feedback
- Success/error indicators

## Styling System

### Color Scheme
- **Primary**: Purple (#8b5cf6)
- **Secondary**: Pink (#ec4899)
- **Accent**: Amber (#f59e0b)
- **Background**: Dark slate (#0a0a0a)
- **Surface**: Slate-900/800

### Tier Colors
- **Legendary**: Amber to Orange gradient
- **Rare**: Purple to Pink gradient
- **Common**: Slate gradient

## Mobile Optimization
- Touch-friendly tap targets (minimum 44px)
- No tap highlight color
- Responsive text sizing
- Optimized viewport settings
- Back camera preference on mobile
- Overflow scroll for character lists

## Performance Considerations
- Lazy loading for components
- Optimized re-renders with proper key props
- CSS transforms for animations (GPU accelerated)
- Minimal state updates
- Camera stream cleanup on unmount

## User Flow

### 1. Team Selection
1. User lands on homepage
2. Sees "Select Your Team" section
3. Clicks on a team name
4. Team is saved to localStorage
5. UI updates to show "Characters Caught" section

### 2. AR Hunting
1. User clicks on the Pokeball
2. Pokeball explodes with animation
3. AR Camera activates with real camera feed
4. System scans for characters (3-second mock delay)
5. Character appears with tier badge

### 3. Character Collection
1. User clicks "Collect Character"
2. Quiz overlay appears with MCQ
3. User selects an answer
4. Clicks "Submit"
5. If correct: Character added to collection
6. If incorrect: Can try again
7. Camera continues scanning for more characters

## Browser Permissions Required
- **Camera Access**: Required for AR hunting feature
- **LocalStorage**: For team selection persistence

## Future Enhancements (Placeholders)
- [ ] Real AR pattern matching (currently mock)
- [ ] Firebase backend integration
- [ ] Team-based scoring system
- [ ] Real-time leaderboard updates
- [ ] Character rarity distribution
- [ ] Achievement system
- [ ] Sound effects and haptic feedback
- [ ] Multi-language support
- [ ] Social sharing features

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Browser Compatibility
- Modern browsers with getUserMedia support
- Chrome/Edge/Safari (mobile and desktop)
- Requires HTTPS for camera access (except localhost)

## File Structure
```
client/
├── src/
│   ├── app/
│   │   ├── globals.css       # Global styles and animations
│   │   ├── layout.tsx         # Root layout with metadata
│   │   └── page.tsx           # Main game interface
│   └── components/
│       ├── Header.tsx         # Reusable header
│       ├── Pokeball.tsx       # Interactive pokeball
│       └── ARCamera.tsx       # AR hunting interface
├── public/
│   └── manifest.json          # PWA manifest
└── COMPONENTS.md              # This file
```

## Development Notes
- All components are client-side ('use client')
- TypeScript strict mode enabled
- Tailwind CSS for styling
- No external UI libraries
- Clean, modular code structure
- Comprehensive error handling
- Mobile-first responsive design

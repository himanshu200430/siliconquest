# Firebase Integration

## Setup Complete ✅

The app is now connected to Firebase Firestore with the following components:

### Files Created/Updated

1. **`src/lib/firebase.ts`** - Firebase client SDK initialization
2. **`src/services/firestore.ts`** - Firestore database operations
3. **`src/components/Leaderboard.tsx`** - Leaderboard component (extracted from page.tsx)
4. **`src/components/UncaughtCharacters.tsx`** - Modal to show uncaught characters
5. **`src/types/index.ts`** - TypeScript interfaces for Team, Card, Character
6. **`src/app/page.tsx`** - Updated to use Firebase instead of mock data

### Firestore Schema

#### Collections

**teams** (collection)
```javascript
{
  id: string,              // Auto-generated document ID
  teamName: string,        // "Papaya Chasers"
  score: number,           // 0
  cardsCaught: string[]    // Array of card IDs caught by this team
}
```

**cards** (collection)
```javascript
{
  id: string,              // Auto-generated document ID (e.g., "char_001")
  name: string,            // "Eren Yeager"
  value: number,           // 50 (points awarded when caught)
  tier: 'Common' | 'Rare' | 'Legendary',
  image: string,           // Emoji or URL
  isCaught: boolean,       // false (uncaught) or true (caught)
  caughtByTeam: string | null  // null or teamId that caught this card
}
```

**characters** (collection) - For future use
```javascript
{
  id: string,
  name: string,
  tier: 'Common' | 'Rare' | 'Legendary',
  image: string,           // Emoji or URL
  question: string,
  options: string[],
  correctAnswer: number
}
```

### Features Implemented

✅ **Real-time Team Fetching** - Teams are loaded from Firestore on page load
✅ **Leaderboard Sorting** - Teams automatically sorted by score (descending)
✅ **Team Selection** - Select team from the list (persisted in localStorage)
✅ **Uncaught Characters Modal** - Click "Show character left to hunt" to see all uncaught cards
✅ **Card Filtering** - Fetches only cards with `isCaught: false`
✅ **Loading States** - Shows spinner while fetching teams and cards
✅ **Modular Components** - Leaderboard and UncaughtCharacters extracted into reusable components

### Available Functions

From `src/services/firestore.ts`:

**Teams:**
- `getTeams()` - Fetch all teams ordered by score
- `getTeamById(teamId)` - Fetch single team
- `addCharacterToTeam(teamId, characterId)` - Add character and increment score

**Cards:**
- `getCards()` - Fetch all cards
- `getUncaughtCards()` - Fetch only uncaught cards (isCaught: false)
- `getCardsCaughtByTeam(teamId)` - Fetch cards caught by specific team
- `markCardAsCaught(cardId, teamId)` - Mark a card as caught by a team

**Characters:**
- `getCharacters()` - Fetch all available characters (for quiz questions)

### Next Steps

1. **Add Character Collection** - When a character is collected, call `addCharacterToTeam()`
2. **Real-time Updates** - Use Firestore's `onSnapshot` for live leaderboard updates
3. **Create Characters Collection** - Add character documents to Firestore
4. **Team Registration** - Build UI for teams to register themselves

### Testing

Current Firestore setup:
- Collection: `teams`
- Document: `team001`
  - `teamName`: "Papaya Chasers"
  - `score`: 0
  - `cardsCaught`: []

The leaderboard will display all teams from your Firestore database!

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  query, 
  orderBy,
  where,
  arrayUnion,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Team, Card, Character } from '@/types';
import { getTierFromValue } from '@/types';

// Fetch all teams ordered by score (descending)
export async function getTeams(): Promise<Team[]> {
  try {
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, orderBy('score', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
}

// Fetch a single team by ID
export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (teamSnap.exists()) {
      return {
        id: teamSnap.id,
        ...teamSnap.data()
      } as Team;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
}

// Add a character to team's collected characters
export async function addCharacterToTeam(teamId: string, characterId: string): Promise<void> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      cardsCaught: arrayUnion(characterId),
      score: increment(1)
    });
  } catch (error) {
    console.error('Error adding character to team:', error);
    throw error;
  }
}

// Fetch all characters
export async function getCharacters(): Promise<Character[]> {
  try {
    const charactersRef = collection(db, 'characters');
    const snapshot = await getDocs(charactersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Character[];
  } catch (error) {
    console.error('Error fetching characters:', error);
    throw error;
  }
}

// Fetch all cards
export async function getCards(): Promise<Card[]> {
  try {
    const cardsRef = collection(db, 'cards');
    const snapshot = await getDocs(cardsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Card[];
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
}

// Fetch uncaught cards (isCaught = false)
export async function getUncaughtCards(): Promise<Card[]> {
  try {
    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('isCaught', '==', false));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Card[];
  } catch (error) {
    console.error('Error fetching uncaught cards:', error);
    throw error;
  }
}

// Fetch cards caught by a specific team
export async function getCardsCaughtByTeam(teamId: string): Promise<Card[]> {
  try {
    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('caughtByTeam', '==', teamId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Card[];
  } catch (error) {
    console.error('Error fetching cards caught by team:', error);
    throw error;
  }
}

// Mark a card as caught by a team
export async function markCardAsCaught(cardId: string, teamId: string): Promise<void> {
  try {
    const cardRef = doc(db, 'cards', cardId);
    await updateDoc(cardRef, {
      isCaught: true,
      caughtByTeam: teamId
    });
  } catch (error) {
    console.error('Error marking card as caught:', error);
    throw error;
  }
}

// Fetch AR-enabled characters with their scan data
export async function getARCharacters(): Promise<Character[]> {
  try {
    const cardsRef = collection(db, 'cards');
    const snapshot = await getDocs(cardsRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Auto-calculate tier from value if not present
        tier: data.tier || getTierFromValue(data.value || 0),
        // Prepend /ar-targets/ to mindFile if not already present
        mindFile: data.mindFile?.startsWith('/') 
          ? data.mindFile 
          : `/ar-targets/${data.mindFile}`,
      };
    }) as Character[];
  } catch (error) {
    console.error('Error fetching AR characters:', error);
    throw error;
  }
}

// Fetch a single character by ID (for real-time updates)
export async function getCharacterById(characterId: string): Promise<Character | null> {
  try {
    const characterRef = doc(db, 'cards', characterId);
    const characterSnap = await getDoc(characterRef);
    
    if (characterSnap.exists()) {
      const data = characterSnap.data();
      return {
        id: characterSnap.id,
        ...data,
        tier: data.tier || getTierFromValue(data.value || 0),
        mindFile: data.mindFile?.startsWith('/') 
          ? data.mindFile 
          : `/ar-targets/${data.mindFile}`,
      } as Character;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching character by ID:', error);
    throw error;
  }
}

// Catch a character (update character status + team data)
// Uses Firestore transaction to prevent race conditions when multiple teams try to catch the same character
export async function catchCharacter(
  characterId: string, 
  teamId: string, 
  characterValue: number
): Promise<{ success: boolean; alreadyCaught?: boolean; caughtByTeam?: string }> {
  try {
    const characterRef = doc(db, 'cards', characterId);
    const teamRef = doc(db, 'teams', teamId);

    // Use transaction to ensure atomic read-check-write operation
    const result = await runTransaction(db, async (transaction) => {
      // Read the current state of the character
      const characterDoc = await transaction.get(characterRef);
      
      if (!characterDoc.exists()) {
        throw new Error('Character does not exist');
      }

      const characterData = characterDoc.data();
      
      // Check if already caught (race condition check)
      if (characterData.isCaught === true) {
        return {
          success: false,
          alreadyCaught: true,
          caughtByTeam: characterData.caughtByTeam
        };
      }

      // If not caught, proceed with catching
      // Update character document
      transaction.update(characterRef, {
        isCaught: true,
        caughtByTeam: teamId
      });

      // Update team document
      transaction.update(teamRef, {
        cardsCaught: arrayUnion(characterId),
        score: increment(characterValue)
      });

      return { success: true };
    });

    return result;
  } catch (error) {
    console.error('Error catching character:', error);
    throw error;
  }
}

// Check if a character is already caught
export async function isCharacterCaught(characterId: string): Promise<boolean> {
  try {
    const characterRef = doc(db, 'cards', characterId);
    const characterSnap = await getDoc(characterRef);
    
    if (characterSnap.exists()) {
      const data = characterSnap.data();
      return data.isCaught === true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking character status:', error);
    throw error;
  }
}

// Reset database: Mark all cards as uncaught and reset team scores
export async function resetDatabase(): Promise<void> {
  try {
    // Reset all cards to uncaught
    const cardsRef = collection(db, 'cards');
    const cardsSnapshot = await getDocs(cardsRef);
    
    const cardUpdates = cardsSnapshot.docs.map(cardDoc => 
      updateDoc(doc(db, 'cards', cardDoc.id), {
        isCaught: false,
        caughtByTeam: ''
      })
    );

    // Reset all team scores to 0 and clear cardsCaught arrays
    const teamsRef = collection(db, 'teams');
    const teamsSnapshot = await getDocs(teamsRef);
    
    const teamUpdates = teamsSnapshot.docs.map(teamDoc => 
      updateDoc(doc(db, 'teams', teamDoc.id), {
        score: 0,
        cardsCaught: []
      })
    );

    // Execute all updates
    await Promise.all([...cardUpdates, ...teamUpdates]);
    
    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

// Create a snapshot of current database state for undo
export async function createDatabaseSnapshot(): Promise<{
  teams: Array<{ id: string; [key: string]: unknown }>;
  cards: Array<{ id: string; [key: string]: unknown }>;
}> {
  try {
    // Get all teams
    const teamsRef = collection(db, 'teams');
    const teamsSnapshot = await getDocs(teamsRef);
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get all cards
    const cardsRef = collection(db, 'cards');
    const cardsSnapshot = await getDocs(cardsRef);
    const cards = cardsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return { teams, cards };
  } catch (error) {
    console.error('Error creating database snapshot:', error);
    throw error;
  }
}

// Restore database from snapshot
export async function restoreDatabaseFromSnapshot(snapshot: {
  teams: Array<{ id: string; [key: string]: unknown }>;
  cards: Array<{ id: string; [key: string]: unknown }>;
}): Promise<void> {
  try {
    // Restore all teams
    const teamUpdates = snapshot.teams.map(team => {
      const { id, ...data } = team;
      return updateDoc(doc(db, 'teams', id), data);
    });

    // Restore all cards
    const cardUpdates = snapshot.cards.map(card => {
      const { id, ...data } = card;
      return updateDoc(doc(db, 'cards', id), data);
    });

    // Execute all updates
    await Promise.all([...teamUpdates, ...cardUpdates]);
    
    console.log('Database restored from snapshot successfully');
  } catch (error) {
    console.error('Error restoring database from snapshot:', error);
    throw error;
  }
}

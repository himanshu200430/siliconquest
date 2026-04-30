import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Initializes the counter documents in Firestore if they don't exist.
 * This should be called when setting up the admin portal for the first time.
 */
export async function initializeFirestoreCounters() {
  const counters = [
    { name: 'teams', suffix: 'Counter' },
    { name: 'cards', suffix: 'LegendaryCounter' },  // c1xx (value: 50)
    { name: 'cards', suffix: 'RareCounter' },       // c2xx (value: 20)
    { name: 'cards', suffix: 'CommonCounter' },     // c3xx (value: 8)
  ];
  
  for (const counter of counters) {
    const counterRef = doc(db, 'counters', `${counter.name}${counter.suffix}`);
    const counterDoc = await getDoc(counterRef);
    
    if (!counterDoc.exists()) {
      await setDoc(counterRef, {
        count: 0
      });
      console.log(`Initialized counter for ${counter.name}${counter.suffix}`);
    }
  }
}

/**
 * Checks if the counter documents exist in Firestore.
 * @returns An object indicating which counters exist
 */
export async function checkCounters() {
  const counters = [
    { name: 'teams', suffix: 'Counter' },
    { name: 'cards', suffix: 'LegendaryCounter' },
    { name: 'cards', suffix: 'RareCounter' },
    { name: 'cards', suffix: 'CommonCounter' },
  ];
  const status: Record<string, boolean> = {};
  
  for (const counter of counters) {
    const counterRef = doc(db, 'counters', `${counter.name}${counter.suffix}`);
    const counterDoc = await getDoc(counterRef);
    const key = counter.suffix === 'Counter' ? counter.name : `${counter.name}${counter.suffix}`;
    status[key] = counterDoc.exists();
  }
  
  // Teams and at least one card counter must exist
  status.teams = status.teams || false;
  status.cards = (status.cardsLegendaryCounter && status.cardsRareCounter && status.cardsCommonCounter) || false;
  
  return status;
}
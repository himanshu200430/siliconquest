import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

/**
 * IMPORTANT: Before using these functions, you must manually create the following structure in Firestore:
 * 
 * Collection: counters
 *   └─ Document: cardsCounter
 *      └─ Field: count (number, initial value: 0)
 *   └─ Document: teamsCounter
 *      └─ Field: count (number, initial value: 0)
 */

/**
 * Generates a sequential, padded ID for a new document in a collection.
 * Uses a transaction to ensure atomicity of the counter increment.
 * 
 * @param collectionName - The name of the collection ('cards' or 'teams')
 * @param prefix - The prefix to use for the ID ('char_', 'team_', 'c1', 'c2', 'c3')
 * @returns A formatted ID string (e.g., 'char_001', 'team_042', 'c101', 'c201', 'c301')
 * @throws Error if counter document doesn't exist or transaction fails
 */
export async function generateNextId(
  collectionName: 'cards' | 'teams',
  prefix: 'char_' | 'team_' | 'c1' | 'c2' | 'c3'
): Promise<string> {
  // Map tier prefixes to their counter suffix
  const counterSuffix = prefix === 'c1' ? 'Legendary' : 
                       prefix === 'c2' ? 'Rare' : 
                       prefix === 'c3' ? 'Common' : '';
  
  // Get reference to the counter document
  const counterRef = doc(db, 'counters', counterSuffix ? `${collectionName}${counterSuffix}Counter` : `${collectionName}Counter`);
  
  try {
    // Run the counter increment in a transaction
    const newId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      // Verify counter document exists
      if (!counterDoc.exists()) {
        throw new Error(
          `Counter document for ${collectionName} does not exist. ` +
          'Please create it manually in Firestore first.'
        );
      }
      
      // Get current count and increment
      const currentCount = counterDoc.data()?.count || 0;
      const nextCount = currentCount + 1;
      
      // Update the counter in Firestore
      transaction.update(counterRef, { count: nextCount });
      
      // Format the ID with padding (e.g., 001, 042, 123)
      return `${prefix}${nextCount.toString().padStart(3, '0')}`;
    });
    
    return newId;
  } catch (error) {
    console.error('Error generating next ID:', error);
    throw new Error(
      `Failed to generate next ID for ${collectionName}. ` +
      'Please ensure the counter document exists and try again.'
    );
  }
}

/**
 * Helper function to validate if a given ID follows the expected format
 * 
 * @param id - The ID to validate
 * @param prefix - The expected prefix ('char_', 'team_', 'c1', 'c2', 'c3')
 * @returns boolean indicating if the ID is valid
 */
export function isValidId(id: string, prefix: 'char_' | 'team_' | 'c1' | 'c2' | 'c3'): boolean {
  const pattern = new RegExp(`^${prefix}\\d{2,3}$`);
  return pattern.test(id);
}

/**
 * Helper function to extract the numeric value from an ID
 * 
 * @param id - The formatted ID (e.g., 'char_042')
 * @returns The numeric value (e.g., 42) or null if invalid
 */
export function getIdNumber(id: string): number | null {
  const match = id.match(/\d+$/);
  if (!match) return null;
  return parseInt(match[0], 10);
}

/**
 * USAGE EXAMPLE:
 * 
 * try {
 *   // Generate a new card ID
 *   const newCardId = await generateNextId('cards', 'char_');
 *   console.log(newCardId); // e.g., 'char_001'
 *   
 *   // Generate a new team ID
 *   const newTeamId = await generateNextId('teams', 'team_');
 *   console.log(newTeamId); // e.g., 'team_001'
 *   
 *   // Validate an ID
 *   const isValid = isValidId('char_042', 'char_');
 *   console.log(isValid); // true
 *   
 *   // Get numeric value
 *   const num = getIdNumber('team_042');
 *   console.log(num); // 42
 * } catch (error) {
 *   console.error('Error:', error.message);
 * }
 */
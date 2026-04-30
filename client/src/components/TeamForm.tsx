import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateNextId } from '@/lib/firestoreAdmin';

interface TeamFormProps {
  isOpen: boolean;
  onClose: () => void;
  teamToEdit?: {
    id: string;
    teamName: string;
  };
}

export default function TeamForm({ isOpen, onClose, teamToEdit }: TeamFormProps) {
  const [teamName, setTeamName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (teamToEdit) {
      setTeamName(teamToEdit.teamName);
    } else {
      setTeamName('');
    }
    setError('');
  }, [teamToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (teamToEdit) {
        // Update existing team
        const teamRef = doc(db, 'teams', teamToEdit.id);
        await updateDoc(teamRef, {
          teamName: teamName.trim()
        });
      } else {
        // Create new team
        const newTeamId = await generateNextId('teams', 'team_');
        const teamRef = doc(db, 'teams', newTeamId);
        await setDoc(teamRef, {
          teamName: teamName.trim(),
          score: 0
        });
      }

      onClose();
    } catch (err) {
      console.error('Error saving team:', err);
      setError('Failed to save team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {teamToEdit ? 'Edit Team' : 'Add New Team'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label 
              htmlFor="teamName" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Team Name
            </label>
            <input
              type="text"
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter team name"
              disabled={isSubmitting}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (teamToEdit ? 'Update Team' : 'Add Team')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
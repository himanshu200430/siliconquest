interface Team {
  id: string;
  teamName: string;
  score: number;
}

interface TeamsManagementProps {
  teams: Team[];
  isLoading: boolean;
  deleteConfirm: string | null;
  onAddTeam: () => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onCancelDelete: () => void;
}

export const TeamsManagement = ({
  teams,
  isLoading,
  deleteConfirm,
  onAddTeam,
  onEditTeam,
  onDeleteTeam,
  onCancelDelete,
}: TeamsManagementProps) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Teams</h3>
        <button
          onClick={onAddTeam}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md 
                   transition-colors shadow-lg shadow-indigo-500/20"
        >
          Add New Team
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="mt-2 text-gray-400">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No teams found. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-gray-800 rounded-lg p-4 flex justify-between items-center
                       hover:bg-gray-750 transition-colors border border-gray-700"
            >
              <div>
                <h4 className="font-semibold text-white">{team.teamName}</h4>
                <p className="text-sm text-gray-400">Score: {team.score}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEditTeam(team)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded
                           transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm === team.id) {
                      onDeleteTeam(team.id);
                    } else {
                      onDeleteTeam(team.id);
                    }
                  }}
                  onMouseLeave={onCancelDelete}
                  className={`px-3 py-1 rounded transition-colors text-sm ${
                    deleteConfirm === team.id
                      ? "bg-red-700 hover:bg-red-800 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {deleteConfirm === team.id ? "Confirm?" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

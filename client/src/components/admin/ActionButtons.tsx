interface Snapshot {
  teams: unknown[];
  cards: unknown[];
  timestamp: number;
}

interface ActionButtonsProps {
  currentView: "teams" | "cards";
  onViewChange: (view: "teams" | "cards") => void;
  onResetClick: () => void;
  onUndoClick: () => void;
  lastSnapshot: Snapshot | null;
  isLoading: boolean;
}

export const ActionButtons = ({
  currentView,
  onViewChange,
  onResetClick,
  onUndoClick,
  lastSnapshot,
  isLoading,
}: ActionButtonsProps) => {
  const getRemainingMinutes = () => {
    if (!lastSnapshot) return 0;
    const fiveMinutes = 5 * 60 * 1000;
    return Math.max(
      0,
      Math.ceil((fiveMinutes - (Date.now() - lastSnapshot.timestamp)) / 60000)
    );
  };

  return (
    <div className="flex gap-4 mb-6 flex-wrap">
      <button
        onClick={() => onViewChange("teams")}
        className={`px-4 py-2 rounded-md transition-colors ${
          currentView === "teams"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
        }`}
      >
        Manage Teams
      </button>
      <button
        onClick={() => onViewChange("cards")}
        className={`px-4 py-2 rounded-md transition-colors ${
          currentView === "cards"
            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
        }`}
      >
        Manage Cards
      </button>

      {/* Spacer to push reset/undo to the right */}
      <div className="flex-grow"></div>

      {/* Undo button */}
      {lastSnapshot && (
        <button
          onClick={onUndoClick}
          disabled={isLoading}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md 
                   transition-colors shadow-lg shadow-yellow-500/20 disabled:opacity-50
                   flex items-center gap-2"
          title={`Undo last reset (expires in ${getRemainingMinutes()} min)`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Undo Last Reset
        </button>
      )}

      {/* Reset Database button */}
      <button
        onClick={onResetClick}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md 
                 transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
        Reset Database
      </button>
    </div>
  );
};

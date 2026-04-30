interface ResetDatabaseModalProps {
  isOpen: boolean;
  password: string;
  error: string;
  isResetting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetDatabaseModal = ({
  isOpen,
  password,
  error,
  isResetting,
  onPasswordChange,
  onConfirm,
  onCancel,
}: ResetDatabaseModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border-2 border-red-500">
        <div className="bg-red-600 px-6 py-4 rounded-t-lg">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Critical Action: Reset Database
          </h3>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-200 text-sm font-semibold mb-2">
              ⚠️ Warning: This action will:
            </p>
            <ul className="text-red-300 text-sm space-y-1 ml-4 list-disc">
              <li>
                Mark all cards as <strong>uncaught</strong>
              </li>
              <li>
                Clear all team&apos;s <strong>caught cards</strong>
              </li>
              <li>
                Reset all team <strong>scores to 0</strong>
              </li>
              <li>This action can be undone within 5 minutes</li>
            </ul>
          </div>

          <div>
            <label
              htmlFor="reset-password"
              className="block text-sm font-medium text-gray-200 mb-2"
            >
              Enter Admin Password to Confirm
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
                       text-white placeholder-gray-400"
              placeholder="Enter admin password"
              disabled={isResetting}
            />
            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md 
                       transition-colors"
              disabled={isResetting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md 
                       transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isResetting || !password}
            >
              {isResetting ? "Resetting..." : "Reset Database"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

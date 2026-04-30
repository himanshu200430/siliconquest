interface SetupScreenProps {
  isInitializing: boolean;
  error: string;
  onInitialize: () => void;
}

export const SetupScreen = ({
  isInitializing,
  error,
  onInitialize,
}: SetupScreenProps) => {
  return (
    <div className="text-center py-8">
      <h3 className="text-xl font-semibold text-white mb-4">
        First-Time Setup Required
      </h3>
      <p className="text-gray-400 mb-6">
        The admin portal needs to initialize some required documents in
        Firestore.
      </p>
      <button
        onClick={onInitialize}
        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 
                 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 
                 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
        disabled={isInitializing}
      >
        {isInitializing ? "Initializing..." : "Initialize Admin Portal"}
      </button>
      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
    </div>
  );
};

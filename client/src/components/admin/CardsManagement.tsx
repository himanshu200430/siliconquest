interface Card {
  id: string;
  name: string;
  question: string;
  options: string[];
  correctAnswer: number;
  image: string;
  mindFile: string;
  modelUrl: string;
  isCaught: boolean;
  caughtByTeam: string;
}

interface CardsManagementProps {
  cards: Card[];
  isLoading: boolean;
  deleteConfirm: string | null;
  onAddCard: () => void;
  onEditCard: (card: Card) => void;
  onDeleteCard: (cardId: string) => void;
  onCancelDelete: () => void;
}

export const CardsManagement = ({
  cards,
  isLoading,
  deleteConfirm,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onCancelDelete,
}: CardsManagementProps) => {
  const getTierBadge = (card: Card) => {
    // Determine tier based on card ID prefix
    // c1xxx = Legendary, c2xxx = Rare, c3xxx = Common
    const cardId = card.id.toLowerCase();
    let tierColor = "bg-purple-600";
    let tierName = "Common";

    if (cardId.startsWith("c1")) {
      tierColor = "bg-yellow-600";
      tierName = "Legendary";
    } else if (cardId.startsWith("c2")) {
      tierColor = "bg-gray-400";
      tierName = "Rare";
    } else if (cardId.startsWith("c3")) {
      tierColor = "bg-purple-600";
      tierName = "Common";
    }

    return (
      <span
        className={`${tierColor} text-white text-xs px-2 py-1 rounded-full`}
      >
        {tierName}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Cards</h3>
        <button
          onClick={onAddCard}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md 
                   transition-colors shadow-lg shadow-indigo-500/20"
        >
          Add New Card
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="mt-2 text-gray-400">Loading cards...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">
            No cards found. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800 border-b border-gray-700">
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">
                  ID
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">
                  Question
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">
                  Tier
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">
                  Caught By
                </th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr
                  key={card.id}
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">
                    {card.id}
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {card.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 max-w-md">
                    <div className="line-clamp-2 break-words">
                      {card.question}
                    </div>
                  </td>
                  <td className="px-4 py-3">{getTierBadge(card)}</td>
                  <td className="px-4 py-3">
                    {card.isCaught ? (
                      <span className="inline-flex items-center gap-1 bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Caught
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-blue-900/30 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-500/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {card.isCaught && card.caughtByTeam ? (
                      <span className="text-gray-300">{card.caughtByTeam}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onEditCard(card)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded
                                 transition-colors text-sm whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (deleteConfirm === card.id) {
                            onDeleteCard(card.id);
                          } else {
                            onDeleteCard(card.id);
                          }
                        }}
                        onMouseLeave={onCancelDelete}
                        className={`px-3 py-1 rounded transition-colors text-sm whitespace-nowrap ${
                          deleteConfirm === card.id
                            ? "bg-red-700 hover:bg-red-800 text-white"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        {deleteConfirm === card.id ? "Confirm?" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

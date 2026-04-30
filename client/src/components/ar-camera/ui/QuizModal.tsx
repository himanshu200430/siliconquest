import { getImageSrc, shouldDisplayAsText } from "@/utils/imageUtils";
import { Character, getTierFromValue } from "../types";
import {
  getTierBorder,
  getTierColor,
  getTierThemeColor,
} from "../utils/tierStyles";

interface QuizModalProps {
  character: Character;
  selectedAnswer: number | null;
  quizResult: "correct" | "incorrect" | null;
  onAnswerSelect: (index: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const QuizModal = ({
  character,
  selectedAnswer,
  quizResult,
  onAnswerSelect,
  onSubmit,
  onClose,
}: QuizModalProps) => {
  const tier = character.tier || getTierFromValue(character.value);
  const themeColor = getTierThemeColor(tier);

  const imageSrc = getImageSrc(character.image);
  const displayAsText = shouldDisplayAsText(character.image);
  const hasContent = imageSrc || displayAsText;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto z-50">
      <div
        className={`relative bg-slate-900/30 backdrop-blur-xl border-2 border-${themeColor.primary}/50 rounded-xl p-6 max-w-lg w-full shadow-2xl shadow-${themeColor.glow} animate-scaleIn my-auto max-h-[90vh] overflow-y-auto`}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click context menu
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="sticky -top-3 -right-3 w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-full flex items-center justify-center border-2 border-slate-600 transition-all duration-200 z-[100] shadow-lg"
          aria-label="Close quiz"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2
          className={`text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-${themeColor.primary} to-${themeColor.secondary} mb-6`}
        >
          Let&apos;s start hunting
        </h2>

        <div
          className={`border-3 ${getTierBorder(
            tier
          )} rounded-2xl p-6 mb-6 bg-slate-800/60 shadow-xl`}
        >
          <div className="flex items-center justify-center mb-4">
            <div
              className={`absolute top-[8.25rem] z-[120] px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(
                tier
              )} text-white text-xs font-bold shadow-md`}
            >
              {tier}
            </div>
            {hasContent ? (
              <div
                className={`relative w-28 h-36 rounded-2xl overflow-hidden border-2 border-${themeColor.primary}/40 shadow-lg shadow-${themeColor.glow} bg-slate-800/80 flex items-center justify-center`}
              >
                {imageSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageSrc}
                    alt={character.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = "none";
                      const textSpan = e.currentTarget.nextElementSibling;
                      if (
                        textSpan &&
                        textSpan.classList.contains("fallback-text")
                      ) {
                        textSpan.classList.remove("hidden");
                      }
                    }}
                  />
                ) : null}
                {displayAsText && (
                  <span
                    className={`text-5xl ${
                      imageSrc ? "hidden fallback-text" : ""
                    }`}
                    aria-hidden="true"
                  >
                    {character.image?.trim()}
                  </span>
                )}
              </div>
            ) : (
              <div
                className={`relative w-28 h-36 rounded-2xl border-2 border-dashed border-${themeColor.primary}/40 bg-slate-800/60 flex items-center justify-center text-${themeColor.primary} text-xs text-center px-4`}
              >
                Card art coming soon
                <div
                  className={`absolute -top-2 -right-2 px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(
                    tier
                  )} text-white text-xs font-bold shadow-md`}
                >
                  {tier}
                </div>
              </div>
            )}
          </div>

          <h3
            className={`text-md text-${themeColor.primary} mb-4 text-center select-none`}
          >
            {character.question}
          </h3>

          <div className="space-y-3 text-sm select-none">
            {character.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = quizResult === "correct" && isSelected;
              const isIncorrect = quizResult === "incorrect" && isSelected;

              return (
                <button
                  key={index}
                  onClick={() => onAnswerSelect(index)}
                  disabled={quizResult !== null}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all duration-300 ${
                    isSelected
                      ? isCorrect
                        ? "bg-green-600/30 border-green-500 text-green-300"
                        : isIncorrect
                        ? "bg-red-600/30 border-red-500 text-red-300"
                        : `bg-${themeColor.primary}/30 border-${themeColor.primary} text-${themeColor.primary}`
                      : `bg-slate-700/30 border-slate-600 text-slate-300 hover:border-${themeColor.primary}/50 hover:bg-slate-700/50`
                  } ${
                    quizResult !== null
                      ? "cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <span className="font-medium">
                    {index + 1}. {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={selectedAnswer === null || quizResult !== null}
          className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
            selectedAnswer === null || quizResult !== null
              ? "bg-slate-700 text-slate-500 cursor-not-allowed"
              : `bg-gradient-to-r from-${themeColor.primary} to-${themeColor.secondary} hover:from-${themeColor.primary} hover:to-${themeColor.secondary} text-white transform hover:scale-105`
          }`}
        >
          {quizResult === "correct"
            ? "✓ Correct! Collecting..."
            : quizResult === "incorrect"
            ? "✗ Try Again"
            : "Submit"}
        </button>

        {quizResult === "incorrect" && (
          <p className="text-red-400 text-center text-sm mt-3 animate-shake">
            Incorrect answer. Please try again!
          </p>
        )}
      </div>
    </div>
  );
};

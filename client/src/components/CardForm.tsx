import { useState, useEffect } from "react";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateNextId } from "@/lib/firestoreAdmin";

interface CardFormProps {
  isOpen: boolean;
  onClose: () => void;
  cardToEdit?: {
    id: string;
    name: string;
    question: string;
    options: string[];
    correctAnswer: number;
    image: string;
    mindFile: string;
    modelUrl: string;
    isCaught?: boolean;
    caughtByTeam?: string;
  };
}

export default function CardForm({
  isOpen,
  onClose,
  cardToEdit,
}: CardFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    image: "",
    mindFile: "",
    modelUrl: "",
    value: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cardToEdit) {
      setFormData({
        name: cardToEdit.name,
        question: cardToEdit.question,
        options: cardToEdit.options,
        correctAnswer: cardToEdit.correctAnswer,
        image: cardToEdit.image,
        mindFile: cardToEdit.mindFile,
        modelUrl: cardToEdit.modelUrl,
        value:
          "value" in cardToEdit && typeof cardToEdit.value === "number"
            ? cardToEdit.value
            : 50,
      });
    } else {
      setFormData({
        name: "",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        image: "",
        mindFile: "",
        modelUrl: "",
        value: 50,
      });
    }
    setError("");
  }, [cardToEdit, isOpen]);

  // Auto-populate mindFile based on value tier
  useEffect(() => {
    const getMindFileFromValue = (value: number): string => {
      switch (value) {
        case 50: // Legendary
          return "/ar-targets/legendary.mind";
        case 20: // Rare
          return "/ar-targets/rare.mind";
        case 8: // Common
          return "/ar-targets/common.mind";
        default:
          return "/ar-targets/common.mind";
      }
    };

    setFormData((prev) => ({
      ...prev,
      mindFile: getMindFileFromValue(prev.value),
    }));
  }, [formData.value]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.question.trim()) {
      setError("Question is required");
      return false;
    }
    if (formData.options.some((opt) => !opt.trim())) {
      setError("All options must be filled");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError("");

    try {
      if (cardToEdit) {
        // Update existing card
        const cardRef = doc(db, "cards", cardToEdit.id);
        await updateDoc(cardRef, {
          ...formData,
          options: formData.options.map((opt) => opt.trim()),
        });
      } else {
        // Create new card with auto-generated ID based on value tier
        let prefix: "c1" | "c2" | "c3" = "c1"; // Default for value 50 (Legendary)
        if (formData.value === 20) {
          prefix = "c2"; // Rare
        } else if (formData.value === 8) {
          prefix = "c3"; // Common
        }

        const newCardId = await generateNextId("cards", prefix);
        const cardRef = doc(db, "cards", newCardId);
        await setDoc(cardRef, {
          ...formData,
          options: formData.options.map((opt) => opt.trim()),
          isCaught: false,
          caughtByTeam: "",
        });
      }

      onClose();
    } catch (err) {
      console.error("Error saving card:", err);
      setError("Failed to save card. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">
          {cardToEdit ? "Edit Card" : "Add New Card"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter card name"
              disabled={isSubmitting}
            />
          </div>

          {/* Card Value (Tier) Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Card Value (Tier)
            </label>
            <select
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: Number(e.target.value) })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                     text-white focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting || !!cardToEdit}
            >
              <option value={50}>50 - Legendary (ID: c1xx)</option>
              <option value={20}>20 - Rare (ID: c2xx)</option>
              <option value={8}>8 - Common (ID: c3xx)</option>
            </select>
            {cardToEdit && (
              <p className="text-xs text-gray-400 mt-1">
                Card tier cannot be changed after creation
              </p>
            )}
          </div>

          {/* Question Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Question
            </label>
            <textarea
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                     text-white placeholder-gray-400 focus:outline-none focus:ring-2
                     focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter question"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Options Inputs */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300">
              Options
            </label>
            {formData.options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[index] = e.target.value;
                    setFormData({ ...formData, options: newOptions });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                         text-white placeholder-gray-400 focus:outline-none focus:ring-2
                         focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Option ${index + 1}`}
                  disabled={isSubmitting}
                />
                <div className="w-20">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctAnswer === index}
                    onChange={() =>
                      setFormData({ ...formData, correctAnswer: index })
                    }
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  <span className="text-gray-300 text-sm">Correct</span>
                </div>
              </div>
            ))}
          </div>

          {/* URL Inputs */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                       text-white placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter image URL"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Mind File URL (Auto-set by tier)
              </label>
              <input
                type="text"
                value={formData.mindFile}
                className="w-full px-3 py-2 bg-gray-600 border border-gray-600 rounded-md
                       text-gray-400 cursor-not-allowed"
                disabled
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Model URL
              </label>
              <input
                type="text"
                value={formData.modelUrl}
                onChange={(e) =>
                  setFormData({ ...formData, modelUrl: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                       text-white placeholder-gray-400 focus:outline-none focus:ring-2
                       focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter model URL"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
                     transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : cardToEdit
                ? "Update Card"
                : "Add Card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

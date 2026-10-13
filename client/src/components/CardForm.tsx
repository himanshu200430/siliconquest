"use client";

import { useState, useEffect } from "react";

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
    value?: number;
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

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
      setError("All 4 options must be filled");
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
      const res = await fetch("/api/admin/mutate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_card",
          id: cardToEdit?.id,
          cardData: {
            ...formData,
            options: formData.options.map((opt) => opt.trim()),
          },
          adminPassword: process.env.NEXT_PUBLIC_ADMIN_PASS,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save card");
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

  const getTierInfo = (val: number) => {
    if (val >= 50) return { label: "Legendary", color: "from-amber-400 to-yellow-500", border: "border-amber-400/50", badge: "bg-amber-500/20 text-amber-300" };
    if (val >= 20) return { label: "Rare", color: "from-cyan-400 to-blue-500", border: "border-cyan-400/50", badge: "bg-cyan-500/20 text-cyan-300" };
    return { label: "Common", color: "from-emerald-400 to-teal-500", border: "border-emerald-400/50", badge: "bg-emerald-500/20 text-emerald-300" };
  };

  const currentTier = getTierInfo(formData.value);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-purple-950/85 border-2 border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/20 backdrop-blur-2xl animate-scaleIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Neon Glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-3.5">
            {/* Holographic Pokeball Crest */}
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/30 via-pink-500/20 to-purple-800/40 border border-purple-400/40 flex items-center justify-center shadow-lg shadow-purple-500/30 overflow-hidden">
              <div className="w-7 h-7 rounded-full border-2 border-purple-300 relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
                <div className="w-full h-1/2 bg-gradient-to-b from-red-500 to-pink-600 border-b border-purple-950" />
                <div className="w-full h-1/2 bg-white/90" />
                <div className="absolute w-2.5 h-2.5 bg-white rounded-full border-2 border-purple-950 flex items-center justify-center">
                  <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border ${currentTier.badge} ${currentTier.border}`}>
                  {`${currentTier.label} • ${formData.value} PTS`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-amber-200 tracking-wide font-sans mt-0.5">
                {cardToEdit ? "Edit Target Card" : "Add Target Card"}
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-400 flex items-center justify-center text-red-400 hover:bg-red-500/40 hover:border-red-300 hover:text-white active:scale-90 transition-all cursor-pointer pointer-events-auto touch-manipulation shadow-lg shadow-red-950/50"
            aria-label="Close dialog"
          >
            <span className="text-lg font-bold leading-none select-none">✕</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Card Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
              Character Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-950/70 border border-purple-500/30 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40 transition-all"
              placeholder="e.g. Pikachu, Levi Ackerman, Gojo..."
              disabled={isSubmitting}
            />
          </div>

          {/* Tier & Value */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
              Target Tier & Points
            </label>
            <select
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: Number(e.target.value) })
              }
              className="w-full px-4 py-3 bg-slate-950/70 border border-purple-500/30 rounded-2xl text-white focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40 transition-all cursor-pointer"
              disabled={isSubmitting || !!cardToEdit}
            >
              <option value={50} className="bg-slate-900 text-amber-300">
                ⭐ 50 - Legendary (Target file: legendary.mind)
              </option>
              <option value={20} className="bg-slate-900 text-cyan-300">
                💎 20 - Rare (Target file: rare.mind)
              </option>
              <option value={8} className="bg-slate-900 text-emerald-300">
                ⚡ 8 - Common (Target file: common.mind)
              </option>
            </select>
            {cardToEdit && (
              <p className="text-[11px] text-slate-400 mt-1">
                🔒 Tier cannot be altered after creation to preserve scan indices.
              </p>
            )}
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
              Trivia / Capture Question
            </label>
            <textarea
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              className="w-full px-4 py-3 bg-slate-950/70 border border-purple-500/30 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/40 transition-all"
              placeholder="Enter the quiz question presented when this target is scanned in AR..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-sm shadow-purple-400" />
              Quiz Options (Select the correct answer)
            </label>
            <div className="space-y-2.5">
              {formData.options.map((option, index) => {
                const isSelected = formData.correctAnswer === index;
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-2 px-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/40"
                        : "bg-slate-950/60 border-purple-500/20"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400 w-5">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...formData.options];
                        newOptions[index] = e.target.value;
                        setFormData({ ...formData, options: newOptions });
                      }}
                      className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                      placeholder={`Option ${index + 1}`}
                      disabled={isSubmitting}
                    />
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={isSelected}
                        onChange={() =>
                          setFormData({ ...formData, correctAnswer: index })
                        }
                        className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
                        disabled={isSubmitting}
                      />
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? "text-emerald-400" : "text-slate-400"
                        }`}
                      >
                        {isSelected ? "CORRECT" : "Mark"}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-purple-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 text-sm"
                placeholder="/characters/pikachu.png"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-purple-300 mb-1">
                Model URL (Optional 3D glTF)
              </label>
              <input
                type="text"
                value={formData.modelUrl}
                onChange={(e) =>
                  setFormData({ ...formData, modelUrl: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-purple-500/30 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 text-sm"
                placeholder="/models/character.glb"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 animate-shake">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 font-semibold transition-all active:scale-95 cursor-pointer shadow-md text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:via-pink-500 hover:to-amber-400 shadow-xl shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Saving Card...</span>
                </>
              ) : (
                <>
                  <span>{cardToEdit ? "Update Card" : "Add Card"}</span>
                  <span className="text-amber-300">✦</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

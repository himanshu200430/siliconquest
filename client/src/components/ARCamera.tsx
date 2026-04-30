"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { catchCharacter, getCharacterById } from "@/services/firestore";
import {
  clearCooldown,
  getCooldownRemaining,
  setWrongAnswerCooldown,
} from "@/utils/quizCooldown";
import { useARCharacters } from "./ar-camera/hooks/useARCharacters";
import { useMindARInlineStyles } from "./ar-camera/hooks/useMindARInlineStyles";
import { useMindARScripts } from "./ar-camera/hooks/useMindARScripts";
import { useSceneLifecycle } from "./ar-camera/hooks/useSceneLifecycle";
import { ARErrorOverlay } from "./ar-camera/ui/ARErrorOverlay";
import { DetectedCharacterOverlay } from "./ar-camera/ui/DetectedCharacterOverlay";
import { FrameOverlay } from "./ar-camera/ui/FrameOverlay";
import { HeaderOverlay } from "./ar-camera/ui/HeaderOverlay";
import { LoadingOverlay } from "./ar-camera/ui/LoadingOverlay";
import { MindARScene } from "./ar-camera/ui/MindARScene";
import { QuizModal } from "./ar-camera/ui/QuizModal";
import { ScanHint } from "./ar-camera/ui/ScanHint";
import {
  ARCameraProps,
  Character,
  getTierFromValue,
  MindARSceneElement,
  Tier,
} from "./ar-camera/types";

export default function ARCamera({
  teamName,
  teamId,
  onClose,
  onCharacterCollected,
}: ARCameraProps) {
  const {
    charactersByTier,
    loading: loadingCharacters,
    error: charactersError,
    refetch,
  } = useARCharacters();
  const sceneRef = useRef<MindARSceneElement | null>(null);
  const targetRefs = useRef<Record<string, Element | null>>({});
  const targetListenersRef = useRef<
    Record<
      string,
      {
        onFound: () => void;
        onLost: () => void;
      }
    >
  >({});
  const charactersMapRef = useRef<Map<string, Character>>(new Map());
  const [detectedCharacter, setDetectedCharacter] = useState<Character | null>(
    null
  );
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(
    null
  );
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>("Common");
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const showQuizRef = useRef(false);
  const activeTargetRef = useRef<{
    characterId: string;
    targetIndex: number;
  } | null>(null);

  const { scriptsLoaded, animationMixerAvailable, arError, setARError } =
    useMindARScripts();

  useMindARInlineStyles(scriptsLoaded);

  // Update character map whenever tier data changes
  useEffect(() => {
    const newMap = new Map<string, Character>();
    Object.values(charactersByTier)
      .flat()
      .forEach((char) => {
        newMap.set(char.id, char);
      });
    charactersMapRef.current = newMap;
  }, [charactersByTier]);

  // Show error if characters failed to load or have missing fields
  useEffect(() => {
    if (charactersError) {
      setARError(charactersError);
    } else if (!loadingCharacters) {
      const totalCharacters = Object.values(charactersByTier).flat().length;
      if (totalCharacters === 0) {
        setARError(
          "No AR characters configured. Please add required fields to Firestore documents. " +
            "See FIRESTORE_SCHEMA.md for details."
        );
      }
    }
  }, [charactersError, loadingCharacters, charactersByTier, setARError]);

  useEffect(() => {
    showQuizRef.current = showQuiz;
  }, [showQuiz]);

  const stopMindAR = useCallback(() => {
    const sceneEl = sceneRef.current;
    if (!sceneEl) return;

    try {
      const mindarComponent = sceneEl.components?.["mindar-image-system"];
      if (mindarComponent && typeof mindarComponent.stop === "function") {
        mindarComponent.stop();
      }
    } catch (error) {
      console.warn("MindAR stop error", error);
    }
  }, []);

  useEffect(() => stopMindAR, [stopMindAR]);

  // Cooldown timer management
  const startCooldownTimer = useCallback((characterId: string) => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }

    const updateCooldown = () => {
      const remaining = getCooldownRemaining(characterId);
      if (remaining === null) {
        setCooldownSeconds(null);
        if (cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
        }
      } else {
        setCooldownSeconds(remaining);
      }
    };

    // Update immediately
    updateCooldown();

    // Then update every second
    cooldownIntervalRef.current = setInterval(updateCooldown, 1000);
  }, []);

  const clearCooldownTimer = useCallback(() => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }
    setCooldownSeconds(null);
  }, []);

  // Cleanup cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // Reset detection state when tier changes
  useEffect(() => {
    activeTargetRef.current = null;
    setDetectedCharacter(null);
    setShowQuiz(false);
    setSelectedAnswer(null);
    setQuizResult(null);
    clearCooldownTimer();
    stopMindAR();
  }, [selectedTier, stopMindAR, clearCooldownTimer]);

  const handleSceneReady = useCallback(() => {
    setIsSceneReady(true);
    setARError(null);
  }, [setARError]);

  const handleSceneError = useCallback(
    (message: string) => {
      setARError(message);
    },
    [setARError]
  );

  useSceneLifecycle(
    sceneRef,
    scriptsLoaded,
    handleSceneReady,
    handleSceneError
  );

  const registerTargetRef = useCallback(
    (characterId: string, targetIndex: number) => {
      return (el: Element | null) => {
        const key = `${characterId}-${targetIndex}`;
        const existingListeners = targetListenersRef.current[key];
        const existingElement = targetRefs.current[key];

        if (existingListeners && existingElement) {
          existingElement.removeEventListener(
            "targetFound",
            existingListeners.onFound
          );
          existingElement.removeEventListener(
            "targetLost",
            existingListeners.onLost
          );
          delete targetListenersRef.current[key];
        }

        if (el) {
          targetRefs.current[key] = el;

          const onFound = () => {
            const character = charactersMapRef.current.get(characterId);
            if (!character) return;

            // Check if character is on cooldown
            const cooldown = getCooldownRemaining(characterId);
            if (cooldown !== null) {
              setCooldownSeconds(cooldown);
              startCooldownTimer(characterId);
            }

            activeTargetRef.current = { characterId, targetIndex };
            setDetectedCharacter(character);
            setShowQuiz(false);
            setSelectedAnswer(null);
            setQuizResult(null);
          };

          const onLost = () => {
            if (
              activeTargetRef.current?.characterId === characterId &&
              activeTargetRef.current?.targetIndex === targetIndex &&
              !showQuizRef.current
            ) {
              activeTargetRef.current = null;
              setDetectedCharacter((current) =>
                current?.id === characterId ? null : current
              );
              // Clear cooldown timer when target is lost
              clearCooldownTimer();
            }
          };

          el.addEventListener("targetFound", onFound);
          el.addEventListener("targetLost", onLost);
          targetListenersRef.current[key] = { onFound, onLost };
        } else {
          delete targetRefs.current[key];
        }
      };
    },
    [clearCooldownTimer, startCooldownTimer]
  );

  useEffect(() => {
    return () => {
      Object.entries(targetListenersRef.current).forEach(([id, listeners]) => {
        const element = targetRefs.current[id];
        if (element) {
          element.removeEventListener("targetFound", listeners.onFound);
          element.removeEventListener("targetLost", listeners.onLost);
        }
      });
      targetListenersRef.current = {};
      targetRefs.current = {};
    };
  }, []);

  const handleCollectClick = () => {
    if (detectedCharacter?.isCaught) return;
    // Don't allow starting quiz if on cooldown
    if (cooldownSeconds !== null && cooldownSeconds > 0) return;
    setShowQuiz(true);
  };

  const handleAnswerSelect = (index: number) => {
    if (quizResult === null) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitQuiz = async () => {
    if (selectedAnswer === null || !detectedCharacter || isCatching) return;

    if (selectedAnswer === detectedCharacter.correctAnswer) {
      setQuizResult("correct");
      setIsCatching(true);

      try {
        // Clear cooldown on correct answer
        clearCooldown(detectedCharacter.id);
        clearCooldownTimer();

        // Update Firestore: mark character as caught and update team
        // This uses a transaction to prevent race conditions
        const result = await catchCharacter(
          detectedCharacter.id,
          teamId,
          detectedCharacter.value
        );

        // Check if the character was already caught by another team
        if (!result.success && result.alreadyCaught) {
          console.log(
            `Character already caught by team: ${result.caughtByTeam}`
          );

          // Fetch the fresh character data from Firestore to get the updated caught status
          const freshCharacter = await getCharacterById(detectedCharacter.id);
          console.log("Fresh character data:", freshCharacter);

          if (freshCharacter) {
            // Update the detected character state with fresh data
            setDetectedCharacter(freshCharacter);
          }

          // Reset quiz state
          setQuizResult(null);
          setIsCatching(false);
          setShowQuiz(false);

          // Show error message after a brief delay to let the UI update
          setTimeout(() => {
            setARError(`This character was just caught by another team!`);
          }, 300);

          // Also refresh the full character list
          refetch();

          return;
        }

        // Notify parent component and close AR camera
        setTimeout(() => {
          onCharacterCollected({
            id: detectedCharacter.id,
            name: detectedCharacter.name,
            image: detectedCharacter.image,
            tier:
              detectedCharacter.tier ||
              getTierFromValue(detectedCharacter.value),
            value: detectedCharacter.value,
          });

          // Refresh character list to reflect caught status
          refetch();

          // Close AR camera and return to home page
          handleClose();
        }, 1200);
      } catch (error) {
        console.error("Error catching character:", error);
        setQuizResult(null);
        setIsCatching(false);
        setARError("Failed to catch character. Please try again.");
      }
    } else {
      setQuizResult("incorrect");

      // Set progressive cooldown for wrong answer
      const cooldownDuration = setWrongAnswerCooldown(detectedCharacter.id);
      console.log(`Wrong answer! Cooldown set for ${cooldownDuration} seconds`);

      setTimeout(() => {
        setQuizResult(null);
        setSelectedAnswer(null);
        setShowQuiz(false);
        // Start cooldown timer
        startCooldownTimer(detectedCharacter.id);
      }, 1500);
    }
  };

  const handleClose = useCallback(() => {
    stopMindAR();
    clearCooldownTimer();
    activeTargetRef.current = null;
    setDetectedCharacter(null);
    setShowQuiz(false);
    setSelectedAnswer(null);
    setQuizResult(null);
    onClose();
  }, [onClose, stopMindAR, clearCooldownTimer]);

  const currentTierCharacters = charactersByTier[selectedTier];

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        {(!scriptsLoaded || loadingCharacters) && !arError && (
          <LoadingOverlay />
        )}

        {arError && <ARErrorOverlay message={arError} onClose={handleClose} />}

        {scriptsLoaded &&
          !arError &&
          !loadingCharacters &&
          currentTierCharacters.length > 0 && (
            <div className="absolute inset-0 w-[100vw] h-[100vh] sm:mx-0 mx-[30vw]">
              <MindARScene
                key={selectedTier}
                sceneRef={sceneRef}
                characters={currentTierCharacters}
                animationMixerAvailable={animationMixerAvailable}
                registerTargetRef={registerTargetRef}
                selectedTier={selectedTier}
              />
            </div>
          )}

        <HeaderOverlay
          teamName={teamName}
          onClose={handleClose}
          mindFiles={[
            { value: "Common", label: "Common" },
            { value: "Rare", label: "Rare" },
            { value: "Legendary", label: "Legendary" },
          ]}
          activeMindFile={selectedTier}
          onMindFileChange={(tier) => setSelectedTier(tier as Tier)}
        />
        <FrameOverlay tier={selectedTier} />
        <ScanHint visible={!detectedCharacter && isSceneReady && !showQuiz} />

        {detectedCharacter && !showQuiz && (
          <DetectedCharacterOverlay
            character={detectedCharacter}
            onCollect={handleCollectClick}
            isCaught={detectedCharacter.isCaught}
            cooldownSeconds={cooldownSeconds}
          />
        )}

        {showQuiz && detectedCharacter && (
          <QuizModal
            character={detectedCharacter}
            selectedAnswer={selectedAnswer}
            quizResult={quizResult}
            onAnswerSelect={handleAnswerSelect}
            onSubmit={handleSubmitQuiz}
            onClose={() => {
              setShowQuiz(false);
              setSelectedAnswer(null);
              setQuizResult(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

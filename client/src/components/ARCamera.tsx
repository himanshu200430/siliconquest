"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { getCards, getCardQuiz, submitCatch } from "@/services/api";
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
import { initTargetCache } from "./ar-camera/utils/mindTargetCache";
import {
  initCameraStreamNormalizer,
  stopAllCameraStreams,
} from "./ar-camera/utils/cameraStreamHelper";
import {
  ARCameraProps,
  Character,
  getTierFromValue,
  MindARSceneElement,
  Tier,
} from "./ar-camera/types";
import targetMapData from "@/data/targetMap.json";

interface TargetMapItem {
  id: string;
  name: string;
  series: string;
  tier: string;
  value: number;
  image: string;
}

export default function ARCamera({
  teamName,
  teamId,
  onClose,
  onCharacterCollected,
}: ARCameraProps) {
  const {
    allCharacters,
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
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isCatching, setIsCatching] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const showQuizRef = useRef(false);
  const activeTargetRef = useRef<{
    characterId: string;
    targetIndex: number;
  } | null>(null);

  // Debouncing refs
  const lastScanTimestampRef = useRef<number>(0);
  const lostDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { scriptsLoaded, animationMixerAvailable, arError, setARError } =
    useMindARScripts();

  useMindARInlineStyles(scriptsLoaded);

  // Build character map combining database records and targetMap defaults
  useEffect(() => {
    const newMap = new Map<string, Character>();

    // 1. Populate from targetMap.json as baseline
    Object.values(targetMapData as Record<string, TargetMapItem>).forEach(
      (item) => {
        newMap.set(item.id, {
          id: item.id,
          name: item.name,
          value: item.value,
          tier: item.tier as Tier,
          image: item.image,
          isCaught: false,
        });
      }
    );

    // 2. Overlay live database records (caught status, custom models, etc.)
    allCharacters.forEach((char) => {
      const existing = newMap.get(char.id);
      newMap.set(char.id, {
        ...(existing || {}),
        ...char,
        tier: char.tier || (existing?.tier as Tier) || getTierFromValue(char.value),
      });
    });

    charactersMapRef.current = newMap;
  }, [allCharacters]);

  // Show error if characters failed to load
  useEffect(() => {
    if (charactersError) {
      setARError(charactersError);
    }
  }, [charactersError, setARError]);

  useEffect(() => {
    showQuizRef.current = showQuiz;
  }, [showQuiz]);

  useEffect(() => {
    setMounted(true);
    initCameraStreamNormalizer();
    initTargetCache();
    return () => {
      stopAllCameraStreams();
      if (lostDebounceTimerRef.current) {
        clearTimeout(lostDebounceTimerRef.current);
      }
    };
  }, []);

  // Cooldown timer management (server-backed countdown)
  const startCooldownTimer = useCallback((seconds: number) => {
    if (cooldownIntervalRef.current) {
      clearInterval(cooldownIntervalRef.current);
      cooldownIntervalRef.current = null;
    }

    const targetTime = Date.now() + seconds * 1000;
    setCooldownSeconds(seconds);

    cooldownIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
      if (remaining <= 0) {
        setCooldownSeconds(null);
        if (cooldownIntervalRef.current) {
          clearInterval(cooldownIntervalRef.current);
          cooldownIntervalRef.current = null;
        }
      } else {
        setCooldownSeconds(remaining);
      }
    }, 1000);
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

  const handleSceneReady = useCallback(() => {
    setIsCameraLive(true);
    setIsSceneReady(true);
    setARError(null);
  }, [setARError]);

  const handleCameraLive = useCallback(() => {
    setIsCameraLive(true);
  }, []);

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
    handleSceneError,
    undefined,
    handleCameraLive,
    sceneKey
  );

  // Register target reference and handle targetFound / targetLost with debouncing
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
            // Cancel any pending targetLost debounce
            if (lostDebounceTimerRef.current) {
              clearTimeout(lostDebounceTimerRef.current);
              lostDebounceTimerRef.current = null;
            }

            const now = Date.now();
            // Debounce rapid re-triggers within 500ms for the same target
            if (
              activeTargetRef.current?.characterId === characterId &&
              now - lastScanTimestampRef.current < 500
            ) {
              return;
            }
            lastScanTimestampRef.current = now;

            const character =
              charactersMapRef.current.get(characterId) || {
                id: characterId,
                name: "Character",
                value: 10,
                tier: "Common" as Tier,
                isCaught: false,
              };

            activeTargetRef.current = { characterId, targetIndex };
            setDetectedCharacter(character);
            setShowQuiz(false);
            setSelectedAnswer(null);
            setQuizResult(null);

            // Step 4.2: Verify card copies & caught status via GET /api/cards
            getCards()
              .then((cardsList) => {
                const fresh = cardsList.find((c) => c.id === characterId);
                if (fresh) {
                  setDetectedCharacter((prev) =>
                    prev && prev.id === characterId
                      ? {
                          ...prev,
                          copiesLeft: (fresh as unknown as { copiesLeft?: number }).copiesLeft,
                          isCaught: fresh.isCaught || (fresh as unknown as { copiesLeft?: number }).copiesLeft === 0,
                          caughtByTeam: fresh.caughtByTeam || undefined,
                        }
                      : prev
                  );
                }
              })
              .catch((err) => {
                console.warn("Card freshness check failed:", err);
              });
          };

          const onLost = () => {
            // Debounce targetLost: ignore quick flicker (800ms threshold)
            if (lostDebounceTimerRef.current) {
              clearTimeout(lostDebounceTimerRef.current);
            }

            lostDebounceTimerRef.current = setTimeout(() => {
              if (
                activeTargetRef.current?.characterId === characterId &&
                activeTargetRef.current?.targetIndex === targetIndex &&
                !showQuizRef.current
              ) {
                activeTargetRef.current = null;
                setDetectedCharacter((current) =>
                  current?.id === characterId ? null : current
                );
                clearCooldownTimer();
              }
            }, 800);
          };

          el.addEventListener("targetFound", onFound);
          el.addEventListener("targetLost", onLost);
          targetListenersRef.current[key] = { onFound, onLost };
        } else {
          delete targetRefs.current[key];
        }
      };
    },
    [clearCooldownTimer]
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

  const handleCollectClick = async () => {
    if (!detectedCharacter) return;
    if (detectedCharacter.isCaught || (detectedCharacter.copiesLeft !== undefined && detectedCharacter.copiesLeft <= 0)) {
      setARError("No copies left or already caught!");
      return;
    }
    if (cooldownSeconds !== null && cooldownSeconds > 0) return;

    try {
      // Step 4.3: Fetch quiz dynamically from GET /api/cards/[id]/quiz
      const quizData = await getCardQuiz(detectedCharacter.id);
      setDetectedCharacter((prev) =>
        prev
          ? {
              ...prev,
              ...quizData,
              tier: quizData.tier as Tier,
            }
          : null
      );
      setShowQuiz(true);
    } catch (err: unknown) {
      const errorObj = err as { status?: number; data?: { noCopiesLeft?: boolean; error?: string } };
      if (errorObj?.status === 409 || errorObj?.data?.noCopiesLeft) {
        setARError("No copies left for this character!");
        setDetectedCharacter((prev) => (prev ? { ...prev, isCaught: true } : null));
        refetch();
      } else {
        setARError("Failed to load quiz question. Please try again.");
      }
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (quizResult === null) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitQuiz = async () => {
    if (selectedAnswer === null || !detectedCharacter || isCatching) return;

    setIsCatching(true);

    try {
      // Step 4.4: Call POST /api/catch { teamId, cardId, answerIndex }
      const result = await submitCatch(teamId, detectedCharacter.id, selectedAnswer);

      // Handle 409 Conflict
      if (result.alreadyCaught) {
        setARError("Your team has already caught this character!");
        setQuizResult(null);
        setIsCatching(false);
        setShowQuiz(false);
        refetch();
        return;
      }

      if (result.noCopiesLeft) {
        setARError("All copies of this character have already been caught!");
        setQuizResult(null);
        setIsCatching(false);
        setShowQuiz(false);
        setDetectedCharacter((prev) => (prev ? { ...prev, isCaught: true } : null));
        refetch();
        return;
      }

      // Handle 429 Rate Limit (Locked until)
      if (result.remainingSeconds && result.remainingSeconds > 0 && !result.correct) {
        setQuizResult("incorrect");
        startCooldownTimer(result.remainingSeconds);
        setTimeout(() => {
          setQuizResult(null);
          setSelectedAnswer(null);
          setShowQuiz(false);
          setIsCatching(false);
        }, 1500);
        return;
      }

      // Handle Correct Answer
      if (result.correct || result.success) {
        setQuizResult("correct");
        clearCooldownTimer();

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

          refetch();
          handleClose();
        }, 1200);
      } else {
        // Wrong Answer with progressive server cooldown
        setQuizResult("incorrect");
        if (result.cooldownSeconds) {
          startCooldownTimer(result.cooldownSeconds);
        }

        setTimeout(() => {
          setQuizResult(null);
          setSelectedAnswer(null);
          setShowQuiz(false);
          setIsCatching(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting catch:", error);
      setQuizResult(null);
      setIsCatching(false);
      setARError("Failed to catch character. Please try again.");
    }
  };

  const handleClose = useCallback(() => {
    stopAllCameraStreams();
    clearCooldownTimer();
    activeTargetRef.current = null;
    setDetectedCharacter(null);
    setShowQuiz(false);
    setSelectedAnswer(null);
    setQuizResult(null);
    onClose();
  }, [onClose, clearCooldownTimer]);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  const currentTier = detectedCharacter
    ? detectedCharacter.tier || getTierFromValue(detectedCharacter.value)
    : "Common";

  return createPortal(
    <>
      {/* 1. Solid Backdrop */}
      <div className="fixed inset-0 z-[40] bg-slate-950 pointer-events-none" />

      {/* 2. MindAR 3D Scene: Single combined scene with cards.mind */}
      {scriptsLoaded && !arError && (
        <div className="fixed inset-0 w-full h-full z-[44]">
          <MindARScene
            key={sceneKey}
            sceneRef={sceneRef}
            characters={allCharacters}
            animationMixerAvailable={animationMixerAvailable}
            registerTargetRef={registerTargetRef}
          />
        </div>
      )}

      {/* 3. HUD UI & Modals */}
      <div className="fixed inset-0 z-[50] flex flex-col overflow-hidden pointer-events-none select-none">
        {/* Loading Overlay */}
        {(!scriptsLoaded || (!isSceneReady && !arError)) && (
          <div className="pointer-events-auto">
            <LoadingOverlay tier={currentTier} isCameraLive={isCameraLive} />
          </div>
        )}

        {/* Camera Error Overlay */}
        {arError && (
          <div className="pointer-events-auto">
            <ARErrorOverlay
              message={arError}
              onClose={handleClose}
              onRetry={async () => {
                setARError(null);
                setIsSceneReady(false);
                setIsCameraLive(false);
                stopAllCameraStreams();
                // Enforce driver buffer for Windows / OS webcam release
                await new Promise((resolve) => setTimeout(resolve, 350));
                setSceneKey((prev) => prev + 1);
              }}
            />
          </div>
        )}

        {/* HUD Header */}
        <HeaderOverlay teamName={teamName} onClose={handleClose} />
        <FrameOverlay tier={currentTier} />
        <ScanHint visible={!detectedCharacter && isSceneReady && !showQuiz} />

        {/* Detected Character Overlay */}
        {detectedCharacter && !showQuiz && (
          <DetectedCharacterOverlay
            character={detectedCharacter}
            onCollect={handleCollectClick}
            isCaught={detectedCharacter.isCaught}
            cooldownSeconds={cooldownSeconds}
          />
        )}

        {/* Quiz Modal */}
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
    </>,
    document.body
  );
}

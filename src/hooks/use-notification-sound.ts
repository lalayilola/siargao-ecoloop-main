import { useCallback, useEffect, useRef } from "react";

type WebkitAudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as WebkitAudioWindow).webkitAudioContext;

    if (!AudioContextClass) return;

    const removeUnlockListeners = () => {
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };

    const unlockAudio = async () => {
      let audioContext = audioContextRef.current;

      if (!audioContext || audioContext.state === "closed") {
        audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
      }

      if (audioContext.state === "suspended") {
        try {
          await audioContext.resume();
        } catch {
          return;
        }
      }

      if (audioContext.state === "running") {
        removeUnlockListeners();
      }
    };

    document.addEventListener("pointerdown", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      removeUnlockListeners();

      const audioContext = audioContextRef.current;
      audioContextRef.current = null;

      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close();
      }
    };
  }, []);

  return useCallback(() => {
    const audioContext = audioContextRef.current;

    // Browsers require a user gesture before audio can play. Until the shared
    // context has been unlocked, keep the visual notification and skip sound.
    if (!audioContext || audioContext.state !== "running") return;

    const playTone = (frequency: number, startTime: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      gainNode.gain.value = 0.5;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    };

    const startTime = audioContext.currentTime;
    playTone(880, startTime);
    playTone(1046, startTime + 0.25);
  }, []);
}

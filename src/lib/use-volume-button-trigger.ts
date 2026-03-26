import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { addVolumeListener, getVolume, setVolume, showNativeVolumeUI } from 'react-native-volume-manager';

type UseVolumeButtonTriggerOptions = {
  cooldownMs?: number;
  enabled?: boolean;
};

type UseVolumeButtonTriggerCallbacks = {
  onVolumeDown?: () => void;
  onVolumeUp?: () => void;
};

const DEFAULT_COOLDOWN_MS = 500;
const RESTORE_EPSILON = 0.0001;

export function useVolumeButtonTrigger(
  { onVolumeDown, onVolumeUp }: UseVolumeButtonTriggerCallbacks,
  { cooldownMs = DEFAULT_COOLDOWN_MS, enabled = true }: UseVolumeButtonTriggerOptions = {},
) {
  const onVolumeDownRef = useRef(onVolumeDown);
  const onVolumeUpRef = useRef(onVolumeUp);
  const enabledRef = useRef(enabled);
  const lastVolumeRef = useRef<number | null>(null);
  const restoringRef = useRef(false);
  const lastTriggerAtRef = useRef(0);
  const restoreResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onVolumeDownRef.current = onVolumeDown;
  }, [onVolumeDown]);

  useEffect(() => {
    onVolumeUpRef.current = onVolumeUp;
  }, [onVolumeUp]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const clearRestoreTimeout = useCallback(() => {
    if (restoreResetTimeoutRef.current) {
      clearTimeout(restoreResetTimeoutRef.current);
      restoreResetTimeoutRef.current = null;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        return undefined;
      }

      let active = true;
      let subscription: { remove: () => void } | null = null;

      const scheduleRestoreReset = () => {
        clearRestoreTimeout();
        restoreResetTimeoutRef.current = setTimeout(() => {
          restoringRef.current = false;
          restoreResetTimeoutRef.current = null;
        }, 250);
      };

      const restoreVolume = async (volume: number) => {
        restoringRef.current = true;
        scheduleRestoreReset();

        try {
          await setVolume(volume, {
            playSound: false,
            showUI: false,
            type: 'music',
          });
        } catch {
          restoringRef.current = false;
          clearRestoreTimeout();
        }
      };

      const initialize = async () => {
        try {
          await showNativeVolumeUI({ enabled: false });
          const currentVolume = await getVolume();
          if (!active) {
            return;
          }

          lastVolumeRef.current = currentVolume.volume;

          subscription = addVolumeListener((event) => {
            const previousVolume = lastVolumeRef.current;

            if (previousVolume === null) {
              lastVolumeRef.current = event.volume;
              return;
            }

            if (restoringRef.current) {
              if (Math.abs(event.volume - previousVolume) <= RESTORE_EPSILON) {
                restoringRef.current = false;
                clearRestoreTimeout();
              }
              return;
            }

            if (Math.abs(event.volume - previousVolume) <= RESTORE_EPSILON) {
              return;
            }

            void restoreVolume(previousVolume);

            if (!enabledRef.current) {
              return;
            }

            const now = Date.now();
            if (now - lastTriggerAtRef.current < cooldownMs) {
              return;
            }

            lastTriggerAtRef.current = now;
            if (event.volume > previousVolume) {
              onVolumeUpRef.current?.();
              return;
            }

            onVolumeDownRef.current?.();
          });
        } catch {
          // If the native module is unavailable, fail quietly and keep normal behavior.
        }
      };

      void initialize();

      return () => {
        active = false;
        subscription?.remove();
        subscription = null;
        restoringRef.current = false;
        clearRestoreTimeout();
        void showNativeVolumeUI({ enabled: true }).catch(() => {
          // ignore restore failures
        });
      };
    }, [clearRestoreTimeout, cooldownMs]),
  );
}

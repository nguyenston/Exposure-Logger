import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import type { ExposureStopStep } from '@/types/settings';

import { parseExposureTranscript } from './voice-transcript';

type SpeechRecognitionModule = {
  abort: () => void;
  addListener: (eventName: string, listener: (event: any) => void) => { remove: () => void };
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
};

type VoiceState = 'idle' | 'starting' | 'listening' | 'processing';

const MAX_LISTENING_MS = 15000;
const START_RETRY_DELAY_MS = 250;
const RESTART_COOLDOWN_MS = 500;

type VoiceResultEvent = {
  isFinal?: boolean;
  results?: {
    transcript?: string;
  }[];
};

type VoiceErrorEvent = {
  error?: string;
  message?: string;
  code?: number;
};

function getSpeechRecognitionModule(): SpeechRecognitionModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speechRecognitionPackage = require('expo-speech-recognition') as {
      ExpoSpeechRecognitionModule?: SpeechRecognitionModule;
    };

    return speechRecognitionPackage.ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
}

function getResultTranscript(event: VoiceResultEvent) {
  return event.results
    ?.map((result) => result.transcript?.trim() ?? '')
    .filter(Boolean)
    .join(' ')
    .trim();
}

export function useExposureVoiceInput(stopStep: ExposureStopStep) {
  const [moduleReady, setModuleReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stopFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<VoiceState>('idle');
  const startRetryCountRef = useRef(0);
  const retryingStartRef = useRef(false);
  const restartListeningRef = useRef<(() => void) | null>(null);
  const recognitionSessionActiveRef = useRef(false);
  const nextAllowedStartAtRef = useRef(0);

  const speechModule = useMemo(() => getSpeechRecognitionModule(), []);

  const clearStopFallback = useCallback(() => {
    if (stopFallbackTimeoutRef.current) {
      clearTimeout(stopFallbackTimeoutRef.current);
      stopFallbackTimeoutRef.current = null;
    }
  }, []);

  const clearListenTimeout = useCallback(() => {
    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
    }
  }, []);

  const clearStartRetryTimeout = useCallback(() => {
    if (startRetryTimeoutRef.current) {
      clearTimeout(startRetryTimeoutRef.current);
      startRetryTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!speechModule) {
      setAvailable(false);
      setModuleReady(true);
      return;
    }

    try {
      setAvailable(speechModule.isRecognitionAvailable());
    } catch {
      setAvailable(false);
    } finally {
      setModuleReady(true);
    }
  }, [speechModule]);

  useEffect(() => {
    if (!speechModule) {
      return;
    }

    const startSubscription = speechModule.addListener('start', () => {
      clearStopFallback();
      clearListenTimeout();
      clearStartRetryTimeout();
      nextAllowedStartAtRef.current = 0;
      recognitionSessionActiveRef.current = true;
      retryingStartRef.current = false;
      startRetryCountRef.current = 0;
      setState('listening');
      setError(null);
      listenTimeoutRef.current = setTimeout(() => {
        speechModule.stop();
        setState('processing');
      }, MAX_LISTENING_MS);
    });
    const endSubscription = speechModule.addListener('end', () => {
      clearStopFallback();
      clearListenTimeout();
      clearStartRetryTimeout();
      recognitionSessionActiveRef.current = false;
      nextAllowedStartAtRef.current = Date.now() + RESTART_COOLDOWN_MS;
      setState((current) => (current === 'processing' ? current : 'idle'));
    });
    const errorSubscription = speechModule.addListener('error', (event: VoiceErrorEvent) => {
      clearStopFallback();
      clearListenTimeout();
      clearStartRetryTimeout();

      const errorType = event.error ?? 'unknown';
      const nextError = event.message ?? 'Voice transcription failed.';
      if (
        /server disconnected/i.test(nextError)
        && stateRef.current === 'starting'
        && startRetryCountRef.current === 0
      ) {
        startRetryCountRef.current = 1;
        retryingStartRef.current = true;
        recognitionSessionActiveRef.current = false;
        nextAllowedStartAtRef.current = Date.now() + RESTART_COOLDOWN_MS;
        setState('idle');
        setError(null);
        startRetryTimeoutRef.current = setTimeout(() => {
          restartListeningRef.current?.();
        }, Math.max(START_RETRY_DELAY_MS, RESTART_COOLDOWN_MS));
        return;
      }

      recognitionSessionActiveRef.current = false;
      nextAllowedStartAtRef.current = Date.now() + RESTART_COOLDOWN_MS;
      setState('idle');
      // Android sometimes emits a generic ERROR_CLIENT during recognizer teardown even
      // when nothing user-visible failed. Only surface it if startup itself failed.
      if (errorType === 'client' && stateRef.current !== 'starting') {
        setError(null);
        return;
      }

      setError(nextError);
    });
    const resultSubscription = speechModule.addListener('result', (event: VoiceResultEvent) => {
      const nextTranscript = getResultTranscript(event);
      if (!nextTranscript) {
        return;
      }

      setTranscript(nextTranscript);
      if (event.isFinal) {
        clearStopFallback();
        clearListenTimeout();
        setState('processing');
      }
    });

    return () => {
      clearStopFallback();
      clearListenTimeout();
      clearStartRetryTimeout();
      recognitionSessionActiveRef.current = false;
      startSubscription.remove();
      endSubscription.remove();
      errorSubscription.remove();
      resultSubscription.remove();
    };
  }, [clearListenTimeout, clearStartRetryTimeout, clearStopFallback, speechModule]);

  const parsedTranscript = useMemo(
    () => parseExposureTranscript(transcript, stopStep),
    [stopStep, transcript],
  );

  const clearTranscript = useCallback(() => {
    clearStopFallback();
    clearListenTimeout();
    setTranscript('');
    setError(null);
    setState('idle');
  }, [clearListenTimeout, clearStopFallback]);

  const startListening = useCallback(async () => {
    if (!speechModule) {
      setError(
        Platform.OS === 'web'
          ? 'Voice input is not available in this browser.'
          : 'Voice input needs a rebuilt native app. Run a new development build after installing speech recognition.',
      );
      return;
    }

    if (stateRef.current !== 'idle' || recognitionSessionActiveRef.current) {
      return;
    }

    const waitForCooldownMs = nextAllowedStartAtRef.current - Date.now();
    if (waitForCooldownMs > 0) {
      clearStartRetryTimeout();
      if (!retryingStartRef.current) {
        setState('starting');
        setError(null);
      }
      startRetryTimeoutRef.current = setTimeout(() => {
        void startListening();
      }, waitForCooldownMs);
      return;
    }

    try {
      clearStopFallback();
      clearListenTimeout();
      clearStartRetryTimeout();
      if (!retryingStartRef.current) {
        startRetryCountRef.current = 0;
      }
      recognitionSessionActiveRef.current = true;
      setState('starting');
      setError(null);
      setTranscript('');

      const permission = await speechModule.requestPermissionsAsync();
      if (!permission.granted) {
        setState('idle');
        setError('Microphone or speech recognition permission was denied.');
        return;
      }

      speechModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: true,
        addsPunctuation: true,
        maxAlternatives: 1,
        iosTaskHint: 'dictation',
        iosVoiceProcessingEnabled: true,
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'free_form',
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1500,
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2500,
        },
      });
    } catch (nextError) {
      retryingStartRef.current = false;
      recognitionSessionActiveRef.current = false;
      setState('idle');
      setError(nextError instanceof Error ? nextError.message : 'Failed to start voice input.');
    }
  }, [clearListenTimeout, clearStartRetryTimeout, clearStopFallback, speechModule]);

  useEffect(() => {
    restartListeningRef.current = () => {
      void startListening();
    };

    return () => {
      restartListeningRef.current = null;
    };
  }, [startListening]);

  const stopListening = useCallback(() => {
    if (!speechModule) {
      return;
    }

    clearStartRetryTimeout();
    clearStopFallback();
    clearListenTimeout();
    setState('processing');
    speechModule.stop();
    stopFallbackTimeoutRef.current = setTimeout(() => {
      recognitionSessionActiveRef.current = false;
      setState('idle');
    }, 1500);
  }, [clearListenTimeout, clearStartRetryTimeout, clearStopFallback, speechModule]);

  const cancelListening = useCallback(() => {
    if (!speechModule) {
      clearTranscript();
      return;
    }

    clearStartRetryTimeout();
    recognitionSessionActiveRef.current = false;
    speechModule.abort();
    clearTranscript();
  }, [clearStartRetryTimeout, clearTranscript, speechModule]);

  return {
    available,
    error,
    moduleReady,
    parsedTranscript,
    startListening,
    state,
    stopListening,
    cancelListening,
    clearTranscript,
    transcript,
  };
}

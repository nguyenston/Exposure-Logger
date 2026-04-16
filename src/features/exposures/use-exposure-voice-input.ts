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
  const stateRef = useRef<VoiceState>('idle');
  const transcriptRef = useRef('');
  const clearingSessionRef = useRef(false);

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

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

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
      if (clearingSessionRef.current) {
        clearingSessionRef.current = false;
        setError(null);
        setState('idle');
        return;
      }

      if (stateRef.current === 'processing' && !transcriptRef.current.trim()) {
        setError('No speech detected.');
      }
      setState((current) =>
        current === 'processing' && transcriptRef.current.trim() ? 'processing' : 'idle',
      );
    });
    const errorSubscription = speechModule.addListener('error', (event: VoiceErrorEvent) => {
      clearStopFallback();
      clearListenTimeout();

      const errorType = event.error ?? 'unknown';
      const nextError = event.message ?? 'Voice transcription failed.';

      setState('idle');
      if (clearingSessionRef.current) {
        clearingSessionRef.current = false;
        setError(null);
        return;
      }

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
        try {
          speechModule.stop();
        } catch {
          // The final result is still usable even if native stop has already happened.
        }
        setState('processing');
      }
    });

    return () => {
      clearStopFallback();
      clearListenTimeout();
      clearingSessionRef.current = false;
      startSubscription.remove();
      endSubscription.remove();
      errorSubscription.remove();
      resultSubscription.remove();
    };
  }, [clearListenTimeout, clearStopFallback, speechModule]);

  const parsedTranscript = useMemo(
    () => parseExposureTranscript(transcript, stopStep),
    [stopStep, transcript],
  );

  const clearTranscript = useCallback(() => {
    if (speechModule) {
      clearingSessionRef.current = true;
      try {
        speechModule.abort();
      } catch {
        clearingSessionRef.current = false;
      }
    }

    clearStopFallback();
    clearListenTimeout();
    setTranscript('');
    setError(null);
    setState('idle');
  }, [clearListenTimeout, clearStopFallback, speechModule]);

  const startListening = useCallback(async () => {
    if (!speechModule) {
      setError(
        Platform.OS === 'web'
          ? 'Voice input is not available in this browser.'
          : 'Voice input needs a rebuilt native app. Run a new development build after installing speech recognition.',
      );
      return;
    }

    if (stateRef.current !== 'idle') {
      return;
    }

    try {
      clearStopFallback();
      clearListenTimeout();
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
      setState('idle');
      setError(nextError instanceof Error ? nextError.message : 'Failed to start voice input.');
    }
  }, [clearListenTimeout, clearStopFallback, speechModule]);

  const stopListening = useCallback(() => {
    if (!speechModule) {
      return;
    }

    if (stateRef.current === 'idle') {
      return;
    }

    clearStopFallback();
    clearListenTimeout();
    setState('processing');
    try {
      speechModule.stop();
    } catch {
      setState('idle');
      return;
    }
    stopFallbackTimeoutRef.current = setTimeout(() => {
      setState('idle');
    }, 1500);
  }, [clearListenTimeout, clearStopFallback, speechModule]);

  const cancelListening = useCallback(() => {
    if (!speechModule) {
      clearTranscript();
      return;
    }

    clearTranscript();
  }, [clearTranscript, speechModule]);

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

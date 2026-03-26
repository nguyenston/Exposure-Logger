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

const MAX_LISTENING_MS = 6000;

type VoiceResultEvent = {
  isFinal?: boolean;
  results?: {
    transcript?: string;
  }[];
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
      setState((current) => (current === 'processing' ? current : 'idle'));
    });
    const errorSubscription = speechModule.addListener('error', (event: { message?: string }) => {
      clearStopFallback();
      clearListenTimeout();
      setState('idle');
      setError(event.message ?? 'Voice transcription failed.');
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

    try {
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
        androidIntentOptions: {
          EXTRA_LANGUAGE_MODEL: 'web_search',
        },
      });
    } catch (nextError) {
      setState('idle');
      setError(nextError instanceof Error ? nextError.message : 'Failed to start voice input.');
    }
  }, [speechModule]);

  const stopListening = useCallback(() => {
    if (!speechModule) {
      return;
    }

    clearStopFallback();
    clearListenTimeout();
    setState('processing');
    speechModule.stop();
    stopFallbackTimeoutRef.current = setTimeout(() => {
      setState('idle');
    }, 1500);
  }, [clearListenTimeout, clearStopFallback, speechModule]);

  const cancelListening = useCallback(() => {
    if (!speechModule) {
      clearTranscript();
      return;
    }

    speechModule.abort();
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

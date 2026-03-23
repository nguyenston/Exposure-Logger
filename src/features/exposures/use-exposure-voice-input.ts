import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const speechModule = useMemo(() => getSpeechRecognitionModule(), []);

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
      setState('listening');
      setError(null);
    });
    const endSubscription = speechModule.addListener('end', () => {
      setState('idle');
    });
    const errorSubscription = speechModule.addListener('error', (event: { message?: string }) => {
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
        setState('processing');
      }
    });

    return () => {
      startSubscription.remove();
      endSubscription.remove();
      errorSubscription.remove();
      resultSubscription.remove();
    };
  }, [speechModule]);

  const parsedTranscript = useMemo(
    () => parseExposureTranscript(transcript, stopStep),
    [stopStep, transcript],
  );

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setState('idle');
  }, []);

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
        continuous: false,
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

    setState('processing');
    speechModule.stop();
  }, [speechModule]);

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

import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capacitor-community/speech-recognition';

export type SpeechErrorType =
  | 'permission_denied'
  | 'unsupported'
  | 'generic'
  | null;

interface SpeechRecognitionHookOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  lang?: string;
}

export function useSpeechRecognition({
  onTranscript,
  lang = 'ar-SA',
}: SpeechRecognitionHookOptions = {}) {
  const isNative = Capacitor.isNativePlatform();

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<SpeechErrorType>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [debugStatus, setDebugStatus] = useState<string>('متوقف');

  // Control refs
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Fresh callback reference
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Check initial support
  useEffect(() => {
    if (isNative) {
      NativeSpeechRecognition.available()
        .then((res) => {
          setIsSupported(res.available);
          if (!res.available) {
            setDebugStatus('خدمة التعرف غير متوفرة');
          }
        })
        .catch(() => {
          setIsSupported(true);
        });
    } else {
      const WebSpeech =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!WebSpeech) {
        setIsSupported(false);
        setDebugStatus('المتصفح لا يدعم التعرف الصوتي');
      }
    }
  }, [isNative]);

  // Auto-restart after 500ms when stopped unintentionally
  const scheduleAutoRestart = useCallback(() => {
    if (!shouldListenRef.current) return;

    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(async () => {
      if (!shouldListenRef.current) return;
      try {
        setDebugStatus('إعادة تشغيل تلقائي...');
        await NativeSpeechRecognition.start({
          language: lang,
          maxResults: 1,
          partialResults: true,
          popup: false,
        });
      } catch (err: any) {
        const msg = err?.message || String(err);
        console.warn('Auto-restart notice:', err);
        // If system is momentarily busy, retry once more if user still wants to listen
        if (shouldListenRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current) scheduleAutoRestart();
          }, 500);
        }
      }
    }, 500);
  }, [lang]);

  // Native Android Speech Recognition Flow
  const startNativeListening = useCallback(async () => {
    setError(null);
    setErrorType(null);
    shouldListenRef.current = true;

    try {
      // 1. Check and request permissions
      setDebugStatus('فحص الصلاحيات...');
      let permStatus = await NativeSpeechRecognition.checkPermissions();
      if (permStatus?.speechRecognition !== 'granted') {
        setDebugStatus('طلب صلاحية الميكروفون...');
        permStatus = await NativeSpeechRecognition.requestPermissions();
      }

      if (permStatus?.speechRecognition !== 'granted') {
        const msg = 'لم يتم منح إذن الميكروفون. يرجى السماح للتطبيق بالوصول إلى الميكروفون من إعدادات الهاتف.';
        setError(msg);
        setErrorType('permission_denied');
        setDebugStatus('تم رفض إذن الميكروفون');
        setIsListening(false);
        shouldListenRef.current = false;
        return;
      }

      // 2. Register listeners BEFORE start()
      setDebugStatus('تجهيز المستمعين...');
      await NativeSpeechRecognition.removeAllListeners();

      // Listen for partial speech results (handles both data.matches and data.value)
      await NativeSpeechRecognition.addListener('partialResults', (data: any) => {
        if (!shouldListenRef.current) return;
        const raw = data?.matches ?? data?.value ?? [];
        const text = (Array.isArray(raw) ? raw[0] : (typeof raw === 'string' ? raw : '')) || '';
        if (!text) return;

        setInterimTranscript(text);
        setDebugStatus(`يستمع: "${text.length > 25 ? '...' + text.slice(-25) : text}"`);

        if (onTranscriptRef.current) {
          onTranscriptRef.current(text, false);
        }
      });

      // Update button & state from listeningState event
      await NativeSpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
        const isStarted = data.status === 'started';
        setIsListening(isStarted);

        if (isStarted) {
          setDebugStatus('يستمع الآن...');
          setError(null);
        } else {
          setDebugStatus('متوقف');
          if (shouldListenRef.current) {
            // Unexpected stop from Android SpeechRecognizer -> auto restart after 500ms
            scheduleAutoRestart();
          }
        }
      });

      // 3. Start speech recognition with requested parameters
      setDebugStatus('بدء التسميع...');
      await NativeSpeechRecognition.start({
        language: lang,
        maxResults: 1,
        partialResults: true,
        popup: false,
      });

      // Ensure state is listening once start() promise resolves
      setIsListening(true);
      setDebugStatus('يستمع الآن...');
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error('startNativeListening failed:', err);
      setError(`خطأ الميكروفون: ${errMsg}`);
      setErrorType('generic');
      setDebugStatus(`خطأ: ${errMsg}`);
      setIsListening(false);
      shouldListenRef.current = false;
    }
  }, [lang, scheduleAutoRestart]);

  // Web Browser fallback (ONLY active when NOT running in native Android)
  const startWebListening = useCallback(() => {
    setError(null);
    setErrorType(null);
    setDebugStatus('تشغيل ميكروفون المتصفح...');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorType('unsupported');
      setError('المتصفح لا يدعم التعرف الصوتي.');
      setDebugStatus('غير مدعوم في المتصفح');
      return;
    }

    shouldListenRef.current = true;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setDebugStatus('يستمع الآن...');
      };

      recognition.onresult = (event: any) => {
        if (!event.results) return;
        let transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
          transcript += event.results[i][0]?.transcript || '';
        }
        transcript = transcript.trim();
        if (transcript) {
          setInterimTranscript(transcript);
          setDebugStatus(`يستمع: "${transcript.length > 25 ? '...' + transcript.slice(-25) : transcript}"`);
          if (onTranscriptRef.current) {
            onTranscriptRef.current(transcript, false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        setDebugStatus(`خطأ: ${event.error}`);
        if (event.error === 'not-allowed') {
          setErrorType('permission_denied');
          setError('لم يتم منح إذن الميكروفون في المتصفح.');
          shouldListenRef.current = false;
          setIsListening(false);
        } else {
          setError(`خطأ: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current) {
              try {
                recognition.start();
              } catch (_) {}
            }
          }, 300);
        } else {
          setIsListening(false);
          setDebugStatus('متوقف');
        }
      };

      recognition.start();
    } catch (err: any) {
      const msg = err?.message || String(err);
      setError(`خطأ: ${msg}`);
      setDebugStatus(`خطأ: ${msg}`);
      setIsListening(false);
    }
  }, [lang]);

  // Unified start
  const startListening = useCallback(() => {
    if (isNative) {
      startNativeListening();
    } else {
      startWebListening();
    }
  }, [isNative, startNativeListening, startWebListening]);

  // Unified stop
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    setIsListening(false);
    setInterimTranscript('');
    setDebugStatus('متوقف');

    if (isNative) {
      NativeSpeechRecognition.stop().catch(() => {});
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, [isNative]);

  // Clear session for next ayah
  const clearSession = useCallback(() => {
    setInterimTranscript('');
    if (isNative && shouldListenRef.current) {
      NativeSpeechRecognition.stop()
        .then(() => {
          if (shouldListenRef.current) {
            setTimeout(() => {
              if (shouldListenRef.current) {
                NativeSpeechRecognition.start({
                  language: lang,
                  maxResults: 1,
                  partialResults: true,
                  popup: false,
                }).catch(() => {});
              }
            }, 100);
          }
        })
        .catch(() => {});
    } else if (!isNative && recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_) {}
    }
  }, [isNative, lang]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (isNative) {
        NativeSpeechRecognition.stop().catch(() => {});
        NativeSpeechRecognition.removeAllListeners().catch(() => {});
      } else if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [isNative]);

  return {
    isListening,
    interimTranscript,
    error,
    errorType,
    isSupported,
    debugStatus,
    startListening,
    stopListening,
    resetTranscript,
    clearSession,
  };
}

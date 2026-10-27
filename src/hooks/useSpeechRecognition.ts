import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as NativeSpeechRecognition } from '@capacitor-community/speech-recognition';

export type SpeechErrorType =
  | 'permission_denied'
  | 'offline_language_missing'
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
  const [audioLevel, setAudioLevel] = useState(0);
  const [debugStatus, setDebugStatus] = useState<string>('جاري التهيئة...');

  // State refs to prevent stale closures
  const shouldListenRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const listenersAttachedRef = useRef(false);
  const restartTimerRef = useRef<any>(null);

  // Fresh callback reference
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Audio level visualizer refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const simulatedLevelIntervalRef = useRef<number | null>(null);

  // Check hardware/plugin support on mount
  useEffect(() => {
    if (isNative) {
      NativeSpeechRecognition.available()
        .then((res) => {
          setIsSupported(res.available);
          if (!res.available) {
            setDebugStatus('خدمة التعرف غير متوفرة على هذا الجهاز');
          } else {
            setDebugStatus('جاهز (أندرويد)');
          }
        })
        .catch((err) => {
          console.warn('Native check available failed:', err);
          setIsSupported(true);
          setDebugStatus('جاهز (أندرويد)');
        });
    } else {
      const WebSpeech =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!WebSpeech) {
        setIsSupported(false);
        setDebugStatus('المتصفح لا يدعم التعرف الصوتي');
      } else {
        setDebugStatus('جاهز (ويب)');
      }
    }
  }, [isNative]);

  const stopAudioVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (simulatedLevelIntervalRef.current) {
      clearInterval(simulatedLevelIntervalRef.current);
      simulatedLevelIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const startAudioVisualizer = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isNative) {
          if (simulatedLevelIntervalRef.current) clearInterval(simulatedLevelIntervalRef.current);
          simulatedLevelIntervalRef.current = window.setInterval(() => {
            setAudioLevel(Math.floor(25 + Math.random() * 45));
          }, 150);
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (_) {
      if (simulatedLevelIntervalRef.current) clearInterval(simulatedLevelIntervalRef.current);
      simulatedLevelIntervalRef.current = window.setInterval(() => {
        setAudioLevel(Math.floor(20 + Math.random() * 40));
      }, 150);
    }
  }, [isNative]);

  // Restart function for Native Android
  const scheduleNativeRestart = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (!shouldListenRef.current) return;

    restartTimerRef.current = setTimeout(async () => {
      if (!shouldListenRef.current) return;
      try {
        await NativeSpeechRecognition.start({
          language: lang,
          partialResults: true,
          popup: false,
        });
        setIsListening(true);
        setDebugStatus('بيسمع (أندرويد)');
        setError(null);
      } catch (err: any) {
        console.warn('Native auto-restart failed:', err);
        const msg = String(err?.message || err);
        setDebugStatus(`وقف: ${msg}`);
        // If it was already running or busy, we wait and retry
        if (shouldListenRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current) scheduleNativeRestart();
          }, 700);
        }
      }
    }, 250);
  }, [lang]);

  // Start Native Listening using @capacitor-community/speech-recognition
  const startNativeListening = useCallback(async () => {
    setError(null);
    setErrorType(null);
    setDebugStatus('جاري فحص الإذن والخدمة...');

    try {
      // 1. Verify availability
      const avail = await NativeSpeechRecognition.available();
      if (!avail.available) {
        setErrorType('unsupported');
        setError('خدمة التعرف الصوتي غير متوفرة على هذا الجهاز. يرجى تفعيل تطبيق Google.');
        setDebugStatus('خطأ: خدمة التعرف غير متوفرة (Google Speech)');
        setIsListening(false);
        shouldListenRef.current = false;
        return;
      }

      // 2. Request permissions explicitly at runtime
      const permResult = await NativeSpeechRecognition.requestPermissions();
      if (permResult.speechRecognition !== 'granted') {
        setErrorType('permission_denied');
        setError('لم يتم منح إذن الميكروفون. يرجى السماح للتطبيق بالوصول إلى الميكروفون من إعدادات الهاتف لتتمكن من التسميع.');
        setDebugStatus('خطأ: تم رفض إذن الميكروفون');
        setIsListening(false);
        shouldListenRef.current = false;
        return;
      }

      shouldListenRef.current = true;

      // 3. Register Event Listeners once
      if (!listenersAttachedRef.current) {
        await NativeSpeechRecognition.removeAllListeners();

        // Listen for partial results as user speaks
        await NativeSpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (!shouldListenRef.current) return;
          const matches = data.matches || [];
          const text = matches[0] || '';
          if (!text) return;

          setInterimTranscript(text);
          setDebugStatus(`بيسمع: "${text.length > 25 ? '...' + text.slice(-25) : text}"`);

          if (onTranscriptRef.current) {
            onTranscriptRef.current(text, false);
          }
        });

        // Listen for state changes (auto restart on premature end)
        await NativeSpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
          if (data.status === 'started') {
            setIsListening(true);
            setDebugStatus('بيسمع (أندرويد)');
            setError(null);
            setErrorType(null);
          } else if (data.status === 'stopped') {
            if (shouldListenRef.current) {
              setDebugStatus('وقف مؤقتاً - جاري إعادة التشغيل...');
              scheduleNativeRestart();
            } else {
              setIsListening(false);
              setDebugStatus('متوقف');
              stopAudioVisualizer();
            }
          }
        });

        listenersAttachedRef.current = true;
      }

      // 4. Start Recognition with exact parameters
      setDebugStatus('بدء الميكروفون...');
      await NativeSpeechRecognition.start({
        language: lang,
        partialResults: true,
        popup: false,
      });

      setIsListening(true);
      setDebugStatus('بيسمع (أندرويد)');
      startAudioVisualizer();
    } catch (err: any) {
      console.warn('Native speech start error:', err);
      const msg = String(err?.message || err);
      const msgLower = msg.toLowerCase();

      if (msgLower.includes('network') || msgLower.includes('offline') || msgLower.includes('server')) {
        setErrorType('offline_language_missing');
        setError('حزمة اللغة العربية للتعرف دون اتصال غير مثبتة على الهاتف.');
        setDebugStatus('خطأ: حزمة التعرف الصوتي دون اتصال غير مثبتة');
      } else if (msgLower.includes('permission') || msgLower.includes('denied')) {
        setErrorType('permission_denied');
        setError('لم يتم منح إذن الميكروفون.');
        setDebugStatus('خطأ: تم رفض إذن الميكروفون');
      } else {
        setErrorType('generic');
        setError(`حدث خطأ أثناء تشغيل الميكروفون: ${msg}`);
        setDebugStatus(`خطأ: ${msg}`);
      }
      setIsListening(false);
      shouldListenRef.current = false;
      stopAudioVisualizer();
    }
  }, [lang, scheduleNativeRestart, startAudioVisualizer, stopAudioVisualizer]);

  // Start Web Listening using standard Web Speech API
  const startWebListening = useCallback(() => {
    setError(null);
    setErrorType(null);
    setDebugStatus('جاري تشغيل ميكروفون المتصفح...');

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorType('unsupported');
      setError('المتصفح الحالي لا يدعم التعرف على الصوت.');
      setDebugStatus('خطأ: المتصفح لا يدعم Web Speech API');
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
        setErrorType(null);
        setDebugStatus('بيسمع (ويب)');
        startAudioVisualizer();
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
          setDebugStatus(`بيسمع: "${transcript.length > 25 ? '...' + transcript.slice(-25) : transcript}"`);
          if (onTranscriptRef.current) {
            onTranscriptRef.current(transcript, false);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Web speech error:', event.error);
        if (event.error === 'no-speech') {
          return;
        }
        setDebugStatus(`خطأ: ${event.error}`);
        if (event.error === 'not-allowed') {
          setErrorType('permission_denied');
          setError('لم يتم منح إذن الميكروفون في المتصفح.');
          shouldListenRef.current = false;
          setIsListening(false);
          stopAudioVisualizer();
        } else {
          setError(`خطأ الميكروفون: ${event.error}`);
        }
      };

      recognition.onend = () => {
        if (shouldListenRef.current) {
          setDebugStatus('وقف مؤقتاً - إعادة تشغيل (ويب)...');
          setTimeout(() => {
            if (shouldListenRef.current) {
              try {
                recognition.start();
              } catch (_) {}
            }
          }, 200);
        } else {
          setIsListening(false);
          setDebugStatus('متوقف');
          stopAudioVisualizer();
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start web speech recognition:', err);
      const msg = String(err?.message || err);
      setError('تعذر تشغيل التعرف على الصوت.');
      setDebugStatus(`خطأ: ${msg}`);
      setIsListening(false);
      stopAudioVisualizer();
    }
  }, [lang, startAudioVisualizer, stopAudioVisualizer]);

  // Unified startListening entry point
  const startListening = useCallback(() => {
    if (isNative) {
      startNativeListening();
    } else {
      startWebListening();
    }
  }, [isNative, startNativeListening, startWebListening]);

  // Unified stopListening
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    setIsListening(false);
    setInterimTranscript('');
    setDebugStatus('متوقف');
    stopAudioVisualizer();

    if (isNative) {
      NativeSpeechRecognition.stop().catch(() => {});
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, [isNative, stopAudioVisualizer]);

  // Clears the current transcript and restarts recognizer for next ayah
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

  // Cleanup on unmount
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
      stopAudioVisualizer();
    };
  }, [isNative, stopAudioVisualizer]);

  return {
    isListening,
    interimTranscript,
    audioLevel,
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

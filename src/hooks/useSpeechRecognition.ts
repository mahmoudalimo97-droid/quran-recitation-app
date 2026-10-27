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
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<SpeechErrorType>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  // Web Speech API refs
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const resultOffsetRef = useRef<number>(0);
  const latestResultCountRef = useRef<number>(0);

  // Native plugin refs
  const isNative = Capacitor.isNativePlatform();
  const listenersAttachedRef = useRef(false);
  const baseUtteranceRef = useRef<string>('');
  const lastSeenUtteranceRef = useRef<string>('');
  const simulatedLevelIntervalRef = useRef<number | null>(null);

  // Audio visualizer refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Fresh callback reference
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Check support on mount
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      NativeSpeechRecognition.available()
        .then((res) => {
          setIsSupported(res.available);
        })
        .catch(() => {
          // Assume supported on native Android by default
          setIsSupported(true);
        });
    } else {
      const WebSpeech =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!WebSpeech) {
        setIsSupported(false);
      }
    }
  }, []);

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
        // Fallback pulsing visualizer for native platforms if Web Audio is restricted
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
    } catch (e) {
      console.warn('Audio visualizer fallback to simulated level:', e);
      if (simulatedLevelIntervalRef.current) clearInterval(simulatedLevelIntervalRef.current);
      simulatedLevelIntervalRef.current = window.setInterval(() => {
        setAudioLevel(Math.floor(20 + Math.random() * 40));
      }, 150);
    }
  }, [isNative]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
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

  // Start Native Listening using @capacitor-community/speech-recognition
  const startNativeListening = useCallback(async () => {
    setError(null);
    try {
      // 1. Check & Request Permissions
      const permStatus = await NativeSpeechRecognition.checkPermissions();
      if (permStatus.speechRecognition !== 'granted') {
        const reqResult = await NativeSpeechRecognition.requestPermissions();
        if (reqResult.speechRecognition !== 'granted') {
          setErrorType('permission_denied');
          setError('لم يتم منح إذن الميكروفون. يرجى السماح للتطبيق بالوصول إلى الميكروفون من إعدادات الهاتف لتتمكن من التسميع.');
          setIsListening(false);
          shouldListenRef.current = false;
          return;
        }
      }

      // 2. Check Service Availability
      const avail = await NativeSpeechRecognition.available();
      if (!avail.available) {
        setErrorType('unsupported');
        setError('خدمة التعرف الصوتي غير متوفرة على هذا الجهاز. يرجى التحقق من تفعيل خدمات Google.');
        setIsListening(false);
        shouldListenRef.current = false;
        return;
      }

      shouldListenRef.current = true;
      baseUtteranceRef.current = '';
      lastSeenUtteranceRef.current = '';

      // 3. Register Event Listeners if not already attached
      if (!listenersAttachedRef.current) {
        await NativeSpeechRecognition.removeAllListeners();

        await NativeSpeechRecognition.addListener('partialResults', (data: { matches: string[] }) => {
          if (!shouldListenRef.current) return;
          const matches = data.matches || [];
          const bestMatch = matches[0] || '';
          if (!bestMatch) return;

          lastSeenUtteranceRef.current = bestMatch;

          // Strip baseline if clearSession occurred within same recognition burst
          let effectiveText = bestMatch;
          if (baseUtteranceRef.current && effectiveText.startsWith(baseUtteranceRef.current)) {
            effectiveText = effectiveText.slice(baseUtteranceRef.current.length).trim();
          }

          setInterimTranscript(effectiveText);
          if (effectiveText && onTranscriptRef.current) {
            onTranscriptRef.current(effectiveText, false);
          }
        });

        await NativeSpeechRecognition.addListener('listeningState', (data: { status: 'started' | 'stopped' }) => {
          if (data.status === 'started') {
            setIsListening(true);
            setError(null);
            setErrorType(null);
          } else if (data.status === 'stopped') {
            // Auto restart if listening was not manually stopped
            if (shouldListenRef.current) {
              setTimeout(async () => {
                if (shouldListenRef.current) {
                  try {
                    baseUtteranceRef.current = '';
                    lastSeenUtteranceRef.current = '';
                    await NativeSpeechRecognition.start({
                      language: lang,
                      maxResults: 3,
                      prompt: 'اقرأ الآن',
                      partialResults: true,
                      popup: false,
                    });
                  } catch (err: any) {
                    console.warn('Native auto-restart notice:', err);
                    const msg = String(err?.message || err).toLowerCase();
                    if (msg.includes('network') || msg.includes('server') || msg.includes('offline')) {
                      setErrorType('offline_language_missing');
                      setError('حزمة اللغة العربية للتعرف دون اتصال غير مثبتة على الهاتف.');
                    }
                  }
                }
              }, 200);
            } else {
              setIsListening(false);
              stopAudioVisualizer();
            }
          }
        });

        listenersAttachedRef.current = true;
      }

      // 4. Start Recognition
      await NativeSpeechRecognition.start({
        language: lang,
        maxResults: 3,
        prompt: 'اقرأ الآن',
        partialResults: true,
        popup: false,
      });

      setIsListening(true);
      setError(null);
      setErrorType(null);
      startAudioVisualizer();
    } catch (err: any) {
      console.warn('Native speech recognition notice:', err);
      const msg = String(err?.message || err).toLowerCase();
      if (msg.includes('network') || msg.includes('server') || msg.includes('offline')) {
        setErrorType('offline_language_missing');
        setError('حزمة اللغة العربية للتعرف دون اتصال غير مثبتة على الهاتف.');
      } else if (msg.includes('permission') || msg.includes('denied')) {
        setErrorType('permission_denied');
        setError('لم يتم منح إذن الميكروفون.');
      } else {
        setErrorType('generic');
        setError('حدث خطأ أثناء تشغيل الميكروفون. يمكنك الضغط على الميكروفون لإعادة المحاولة أو تخطي الآية.');
      }
      setIsListening(false);
      shouldListenRef.current = false;
      stopAudioVisualizer();
    }
  }, [lang, startAudioVisualizer, stopAudioVisualizer]);

  // Start Web Listening using Web Speech API
  const startWebListening = useCallback(() => {
    setError(null);
    setErrorType(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorType('unsupported');
      setError('المتصفح الحالي لا يدعم التعرف على الصوت.');
      return;
    }

    shouldListenRef.current = true;
    resultOffsetRef.current = 0;
    latestResultCountRef.current = 0;

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
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setErrorType(null);
        resultOffsetRef.current = 0;
        latestResultCountRef.current = 0;
        startAudioVisualizer();
      };

      recognition.onresult = (event: any) => {
        if (!event.results) return;
        latestResultCountRef.current = event.results.length;

        let interimStr = '';
        let finalStr = '';

        const startIdx = Math.max(resultOffsetRef.current, 0);

        for (let i = startIdx; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcriptChunk = item[0]?.transcript || '';

          if (item.isFinal) {
            finalStr += transcriptChunk + ' ';
          } else {
            interimStr += transcriptChunk + ' ';
          }
        }

        const fullChunk = (finalStr + interimStr).trim();
        setInterimTranscript(fullChunk);

        if (fullChunk && onTranscriptRef.current) {
          const isFinal = Boolean(finalStr.trim() && !interimStr.trim());
          onTranscriptRef.current(fullChunk, isFinal);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        if (event.error === 'no-speech') {
          return;
        }
        if (event.error === 'not-allowed') {
          setErrorType('permission_denied');
          setError('لم يتم منح إذن الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.');
          shouldListenRef.current = false;
          setIsListening(false);
          stopAudioVisualizer();
          return;
        }
        if (event.error === 'network') {
          setErrorType('offline_language_missing');
          setError('التعرف على الصوت يحتاج حزمة اللغة العربية دون اتصال.');
        }
      };

      recognition.onend = () => {
        resultOffsetRef.current = 0;
        latestResultCountRef.current = 0;

        if (shouldListenRef.current) {
          try {
            recognition.start();
          } catch (_) {
            setTimeout(() => {
              if (shouldListenRef.current) {
                try {
                  recognition.start();
                } catch (e) {
                  console.warn('Recognition restart error:', e);
                }
              }
            }, 250);
          }
        } else {
          setIsListening(false);
          stopAudioVisualizer();
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start web speech recognition:', err);
      setError('تعذر تشغيل التعرف على الصوت. تحقق من توصيل الميكروفون.');
      setIsListening(false);
      stopAudioVisualizer();
    }
  }, [lang, startAudioVisualizer, stopAudioVisualizer]);

  // Unified startListening entry point
  const startListening = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      startNativeListening();
    } else {
      startWebListening();
    }
  }, [startNativeListening, startWebListening]);

  // Unified stopListening
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    stopAudioVisualizer();

    if (Capacitor.isNativePlatform()) {
      baseUtteranceRef.current = '';
      lastSeenUtteranceRef.current = '';
      NativeSpeechRecognition.stop().catch(() => {});
    } else {
      resultOffsetRef.current = 0;
      latestResultCountRef.current = 0;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    }
  }, [stopAudioVisualizer]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
  }, []);

  // Seamlessly transitions between Ayahs without resetting audio hardware
  const clearSession = useCallback(() => {
    setInterimTranscript('');
    if (Capacitor.isNativePlatform()) {
      baseUtteranceRef.current = lastSeenUtteranceRef.current;
    } else {
      resultOffsetRef.current = latestResultCountRef.current;
    }
  }, []);

  return {
    isListening,
    interimTranscript,
    audioLevel,
    error,
    errorType,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    clearSession,
  };
}

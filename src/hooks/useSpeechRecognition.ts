import { useState, useEffect, useRef, useCallback } from 'react';

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
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const resultOffsetRef = useRef<number>(0);
  const latestResultCountRef = useRef<number>(0);

  // Keep fresh reference to onTranscript to avoid stale closure
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Check support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      stopAudioVisualizer();
    };
  }, []);

  const startAudioVisualizer = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
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
      console.warn('Audio visualizer init error:', e);
    }
  }, []);

  const stopAudioVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
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

  const startListening = useCallback(() => {
    setError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('المتصفح الحالي لا يدعم التعرف على الصوت عبر Web Speech API. يمكنك استخدام وضع المحاكاة للتسميع.');
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
          setError('لم يتم منح إذن الميكروفون. يرجى السماح بالوصول للميكروفون من إعدادات المتصفح.');
          shouldListenRef.current = false;
          setIsListening(false);
          stopAudioVisualizer();
          return;
        }
        if (event.error === 'network') {
          setError('حدث خطأ في الاتصال بخدمة التعرف الصوتي.');
        }
      };

      recognition.onend = () => {
        resultOffsetRef.current = 0;
        latestResultCountRef.current = 0;

        // Automatically restart if user hasn't explicitly clicked stop
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
      console.error('Failed to start speech recognition:', err);
      setError('تعذر تشغيل التعرف على الصوت. تحقق من توصيل الميكروفون.');
      setIsListening(false);
      stopAudioVisualizer();
    }
  }, [lang, startAudioVisualizer, stopAudioVisualizer]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    setInterimTranscript('');
    resultOffsetRef.current = 0;
    latestResultCountRef.current = 0;
    stopAudioVisualizer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
  }, [stopAudioVisualizer]);

  const resetTranscript = useCallback(() => {
    setInterimTranscript('');
  }, []);

  // Seamlessly slides result offset between ayahs without stopping/aborting audio hardware
  const clearSession = useCallback(() => {
    setInterimTranscript('');
    resultOffsetRef.current = latestResultCountRef.current;
  }, []);

  return {
    isListening,
    interimTranscript,
    audioLevel,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    clearSession,
  };
}

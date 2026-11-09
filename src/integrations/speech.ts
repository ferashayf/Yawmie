// The iPhone's speech-to-text through the browser (needs Siri & Dictation). Website app only.
import type { Lang } from '../model/types';

export type VoiceProblem = 'unavailable' | 'dictationOff' | 'notAllowed' | 'framed' | 'failed';

interface Recognition {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}

// Words arrive live through onWords; `done` gives the final text ('' when cancelled or nothing heard).
export function startListening(lang: Lang, onWords: (text: string) => void): { done: Promise<string>; stop(): void; cancel(): void } {
  const Rec = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition
    ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
  if (!Rec) return { done: Promise.reject<string>('unavailable' satisfies VoiceProblem), stop() {}, cancel() {} };
  const rec = new Rec();
  rec.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  let text = '';
  let cancelled = false; // late words after Cancel are ignored
  const done = new Promise<string>((resolve, reject) => {
    rec.onresult = (e) => {
      if (cancelled) return;
      text = Array.from(e.results).map((r) => r[0].transcript).join('');
      onWords(text);
    };
    rec.onerror = (e) => {
      if (cancelled || e.error === 'aborted' || e.error === 'no-speech') return;
      cancelled = true;
      const framed = window.self !== window.top;
      reject((e.error === 'service-not-allowed' ? 'dictationOff' : e.error === 'not-allowed' ? (framed ? 'framed' : 'notAllowed') : 'failed') satisfies VoiceProblem);
    };
    rec.onend = () => resolve(cancelled ? '' : text.trim());
    try {
      rec.start();
    } catch {
      reject('failed' satisfies VoiceProblem);
    }
  });
  return {
    done,
    stop: () => rec.stop(),
    cancel: () => {
      cancelled = true;
      try { rec.abort(); } catch { /* already stopped */ }
    },
  };
}

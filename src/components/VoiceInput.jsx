import React, { useState, useEffect, useRef } from 'react';

/**
 * Supported Languages List
 * Uses standard BCP 47 language tags supported by Web Speech API
 */
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'ms-MY', label: 'Bahasa Melayu' },
  { code: 'zh-CN', label: 'Mandarin (Simplified)' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'id-ID', label: 'Bahasa Indonesia' },
];

export default function VoiceInput({ onTranscript, defaultLang = 'en-US' }) {
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript) {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
      } else {
        setErrorMessage('Failed to capture speech. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setErrorMessage('');
      // Set bahasa mengikut pilihan dropdown sebelum mikrofon bermula
      recognitionRef.current.lang = selectedLang;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
      {/* Microphone Toggle Button */}
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '13px',
          fontWeight: '600',
          borderRadius: '6px',
          border: 'none',
          cursor: 'pointer',
          color: '#ffffff',
          backgroundColor: isListening ? '#dc2626' : '#2563eb',
          boxShadow: isListening ? '0 0 8px rgba(220, 38, 38, 0.6)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        <span>{isListening ? '🛑' : '🎤'}</span>
        <span>{isListening ? 'Listening...' : 'Voice to Text'}</span>
      </button>

      {/* Language Selector Dropdown */}
      <select
        value={selectedLang}
        onChange={(e) => setSelectedLang(e.target.value)}
        disabled={isListening}
        style={{
          padding: '6px 10px',
          fontSize: '12px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>

      {/* Error Feedback */}
      {errorMessage && (
        <span style={{ color: '#ef4444', fontSize: '12px', width: '100%' }}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
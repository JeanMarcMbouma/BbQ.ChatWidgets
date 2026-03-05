import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import '../styles/VoiceChatPage.css';

interface VoiceChatPageProps {
  onBack: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing';

/* Check browser support for Web Speech API */
const hasSpeechRecognition =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

const hasSpeechSynthesis =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function VoiceChatPage({ onBack }: VoiceChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const speakText = useCallback(
    (text: string) => {
      if (!hasSpeechSynthesis || !ttsEnabled) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [ttsEnabled, selectedLanguage]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMsg]);
      setTranscript('');
      setVoiceState('processing');
      setError(null);

      try {
        const response = await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, threadId })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!threadId && data.threadId) setThreadId(data.threadId);

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);

        if (data.content) speakText(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setVoiceState('idle');
      }
    },
    [threadId, speakText]
  );

  const startListening = useCallback(() => {
    if (!hasSpeechRecognition) {
      setError('Your browser does not support voice input. Try Chrome or Edge.');
      return;
    }

    setError(null);
    setTranscript('');

    const SpeechRecognitionCtor =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .SpeechRecognition ||
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition;
    const recognition: SpeechRecognition = new SpeechRecognitionCtor!();

    recognition.lang = selectedLanguage;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setVoiceState('listening');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const text = result[0].transcript;
      setTranscript(text);

      if (result.isFinal) {
        recognition.stop();
        sendMessage(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
      setVoiceState('idle');
    };

    recognition.onend = () => {
      setVoiceState(prev => prev === 'listening' ? 'idle' : prev);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [selectedLanguage, sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState('idle');
  }, []);

  const stopSpeaking = useCallback(() => {
    if (hasSpeechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const handleMicClick = () => {
    if (voiceState === 'listening') {
      stopListening();
    } else if (voiceState === 'idle') {
      startListening();
    }
  };

  const LANGUAGES = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'pt-BR', label: 'Portuguese (BR)' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'zh-CN', label: 'Chinese (Simplified)' }
  ];

  return (
    <div className="page voice-page">
      <div className="page-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>🎙️ Voice Chat</h1>
        <div className="thread-info">
          {threadId && <span className="thread-id">Thread: {threadId.slice(0, 8)}...</span>}
          {isSpeaking && (
            <span className="speaking-badge" onClick={stopSpeaking} title="Click to stop">
              🔊 Speaking…
            </span>
          )}
        </div>
      </div>

      {!hasSpeechRecognition && (
        <div className="browser-warning">
          ⚠️ Your browser does not support the Web Speech API. Voice input requires Chrome or
          Edge. Text input still works.
        </div>
      )}

      <div className="chat-container">
        <div className="messages-list">
          {messages.map(msg => (
            <div key={msg.id} className={`message ${msg.role}`}>
              <div className="message-content">
                <p>{msg.content}</p>
              </div>
              <span className="timestamp">{msg.timestamp.toLocaleTimeString()}</span>
            </div>
          ))}

          {voiceState === 'listening' && (
            <div className="transcript-preview">
              <div className="listening-indicator">
                <span className="listening-dot"></span>
                <span className="listening-dot"></span>
                <span className="listening-dot"></span>
              </div>
              <p>{transcript || 'Listening…'}</p>
            </div>
          )}

          {voiceState === 'processing' && (
            <div className="message assistant loading">
              <div className="spinner"></div>
              <p>Processing…</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="voice-controls">
          <div className="voice-settings">
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              disabled={voiceState !== 'idle'}
              className="language-select"
            >
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>

            <label className="tts-toggle">
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={e => setTtsEnabled(e.target.checked)}
              />
              <span>Read responses aloud</span>
            </label>
          </div>

          <button
            className={`mic-button ${voiceState === 'listening' ? 'listening' : ''}`}
            onClick={handleMicClick}
            disabled={voiceState === 'processing' || !hasSpeechRecognition}
            title={voiceState === 'listening' ? 'Stop listening' : 'Start voice input'}
          >
            {voiceState === 'listening' ? '⏹ Stop' : '🎙 Speak'}
          </button>
        </div>
      </div>

      <div className="scenario-info">
        <h3>About This Scenario</h3>
        <p>
          <strong>Voice Chat</strong> uses your browser's built-in Web Speech API to convert
          spoken words into text and read assistant responses aloud — no additional services required.
        </p>

        <div className="feature-list">
          <h4>Key Features</h4>
          <ul>
            <li>🎙️ <strong>Voice input</strong> — press Speak and talk naturally</li>
            <li>🔊 <strong>Text-to-speech</strong> — AI responses are read aloud</li>
            <li>🌍 <strong>Multi-language</strong> — select your preferred language</li>
            <li>⚡ <strong>No extra dependencies</strong> — runs fully in the browser</li>
          </ul>
        </div>

        <div className="voice-info-box">
          <h4>Browser Support</h4>
          <p>Voice input requires a browser with Web Speech API support (Chrome, Edge, Safari 15+).</p>
          <p>The transcription happens locally in the browser and the text is sent to the chat API.</p>
          {!hasSpeechSynthesis && (
            <p className="warning-text">⚠️ Text-to-speech is not available in your browser.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoiceChatPage;

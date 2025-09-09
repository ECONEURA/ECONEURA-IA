/**
 * Voice Recognition for ECONEURA Cockpit
 * Web Speech API integration with NEURA chat
 */

export interface VoiceRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class VoiceRecognition {
  private recognition: any;
  private isListening = false;
  private onResult?: (result: VoiceRecognitionResult) => void;
  private onError?: (error: string) => void;
  private onStart?: () => void;
  private onEnd?: () => void;

  constructor(options: VoiceRecognitionOptions = {}) {
    // Check if Web Speech API is supported
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      throw new Error('Web Speech API not supported in this browser');
    }

    // Initialize recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.lang = options.lang || 'es-ES';
    this.recognition.continuous = options.continuous || false;
    this.recognition.interimResults = options.interimResults || true;
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      this.onResult?.({
        transcript: transcript.trim(),
        confidence,
        isFinal
      });
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      this.onError?.(event.error);
    };

    this.recognition.onnomatch = () => {
      this.onError?.('No speech was recognized');
    };
  }

  // Start listening
  public start(): void {
    if (this.isListening) {
      console.warn('Voice recognition is already listening');
      return;
    }

    try {
      this.recognition.start();
    } catch (error) {
      this.onError?.(`Failed to start recognition: ${error}`);
    }
  }

  // Stop listening
  public stop(): void {
    if (!this.isListening) {
      return;
    }

    this.recognition.stop();
  }

  // Abort recognition
  public abort(): void {
    this.recognition.abort();
    this.isListening = false;
  }

  // Check if currently listening
  public getIsListening(): boolean {
    return this.isListening;
  }

  // Set event handlers
  public onResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResult = callback;
  }

  public onError(callback: (error: string) => void): void {
    this.onError = callback;
  }

  public onStart(callback: () => void): void {
    this.onStart = callback;
  }

  public onEnd(callback: () => void): void {
    this.onEnd = callback;
  }

  // Change language
  public setLanguage(lang: string): void {
    this.recognition.lang = lang;
  }

  // Check if Web Speech API is supported
  public static isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  // Get available languages (simplified list)
  public static getAvailableLanguages(): string[] {
    return [
      'es-ES', // Spanish (Spain)
      'es-MX', // Spanish (Mexico)
      'en-US', // English (US)
      'en-GB', // English (UK)
      'fr-FR', // French (France)
      'de-DE', // German
      'it-IT', // Italian
      'pt-BR', // Portuguese (Brazil)
      'ja-JP', // Japanese
      'ko-KR', // Korean
      'zh-CN', // Chinese (Simplified)
      'zh-TW'  // Chinese (Traditional)
    ];
  }
}

// Global types for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}


// NEURA Chat Component - ECONEURA Cockpit
'use client';
import React, { useState } from 'react';
import { ui } from '@/lib/palette';

interface NeuraChatProps {
  dept: string;
}

export default function NeuraChat({ dept }: NeuraChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openChat = async () => {
    setIsOpen(true);
    if (messages.length === 0) {
      // Mensaje inicial
      setMessages([{
        role: 'assistant',
        content: `Hola, soy NEURA, tu asistente de IA para ${dept}. ¿En qué puedo ayudarte?`
      }]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `Eres NEURA, asistente de IA para ${dept}. Responde de manera profesional y útil.` },
            userMessage
          ]
        })
      });

      const data = await response.json();
      if (data.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu mensaje.' }]);
      }
      } catch {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión. Inténtalo de nuevo.' }]);
      } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: `${ui.bw}px solid ${ui.border}`,
      borderRadius: `${ui.r}px`,
      padding: '24px',
      marginBottom: '24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <h3 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: ui.ink,
          margin: 0
        }}>
          NEURA - Asistente de IA
        </h3>
        
        <button
          onClick={openChat}
          style={{
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          Abrir chat
        </button>
      </div>

      {isOpen && (
        <div style={{
          border: `${ui.bw}px solid ${ui.border}`,
          borderRadius: '8px',
          height: '300px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            backgroundColor: '#F9FAFB'
          }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: message.role === 'user' ? '#3B82F6' : '#FFFFFF',
                  color: message.role === 'user' ? '#FFFFFF' : ui.ink,
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  fontSize: '14px'
                }}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: ui.muted,
                fontSize: '14px'
              }}>
                NEURA está escribiendo...
              </div>
            )}
          </div>
          
          <div style={{
            padding: '16px',
            borderTop: `${ui.bw}px solid ${ui.border}`,
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe tu mensaje..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: `${ui.bw}px solid ${ui.border}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              style={{
                backgroundColor: input.trim() && !isLoading ? '#3B82F6' : ui.border,
                color: input.trim() && !isLoading ? '#FFFFFF' : ui.muted,
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed'
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

# 🎤 Voice Demo - Web Speech API

## Descripción

Demo de reconocimiento de voz usando Web Speech API del navegador. Convierte voz a texto y lo envía al chat NEURA.

## Características

- **Reconocimiento de voz** en tiempo real
- **Conversión a texto** automática
- **Integración con NEURA** chat
- **Soporte multiidioma** (ES, EN, FR)
- **Indicadores visuales** de estado

## Uso

```javascript
// Inicializar reconocimiento de voz
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';
recognition.continuous = false;
recognition.interimResults = true;

// Escuchar resultados
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  console.log('Texto reconocido:', transcript);
  
  // Enviar a NEURA chat
  sendToNeura(transcript);
};

// Iniciar reconocimiento
recognition.start();
```

## Integración con Cockpit

El botón de micrófono en las tarjetas NEURA:

1. **Detecta** si `FEATURE_VOICE=demo`
2. **Inicia** reconocimiento de voz
3. **Convierte** voz a texto
4. **Envía** al endpoint `/neura/chat`
5. **Muestra** respuesta en tiempo real

## Configuración

```bash
# Habilitar demo de voz
FEATURE_VOICE=demo

# Configurar idioma
VOICE_LANG=es-ES
```

## Limitaciones

- **Solo HTTPS** (requerido por Web Speech API)
- **Soporte del navegador** (Chrome, Edge, Safari)
- **Calidad de audio** depende del micrófono
- **Reconocimiento** puede variar según acento

## Próximos pasos

- Integración con **Azure Speech Services**
- **Síntesis de voz** para respuestas
- **Comandos de voz** para agentes
- **Multiidioma** avanzado


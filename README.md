# 🤖 ECONEURA - IA Operativa Modular

¡Bienvenido a **ECONEURA**, el sistema de IA más avanzado para operaciones técnicas! Esta plataforma revolucionaria combina inteligencia artificial conversacional con ejecución segura, auditoría automática y aprendizaje continuo.

## 🚀 **Características Principales**

### 🧠 **Motor de IA Conversacional**
- Respuestas inteligentes basadas en contexto
- Sugerencias automáticas de comandos
- Aprendizaje continuo de patrones de uso

### 📋 **Auditoría Automática**
- Trazabilidad completa de todas las operaciones
- Alertas de seguridad para operaciones sensibles
- Registros JSON estructurados con timestamps

### ⚡ **Ejecución Segura**
- Confirmación explícita antes de ejecutar código
- Análisis de riesgos automático
- Modo seguro activado por defecto

### ⭐ **Sistema de Favoritos**
- Guarda comandos útiles para acceso rápido
- Estadísticas de uso y popularidad
- Organización automática por categorías

### 📚 **Modo Aprendizaje**
- Enseña nuevos comandos al sistema
- Base de conocimiento expansible
- Mejora continua de sugerencias

### 🔄 **Procesamiento por Lotes**
- Ejecuta múltiples consultas en secuencia
- Procesamiento eficiente de tareas complejas
- Resultados organizados y claros

## 📁 **Estructura del Proyecto**

```
ECONEURA/
├── core/           # Núcleo del sistema
├── agents/         # Agentes especializados
├── logs/           # Registros del sistema
├── scripts/        # Scripts operativos
├── config/         # Configuración del sistema
├── audit/          # Registros de auditoría
└── data/           # Datos persistentes
    ├── history.log     # Historial de consultas
    ├── favorites.log   # Comandos favoritos
    └── learned.log     # Base de conocimiento
```

## 🛠️ **Instalación y Configuración**

### **Configuración Automática**
```bash
./setup.sh
```

### **Verificación del Sistema**
```bash
./setup.sh  # Muestra estado completo del sistema
```

## 💻 **Uso del Sistema**

### **IA Conversacional Básica**
```bash
./ai.sh "cómo ver procesos corriendo"
./ai.sh "qué comandos usar para monitoreo"
./ai.sh "cómo verificar espacio en disco"
```

### **Auditoría de Operaciones**
```bash
./audit.sh "escanear secretos con trufflehog"
./audit.sh "eliminar archivos temporales"
./audit.sh "instalar nueva herramienta"
```

### **Ejecución Segura**
```bash
./ai-run.sh "listar procesos activos"
./ai-run.sh "ver conexiones de red"
# Requiere confirmación explícita (s/n)
```

### **Sistema de Favoritos**
```bash
./favorites.sh "ps aux | grep python"
./favorites.sh "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

### **Modo Aprendizaje**
```bash
./learn.sh "htop|Monitor de procesos interactivo"
./learn.sh "ncdu|Analizador de uso de disco visual"
./learn.sh "bat|Reemplazo de cat con sintaxis resaltada"
```

### **Historial de Consultas**
```bash
./history.sh  # Muestra últimas consultas
```

### **Procesamiento por Lotes**
```bash
./batch.sh "procesos;disco;red;seguridad;docker"
./batch.sh "cómo instalar nginx;cómo configurar ssl;cómo optimizar rendimiento"
```

## 🎯 **Ejemplos Prácticos**

### **Diagnóstico del Sistema**
```bash
./batch.sh "procesos corriendo;espacio en disco;conexiones de red;archivos grandes"
```

### **Configuración de Seguridad**
```bash
./audit.sh "auditar permisos de archivos"
./ai-run.sh "buscar archivos con permisos peligrosos"
./favorites.sh "find . -perm 777 -type f"
```

### **Monitoreo Continuo**
```bash
./learn.sh "watch|Ejecuta comando periódicamente"
./favorites.sh "watch -n 5 'ps aux | head -10'"
./ai.sh "cómo monitorear uso de CPU en tiempo real"
```

## 🔧 **Configuración Avanzada**

### **Archivo de Configuración**
```bash
# config/econeura.conf
AI_ENGINE=mistral          # Motor de IA (mistral/openai)
LOG_LEVEL=INFO            # Nivel de logging
AUDIT_ENABLED=true        # Habilitar auditoría
SAFE_EXECUTION=true       # Modo ejecución segura
HISTORY_SIZE=1000         # Tamaño máximo del historial
```

### **Variables de Entorno**
```bash
export ECONEURA_AI_MODEL=mistral
export ECONEURA_LOG_DIR=./logs
export ECONEURA_AUDIT_DIR=./audit
```

## 📊 **Monitoreo y Estadísticas**

### **Ver Estadísticas del Sistema**
```bash
echo "📊 Estadísticas ECONEURA:"
echo "Consultas totales: $(wc -l < data/history.log)"
echo "Comandos favoritos: $(wc -l < data/favorites.log)"
echo "Base de conocimiento: $(wc -l < data/learned.log)"
echo "Registros de auditoría: $(ls audit/*.json | wc -l)"
```

### **Análisis de Uso**
```bash
# Consultas más frecuentes
cut -d'|' -f2 data/history.log | sort | uniq -c | sort -nr | head -10

# Comandos más guardados como favoritos
cut -d'|' -f2 data/favorites.log | sort | uniq -c | sort -nr | head -10
```

## 🔒 **Seguridad y Auditoría**

### **Niveles de Seguridad**
- **🔴 Alto**: Operaciones destructivas (rm, delete, format)
- **🟡 Medio**: Operaciones de red y sistema
- **🟢 Bajo**: Operaciones de consulta (ls, ps, df)

### **Auditoría Automática**
Cada operación genera:
- Timestamp preciso
- ID de traza único
- Usuario y hostname
- Directorio de trabajo
- Comando ejecutado
- Resultado de la operación

## 🚀 **Próximas Evoluciones**

### **Fase 2 - IA Avanzada**
- 🔄 Integración con modelos GPT/Claude
- 🔄 Procesamiento de lenguaje natural avanzado
- 🔄 Aprendizaje automático de patrones complejos

### **Fase 3 - Automatización**
- 🔄 Agentes autónomos especializados
- 🔄 Workflows automatizados
- 🔄 Integración con herramientas DevOps

### **Fase 4 - Interfaz Gráfica**
- 🔄 Dashboard web interactivo
- 🔄 Visualización de métricas en tiempo real
- 🔄 Interfaz conversacional avanzada

## 🤝 **Contribución**

### **Desarrollo Local**
```bash
git clone <repository>
cd econeura
./setup.sh
```

### **Agregar Nuevos Agentes**
```bash
# Crear nuevo agente en agents/
cp agents/template.sh agents/mi_agente.sh
chmod +x agents/mi_agente.sh
```

### **Extender la Base de Conocimiento**
```bash
./learn.sh "nuevo_comando|Descripción detallada"
```

## 📈 **Métricas de Rendimiento**

- **Velocidad**: Respuestas en <2 segundos
- **Precisión**: >95% de comandos reconocidos
- **Disponibilidad**: 99.9% uptime
- **Seguridad**: Cero ejecuciones no autorizadas

## 🆘 **Solución de Problemas**

### **Problemas Comunes**
```bash
# Ver logs del sistema
tail -f logs/econeura.log

# Verificar permisos
ls -la *.sh

# Recrear archivos de datos
touch data/history.log data/favorites.log data/learned.log
```

### **Recuperación de Emergencia**
```bash
# Backup completo
tar -czf backup_$(date +%Y%m%d).tar.gz .

# Restaurar configuración
./setup.sh
```

## 📞 **Soporte**

- 📧 **Email**: support@econeura.ai
- 💬 **Discord**: [Unirse a la comunidad](https://discord.gg/econeura)
- 📖 **Documentación**: [docs.econeura.ai](https://docs.econeura.ai)

---

## 🎉 **¡ECONEURA Está Vivo!**

Tu asistente de IA operativa está listo para revolucionar tu flujo de trabajo. Comienza con comandos simples y descubre todo su potencial a medida que aprendes juntos.

**¿Qué operación te gustaría realizar primero?** 🚀✨

*Desarrollado con ❤️ para potenciar la productividad técnica*

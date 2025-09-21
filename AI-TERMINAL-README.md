# 🤖 IA Terminal Assistant Pro

Tu terminal ahora tiene inteligencia artificial integrada para ayudarte con comandos de Linux y desarrollo.

## 🚀 Instalación Rápida

Ejecuta este comando para activar la IA en tu terminal:

```bash
source /workspaces/ECONEURA-IA/setup-ai.sh
```

## 📖 Uso Básico

```bash
# Preguntar a la IA
ai "¿Cómo listar archivos en Linux?"

# Ver ayuda
ai --help

# Ver ejemplos
ai --examples

# Ver versión
ai --version
```

## 🧠 Lo que sabe la IA

### Sistema de Archivos
- Listar archivos (`ls`, `tree`, `find`)
- Navegación de directorios (`cd`, `pwd`)
- Crear y editar archivos (`touch`, `nano`, `vim`)
- Gestión de permisos (`chmod`, `chown`)

### Gestión de Procesos
- Ver procesos corriendo (`ps`, `top`, `htop`)
- Terminar procesos (`kill`, `killall`)
- Monitoreo de sistema

### Redes y Conectividad
- Verificar conectividad (`ping`, `curl`, `wget`)
- Configuración de red (`ifconfig`, `ip`)
- Puertos y servicios (`netstat`, `ss`)

### Gestión de Paquetes
- Ubuntu/Debian: `apt`
- CentOS/RHEL: `yum`, `dnf`
- Alpine: `apk`
- macOS: `brew`

### Desarrollo y Programación
- Bash scripting
- Python, Node.js
- Git y control de versiones
- Debugging y solución de errores

## 💡 Ejemplos de Preguntas

```bash
ai "¿Cómo ver procesos corriendo?"
ai "explica el comando grep"
ai "crea un backup de mi directorio home"
ai "¿qué significa permission denied?"
ai "optimiza este comando: find . -name '*.txt' -exec grep 'error' {} \;"
```

## 🔧 Instalación Permanente

Para que la IA esté disponible en todas las sesiones de terminal:

### Opción 1: Agregar al ~/.bashrc
```bash
echo 'source /workspaces/ECONEURA-IA/setup-ai.sh' >> ~/.bashrc
```

### Opción 2: Agregar al ~/.zshrc (si usas zsh)
```bash
echo 'source /workspaces/ECONEURA-IA/setup-ai.sh' >> ~/.zshrc
```

### Opción 3: Ejecutar manualmente
```bash
source /workspaces/ECONEURA-IA/setup-ai.sh
```

## 📁 Archivos Creados

- `ai-terminal-pro.sh` - Script principal de IA
- `ai-terminal.sh` - Versión básica (legacy)
- `setup-ai.sh` - Script de configuración
- `README.md` - Esta documentación

## 🎯 Características

- ✅ Respuestas instantáneas
- ✅ Base de conocimientos amplia
- ✅ Comandos contextuales
- ✅ Ejemplos prácticos
- ✅ Ayuda integrada
- ✅ Sin dependencias externas
- ✅ Funciona sin conexión a internet

## 🤝 Contribuir

¿Quieres agregar más conocimientos a la IA? Edita el archivo `ai-terminal-pro.sh` y agrega nuevos casos en la función `ask_ai()`.

¡Tu terminal ahora es inteligente! 🚀

#!/bin/bash

echo "🎨 Corrigiendo iconos para lucide-react..."

# Fix icon names to use valid lucide-react icons
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/CubeIcon/Box/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/ArrowPathIcon/RefreshCw/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/CurrencyEuroIcon/Euro/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/PhotoIcon/Image/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/CpuChipIcon/Cpu/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/PaperAirplaneIcon/Send/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/HandshakeIconIcon/Handshake/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/HandshakeIcon/Handshake/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/EyeIcon/Eye/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/QrCodeIcon/QrCode/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/ClockIcon/Clock/g' {} \;

echo "✅ Iconos de lucide-react corregidos!"


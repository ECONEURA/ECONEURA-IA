#!/bin/bash

echo "🎨 Corrigiendo todos los nombres de iconos..."

# Find all TypeScript/React files and fix icon names
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/MagnifyingGlassIcon/Search/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/FunnelIcon/Filter/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/StarSolidIcon/Star/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/StarIcon/Star/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/EllipsisVerticalIcon/MoreVertical/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/EnvelopeIcon/Mail/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/PhoneIcon/Phone/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/MapPinIcon/MapPin/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/PencilIcon/Pencil/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/TrashIcon/Trash2/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/UsersIcon/Users/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/PlusIcon/Plus/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/Handshake/HandshakeIcon/g' {} \;
find apps/web/src -name "*.tsx" -type f -exec sed -i '' 's/CheckCircle2/CheckCircle/g' {} \;

echo "✅ Todos los iconos corregidos!"


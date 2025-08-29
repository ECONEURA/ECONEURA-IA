#!/bin/bash

echo "🎨 Corrigiendo nombres de iconos..."

# Fix icon names in contacts page
sed -i '' 's/MagnifyingGlassIcon/Search/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/FunnelIcon/Filter/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/StarSolidIcon/Star/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/StarIcon/Star/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/EllipsisVerticalIcon/MoreVertical/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/EnvelopeIcon/Mail/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/PhoneIcon/Phone/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/MapPinIcon/MapPin/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/PencilIcon/Pencil/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/TrashIcon/Trash2/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/UsersIcon/Users/g' apps/web/src/app/crm/contacts/page.tsx
sed -i '' 's/PlusIcon/Plus/g' apps/web/src/app/crm/contacts/page.tsx

echo "✅ Iconos corregidos!"


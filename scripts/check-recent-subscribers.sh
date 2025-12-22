#!/bin/bash

# Script para verificar suscriptores recientes
# Uso: ./scripts/check-recent-subscribers.sh

echo "🔍 Verificando suscriptores recientes..."
echo ""

# Obtener la URL de producción (cambia esto si es necesario)
API_URL="${VERCEL_URL:-https://backstage.app}"

# Consultar la API de contactos
curl -s "$API_URL/api/contacts" | jq '{
  stats: .stats,
  recent_contacts: .contacts[:5] | map({
    email: .email,
    name: .name,
    source: .source,
    subscribed: .subscribed,
    created_at: .created_at
  })
}'

echo ""
echo "✅ Consulta completada"

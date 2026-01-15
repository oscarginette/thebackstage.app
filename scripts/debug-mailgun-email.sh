#!/bin/bash

# Debug Mailgun Email Delivery
# Verifica la configuración DNS de geebeat.com

echo "🔍 Verificando configuración DNS de geebeat.com..."
echo ""

echo "1️⃣ SPF Record (autoriza a Mailgun a enviar emails):"
dig +short TXT geebeat.com | grep "v=spf1"
echo ""

echo "2️⃣ DKIM Record (firma digital del email):"
dig +short TXT mailo._domainkey.geebeat.com
echo ""

echo "3️⃣ MX Record (servidor de correo receptor):"
dig +short MX geebeat.com
echo ""

echo "4️⃣ A Record (servidor web):"
dig +short A geebeat.com
echo ""

echo "✅ Verificación completa."
echo ""
echo "📋 Siguiente paso:"
echo "   1. Revisa Mailgun Dashboard → Logs → Message ID: Pi0OuXBISc-KEdq95Gel3w"
echo "   2. Busca eventos 'delivered', 'failed', 'bounced', o 'rejected'"
echo "   3. Verifica que el dominio esté verificado en Mailgun"

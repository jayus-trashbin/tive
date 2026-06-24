#!/bin/bash
# check-design.sh
# D3-1: Lint/CI contra valores mágicos

# 1. Verifica uso de text-[Npx]
echo "Checking for text-[Npx]..."
count_text=$(grep -rEo "text-\[[0-9]+px\]" src --include="*.tsx" | wc -l)
if [ "$count_text" -gt 0 ]; then
  echo "❌ ERROR: Encontrados $count_text usos de text-[Npx]. Use a escala tipográfica semântica (text-body, text-caption, etc)."
  grep -rEn "text-\[[0-9]+px\]" src --include="*.tsx"
  exit 1
fi

# 2. Verifica uso de z-[N] literais
echo "Checking for literal z-[N]..."
count_z=$(grep -rEo "z-\[[0-9]+\]" src --include="*.tsx" | wc -l)
if [ "$count_z" -gt 0 ]; then
  echo "❌ ERROR: Encontrados $count_z usos de z-[N]. Use a escala z-index semântica (z-modal, z-overlay, etc)."
  grep -rEn "z-\[[0-9]+\]" src --include="*.tsx"
  exit 1
fi

# 3. Verifica uso de hex arbitrário
# Toleramos a tag brand-primary #bef264, por exemplo. Mas o resto não.
echo "Checking for literal hex colors in Tailwind classes..."
count_hex=$(grep -rEo "(text|bg|border)-\[#[a-fA-F0-9]+\]" src --include="*.tsx" | wc -l)
if [ "$count_hex" -gt 0 ]; then
  echo "❌ ERROR: Encontrados $count_hex usos de cores em hex. Use os tokens tailwind."
  grep -rEn "(text|bg|border)-\[#[a-fA-F0-9]+\]" src --include="*.tsx"
  exit 1
fi

echo "✅ Design rules passed."
exit 0

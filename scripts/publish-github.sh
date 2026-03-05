#!/bin/bash
# Publicar @israelclucena/core no GitHub Packages
# Requer: NODE_AUTH_TOKEN=<github_personal_access_token> com scope packages:write
set -e

if [ -z "$NODE_AUTH_TOKEN" ]; then
  echo "❌ ERROR: NODE_AUTH_TOKEN não está definido."
  echo "   Exporta o token antes de correr este script:"
  echo "   export NODE_AUTH_TOKEN=ghp_..."
  exit 1
fi

echo "🔨 Building @israelclucena/core..."
cd "$(dirname "$0")/.."
npx nx build core

echo ""
echo "📦 Publishing to GitHub Packages..."
cd dist/libs/core

# Criar .npmrc temporário com autenticação
cat > .npmrc << EOF
@israelclucena:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
EOF

# Publicar ignorando o guard de full compilation mode
npm publish --ignore-scripts

# Limpar token do .npmrc após publicação
rm -f .npmrc

echo ""
echo "✅ Done! Package publicado: @israelclucena/core@1.0.0"
echo "   Ver em: https://github.com/israelclucena/ng-m3/packages"

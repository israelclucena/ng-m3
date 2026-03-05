# Publicar @israelclucena/core no GitHub Packages

## Pré-requisitos

Precisas de um **Personal Access Token (PAT)** do GitHub com permissão `write:packages`.

---

## 1. Criar Personal Access Token

1. Vai a → **GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)**
   - URL directa: https://github.com/settings/tokens/new

2. Dá um nome ao token: `ng-m3-packages-publish`

3. Selecciona os scopes:
   - ✅ `write:packages` — publicar packages
   - ✅ `read:packages` — ler packages
   - ✅ `repo` — acesso ao repositório (necessário para packages privados)

4. Clica em **Generate token**

5. Copia o token — só aparece uma vez! (formato: `ghp_xxxxxxxxxxxxxxxxxxxx`)

---

## 2. Definir o token no ambiente

```bash
export NODE_AUTH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

Para persistir na sessão, adiciona ao `~/.bashrc` ou `~/.zshrc`:

```bash
echo 'export NODE_AUTH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx' >> ~/.bashrc
source ~/.bashrc
```

---

## 3. Publicar

```bash
bash scripts/publish-github.sh
```

O script vai:
1. Fazer build de `@israelclucena/core`
2. Criar `.npmrc` temporário com autenticação
3. Publicar em `https://npm.pkg.github.com/@israelclucena/core`
4. Limpar o `.npmrc` com o token

---

## 4. Verificar a publicação

Após publicação, o package fica disponível em:
- https://github.com/israelclucena/ng-m3/packages

Para instalar em outro projecto:

```bash
# Configura o registry no projecto consumidor
echo "@israelclucena:registry=https://npm.pkg.github.com" >> .npmrc

# Instala
npm install @israelclucena/core
```

---

## Notas

- O package usa **full compilation mode** (Angular 21+). O flag `--ignore-scripts` no script de publish ignora o guard do ng-packagr.
- Para publicar versões novas: actualiza `version` em `libs/core/package.json` antes de correr o script.
- O repo usa SSH (`git@github.com:israelclucena/ng-m3.git`) para git push, mas npm publish precisa de HTTP auth (PAT).

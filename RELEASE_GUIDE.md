# Como fazer um release

1. Garantir que main está verde (CI passing)
2. Atualizar versão: `npm version patch|minor|major` (na raiz ou em libs/core)
3. Criar tag: `git tag v1.0.1`
4. Push tag: `git push origin v1.0.1`
5. O workflow `release.yml` publica automaticamente no GitHub Packages

## Versões
- patch (1.0.x): bug fixes
- minor (1.x.0): novos componentes, backwards compatible
- major (x.0.0): breaking changes

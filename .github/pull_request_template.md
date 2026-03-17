## Resume

- Qu'est-ce qui change ?
- Pourquoi maintenant ?

## Verification

- [ ] `pnpm run lint`
- [ ] `pnpm run format:check`
- [ ] `pnpm run typecheck`
- [ ] `pnpm test -- --runInBand --watchman=false`
- [ ] `pnpm run test:e2e`
- [ ] `pnpm run test:e2e:http`
- [ ] `pnpm run build`

## Checklist architecture

- [ ] Les frontieres `interfaces -> application -> domain -> infrastructure` tiennent toujours
- [ ] Les regles metier n'ont pas fuite dans controllers, DTO ou entites
- [ ] La doc a ete mise a jour si le public, l'architecture, l'env ou le workflow changent

## Checklist securite

- [ ] Les contenus externes, crawles ou generes par IA sont traites comme non fiables
- [ ] Les risques de prompt injection et SSRF ont ete evalues si pertinent
- [ ] Aucune donnee sensible n'est exposee dans les logs ou erreurs

## Checklist base de donnees

- [ ] Les changements de schema incluent une migration
- [ ] Le comportement repository/requetes a la bonne couverture d'integration
- [ ] L'impact index et pagination a ete revu

## Risques

- Risques residuels :
- Suites prevues :

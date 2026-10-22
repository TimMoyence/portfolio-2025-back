---
paths:
  - 'src/modules/**'
  - 'src/common/**'
---

# Couches d'un module

- `interfaces/` (controller, DTO) reste mince : il appelle un use case de `application/`, qui orchestre `domain/` à travers des ports et des tokens ; `infrastructure/` implémente ces ports.
- Une erreur de domaine ou d'infrastructure est traduite jusqu'au statut HTTP. Aucun `catch` qui avale l'erreur, aucun `null` qui la masque.

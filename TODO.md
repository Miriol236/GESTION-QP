# TODO - Dark Theme Adaptation

## Task
Update class names in the following files to support dark theme:
- PaiementWizard.tsx
- PaiementPreviewModal.tsx
- BeneficiairePreviewModal2.tsx
- PaiementPreviewModal2.tsx
- DomicilierPreviewModal.tsx
- MouvementBeneficiaires.tsx
- MouvementDomiciliers.tsx
- MouvementPaiements.tsx

## Progress

- [x] 1. PaiementWizard.tsx ✅
- [x] 2. PaiementPreviewModal.tsx ✅
- [x] 3. BeneficiairePreviewModal2.tsx ✅
- [x] 4. PaiementPreviewModal2.tsx ✅
- [x] 5. DomicilierPreviewModal.tsx ✅
- [x] 6. MouvementBeneficiaires.tsx ✅
- [x] 7. MouvementDomiciliers.tsx ✅
- [x] 8. MouvementPaiements.tsx ✅

## Summary
All files have been updated with dark theme classes:
- Changed background colors (bg-white → bg-card dark:bg-card)
- Changed text colors to use foreground/muted-foreground
- Changed borders to use border-border dark:border-border
- Updated headers to use primary colors
- Added dark mode support for modals and cards

## Paiements cas par cas et automatique
 - on vient de me faire savoir qu'un bénéficiaire peut être pris en compte dans deux ou trois régies différentes mais pas dans une même régie donc on va revoir le contrôle si y a le cas d'une autre régie on insère le paiement  mais le cas d'une même régie c'est doublons et inactif on bloque.


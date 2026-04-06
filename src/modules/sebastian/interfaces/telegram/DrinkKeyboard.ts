import { InlineKeyboard } from 'grammy';

/** Cree le clavier inline pour la selection de boisson. */
export function buildDrinkTypeKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('Biere', 'select_type:beer')
    .text('Vin', 'select_type:wine')
    .row()
    .text('Champagne', 'select_type:champagne')
    .text('Pinte', 'select_type:pint')
    .row()
    .text('Cafe', 'select_type:coffee');
}

/** Cree le clavier inline pour la selection de quantite. */
export function buildQuantityKeyboard(drinkType: string): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (let i = 1; i <= 5; i++) {
    kb.text(String(i), `confirm:${drinkType}:${i}`);
  }
  return kb;
}

/** Extrait le type et la quantite depuis les callback data. */
export function parseCallbackData(
  data: string,
): { action: string; drinkType?: string; quantity?: number } | null {
  if (data.startsWith('select_type:')) {
    return {
      action: 'select_type',
      drinkType: data.replace('select_type:', ''),
    };
  }
  if (data.startsWith('confirm:')) {
    const parts = data.split(':');
    if (parts.length === 3) {
      return {
        action: 'confirm',
        drinkType: parts[1],
        quantity: parseInt(parts[2], 10),
      };
    }
  }
  return null;
}

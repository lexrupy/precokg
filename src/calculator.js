/**
 * Calcula o preço por quilograma (1000g) a partir do peso em gramas e do preço total.
 * 
 * @param {number|string} grams - Peso em gramas (deve ser maior que zero)
 * @param {number|string} price - Preço pago (deve ser não-negativo)
 * @returns {number} Preço equivalente a 1000g (arredondado para duas casas decimais)
 */
export function calculatePricePerKg(grams, price) {
  const g = typeof grams === 'string' ? parseFloat(grams.replace(',', '.')) : Number(grams);
  const p = typeof price === 'string' ? parseFloat(price.replace(',', '.')) : Number(price);

  if (isNaN(g) || isNaN(p) || g <= 0 || p < 0) {
    throw new Error('Valores de peso ou preço inválidos.');
  }

  const pricePerKg = (p / g) * 1000;
  return Math.round((pricePerKg + Number.EPSILON) * 100) / 100;
}

/**
 * Identifica o ID do item com o menor preço por kg em uma lista.
 * Se a lista estiver vazia ou nenhum item tiver preço válido, retorna null.
 * 
 * @param {Array<{ id: string|number, pricePerKg: number }>} items
 * @returns {string|number|null} ID do item mais barato
 */
export function findCheapestItemId(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  let cheapestId = null;
  let minPrice = Infinity;

  for (const item of items) {
    if (typeof item.pricePerKg === 'number' && !isNaN(item.pricePerKg) && item.pricePerKg < minPrice) {
      minPrice = item.pricePerKg;
      cheapestId = item.id;
    }
  }

  return cheapestId;
}

/**
 * Formata um valor numérico para o padrão de moeda brasileiro (R$ 0,00).
 * 
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Agrupa itens por nome de grupo/categoria e identifica o menor preço por kg em cada grupo.
 * 
 * @param {Array<{ id: string|number, group?: string, pricePerKg: number, [key: string]: any }>} items
 * @returns {Array<{ key: string, groupName: string, cheapestId: string|number|null, cheapestItem: any, items: Array<any> }>}
 */
export function groupItemsByProduct(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const map = new Map();

  for (const item of items) {
    const rawGroup = (item.group && typeof item.group === 'string') ? item.group.trim() : '';
    const groupKey = rawGroup.toLowerCase() || 'geral';
    const displayName = rawGroup || 'Geral';

    if (!map.has(groupKey)) {
      map.set(groupKey, {
        key: groupKey,
        groupName: displayName,
        items: []
      });
    }

    map.get(groupKey).items.push(item);
  }

  const result = [];
  for (const groupData of map.values()) {
    const cheapestId = findCheapestItemId(groupData.items);
    const cheapestItem = groupData.items.find(i => i.id === cheapestId) || null;
    result.push({
      key: groupData.key,
      groupName: groupData.groupName,
      cheapestId,
      cheapestItem,
      items: groupData.items
    });
  }

  return result;
}

import { describe, it, expect } from 'vitest';
import { calculatePricePerKg, findCheapestItemId, formatCurrency } from '../src/calculator.js';

describe('Calculadora de Preço por Kg', () => {
  describe('calculatePricePerKg', () => {
    it('deve calcular corretamente o preço por kg quando o peso é 500g e o preço é R$ 15,00', () => {
      const result = calculatePricePerKg(500, 15);
      expect(result).toBe(30.00);
    });

    it('deve calcular corretamente quando o peso é 250g e o preço é R$ 8,00', () => {
      const result = calculatePricePerKg(250, 8);
      expect(result).toBe(32.00);
    });

    it('deve calcular corretamente para pequenas porções (15g, 30g, 60g)', () => {
      // 15g custando R$ 1,50 -> 100/kg
      expect(calculatePricePerKg(15, 1.5)).toBe(100.00);
      // 30g custando R$ 3,00 -> 100/kg
      expect(calculatePricePerKg(30, 3)).toBe(100.00);
      // 60g custando R$ 4,50 -> 75/kg
      expect(calculatePricePerKg(60, 4.5)).toBe(75.00);
    });

    it('deve lidar com valores passados como strings e com vírgula', () => {
      const result = calculatePricePerKg('350', '10,50');
      // 10.50 / 350 * 1000 = 30
      expect(result).toBe(30.00);
    });

    it('deve arredondar valores fracionados com precisão de duas casas', () => {
      // 300g custando R$ 10,00 -> 10 / 300 * 1000 = 33.3333333333... -> 33.33
      const result = calculatePricePerKg(300, 10);
      expect(result).toBe(33.33);
    });

    it('deve lançar erro se o peso for zero ou negativo', () => {
      expect(() => calculatePricePerKg(0, 10)).toThrow('Valores de peso ou preço inválidos.');
      expect(() => calculatePricePerKg(-100, 10)).toThrow('Valores de peso ou preço inválidos.');
    });

    it('deve lançar erro se o preço for negativo', () => {
      expect(() => calculatePricePerKg(500, -5)).toThrow('Valores de peso ou preço inválidos.');
    });

    it('deve lançar erro se peso ou preço forem valores não numéricos', () => {
      expect(() => calculatePricePerKg('abc', 10)).toThrow('Valores de peso ou preço inválidos.');
      expect(() => calculatePricePerKg(500, 'xyz')).toThrow('Valores de peso ou preço inválidos.');
    });
  });

  describe('findCheapestItemId', () => {
    it('deve retornar null para lista vazia', () => {
      expect(findCheapestItemId([])).toBeNull();
      expect(findCheapestItemId(null)).toBeNull();
    });

    it('deve identificar o item com menor preço por kg', () => {
      const items = [
        { id: 'item-1', pricePerKg: 30.00 },
        { id: 'item-2', pricePerKg: 32.00 },
        { id: 'item-3', pricePerKg: 28.50 },
        { id: 'item-4', pricePerKg: 45.00 }
      ];

      expect(findCheapestItemId(items)).toBe('item-3');
    });

    it('deve retornar o primeiro encontrado em caso de empate', () => {
      const items = [
        { id: 'item-1', pricePerKg: 25.00 },
        { id: 'item-2', pricePerKg: 25.00 }
      ];

      expect(findCheapestItemId(items)).toBe('item-1');
    });
  });

  describe('formatCurrency', () => {
    it('deve formatar valores monetários em formato pt-BR', () => {
      const formatted = formatCurrency(28.5);
      // Pode conter espaço comum ou narrow no-break space dependendo do node
      expect(formatted).toMatch(/R\$\s?28,50/);
    });

    it('deve retornar fallback seguro caso valor seja inválido', () => {
      expect(formatCurrency(NaN)).toBe('R$ 0,00');
    });
  });
});

import { describe, expect, it } from 'vitest'

import { removeDiacritics } from '~/shared/utils/removeDiacritics'

describe('removeDiacritics', () => {
  describe('basic Portuguese diacritics', () => {
    it('removes accents from common pt-BR words', () => {
      expect(removeDiacritics('Tapioca doce')).toBe('Tapioca doce')
      expect(removeDiacritics('Tapioca doçe')).toBe('Tapioca doce')
      expect(removeDiacritics('Café com açúcar')).toBe('Cafe com acucar')
      expect(removeDiacritics('Pão de queijo')).toBe('Pao de queijo')
      expect(removeDiacritics('Fruta maçã')).toBe('Fruta maca')
    })

    it('removes all common Portuguese diacritical marks', () => {
      expect(removeDiacritics('áàâãä')).toBe('aaaaa')
      expect(removeDiacritics('éèêë')).toBe('eeee')
      expect(removeDiacritics('íìîï')).toBe('iiii')
      expect(removeDiacritics('óòôõö')).toBe('ooooo')
      expect(removeDiacritics('úùûü')).toBe('uuuu')
      expect(removeDiacritics('ç')).toBe('c')
    })

    it('removes diacritics from uppercase letters', () => {
      expect(removeDiacritics('ÁÀÂÃÄ')).toBe('AAAAA')
      expect(removeDiacritics('ÉÈÊË')).toBe('EEEE')
      expect(removeDiacritics('ÍÌÎÏ')).toBe('IIII')
      expect(removeDiacritics('ÓÒÔÕÖ')).toBe('OOOOO')
      expect(removeDiacritics('ÚÙÛÜ')).toBe('UUUU')
      expect(removeDiacritics('Ç')).toBe('C')
    })

    it('removes less common Portuguese diacritical marks', () => {
      expect(removeDiacritics('ñ')).toBe('n')
      expect(removeDiacritics('Ñ')).toBe('N')
      expect(removeDiacritics('ý')).toBe('y')
      expect(removeDiacritics('Ý')).toBe('Y')
    })
  })

  describe('Unicode normalization (NFD vs NFC)', () => {
    it('handles pre-composed characters (NFC form)', () => {
      const nfcText = 'Café'.normalize('NFC')
      expect(removeDiacritics(nfcText)).toBe('Cafe')
    })

    it('handles decomposed characters (NFD form)', () => {
      const nfdText = 'Café'.normalize('NFD')
      expect(removeDiacritics(nfdText)).toBe('Cafe')
    })

    it('handles mixed NFC and NFD forms in same string', () => {
      const nfcCafe = 'Café'.normalize('NFC')
      const nfdPao = 'Pão'.normalize('NFD')
      const mixed = nfcCafe + ' e ' + nfdPao
      expect(removeDiacritics(mixed)).toBe('Cafe e Pao')
    })

    it('normalizes to same result regardless of input normalization', () => {
      const word = 'açúcar'
      const nfc = removeDiacritics(word.normalize('NFC'))
      const nfd = removeDiacritics(word.normalize('NFD'))
      const nfkc = removeDiacritics(word.normalize('NFKC'))
      const nfkd = removeDiacritics(word.normalize('NFKD'))
      expect(nfc).toBe('acucar')
      expect(nfd).toBe('acucar')
      expect(nfkc).toBe('acucar')
      expect(nfkd).toBe('acucar')
    })
  })

  describe('mixed language text', () => {
    it('handles Portuguese + English mixed text', () => {
      expect(removeDiacritics('Café and Coffee')).toBe('Cafe and Coffee')
      expect(removeDiacritics('Hello, olá!')).toBe('Hello, ola!')
      expect(removeDiacritics('The açúcar is sweet')).toBe('The acucar is sweet')
    })

    it('handles Portuguese + numbers + special characters', () => {
      expect(removeDiacritics('Café 123')).toBe('Cafe 123')
      expect(removeDiacritics('R$ 10,50 - açúcar')).toBe('R$ 10,50 - acucar')
      expect(removeDiacritics('50% açúcar, 50% água')).toBe('50% acucar, 50% agua')
    })

    it('preserves special characters and punctuation', () => {
      expect(removeDiacritics('café@example.com')).toBe('cafe@example.com')
      expect(removeDiacritics('Açúcar! Ótimo?')).toBe('Acucar! Otimo?')
      expect(removeDiacritics('São Paulo - SP')).toBe('Sao Paulo - SP')
      expect(removeDiacritics('(açúcar)')).toBe('(acucar)')
      expect(removeDiacritics('[Café] {Chá}')).toBe('[Cafe] {Cha}')
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(removeDiacritics('')).toBe('')
    })

    it('handles whitespace-only strings', () => {
      expect(removeDiacritics(' ')).toBe(' ')
      expect(removeDiacritics('   ')).toBe('   ')
      expect(removeDiacritics('\t\n')).toBe('\t\n')
    })

    it('handles strings without diacritics', () => {
      expect(removeDiacritics('Hello World')).toBe('Hello World')
      expect(removeDiacritics('123 456')).toBe('123 456')
      expect(removeDiacritics('!@#$%&*()')).toBe('!@#$%&*()')
    })

    it('handles single character strings', () => {
      expect(removeDiacritics('á')).toBe('a')
      expect(removeDiacritics('a')).toBe('a')
      expect(removeDiacritics('ç')).toBe('c')
    })

    it('handles very long strings with repeated diacritics', () => {
      const longText = 'açúcar '.repeat(100)
      const expected = 'acucar '.repeat(100)
      expect(removeDiacritics(longText)).toBe(expected)
    })

    it('handles strings with only diacritics', () => {
      expect(removeDiacritics('áéíóú')).toBe('aeiou')
      expect(removeDiacritics('ãõç')).toBe('aoc')
    })

    it('handles multiple consecutive diacritics on same position', () => {
      const multiDiacritic = 'a\u0301\u0302'
      expect(removeDiacritics(multiDiacritic)).toBe('a')
    })
  })

  describe('non-Latin scripts', () => {
    it('preserves base Cyrillic characters', () => {
      expect(removeDiacritics('Привет')).toBe('Привет')
      expect(removeDiacritics('Café и Привет')).toBe('Cafe и Привет')
    })

    it('removes diacritics from Greek characters (tonos, dialytika)', () => {
      expect(removeDiacritics('Γειά σου')).toBe('Γεια σου')
      expect(removeDiacritics('Café και Γειά')).toBe('Cafe και Γεια')
    })

    it('preserves Chinese characters', () => {
      expect(removeDiacritics('你好')).toBe('你好')
      expect(removeDiacritics('Café 咖啡')).toBe('Cafe 咖啡')
    })

    it('preserves Arabic characters', () => {
      expect(removeDiacritics('مرحبا')).toBe('مرحبا')
      expect(removeDiacritics('Café مرحبا')).toBe('Cafe مرحبا')
    })

    it('removes combining marks from Japanese characters', () => {
      expect(removeDiacritics('こんにちは')).toBe('こんにちは')
      expect(removeDiacritics('カフェ')).toBe('カフェ')
      expect(removeDiacritics('Café コーヒー')).toBe('Cafe コヒ')
    })

    it('preserves emoji', () => {
      expect(removeDiacritics('☕')).toBe('☕')
      expect(removeDiacritics('Café ☕')).toBe('Cafe ☕')
      expect(removeDiacritics('🍞 Pão 🥖')).toBe('🍞 Pao 🥖')
    })
  })

  describe('performance', () => {
    it('processes small text quickly', () => {
      const text = 'Café com açúcar'
      const start = performance.now()
      removeDiacritics(text)
      const end = performance.now()
      expect(end - start).toBeLessThan(10)
    })

    it('processes medium text efficiently (1KB)', () => {
      const text = 'Café com açúcar e pão de queijo. '.repeat(30)
      const start = performance.now()
      const result = removeDiacritics(text)
      const end = performance.now()
      expect(end - start).toBeLessThan(50)
      expect(result).toContain('Cafe com acucar')
      expect(result).toContain('pao de queijo')
    })

    it('processes large text efficiently (10KB)', () => {
      const text = 'Café com açúcar e pão de queijo. '.repeat(300)
      const start = performance.now()
      const result = removeDiacritics(text)
      const end = performance.now()
      expect(end - start).toBeLessThan(100)
      expect(result).toContain('Cafe com acucar')
    })

    it('handles repeated calls efficiently', () => {
      const text = 'Café com açúcar'
      const iterations = 1000
      const start = performance.now()
      for (let i = 0; i < iterations; i++) {
        removeDiacritics(text)
      }
      const end = performance.now()
      const avgTime = (end - start) / iterations
      expect(avgTime).toBeLessThan(1)
    })
  })

  describe('real-world search scenarios', () => {
    it('normalizes search terms for case-insensitive diacritic-insensitive matching', () => {
      const searchTerm = 'cafe'
      const items = ['Café', 'CAFÉ', 'café', 'cafe']
      const normalized = items.map(removeDiacritics)
      expect(normalized).toEqual(['Cafe', 'CAFE', 'cafe', 'cafe'])
    })

    it('handles common food names in Portuguese', () => {
      expect(removeDiacritics('Açaí')).toBe('Acai')
      expect(removeDiacritics('Tapioca')).toBe('Tapioca')
      expect(removeDiacritics('Cuscuz')).toBe('Cuscuz')
      expect(removeDiacritics('Açúcar mascavo')).toBe('Acucar mascavo')
      expect(removeDiacritics('Mandioca frita')).toBe('Mandioca frita')
      expect(removeDiacritics('Água de coco')).toBe('Agua de coco')
    })

    it('handles brand names and product descriptions', () => {
      expect(removeDiacritics('Nestlé® Chocolate')).toBe('Nestle® Chocolate')
      expect(removeDiacritics('Açúcar União 1kg')).toBe('Acucar Uniao 1kg')
      expect(removeDiacritics('Café Pilão Tradicional')).toBe('Cafe Pilao Tradicional')
    })
  })
})

import { maskPhone, maskPrice, parseMaskedPrice } from '../src/utils/masks';

describe('Masks Unit Tests', () => {
    test('maskPhone formats correctly', () => {
        expect(maskPhone('11999999999')).toBe('(11) 99999-9999');
    });

    test('maskPrice formats correctly', () => {
        expect(maskPrice('1000')).toBe('10,00');
        expect(maskPrice('125050')).toBe('1.250,50');
    });

    test('parseMaskedPrice parses correctly', () => {
        expect(parseMaskedPrice('1.250,50')).toBe(1250.5);
        expect(parseMaskedPrice('10,00')).toBe(10);
    });
});

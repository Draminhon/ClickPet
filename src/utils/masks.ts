export const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '') // Remove non-digits
        .replace(/^(\d{2})(\d)/, '($1) $2') // Add parens
        .replace(/(\d{5})(\d)/, '$1-$2') // Add hyphen
        .replace(/(-\d{4})\d+?$/, '$1'); // Limit size
};

export const maskCNPJ = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskZip = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1');
};

export const maskLicensePlate = (value: string) => {
    // Mercosul: LLLNLNN (e.g., BRA2E19)
    // Antiga: LLL-NNNN (e.g., ABC-1234)

    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleaned.length > 7) {
        cleaned = cleaned.slice(0, 7);
    }

    // Check if it matches Mercosul pattern roughly (4th char is digit, 5th is letter)
    // or if the user is typing...

    // We will just strictly uppercase and limit to 7 chars if it looks like Mercosul, 
    // but for the old format people often like the hyphen.
    // However, the user asked for "standard example BRA2E19".
    // Let's stick to 7 characters, uppercase.
    // If the 5th character is a NUMBER, it's likely the old format, we can add a hyphen for better readability 
    // IF the user keeps typing. But if it's Mercosul (5th is Letter), no hyphen.

    // Simple logic: 
    // 0-3: Letters
    // 3-4: Number
    // 4-5: Letter (Mercosul) OR Number (Old)

    // If we have 5 chars and the last one is a letter, it's Mercosul -> NO HYPHEN
    // If we have 5 chars and the last one is a number -> It could be old -> MIGHT want hyphen?

    // Actually, to be safe and strictly follow the user's example for Mercosul:
    // I will try not to force the hyphen if it's Mercosul.

    // Let's implement a formatter that handles both but prioritizes the user's request details.

    // If length <= 3: just letters
    // 4th must be number

    value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Mercosul format: LLLNLNN (7 chars)
    // Old format: LLLNNNN (7 chars) - usually formatted as LLL-NNNN

    // Strategy: If it matches Mercosul pattern, return as is.
    // If it matches Old pattern, adds hyphen? 
    // The user complained about the format being WRONG and gave a Mercosul example.
    // Likely the previous mask forced a hyphen where it shouldn't.

    // Let's iterate:
    // 1. Limit to 7 chars.
    // 2. If it's the old format (LLLNNNN), maybe we return LLL-NNNN (8 chars).
    // 3. If it's Mercosul (LLLNLNN), we return LLLNLNN (7 chars).

    if (value.length > 7) value = value.slice(0, 7);

    // Regex for Mercosul pattern (partial or full)
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(value);
    const isMercosulPartial = /^[A-Z]{3}[0-9][A-Z]/.test(value);

    if (isMercosul || isMercosulPartial) {
        return value; // Return plain: BRA2E19
    }

    // If it's strictly old format 3 letters + numbers...
    if (/^[A-Z]{3}[0-9]+$/.test(value)) {
        // It could be the start of Mercosul (AAA1...) or Old (AAA1...)
        // We can't distinguish until the 5th character.
        // If length is 4 (AAA1), we don't know yet.

        // If length >= 5 and 5th char is a NUMBER, it's OLD format (usually). add hyphen.
        if (value.length >= 5) {
            const fifthChar = value[4];
            if (/[0-9]/.test(fifthChar)) {
                // Old format detected: AAA12... -> AAA-12...
                return value.replace(/^([A-Z]{3})(\d+)/, '$1-$2');
            }
        }
    }

    // Default fallback (just uppercase, no hyphen if not sure)
    return value;
};

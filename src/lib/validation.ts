/**
 * Limite de tamanho para campos de imagem em base64 (data URI). O cliente
 * (web e mobile) já recusa arquivos acima desses limites antes do upload,
 * mas isso nunca era validado no servidor — um cliente alterado ou uma
 * chamada direta à API podia mandar um payload arbitrariamente grande e
 * inflar o banco sem limite nenhum.
 *
 * Base64 infla o tamanho original em ~4/3; o cálculo abaixo é sobre o
 * tamanho da própria string (incluindo o prefixo `data:image/...;base64,`),
 * então o limite de bytes reais do arquivo é um pouco menor que o valor
 * passado — o suficiente para o propósito de conter abuso, não uma métrica
 * exata de bytes decodificados.
 */
export function checkImageSize(
    value: string | undefined | null,
    maxBytes: number,
    fieldLabel: string,
): { valid: true } | { valid: false; message: string } {
    if (!value) return { valid: true };

    if (value.length > maxBytes) {
        const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
        return { valid: false, message: `${fieldLabel} excede o tamanho máximo permitido (${maxMb}MB).` };
    }
    return { valid: true };
}

export const IMAGE_SIZE_LIMITS = {
    /** Foto de perfil, logo e banner da loja — mesmo limite já aplicado no client web. */
    PROFILE_IMAGE_MAX_BYTES: 2 * 1024 * 1024,
    /** Foto de pet e imagem de produto — mesmo limite já aplicado no client web/mobile. */
    ITEM_IMAGE_MAX_BYTES: 1024 * 1024,
};

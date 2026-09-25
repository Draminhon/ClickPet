"use client";

interface PrintAndAnimationStylesProps {
    /** CSS class prefix used for the responsive table/toolbar selectors (e.g. "orders" or "receipts") */
    tablePrefix: string;
    /** Extra selectors (besides `aside` and `.no-print`) that should be hidden when printing */
    printHideSelectors?: string[];
    /** Includes the `.spin-animation` / `@keyframes spin` rules (used by the "Enviando PIX..." indicator) */
    includeSpinAnimation?: boolean;
    /** Includes the `.{prefix}-search-input-wrapper` mobile rule */
    includeSearchInputWrapper?: boolean;
}

// Estilos compartilhados entre as páginas de Pedidos e Comprovantes do parceiro:
// animações de entrada dos modais/drawers, o layout de impressão do comprovante
// e o layout responsivo (mobile) da tabela/toolbar de cada página.
export default function PrintAndAnimationStyles({
    tablePrefix,
    printHideSelectors = [],
    includeSpinAnimation = false,
    includeSearchInputWrapper = false,
}: PrintAndAnimationStylesProps) {
    const printHideList = ['aside', '.no-print', ...printHideSelectors].join(',\n                    ');

    return (
        <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                ${includeSpinAnimation ? `
                .spin-animation {
                    animation: spin 1.5s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                ` : ''}

                @media print {
                    ${printHideList} {
                        display: none !important;
                    }
                    body, html {
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    main {
                        margin-left: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        overflow: visible !important;
                    }
                    .clickpet-modal-overlay-print {
                        position: static !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        backdrop-filter: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        overflow: visible !important;
                    }
                    .clickpet-modal-content-print {
                        max-width: 100% !important;
                        max-height: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        transform: none !important;
                        animation: none !important;
                        background: white !important;
                        overflow: visible !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }

                @media (max-width: 768px) {
                    .${tablePrefix}-toolbar {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 0.75rem !important;
                    }
                    .${tablePrefix}-tabs-container {
                        width: 100% !important;
                    }
                    .${tablePrefix}-search-container {
                        width: 100% !important;
                    }
                    ${includeSearchInputWrapper ? `
                    .${tablePrefix}-search-input-wrapper {
                        flex: 1 !important;
                        width: auto !important;
                    }
                    ` : ''}
                    .${tablePrefix}-table-container {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                    }
                    .${tablePrefix}-table,
                    .${tablePrefix}-table tbody,
                    .${tablePrefix}-table-row,
                    .${tablePrefix}-table-cell {
                        display: block !important;
                        width: 100% !important;
                    }
                    .${tablePrefix}-table-header {
                        display: none !important;
                    }
                    .${tablePrefix}-table-row {
                        background: #F9FBFD !important;
                        border: 1px solid rgba(209, 217, 226, 1) !important;
                        border-radius: 12px !important;
                        padding: 1rem !important;
                        margin-bottom: 1rem !important;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.02) !important;
                        text-align: left !important;
                    }
                    .${tablePrefix}-table-cell {
                        display: flex !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                        padding: 10px 0 !important;
                        border-bottom: 1px dashed rgba(209, 217, 226, 0.4) !important;
                        text-align: right !important;
                        font-size: 14px !important;
                    }
                    .${tablePrefix}-table-cell:last-child {
                        border-bottom: none !important;
                    }
                    .${tablePrefix}-table-cell::before {
                        content: attr(data-label) !important;
                        font-weight: 700 !important;
                        color: #757575 !important;
                        text-transform: uppercase !important;
                        font-size: 11px !important;
                        text-align: left !important;
                        margin-right: 16px !important;
                    }
                    .${tablePrefix}-table-cell:first-child {
                        border-bottom: 1px solid rgba(209, 217, 226, 1) !important;
                        padding-bottom: 12px !important;
                        margin-bottom: 8px !important;
                        justify-content: flex-start !important;
                        padding-top: 0 !important;
                    }
                    .${tablePrefix}-table-cell:first-child::before {
                        display: none !important;
                    }
                }
            ` }} />
    );
}

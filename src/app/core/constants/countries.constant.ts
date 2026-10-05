export interface TaxRateOption {
    rate: number;
    labelKey: string;
}

export interface CountryConfig {
    code: string;
    nameKey: string;
    defaultName: string;
    flag: string;
    flagUrl: string;
    taxLabel: string;
    defaultRate: number;
    currency: string;
    currencySymbol: string;
    rates: TaxRateOption[];
}

export const COUNTRIES_CONFIG: CountryConfig[] = [
    {
        code: 'TR',
        nameKey: 'countries.turkey',
        defaultName: 'Türkiye',
        flag: '🇹🇷',
        flagUrl: 'https://flagcdn.com/w80/tr.png',
        taxLabel: 'KDV',
        defaultRate: 20,
        currency: 'TRY',
        currencySymbol: '₺',
        rates: [
            { rate: 20, labelKey: 'rate.standardVat' },
            { rate: 10, labelKey: 'rate.reducedFood' },
            { rate: 1, labelKey: 'rate.basicNeeds' },
            { rate: 0, labelKey: 'rate.exemptExport' }
        ]
    },
    {
        code: 'AE',
        nameKey: 'countries.dubai',
        defaultName: 'Dubai (BAE)',
        flag: '🇦🇪',
        flagUrl: 'https://flagcdn.com/w80/ae.png',
        taxLabel: 'VAT',
        defaultRate: 5,
        currency: 'AED',
        currencySymbol: 'AED',
        rates: [
            { rate: 5, labelKey: 'rate.standardVat' },
            { rate: 0, labelKey: 'rate.zeroExempt' }
        ]
    },
    {
        code: 'DE',
        nameKey: 'countries.germany',
        defaultName: 'Almanya',
        flag: '🇩🇪',
        flagUrl: 'https://flagcdn.com/w80/de.png',
        taxLabel: 'MwSt',
        defaultRate: 19,
        currency: 'EUR',
        currencySymbol: '€',
        rates: [
            { rate: 19, labelKey: 'rate.standard' },
            { rate: 7, labelKey: 'rate.reduced' },
            { rate: 0, labelKey: 'rate.exempt' }
        ]
    },
    {
        code: 'FR',
        nameKey: 'countries.france',
        defaultName: 'Fransa',
        flag: '🇫🇷',
        flagUrl: 'https://flagcdn.com/w80/fr.png',
        taxLabel: 'TVA',
        defaultRate: 20,
        currency: 'EUR',
        currencySymbol: '€',
        rates: [
            { rate: 20, labelKey: 'rate.standard' },
            { rate: 10, labelKey: 'rate.intermediate' },
            { rate: 5.5, labelKey: 'rate.reduced' },
            { rate: 2.1, labelKey: 'rate.special' },
            { rate: 0, labelKey: 'rate.exempt' }
        ]
    },
    {
        code: 'UK',
        nameKey: 'countries.uk',
        defaultName: 'Birleşik Krallık',
        flag: '🇬🇧',
        flagUrl: 'https://flagcdn.com/w80/gb.png',
        taxLabel: 'VAT',
        defaultRate: 20,
        currency: 'GBP',
        currencySymbol: '£',
        rates: [
            { rate: 20, labelKey: 'rate.standard' },
            { rate: 5, labelKey: 'rate.reduced' },
            { rate: 0, labelKey: 'rate.zeroExempt' }
        ]
    },
    {
        code: 'ES',
        nameKey: 'countries.spain',
        defaultName: 'İspanya',
        flag: '🇪🇸',
        flagUrl: 'https://flagcdn.com/w80/es.png',
        taxLabel: 'IVA',
        defaultRate: 21,
        currency: 'EUR',
        currencySymbol: '€',
        rates: [
            { rate: 21, labelKey: 'rate.standard' },
            { rate: 10, labelKey: 'rate.reduced' },
            { rate: 4, labelKey: 'rate.superReduced' },
            { rate: 0, labelKey: 'rate.exempt' }
        ]
    },
    {
        code: 'IT',
        nameKey: 'countries.italy',
        defaultName: 'İtalya',
        flag: '🇮🇹',
        flagUrl: 'https://flagcdn.com/w80/it.png',
        taxLabel: 'IVA',
        defaultRate: 22,
        currency: 'EUR',
        currencySymbol: '€',
        rates: [
            { rate: 22, labelKey: 'rate.standard' },
            { rate: 10, labelKey: 'rate.reduced' },
            { rate: 5, labelKey: 'rate.special' },
            { rate: 4, labelKey: 'rate.minimum' },
            { rate: 0, labelKey: 'rate.exempt' }
        ]
    },
    {
        code: 'NL',
        nameKey: 'countries.netherlands',
        defaultName: 'Hollanda',
        flag: '🇳🇱',
        flagUrl: 'https://flagcdn.com/w80/nl.png',
        taxLabel: 'BTW',
        defaultRate: 21,
        currency: 'EUR',
        currencySymbol: '€',
        rates: [
            { rate: 21, labelKey: 'rate.standard' },
            { rate: 9, labelKey: 'rate.reduced' },
            { rate: 0, labelKey: 'rate.exempt' }
        ]
    },
    {
        code: 'CA',
        nameKey: 'countries.canada',
        defaultName: 'Kanada',
        flag: '🇨🇦',
        flagUrl: 'https://flagcdn.com/w80/ca.png',
        taxLabel: 'GST/HST',
        defaultRate: 5,
        currency: 'CAD',
        currencySymbol: 'CA$',
        rates: [
            { rate: 5, labelKey: 'rate.federalGst' },
            { rate: 0, labelKey: 'rate.zeroExempt' }
        ]
    },
    {
        code: 'US',
        nameKey: 'countries.usa',
        defaultName: 'ABD',
        flag: '🇺🇸',
        flagUrl: 'https://flagcdn.com/w80/us.png',
        taxLabel: 'Sales Tax',
        defaultRate: 0,
        currency: 'USD',
        currencySymbol: '$',
        rates: [
            { rate: 0, labelKey: 'rate.exempt' },
            { rate: 5, labelKey: 'rate.stateAvg' },
            { rate: 6, labelKey: 'rate.stateAvg' },
            { rate: 7, labelKey: 'rate.stateAvg' },
            { rate: 8.875, labelKey: 'rate.nyc' }
        ]
    },
    {
        code: 'AU',
        nameKey: 'countries.australia',
        defaultName: 'Avustralya',
        flag: '🇦🇺',
        flagUrl: 'https://flagcdn.com/w80/au.png',
        taxLabel: 'GST',
        defaultRate: 10,
        currency: 'AUD',
        currencySymbol: 'A$',
        rates: [
            { rate: 10, labelKey: 'rate.standardGst' },
            { rate: 0, labelKey: 'rate.exempt' }
        ]
    }
];

export const COUNTRY_MAP: { [code: string]: CountryConfig } = COUNTRIES_CONFIG.reduce((acc, curr) => {
    acc[curr.code] = curr;
    return acc;
}, {} as { [code: string]: CountryConfig });

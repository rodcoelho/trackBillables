export const PRICING = {
  monthly: {
    price: 15,
    label: '$15',
    interval: 'month' as const,
    description: 'Billed monthly',
  },
  annual: {
    price: 144,
    label: '$144',
    interval: 'year' as const,
    perMonth: '$12',
    savings: '20%',
    description: 'Billed annually',
  },
};

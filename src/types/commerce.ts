export interface PrintOrder {
    id: string;
    userId: string;
    productType: 'hardcover_book' | 'video_book';
    status: 'draft' | 'paid' | 'printing' | 'shipped';
    assets: {
        selectedIds: string[]; // Image/Video IDs from ImageRecord
        coverImageId?: string;
        title?: string;
    };
    shipping: {
        name: string;
        address: string;
        city: string;
        zip: string;
        country: string;
    };
    totalAmount: number;
    createdAt: string;
}

export interface BookProduct {
    id: 'hardcover' | 'videobook';
    name: string;
    description: string;
    price: number;
    features: string[];
    minPages?: number;
    maxPages?: number;
}

export const MAGIC_PRODUCTS: BookProduct[] = [
    {
        id: 'hardcover',
        name: 'Magic Storybook',
        description: 'Your masterpieces in a real hardcover book.',
        price: 29.99,
        features: ['Hardcover (~8x11")', 'Premium Glossy Paper', '20-40 Pages', 'Free Digital Copy'],
        minPages: 20,
        maxPages: 40
    },
    {
        id: 'videobook',
        name: 'Magic Cinema Book',
        description: 'A physical book with a screen inside!',
        price: 69.99,
        features: ['7-inch HD Screen', 'Plays your Magic Cinema videos', 'Rechargeable Battery', 'Keepsake Box'],
        minPages: 1
    }
];

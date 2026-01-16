
export interface ContentMatch {
    id: string;
    title: string;
    type: 'Movie' | 'Story' | 'Cartoon' | 'Book';
    reason: string;
    keywords: string[];
    thumbnailUrl: string;
    description: string;
    externalLink?: string; // YouTube or other
}

const MOCK_CONTENT_DB: ContentMatch[] = [
    {
        id: 'mermaid_movie',
        title: 'The Little Mermaid',
        type: 'Movie',
        reason: 'Matches mermaid tail and underwater theme',
        keywords: ['mermaid', 'tail', 'ocean', 'under water', 'sea', 'swim', 'fish', 'ariel', 'princess'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1630140226315-77cefb382f9d?q=80&w=400',
        description: 'A mermaid princess makes a bargain to become human.',
        externalLink: 'https://www.youtube.com/watch?v=ZGZX5-PAwR8'
    },
    {
        id: 'tangled_movie',
        title: 'Tangled',
        type: 'Movie',
        reason: 'Matches long braid and tower theme',
        keywords: ['long hair', 'golden hair', 'braid', 'hair', 'tower', 'princess', 'lanterns', 'blonde'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1598454448512-eb2636a6e5a4?q=80&w=400',
        description: 'A princess with magical long hair dreams of leaving her tower.',
        externalLink: 'https://www.youtube.com/watch?v=JpKnr-VtkGw'
    },
    {
        id: 'frozen_movie',
        title: 'Frozen',
        type: 'Movie',
        reason: 'Matches winter theme or royal dress',
        keywords: ['ice', 'snow', 'winter', 'sister', 'snowman', 'elsa', 'anna', 'dress', 'queen', 'blue dress'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1622353163753-4dc5f392237d?q=80&w=400',
        description: 'Two sisters save their kingdom from eternal winter.',
        externalLink: 'https://www.youtube.com/watch?v=TbQm5doF_40'
    },
    {
        id: 'cinderella_story',
        title: 'Cinderella',
        type: 'Story',
        reason: 'Matches royal gown or magic',
        keywords: ['glass slipper', 'pumpkin', 'carriage', 'clock', 'midnight', 'princess', 'dress', 'ball gown', 'blue dress'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1518331483807-f6d6e1b07244?q=80&w=400',
        description: 'A magical transformation at midnight.',
        externalLink: 'https://www.youtube.com/watch?v=20DF6U1HcGQ'
    },
    {
        id: 'pets_movie',
        title: 'Secret Life of Pets',
        type: 'Movie',
        reason: 'Matches cute animals',
        keywords: ['dog', 'cat', 'pet', 'animal', 'puppy', 'kitten', 'bunny', 'leash', 'cute dog'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400',
        description: 'What do your pets do when you\'re not home?',
        externalLink: 'https://www.youtube.com/watch?v=i-80SGWfEjM'
    },
    {
        id: 'cars_movie',
        title: 'Cars',
        type: 'Movie',
        reason: 'Matches vehicles and racing',
        keywords: ['car', 'race', 'speed', 'vehicle', 'mcqueen', 'wheel', 'red car', 'truck'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1541895104-5543e95b3bdf?q=80&w=400',
        description: 'Lightning McQueen races to the finish line!',
        externalLink: 'https://www.youtube.com/watch?v=SbXIj2T-_uk'
    },
    {
        id: 'spiderman',
        title: 'Spider-Man',
        type: 'Movie',
        reason: 'Matches superhero action',
        keywords: ['spider', 'hero', 'mask', 'web', 'city', 'red', 'blue', 'action', 'suit'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1604200213928-ba3cf4fa8ef2?q=80&w=400',
        description: 'Your friendly neighborhood superhero!',
        externalLink: 'https://www.youtube.com/watch?v=trQ75Ff08Uo'
    },
    {
        id: 'moana',
        title: 'Moana',
        type: 'Movie',
        reason: 'Matches ocean and adventure',
        keywords: ['ocean', 'sea', 'boat', 'island', 'water', 'adventure', 'girl', 'hero', 'wave'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1652156689729-236b3c959432?q=80&w=400',
        description: 'An epic journey across the ocean.',
        externalLink: 'https://www.youtube.com/watch?v=LKFuXETZUsI'
    },
    {
        id: 'wizard_oz',
        title: 'The Wizard of Oz',
        type: 'Movie',
        reason: 'Matches magical journey',
        keywords: ['wizard', 'witch', 'magic', 'road', 'shoes', 'red shoes', 'lion', 'tin man', 'scarecrow'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400',
        description: 'Follow the yellow brick road!',
        externalLink: 'https://www.youtube.com/watch?v=H_3T4DGw10U'
    },
    {
        id: 'pokemon_show',
        title: 'Pokémon',
        type: 'Cartoon',
        reason: 'Matches creatures and adventure',
        keywords: ['pokemon', 'pikachu', 'creature', 'monster', 'battle', 'ash', 'anime', 'cat', 'dog', 'animal'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?q=80&w=400',
        description: 'Gotta catch \'em all! Join Ash and Pikachu.',
        externalLink: 'https://www.youtube.com/watch?v=D_Yt4d24Glw'
    },
    {
        id: 'totoro_movie',
        title: 'My Neighbor Totoro',
        type: 'Movie',
        reason: 'Matches whimsical creatures and nature',
        keywords: ['totoro', 'catbus', 'forest', 'spirit', 'anime', 'ghibli', 'cat', 'magic', 'creature', 'cute'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1629813959957-c5806e22c9a9?q=80&w=400',
        description: 'Two sisters meet a friendly forest spirit.',
        externalLink: 'https://www.youtube.com/watch?v=92a7Hj0ijLs'
    }
];

export class ContentService {
    /**
     * Finds content that matches the given keywords using a scoring system
     */
    async findMatchingContent(keywords: string[]): Promise<ContentMatch[]> {
        // Normalize search keywords
        const normalizedSearch = keywords.map(k => k.toLowerCase().trim());

        // Score each item
        const scoredMatches = MOCK_CONTENT_DB.map(item => {
            let score = 0;
            const matchedKeywords: string[] = [];

            item.keywords.forEach(k => {
                const itemKw = k.toLowerCase();
                // Check against all search keywords
                normalizedSearch.forEach(searchKw => {
                    // Exact match gets higher score
                    if (itemKw === searchKw) {
                        score += 2;
                        matchedKeywords.push(k);
                    }
                    // Partial match gets lower score (e.g. "dog" matches "dogs")
                    else if (itemKw.includes(searchKw) || searchKw.includes(itemKw)) {
                        score += 1;
                        matchedKeywords.push(k);
                    }
                });
            });

            return { item, score, matchedKeywords };
        });

        // Filter valid matches and sort by score (Desc)
        const validMatches = scoredMatches
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(m => m.item);

        // If matches found, return unique top 3
        if (validMatches.length > 0) {
            // Deduplicate by ID just in case
            const unique = Array.from(new Set(validMatches.map(i => i.id)))
                .map(id => validMatches.find(i => i.id === id)!);
            return unique.slice(0, 3);
        }

        // FALLBACK: If ABSOLUTELY no matches, return "Magic Suggestions" (Random 2)
        const shuffled = [...MOCK_CONTENT_DB].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2).map(item => ({
            ...item,
            reason: `Based on your unique style!`
        }));
    }

    /**
     * Get a random selection for "Discovery"
     */
    async getRandomDiscovery(): Promise<ContentMatch[]> {
        return MOCK_CONTENT_DB.slice(0, 2);
    }
}

export const contentService = new ContentService();

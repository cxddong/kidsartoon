export interface Masterpiece {
    id: string;
    artist: string;
    title: string;
    tags: string[];
    imagePath: string;
    kidFriendlyFact: string;
    biography?: string;
}

export const MASTERPIECES: Masterpiece[] = [
    {
        id: "van_gogh_starry",
        artist: "Vincent van Gogh",
        title: "The Starry Night",
        tags: ["blue", "swirls", "night", "stars", "yellow", "sky", "moon"],
        imagePath: "/assets/masterpieces/van_gogh_starry.jpg",
        kidFriendlyFact: "He loved painting the wind and stars like magic swirls!",
        biography: "Vincent van Gogh (1853-1890) was a Dutch artist famous for his bold, swirling brushstrokes and vibrant colors. He painted over 2,000 artworks in just 10 years! He loved nature and often painted outdoors, capturing the beauty of sunflowers, starry nights, and wheat fields."
    },
    {
        id: "monet_waterlily",
        artist: "Claude Monet",
        title: "Water Lilies",
        tags: ["water", "flowers", "green", "pink", "blur", "garden", "peaceful"],
        imagePath: "/assets/masterpieces/monet_waterlily.jpg",
        kidFriendlyFact: "He painted the same garden hundreds of times!",
        biography: "Claude Monet (1840-1926) was a French painter who founded Impressionism. He loved painting nature and light! He had a beautiful garden with a pond full of water lilies that he painted over 250 times. His paintings look soft and dreamy, like looking through a magical mist."
    },
    {
        id: "matisse_snail",
        artist: "Henri Matisse",
        title: "The Snail",
        tags: ["shapes", "colors", "abstract", "collage", "square", "colorful"],
        imagePath: "/assets/masterpieces/matisse_snail.jpg",
        kidFriendlyFact: "He 'painted' with scissors by cutting colorful paper!",
        biography: "Henri Matisse (1869-1954) was a French artist who loved bright, happy colors! When he got older and couldn't paint with a brush anymore, he invented a new way to make art - by cutting colored paper with scissors and arranging them in beautiful patterns. He called it 'painting with scissors!'"
    },
    {
        id: "picasso_musicians",
        artist: "Pablo Picasso",
        title: "Three Musicians",
        tags: ["geometric", "cubism", "funny", "music", "people", "shapes"],
        imagePath: "/assets/masterpieces/picasso_musicians.jpg",
        kidFriendlyFact: "He drew people using blocks and triangles!",
        biography: "Pablo Picasso (1881-1973) was a Spanish artist who created over 50,000 artworks! He invented a style called Cubism where he drew people and objects using geometric shapes like squares, triangles, and circles. He believed you could see all sides of something at once!"
    },
    {
        id: "kandinsky_circles",
        artist: "Wassily Kandinsky",
        title: "Squares with Concentric Circles",
        tags: ["circles", "colors", "rings", "abstract", "patterns"],
        imagePath: "/assets/masterpieces/kandinsky_circles.jpg",
        kidFriendlyFact: "He thought colors could make music!",
        biography: "Wassily Kandinsky (1866-1944) was a Russian artist who believed colors had sounds! He thought yellow sounded like a trumpet and blue like a cello. He created abstract art with colorful shapes and circles, trying to paint music and feelings instead of real things."
    },
    {
        id: "mondrian_composition",
        artist: "Piet Mondrian",
        title: "Composition with Red, Blue and Yellow",
        tags: ["lines", "squares", "red", "blue", "yellow", "grid", "simple"],
        imagePath: "/assets/masterpieces/mondrian_composition.jpg",
        kidFriendlyFact: "He only used straight lines and 3 colors!",
        biography: "Piet Mondrian (1872-1944) was a Dutch artist who loved simplicity! He created beautiful art using only black lines, white backgrounds, and three primary colors: red, blue, and yellow. He believed this simple style could show perfect harmony and balance."
    },
    {
        id: "pollock_no1",
        artist: "Jackson Pollock",
        title: "Number 1A",
        tags: ["splatter", "messy", "drip", "energy", "abstract", "movement"],
        imagePath: "/assets/masterpieces/pollock_no1.jpg",
        kidFriendlyFact: "He dripped and splashed paint on the floor!",
        biography: "Jackson Pollock (1912-1956) was an American artist famous for his 'drip paintings.' He laid huge canvases on the floor and walked around them, dripping, pouring, and flinging paint! He called it 'action painting' because his whole body moved like a dance while creating art."
    },
    {
        id: "miro_sun",
        artist: "Joan Miró",
        title: "The Sun",
        tags: ["sun", "bright", "simple", "happy", "colorful", "playful"],
        imagePath: "/assets/masterpieces/miro_sun.jpg",
        kidFriendlyFact: "He painted like a happy kid playing!",
        biography: "Joan Miró (1893-1983) was a Spanish artist who kept the playful spirit of childhood in his art! He used simple shapes, bright colors, and magical symbols like stars, moons, and birds. His paintings look joyful and dreamlike, full of wonder and imagination."
    },
    {
        id: "klimt_tree",
        artist: "Gustav Klimt",
        title: "The Tree of Life",
        tags: ["gold", "swirls", "tree", "decorative", "patterns"],
        imagePath: "/assets/masterpieces/klimt_tree.jpg",
        kidFriendlyFact: "He used real gold in his paintings!",
        biography: "Gustav Klimt (1862-1918) was an Austrian artist who loved decorative patterns and REAL GOLD! He created shimmering, magical paintings by mixing gold leaf with his paints. His artworks look like precious treasures with swirling patterns and beautiful designs."
    },
    {
        id: "hokusai_wave",
        artist: "Katsushika Hokusai",
        title: "The Great Wave",
        tags: ["wave", "blue", "water", "ocean", "mountain", "japan"],
        imagePath: "/assets/masterpieces/hokusai_wave.jpg",
        kidFriendlyFact: "This wave is more famous than most movie stars!",
        biography: "Katsushika Hokusai (1760-1849) was a Japanese artist who created one of the world's most famous images: The Great Wave! He made beautiful woodblock prints showing Japanese landscapes and nature. He was so dedicated that he created over 30,000 artworks in his lifetime!"
    },
    {
        id: "warhol_soup",
        artist: "Andy Warhol",
        title: "Campbell's Soup Cans",
        tags: ["pop art", "repeat", "food", "colorful", "simple", "fun"],
        imagePath: "/assets/masterpieces/warhol_soup.jpg",
        kidFriendlyFact: "He made everyday things like soup cans into art!",
        biography: "Andy Warhol (1928-1987) was an American artist who turned ordinary everyday objects into famous art! He painted soup cans, soda bottles, and celebrities using bright colors and repeated patterns. He showed that art could be about the fun, colorful things we see every day."
    },
    {
        id: "rousseau_jungle",
        artist: "Henri Rousseau",
        title: "Tiger in a Tropical Storm",
        tags: ["jungle", "animals", "green", "plants", "tiger", "nature"],
        imagePath: "/assets/masterpieces/rousseau_jungle.jpg",
        kidFriendlyFact: "He never saw a real jungle but painted it from his dreams!",
        biography: "Henri Rousseau (1844-1910) was a French artist who painted magical jungle scenes even though he never left France! He visited botanical gardens and zoos, then used his imagination to create lush, dreamlike jungles full of exotic plants and wild animals. He taught himself to paint!"
    },
    {
        id: "chagall_village",
        artist: "Marc Chagall",
        title: "I and the Village",
        tags: ["dreamy", "floating", "animals", "colorful", "fantasy"],
        imagePath: "/assets/masterpieces/chagall_village.jpg",
        kidFriendlyFact: "His paintings are like colorful dreams!",
        biography: "Marc Chagall (1887-1985) was a Russian-French artist who painted magical, dreamlike scenes! In his paintings, people and animals float in the sky, love fills the air, and memories mix with imagination. His art is full of bright colors and represents the beauty of dreams and memories."
    },
    {
        id: "dali_clocks",
        artist: "Salvador Dalí",
        title: "The Persistence of Memory",
        tags: ["melting", "weird", "clocks", "surreal", "desert"],
        imagePath: "/assets/masterpieces/dali_clocks.jpg",
        kidFriendlyFact: "He painted clocks that melt like cheese!",
        biography: "Salvador Dalí (1904-1989) was a Spanish artist famous for painting weird, dreamlike scenes! He created 'Surrealist' art where impossible things happen - like melting clocks! He had a wild imagination and a funny mustache. He believed dreams and imagination were as important as reality."
    },
    {
        id: "seurat_sunday",
        artist: "Georges Seurat",
        title: "A Sunday Afternoon",
        tags: ["dots", "park", "people", "pointillism", "colorful"],
        imagePath: "/assets/masterpieces/seurat_sunday.jpg",
        kidFriendlyFact: "He made pictures using only tiny dots of color!",
        biography: "Georges Seurat (1859-1891) was a French artist who invented a technique called Pointillism! Instead of painting normal brush strokes, he made entire pictures using thousands of tiny colored dots. When you step back, the dots blend together to create beautiful scenes!"
    },
    {
        id: "klee_castle",
        artist: "Paul Klee",
        title: "Castle and Sun",
        tags: ["castle", "geometric", "simple", "colorful", "childlike"],
        imagePath: "/assets/masterpieces/klee_castle.jpg",
        kidFriendlyFact: "His paintings look like magical kid drawings!",
        biography: "Paul Klee (1879-1940) was a Swiss-German artist who created over 9,000 artworks! He loved using simple shapes, bright colors, and playful lines. His art often looks like magical children's drawings mixed with music - he was also a talented violinist!"
    },
    {
        id: "okeefe_flower",
        artist: "Georgia O'Keeffe",
        title: "Red Poppy",
        tags: ["flower", "red", "close-up", "big", "nature"],
        imagePath: "/assets/masterpieces/okeefe_flower.jpg",
        kidFriendlyFact: "She painted flowers SO BIG they fill the whole canvas!",
        biography: "Georgia O'Keeffe (1887-1986) was an American artist called the 'Mother of American Modernism!' She painted enormous, close-up views of flowers, making tiny petals look huge and magical. She also loved painting the deserts and mountains of New Mexico where she lived."
    },
    {
        id: "magritte_pipe",
        artist: "René Magritte",
        title: "The Treachery of Images",
        tags: ["pipe", "words", "mysterious", "simple", "thinking"],
        imagePath: "/assets/masterpieces/magritte_pipe.jpg",
        kidFriendlyFact: "He painted a pipe and wrote 'This is not a pipe'!",
        biography: "René Magritte (1898-1967) was a Belgian artist who made people think about reality! He painted realistic objects in strange, impossible situations. His famous pipe painting with words 'This is not a pipe' makes you think: you can't actually smoke a picture of a pipe!"
    },
    {
        id: "rothko_orange",
        artist: "Mark Rothko",
        title: "Orange and Yellow",
        tags: ["blocks", "colors", "simple", "calm", "abstract"],
        imagePath: "/assets/masterpieces/rothko_orange.jpg",
        kidFriendlyFact: "He painted huge blocks of color that make you feel emotions!",
        biography: "Mark Rothko (1903-1970) was an American artist who believed colors could make people feel deep emotions! He painted huge canvases with soft, glowing blocks of color. He wanted people to stand close to his paintings and feel peace, joy, sadness, or wonder from the colors alone."
    },
    {
        id: "haring_figures",
        artist: "Keith Haring",
        title: "Dancing Figures",
        tags: ["people", "dancing", "black", "white", "movement", "fun"],
        imagePath: "/assets/masterpieces/haring_figures.jpg",
        kidFriendlyFact: "He drew simple stick figures full of energy and dance!",
        biography: "Keith Haring (1958-1990) was an American artist known for his bold, simple figures full of energy! He started by drawing in New York City subways with chalk. His art features dancing people, barking dogs, and radiating hearts - all bursting with movement and joy!"
    }
];

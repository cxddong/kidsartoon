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
    },
    {
        id: "kahlo_thorns",
        artist: "Frida Kahlo",
        title: "Self-Portrait with Thorn Necklace and Hummingbird",
        tags: ["portrait", "bright", "flowers", "self-portrait", "colorful", "mexican", "nature"],
        imagePath: "/assets/masterpieces/kahlo_thorns.jpg",
        kidFriendlyFact: "She painted herself 55 times with flowers and animals!",
        biography: "Frida Kahlo (1907-1954) was a Mexican artist famous for her colorful self-portraits! She loved wearing flowers in her hair and traditional Mexican clothing. She painted her feelings, her dreams, and her life experiences with bright, bold colors inspired by Mexican folk art."
    },
    {
        id: "basquiat_untitled",
        artist: "Jean-Michel Basquiat",
        title: "Untitled",
        tags: ["graffiti", "bold", "street art", "expressive", "colorful", "text", "crowns"],
        imagePath: "/assets/masterpieces/basquiat_untitled.jpg",
        kidFriendlyFact: "He started as a street artist and became world-famous!",
        biography: "Jean-Michel Basquiat (1960-1988) was an American artist who started creating graffiti art on the streets of New York! His paintings are full of bold colors, words, symbols, and crowns. He mixed street art with fine art, creating a unique style that expressed his thoughts about the world."
    },
    {
        id: "kusama_dots",
        artist: "Yayoi Kusama",
        title: "Infinity Dots",
        tags: ["dots", "patterns", "repetitive", "colorful", "polka dots", "abstract"],
        imagePath: "/assets/masterpieces/kusama_dots.jpg",
        kidFriendlyFact: "She covers entire rooms with colorful polka dots!",
        biography: "Yayoi Kusama (born 1929) is a Japanese artist obsessed with polka dots! She creates entire rooms, pumpkins, and paintings covered in endless dots. She calls them 'infinity nets.' She also creates magical mirror rooms that make you feel like you're floating in space with lights!"
    },
    {
        id: "caravaggio_matthew",
        artist: "Caravaggio",
        title: "The Calling of Saint Matthew",
        tags: ["dramatic", "light", "shadow", "realistic", "dark", "baroque"],
        imagePath: "/assets/masterpieces/caravaggio_matthew.jpg",
        kidFriendlyFact: "He used dramatic spotlights in his paintings like theater!",
        biography: "Caravaggio (1571-1610) was an Italian master who revolutionized painting! He used a technique called 'chiaroscuro' - dramatic contrasts between light and dark. His paintings look like theatrical scenes with a spotlight shining on the important parts, making them super dramatic!"
    },
    {
        id: "vermeer_pearl",
        artist: "Johannes Vermeer",
        title: "Girl with a Pearl Earring",
        tags: ["soft", "portrait", "blue", "yellow", "delicate", "realistic", "quiet"],
        imagePath: "/assets/masterpieces/vermeer_pearl.jpg",
        kidFriendlyFact: "He painted light so realistically it looks like a photograph!",
        biography: "Johannes Vermeer (1632-1675) was a Dutch painter who captured light like magic! He painted quiet, peaceful scenes of everyday life with soft, glowing light. His paintings are so realistic and detailed that they look almost like photographs, even though cameras didn't exist yet!"
    },
    {
        id: "turner_temeraire",
        artist: "J.M.W. Turner",
        title: "The Fighting Temeraire",
        tags: ["sunset", "ships", "atmospheric", "orange", "water", "romantic", "sky"],
        imagePath: "/assets/masterpieces/turner_temeraire.jpg",
        kidFriendlyFact: "He loved painting storms, sunsets, and the power of nature!",
        biography: "J.M.W. Turner (1775-1851) was an English painter known as the 'painter of light!' He created breathtaking landscapes with glowing sunsets, dramatic storms, and misty atmospheres. His paintings of the sea and sky look like they're made of pure light and color!"
    },
    {
        id: "botticelli_venus",
        artist: "Sandro Botticelli",
        title: "The Birth of Venus",
        tags: ["classical", "beautiful", "flowing", "renaissance", "mythological", "soft"],
        imagePath: "/assets/masterpieces/botticelli_venus.jpg",
        kidFriendlyFact: "He painted a goddess floating on a giant seashell!",
        biography: "Sandro Botticelli (1445-1510) was an Italian Renaissance painter who created graceful, flowing artworks! His paintings look like beautiful dreams with soft colors and elegant figures. He loved painting mythological stories and made them look magical and otherworldly."
    },
    {
        id: "rembrandt_nightwatch",
        artist: "Rembrandt van Rijn",
        title: "The Night Watch",
        tags: ["group", "dark", "dramatic", "detailed", "realistic", "dutch", "golden"],
        imagePath: "/assets/masterpieces/rembrandt_nightwatch.jpg",
        kidFriendlyFact: "He was a master of painting with light and shadow!",
        biography: "Rembrandt van Rijn (1606-1669) was a Dutch master painter famous for his dramatic use of light! He painted detailed portraits and group scenes where light seems to glow from within. He was also an incredible storyteller, making every painting feel alive with emotion and drama."
    },
    {
        id: "whistler_mother",
        artist: "James McNeill Whistler",
        title: "Arrangement in Grey and Black",
        tags: ["simple", "portrait", "elegant", "minimal", "calm", "monochrome"],
        imagePath: "/assets/masterpieces/whistler_mother.jpg",
        kidFriendlyFact: "He believed art should be like music - beautiful arrangements of color!",
        biography: "James McNeill Whistler (1834-1903) was an American artist who believed paintings were like music! He gave his paintings musical titles like 'Symphony' and 'Arrangement.' He loved simple, elegant compositions with harmonious colors, creating calm and beautiful scenes."
    },
    {
        id: "degas_dancers",
        artist: "Edgar Degas",
        title: "The Dance Class",
        tags: ["ballet", "movement", "dancers", "impressionist", "graceful", "pink", "blue"],
        imagePath: "/assets/masterpieces/degas_dancers.jpg",
        kidFriendlyFact: "He loved painting ballerinas practicing and dancing!",
        biography: "Edgar Degas (1834-1917) was a French artist who captured movement and grace! He painted over half of his artworks featuring ballet dancers. He showed them not just performing, but practicing, stretching, and resting - capturing the beauty of movement in every pose!"
    },
    {
        id: "banksy_balloon",
        artist: "Banksy",
        title: "Girl with Balloon",
        tags: ["street art", "simple", "stencil", "red", "black", "heart", "modern"],
        imagePath: "/assets/masterpieces/banksy_balloon.jpg",
        kidFriendlyFact: "This mysterious street artist's identity is still a secret!",
        biography: "Banksy is a mysterious street artist whose real name is unknown! Active since the 1990s, Banksy creates thought-provoking art on city walls using stencils. The art often features children, animals, and simple but powerful messages about peace, freedom, and kindness!"
    },
    {
        id: "hiroshige_rain",
        artist: "Utagawa Hiroshige",
        title: "Sudden Shower over Shin-Ōhashi Bridge",
        tags: ["rain", "japan", "woodblock", "lines", "blue", "atmospheric", "weather"],
        imagePath: "/assets/masterpieces/hiroshige_rain.jpg",
        kidFriendlyFact: "He showed rain as thousands of tiny vertical lines!",
        biography: "Utagawa Hiroshige (1797-1858) was a Japanese master of woodblock prints! He created beautiful landscapes showing Japan's seasons, weather, and famous places. He was amazing at depicting rain, snow, and mist - making you feel like you're really there!"
    },
    {
        id: "lichtenstein_whaam",
        artist: "Roy Lichtenstein",
        title: "Whaam!",
        tags: ["pop art", "comic", "dots", "bold", "action", "colorful", "fun"],
        imagePath: "/assets/masterpieces/lichtenstein_whaam.jpg",
        kidFriendlyFact: "He made paintings that look like giant comic book panels!",
        biography: "Roy Lichtenstein (1923-1997) was an American Pop Artist who turned comic book panels into huge paintings! He used Ben-Day dots (tiny colored dots like in printed comics) and bold outlines. His artwork celebrates everyday pop culture and makes it into fine art!"
    },
    {
        id: "arcimboldo_vegetables",
        artist: "Giuseppe Arcimboldo",
        title: "Vertumnus",
        tags: ["portrait", "fruits", "vegetables", "creative", "fun", "playful", "nature"],
        imagePath: "/assets/masterpieces/arcimboldo_vegetables.jpg",
        kidFriendlyFact: "He created portraits using only fruits and vegetables!",
        biography: "Giuseppe Arcimboldo (1526-1593) was an Italian painter famous for creating imaginative portrait heads made entirely from fruits, vegetables, flowers, fish, and books! Turn his paintings upside down and they transform - pure magical fun that makes you see things in new ways!"
    },
    {
        id: "escher_hands",
        artist: "M.C. Escher",
        title: "Drawing Hands",
        tags: ["impossible", "illusion", "detailed", "black and white", "mind-bending", "clever"],
        imagePath: "/assets/masterpieces/escher_hands.jpg",
        kidFriendlyFact: "He drew pictures of things that can't exist in real life!",
        biography: "M.C. Escher (1898-1972) was a Dutch artist who created impossible worlds! He drew staircases that go up forever, hands that draw themselves, and fish that turn into birds. His mathematical and perspective tricks make your brain say 'Wait, how is that possible?!'"
    },
    {
        id: "kahlo_roots",
        artist: "Frida Kahlo",
        title: "Roots",
        tags: ["surreal", "nature", "vines", "lying down", "green", "fantasy", "personal"],
        imagePath: "/assets/masterpieces/kahlo_roots.jpg",
        kidFriendlyFact: "She painted herself connected to the earth like a plant!",
        biography: "Frida Kahlo (1907-1954) expressed her emotions through surreal self-portraits! In 'Roots,' she shows herself becoming one with nature, with vines growing from her body. She used art to share her feelings, pain, and connection to Mexican culture and nature."
    },
    {
        id: "mucha_seasons",
        artist: "Alphonse Mucha",
        title: "The Seasons",
        tags: ["art nouveau", "decorative", "flowing", "beautiful", "elegant", "nature", "flowers"],
        imagePath: "/assets/masterpieces/mucha_seasons.jpg",
        kidFriendlyFact: "He made art that looks like it's made of flowing ribbons and flowers!",
        biography: "Alphonse Mucha (1860-1939) was a Czech artist who created the Art Nouveau style! His artwork features beautiful women surrounded by flowing hair, flowers, and decorative curves. Everything looks elegant and natural, like ornate jewelry come to life!"
    },
    {
        id: "morisot_cradle",
        artist: "Berthe Morisot",
        title: "The Cradle",
        tags: ["impressionist", "gentle", "mother", "soft", "domestic", "tender", "delicate"],
        imagePath: "/assets/masterpieces/morisot_cradle.jpg",
        kidFriendlyFact: "She was one of the first female Impressionist painters!",
        biography: "Berthe Morisot (1841-1895) was a French Impressionist painter who captured tender moments of everyday life! She painted with soft, loose brushstrokes showing mothers, children, gardens, and peaceful domestic scenes. She broke barriers as a leading female artist in the Impressionist movement!"
    },
    {
        id: "leyenaar_paper",
        artist: "Beatriz Milhazes",
        title: "Meu Limão",
        tags: ["colorful", "patterns", "bright", "abstract", "festive", "brazilian", "circles"],
        imagePath: "/assets/masterpieces/milhazes_limao.jpg",
        kidFriendlyFact: "She creates art inspired by Brazilian carnival and tropical colors!",
        biography: "Beatriz Milhazes (born 1960) is a Brazilian artist who creates explosively colorful abstract paintings! Her work is inspired by Brazilian culture, carnival decorations, and tropical nature. She layers bright colors and patterns in collages that feel like a celebration!"
    },
    {
        id: "hokusai_fuji",
        artist: "Katsushika Hokusai",
        title: "Red Fuji",
        tags: ["mountain", "red", "japan", "simple", "majestic", "landscape", "iconic"],
        imagePath: "/assets/masterpieces/hokusai_fuji.jpg",
        kidFriendlyFact: "He created 36 different views of the same mountain!",
        biography: "Katsushika Hokusai created a famous series called 'Thirty-six Views of Mount Fuji' showing Japan's sacred mountain in different seasons, weather, and times of day. 'Red Fuji' shows the mountain glowing red in morning light - a rare and magical sight!"
    },
    {
        id: "bruegel_babel",
        artist: "Pieter Bruegel",
        title: "The Tower of Babel",
        tags: ["detailed", "architectural", "fantasy", "medieval", "biblical", "grand", "complex"],
        imagePath: "/assets/masterpieces/bruegel_babel.jpg",
        kidFriendlyFact: "He painted a giant tower with thousands of tiny details!",
        biography: "Pieter Bruegel the Elder (1525-1569) was a Flemish painter famous for detailed landscapes full of tiny people and activities! His Tower of Babel shows an impossibly huge spiral building with hundreds of little workers. Look closely - every section has something new to discover!"
    },
    {
        id: "cassatt_bath",
        artist: "Mary Cassatt",
        title: "The Child's Bath",
        tags: ["impressionist", "mother", "child", "gentle", "intimate", "tender", "domestic"],
        imagePath: "/assets/masterpieces/cassatt_bath.jpg",
        kidFriendlyFact: "She specialized in painting the special bond between mothers and children!",
        biography: "Mary Cassatt (1844-1926) was an American Impressionist who painted beautiful scenes of mothers and children! She captured tender everyday moments with soft colors and gentle brushstrokes. She was one of only three women in the French Impressionist movement!"
    },
    {
        id: "okeefe_skull",
        artist: "Georgia O'Keeffe",
        title: "Cow's Skull with Calico Roses",
        tags: ["desert", "skull", "flowers", "contrast", "american", "southwestern", "bold"],
        imagePath: "/assets/masterpieces/okeefe_skull.jpg",
        kidFriendlyFact: "She combined desert bones with beautiful flowers!",
        biography: "Georgia O'Keeffe loved the desert landscape of New Mexico! She collected sun-bleached bones from the desert and painted them alongside colorful flowers, creating striking contrasts between life and the stark beauty of the desert. She found beauty in unexpected places!"
    },
    {
        id: "kandinsky_composition",
        artist: "Wassily Kandinsky",
        title: "Composition VIII",
        tags: ["geometric", "abstract", "shapes", "colorful", "dynamic", "musical", "playful"],
        imagePath: "/assets/masterpieces/kandinsky_composition.jpg",
        kidFriendlyFact: "He arranged shapes and colors like notes in a symphony!",
        biography: "In 'Composition VIII,' Kandinsky created a symphony of geometric shapes! Circles, triangles, and lines dance across the canvas in perfect harmony. He believed abstract art could express emotions and ideas better than realistic paintings - just like music does without words!"
    }
];

import type { Variants } from 'framer-motion';

/**
 * Scheme 1: The Jelly Pop (🌟 Highly Recommended for Generate Page)
 * Experience: Lively, Bouncy, Full of Energy
 */
export const jellyPopVariants: Variants = {
    initial: { scale: 0, opacity: 0 },
    animate: {
        scale: 1,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
        }
    },
    exit: { scale: 0, opacity: 0 }
};

export const jellyPopContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

/**
 * Scheme 2: The Magic Float (✨ Recommended for Home Page/Image Feed)
 * Experience: Elegant, Light, Magical
 */
export const magicFloatVariants: Variants = {
    initial: { y: 50, opacity: 0 },
    animate: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.6,
            ease: [0.6, -0.05, 0.01, 0.99]
        }
    }
};

/**
 * Scheme 3: 3D Storybook Flip (📖 Recommended for Magic Lab/Detail View)
 * Experience: Storytelling, 3D, like opening a book
 */
export const storybookFlipVariants: Variants = {
    initial: { rotateX: 90, opacity: 0 },
    animate: {
        rotateX: 0,
        opacity: 1,
        transition: {
            type: "spring",
            bounce: 0.4,
            duration: 0.8
        }
    }
};

/**
 * Scheme 4: The Slide & Skew (🚀 Recommended for Lists/Sidebars)
 * Experience: Fast, Modern, Sharp
 */
export const slideAndSkewVariants: Variants = {
    initial: { x: 100, opacity: 0, skewX: -10 },
    animate: {
        x: 0,
        opacity: 1,
        skewX: 0,
        transition: {
            type: "spring",
            stiffness: 200,
            damping: 25
        }
    }
};

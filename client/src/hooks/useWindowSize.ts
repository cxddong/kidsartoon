import { useState, useEffect } from 'react';

interface WindowSize {
    width: number | undefined;
    height: number | undefined;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
}

export function useWindowSize(): WindowSize {
    // Initialize with undefined to avoid hydration mismatch
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: undefined,
        height: undefined,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
    });

    useEffect(() => {
        // Handler to call on window resize
        function handleResize() {
            const width = window.innerWidth;
            const height = window.innerHeight;

            setWindowSize({
                width,
                height,
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024,
            });
        }

        // Add event listener
        window.addEventListener("resize", handleResize);

        // Call handler right away so state gets updated with initial window size
        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []); // Empty array ensures that effect is only run on mount

    return windowSize;
}

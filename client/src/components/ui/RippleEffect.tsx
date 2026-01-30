
import React, { useEffect, useRef } from 'react';

// Props Interface based on the Framer component
interface RippleEffectProps {
    image: string;
    intensity?: number;
    rippleCount?: number;
    rippleInterval?: number;
    rippleSize?: number;
    className?: string; // Allow custom styling
}

// Extend Window interface for jQuery support
declare global {
    interface Window {
        $: any;
        jQuery: any;
    }
}

const loadRippleScript = (callback: () => void) => {
    if (!window.$) {
        const jqueryScript = document.createElement("script");
        jqueryScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js";
        jqueryScript.async = true;
        jqueryScript.onload = () => {
            const ripplesScript = document.createElement("script");
            ripplesScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jquery.ripples/0.5.3/jquery.ripples.min.js";
            ripplesScript.async = true;
            ripplesScript.onload = callback;
            document.body.appendChild(ripplesScript);
        };
        document.body.appendChild(jqueryScript);
    } else if (!window.$.fn.ripples) {
        const ripplesScript = document.createElement("script");
        ripplesScript.src = "https://cdnjs.cloudflare.com/ajax/libs/jquery.ripples/0.5.3/jquery.ripples.min.js";
        ripplesScript.async = true;
        ripplesScript.onload = callback;
        document.body.appendChild(ripplesScript);
    } else {
        callback();
    }
};

export const RippleEffect: React.FC<RippleEffectProps> = ({
    image,
    intensity = 3,
    rippleCount = 2,
    rippleInterval = 4000,
    rippleSize = 30,
    className
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Ensure scripts are loaded before applying the effect
        loadRippleScript(() => {
            if (window.$ && typeof window.$.fn.ripples === "function") {
                console.log("Ripples.js is loaded. Applying effect...");

                const $el = window.$(containerRef.current);

                // Destroy previous instance before applying new settings
                try {
                    $el.ripples("destroy");
                } catch (e) {
                    // Ignore error if not initialized
                }

                // Map intensity
                const mappedIntensity = 0.01 + (intensity / 100) * 0.05; // Keeps it between 0.01 and 0.06

                // Apply Ripples.js effect
                $el.ripples({
                    resolution: 512,
                    perturbance: mappedIntensity,
                    interactive: true,
                    imageUrl: image // Pass image explicitly if needed, but background-image usually works
                });

                // Generate controlled random ripples based on user settings
                const rippleIntervalId = setInterval(() => {
                    if (!containerRef.current) return;
                    for (let i = 0; i < rippleCount; i++) {
                        const x = Math.random() * $el.outerWidth();
                        const y = Math.random() * $el.outerHeight();
                        const dropSize = rippleSize;
                        const dropStrength = 0.02 + Math.random() * 0.02;

                        try {
                            $el.ripples("drop", x, y, dropSize, dropStrength);
                        } catch (e) { /* ignore */ }
                    }
                }, rippleInterval);

                return () => {
                    clearInterval(rippleIntervalId);
                    try {
                        $el.ripples("destroy");
                    } catch (e) { }
                };
            } else {
                console.error("Ripples.js failed to load.");
            }
        });
    }, [image, intensity, rippleCount, rippleInterval, rippleSize]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
            }}
        />
    );
};

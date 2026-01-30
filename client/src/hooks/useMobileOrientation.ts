import { useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

export const useMobileOrientation = () => {
    useEffect(() => {
        const lockOrientation = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    await ScreenOrientation.lock({ orientation: 'landscape' });
                    console.log('Screen orientation locked to landscape');
                } catch (error) {
                    console.error('Failed to lock screen orientation:', error);
                }
            }
        };

        lockOrientation();

        // Optional: Listen for changes if needed (though we are forcing lock)
        // ScreenOrientation.addListener('screenOrientationChange', (change) => {
        //     console.log('Orientation changed to:', change.type);
        // });

        return () => {
            if (Capacitor.isNativePlatform()) {
                ScreenOrientation.unlock(); // Unlock on unmount (if needed, usually we want it locked for whole app)
            }
        };
    }, []);
};

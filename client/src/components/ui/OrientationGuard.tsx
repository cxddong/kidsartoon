import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 横屏提示组件（可选）
 * 在iPad竖屏时显示，引导用户旋转设备到横屏模式
 * 
 * 使用方法：
 * 1. 在App.tsx或主布局中添加此组件
 * 2. 设置 enabled={true} 启用横屏强制提示
 * 3. 或者设置 enabled={false} 仅在CSS中显示提示
 */

interface OrientationGuardProps {
    /** 是否启用横屏提示 */
    enabled?: boolean;
    /** 自定义提示文本 */
    title?: string;
    message?: string;
}

export const OrientationGuard: React.FC<OrientationGuardProps> = ({
    enabled = false,
    title = '🔄 请旋转设备',
    message = '为了获得最佳体验，请将设备旋转至横屏模式'
}) => {
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            // 检测是否为竖屏
            const portrait = window.innerHeight > window.innerWidth;
            // 检测是否为平板尺寸
            const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1366;

            setIsPortrait(portrait && isTablet);
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);

        return () => {
            window.removeEventListener('resize', checkOrientation);
            window.removeEventListener('orientationchange', checkOrientation);
        };
    }, []);

    if (!enabled || !isPortrait) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex flex-col items-center justify-center p-8 text-white"
                style={{ touchAction: 'none' }}
            >
                {/* 旋转动画图标 */}
                <motion.div
                    animate={{
                        rotate: [0, 90, 90, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="mb-8"
                >
                    <svg
                        width="120"
                        height="120"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-2xl"
                    >
                        <rect x="3" y="6" width="18" height="12" rx="2" stroke="white" strokeWidth="2" fill="none" />
                        <path d="M16 19 L18 21 L20 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="2" fill="white" />
                    </svg>
                </motion.div>

                {/* 标题 */}
                <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black mb-4 text-center"
                >
                    {title}
                </motion.h2>

                {/* 消息 */}
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg opacity-90 text-center max-w-md leading-relaxed"
                >
                    {message}
                </motion.p>

                {/* 装饰性光效 */}
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </motion.div>
        </AnimatePresence>
    );
};

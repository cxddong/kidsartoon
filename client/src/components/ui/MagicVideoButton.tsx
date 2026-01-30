import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Props {
    videoSrc: string;   // 视频地址
    posterSrc?: string;  // 静态封面图 (可选，通常是视频第1帧的截图)
    label?: string;      // 按钮文字 (可选)
    onClick?: (e: React.MouseEvent) => void;
    className?: string;
    enableMobileAutoPlay?: boolean; // 移动端是否启用视口自动播放
    labelClassName?: string;        // 自定义文字样式
}

export const MagicVideoButton: React.FC<Props> = ({
    videoSrc,
    posterSrc,
    label,
    onClick,
    className = '',
    enableMobileAutoPlay = true,
    labelClassName = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // 检测是否为移动设备
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // 移动端：使用 IntersectionObserver 实现滚动到视口自动播放
    useEffect(() => {
        if (!isMobile || !enableMobileAutoPlay || !containerRef.current || !videoRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // 进入视口：播放
                        const playPromise = videoRef.current?.play();
                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => setIsPlaying(true))
                                .catch(error => console.warn("Scroll play interrupted:", error));
                        }
                    } else {
                        // 离开视口：暂停并重置
                        if (videoRef.current) {
                            videoRef.current.pause();
                            videoRef.current.currentTime = 0;
                            setIsPlaying(false);
                        }
                    }
                });
            },
            {
                threshold: 0.5, // 50%进入视口时触发
            }
        );

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [isMobile, enableMobileAutoPlay]);

    // 🖱️ PC端：鼠标进入时播放
    const handleMouseEnter = () => {
        if (isMobile || !videoRef.current) return;

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch(error => console.warn("Hover play interrupted:", error));
        }
    };

    // 🖱️ PC端：鼠标离开时暂停并重置
    const handleMouseLeave = () => {
        if (isMobile || !videoRef.current) return;

        videoRef.current.pause();
        videoRef.current.currentTime = 0; // 回到第一帧
        setIsPlaying(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            e.stopPropagation();
            onClick(e);
        }
    };

    return (
        <motion.div
            ref={containerRef}
            className={`relative overflow-hidden cursor-pointer group ${className}`}
            style={{ background: 'black' }}
            whileHover={{ scale: isMobile ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            {/* 1. 静态封面 (在视频加载前或暂停时显示) */}
            {posterSrc && (
                <img
                    src={posterSrc}
                    alt={label || 'Video button'}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                />
            )}

            {/* 2. 视频层 (默认暂停) */}
            <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-cover block"
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    transform: 'scale(1.1)',
                    background: 'black'
                }}
                muted        // 必须静音才能自动播放
                playsInline  // iOS 必须
                loop         // 循环播放
                preload="metadata" // 仅预加载元数据，省流量
                poster={posterSrc} // 原生poster作为备选
            />

            {/* 3. 遮罩与文字 (可选) */}
            {/* 3. 遮罩与文字 (可选) (Reduced opacity) */}
            {label && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent flex items-end justify-center pb-2 pointer-events-none">
                    <span className={cn("text-white font-bold text-[10px] drop-shadow-md text-center px-1 leading-tight", labelClassName)}>
                        {label}
                    </span>
                </div>
            )}

            {/* Hover提示 (仅PC) - Removed darkening overlay as requested */}
            {/* {!isMobile && (
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
            )} */}
        </motion.div>
    );
};

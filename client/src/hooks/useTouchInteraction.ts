import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 检测当前设备是否为触摸设备
 */
export const isTouchDevice = (): boolean => {
    return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
    );
};

/**
 * 触摸交互Hook - 统一管理触摸和鼠标交互
 * 
 * 功能：
 * - 自动检测触摸/鼠标设备
 * - 触摸设备：第一次触摸显示信息，第二次触摸执行动作
 * - 鼠标设备：hover显示信息，点击执行动作
 * 
 * @param onAction 执行的主要动作（如跳转）
 * @param options 配置选项
 */
export const useTouchInteraction = (
    onAction: () => void,
    options: {
        /** 触摸后自动隐藏tooltip的延迟时间（毫秒），0表示不自动隐藏 */
        autoHideDelay?: number;
        /** 是否在触摸时执行动作前有确认步骤 */
        requireConfirm?: boolean;
    } = {}
) => {
    const { autoHideDelay = 0, requireConfirm = true } = options;
    const [isActive, setIsActive] = useState(false); // 是否显示tooltip/信息
    const [isTouched, setIsTouched] = useState(false); // 是否已经被触摸过一次
    const autoHideTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isTouch = isTouchDevice();

    // 清理自动隐藏定时器
    const clearAutoHideTimer = useCallback(() => {
        if (autoHideTimerRef.current) {
            clearTimeout(autoHideTimerRef.current);
            autoHideTimerRef.current = null;
        }
    }, []);

    // 鼠标进入
    const handleMouseEnter = useCallback(() => {
        if (!isTouch) {
            setIsActive(true);
        }
    }, [isTouch]);

    // 鼠标离开
    const handleMouseLeave = useCallback(() => {
        if (!isTouch) {
            setIsActive(false);
        }
    }, [isTouch]);

    // 触摸开始
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!isTouch) return;

        e.stopPropagation();

        if (requireConfirm && !isTouched) {
            // 第一次触摸：显示信息
            setIsActive(true);
            setIsTouched(true);

            // 如果设置了自动隐藏
            if (autoHideDelay > 0) {
                clearAutoHideTimer();
                autoHideTimerRef.current = setTimeout(() => {
                    setIsActive(false);
                    setIsTouched(false);
                }, autoHideDelay);
            }
        } else {
            // 第二次触摸或不需要确认：执行动作
            clearAutoHideTimer();
            onAction();
            setIsActive(false);
            setIsTouched(false);
        }
    }, [isTouch, isTouched, requireConfirm, autoHideDelay, onAction, clearAutoHideTimer]);

    // 点击处理（用于鼠标设备）
    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!isTouch) {
            e.stopPropagation();
            onAction();
        }
    }, [isTouch, onAction]);

    // 点击外部区域重置状态
    useEffect(() => {
        const handleClickOutside = () => {
            if (isTouch && isTouched) {
                setIsActive(false);
                setIsTouched(false);
                clearAutoHideTimer();
            }
        };

        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('touchstart', handleClickOutside);
            clearAutoHideTimer();
        };
    }, [isTouch, isTouched, clearAutoHideTimer]);

    // 重置状态（供外部调用）
    const reset = useCallback(() => {
        setIsActive(false);
        setIsTouched(false);
        clearAutoHideTimer();
    }, [clearAutoHideTimer]);

    return {
        isActive,        // 是否应该显示tooltip/信息
        isTouched,       // 是否已触摸过（触摸设备）
        isTouch,         // 是否为触摸设备
        handlers: {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
            onTouchStart: handleTouchStart,
            onClick: handleClick,
        },
        reset,
    };
};

/**
 * 简化版触摸交互Hook - 用于简单的显示/隐藏场景
 */
export const useSimpleTouchHover = (itemId: string, activeId: string | null, setActiveId: (id: string | null) => void) => {
    const isTouch = isTouchDevice();

    const handlers = {
        onMouseEnter: () => {
            if (!isTouch) {
                setActiveId(itemId);
            }
        },
        onMouseLeave: () => {
            if (!isTouch) {
                setActiveId(null);
            }
        },
        onTouchStart: (e: React.TouchEvent) => {
            e.stopPropagation();
            if (activeId === itemId) {
                setActiveId(null);
            } else {
                setActiveId(itemId);
            }
        },
    };

    return {
        isActive: activeId === itemId,
        isTouch,
        handlers,
    };
};

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Globe, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MagicNavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);

    const isActive = (path: string) => location.pathname === path || (path === '/' && location.pathname === '/home');

    return (
        // 容器定位：固定在底部，居中悬浮
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-50">

            {/* 🔮 胶囊本体 - 可变形 */}
            <motion.div
                className="flex items-center gap-2 bg-white/20 backdrop-blur-xl border border-white/50 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] ring-1 ring-white/30 overflow-hidden"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
                animate={{
                    width: isExpanded ? 300 : 140,
                    height: isExpanded ? 70 : 50,
                    paddingLeft: isExpanded ? 24 : 8,
                    paddingRight: isExpanded ? 24 : 8,
                    paddingTop: isExpanded ? 8 : 6,
                    paddingBottom: isExpanded ? 8 : 6,
                    opacity: isExpanded ? 1 : 0.85,
                }}
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1], // 自定义缓动曲线
                }}
            >
                <div className="flex items-center justify-between w-full">
                    {/* 🌍 左侧：社区 (Community) */}
                    <NavButton
                        icon={<Globe size={isExpanded ? 24 : 18} />}
                        label="World"
                        active={isActive('/community')}
                        onClick={() => navigate('/community')}
                        isExpanded={isExpanded}
                    />

                    {/* 🏠 中间：主页 (Home) - 保持中央突出 */}
                    <div className="relative">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/home')}
                            className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white/40"
                            animate={{
                                width: isExpanded ? 52 : 40,
                                height: isExpanded ? 52 : 40,
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <Sparkles size={isExpanded ? 26 : 20} strokeWidth={2.5} className="fill-white/20" />

                            {/* 装饰星光 - 持续闪烁 */}
                            <motion.div
                                className="absolute -top-1 -right-1"
                                animate={{
                                    opacity: [0.6, 1, 0.6],
                                    scale: [0.8, 1.2, 0.8],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Sparkles size={12} className="text-yellow-300" />
                            </motion.div>
                        </motion.button>
                    </div>

                    {/* 👤 右侧：个人 (Profile) */}
                    <NavButton
                        icon={<User size={isExpanded ? 24 : 18} />}
                        label="Me"
                        active={isActive('/profile')}
                        onClick={() => navigate('/profile')}
                        isExpanded={isExpanded}
                    />
                </div>
            </motion.div>
        </div>
    );
};

// 子组件：普通按钮 - 带展开/收起动画
const NavButton = ({ icon, label, onClick, active, isExpanded }: any) => (
    <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`flex items-center justify-center rounded-full transition-colors duration-200 ${active
            ? 'text-indigo-600 bg-white/50'
            : 'text-gray-200 hover:text-white hover:bg-white/30'
            }`}
        animate={{
            width: isExpanded ? 90 : 36,
            height: isExpanded ? 54 : 36,
            gap: isExpanded ? 8 : 0,
        }}
        transition={{ duration: 0.3 }}
    >
        {/* 图标 */}
        <motion.div
            className={active ? "scale-110 drop-shadow-md" : ""}
            animate={{
                scale: isExpanded ? 1 : 0.9,
            }}
        >
            {icon}
        </motion.div>

        {/* 文字标签 - 淡入淡出 */}
        <AnimatePresence>
            {isExpanded && (
                <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-bold tracking-wide whitespace-nowrap overflow-hidden"
                >
                    {label}
                </motion.span>
            )}
        </AnimatePresence>
    </motion.button>
);

/**
 * 3D 魔法工坊 - 基于火山引擎 2026.02 官方定价更新
 * 单次成本: 2.4 RMB (~$0.34 / 34 Gems)
 */

export const PRICING_CONFIG = {
    GENERATION: {
        // 🚀 3D 魔法模块 (豆包 Seed3D-1.0)
        TOY_MAKER_3D: {
            COST_FREE: 80,         // Value: $0.80 (Standard/Visitor)
            COST_BASIC: 50,        // Value: $0.50 (Basic Plan)
            COST_PRO: 40,          // Value: $0.40 (Pro Plan)
            RETRY_ON_FAILURE: true, // 失败自动返还积分
            MAX_CONCURRENT_PER_USER: 1 // 限制单人并发，保护 API 5 并发限制
        }
    },

    // 豆包 API 参数映射
    DOUBAO_3D_SPEC: {
        DEFAULT_FACES: "100k", // 建议 100k 以平衡加载速度与精度
        DEFAULT_FORMAT: "glb",  // 移动端/Web 预览最佳格式
    }
};

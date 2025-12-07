# 测试指南

## 安装依赖

首先安装测试相关的依赖：

```bash
cd KAT
npm install
```

## 运行测试

### 1. 运行所有测试（监视模式）

```bash
npm test
```

这将启动 Vitest 的监视模式，当你修改代码时会自动重新运行测试。

### 2. 运行所有测试（一次性）

```bash
npm run test:run
```

### 3. 使用 UI 界面运行测试

```bash
npm run test:ui
```

这将打开一个浏览器界面，可以可视化地查看测试结果。

### 4. 生成测试覆盖率报告

```bash
npm run test:coverage
```

这将运行所有测试并生成覆盖率报告。

## 测试文件结构

```
KAT/
├── tests/
│   ├── setup.ts              # 测试设置和辅助函数
│   ├── health.test.ts        # 健康检查测试
│   ├── users.test.ts         # 用户 API 测试
│   ├── media.test.ts         # 媒体生成 API 测试
│   ├── community.test.ts     # 社区功能 API 测试
│   └── subscriptions.test.ts # 订阅系统 API 测试
└── vitest.config.ts          # Vitest 配置文件
```

## 编写新测试

1. 在 `tests/` 目录下创建新的测试文件，命名格式：`*.test.ts`
2. 使用 `createTestApp()` 函数创建测试应用实例
3. 使用 `supertest` 发送 HTTP 请求
4. 使用 Vitest 的断言函数进行验证

示例：

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('My Feature', () => {
  const app = createTestApp();

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/my-endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

## 测试命令说明

- `npm test` - 启动监视模式，自动重新运行测试
- `npm run test:run` - 运行一次所有测试
- `npm run test:ui` - 打开测试 UI 界面
- `npm run test:coverage` - 生成覆盖率报告

## 注意事项

- 测试使用内存存储，不会影响实际数据
- 每个测试文件都是独立的，可以并行运行
- 使用 `beforeEach` 和 `afterEach` 来设置和清理测试数据


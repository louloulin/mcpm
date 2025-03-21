# MCP集成SDK贡献指南

感谢您考虑为MCP集成SDK做出贡献！本文档提供了参与项目开发的指南和最佳实践。

## 开发设置

### 前提条件

- Node.js 14+
- pnpm 7+（推荐）或npm/yarn

### 克隆与安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-org/mcp-integration-sdk.git
   cd mcp-integration-sdk
   ```

2. 安装依赖：
   ```bash
   pnpm install
   ```

3. 构建SDK：
   ```bash
   pnpm build
   ```

## 开发工作流

### 分支策略

- `main`: 最新稳定版本
- `dev`: 开发分支，所有功能分支都应该从这里分叉
- `feature/xxx`: 新功能分支
- `fix/xxx`: 修复分支
- `docs/xxx`: 文档更新分支

### 提交代码

1. 创建新分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 进行更改并遵循代码风格和测试要求

3. 提交更改：
   ```bash
   git commit -m "feat: 添加新功能"
   ```

   我们使用[约定式提交](https://www.conventionalcommits.org/)规范：
   - `feat`: 新功能
   - `fix`: 修复bug
   - `docs`: 文档变更
   - `style`: 代码格式变更（不影响功能）
   - `refactor`: 代码重构
   - `test`: 添加或修改测试
   - `chore`: 构建过程或辅助工具变动

4. 推送到远程仓库：
   ```bash
   git push origin feature/your-feature-name
   ```

5. 创建Pull Request（PR）到`dev`分支

## 代码规范

### TypeScript风格指南

- 使用2个空格缩进
- 使用分号
- 优先使用`interface`而非`type`来定义对象类型
- 导出的类型和接口应该以大写字母开头
- 使用有意义的变量和函数名
- 避免使用`any`类型，尽量提供准确的类型定义

### 测试要求

- 为所有新功能添加单元测试
- 确保测试覆盖率维持在目标水平
- 运行测试：
  ```bash
  pnpm test
  ```

- 检查测试覆盖率：
  ```bash
  pnpm test:coverage
  ```

## SDK文档

### API文档

- 使用TSDoc格式为所有公共API添加注释
- 生成API文档：
  ```bash
  pnpm docs:generate
  ```

### 示例代码

- 为新功能提供示例代码
- 确保示例代码可运行且简明扼要

## 发布流程

版本号遵循[语义化版本](https://semver.org/)规范：

- 主版本（MAJOR）：不兼容的API变更
- 次版本（MINOR）：向后兼容的功能性新增
- 修订版本（PATCH）：向后兼容的问题修正

### 发布新版本

只有核心维护者可以发布新版本：

1. 更新版本号：
   ```bash
   pnpm version [patch|minor|major]
   ```

2. 构建SDK：
   ```bash
   pnpm build
   ```

3. 发布到NPM：
   ```bash
   pnpm publish
   ```

## 反馈与问题

如有问题或建议，请通过以下方式联系我们：

- 提交GitHub Issue
- 在PR中讨论
- 联系MCP开发团队

感谢您的贡献！ 
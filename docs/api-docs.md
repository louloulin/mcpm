# MCPM Cloud API文档指南

本指南介绍如何使用MCPM Cloud CLI的文档功能生成、查看和管理API文档。

## 概述

MCPM Cloud API文档工具提供了一种简单的方式来生成、查看和管理API文档。该工具基于TypeScript源代码中的JSDoc注释自动生成美观的HTML文档，帮助开发者更好地理解和使用API。

## 安装

API文档工具已经集成在MCPM Cloud CLI中，无需单独安装。只需确保您已经安装了MCPM Cloud CLI：

```bash
npm install -g mcpm
```

## 基本用法

### 生成API文档

使用以下命令生成API文档：

```bash
mcpm docs generate
```

默认情况下，该命令将扫描当前目录中的所有TypeScript文件（`**/*.ts`），并将生成的文档保存在`docs/api`目录中。

可以通过参数自定义生成过程：

```bash
mcpm docs generate --input "src/**/*.ts" --output "documentation/api" --title "我的API文档"
```

#### 可用选项

- `-i, --input <files>`: 输入文件路径，支持glob模式（默认：`**/*.ts`）
- `-o, --output <dir>`: 输出目录（默认：`docs/api`）
- `-t, --title <title>`: API文档标题（默认：`MCPM Cloud API`）
- `-v, --version <version>`: API版本（默认：从package.json获取）
- `-d, --description <desc>`: API文档描述
- `-b, --base-path <path>`: API基础路径（默认：`/api`）
- `--ts, --typescript`: 强制将所有文件作为TypeScript处理

### 预览API文档

生成文档后，可以在浏览器中打开本地服务器预览文档：

```bash
mcpm docs serve
```

该命令将启动一个HTTP服务器，默认在端口8080上提供文档：

```
文档服务器已启动!
本地: http://localhost:8080

按 Ctrl+C 停止服务器
```

可以通过参数自定义预览过程：

```bash
mcpm docs serve --dir "documentation/api" --port 3000
```

#### 可用选项

- `-d, --dir <dir>`: 文档目录（默认：`docs/api`）
- `-p, --port <port>`: 服务器端口（默认：`8080`）

### 清理API文档

如果需要删除生成的文档，可以使用以下命令：

```bash
mcpm docs clean
```

该命令会提示确认删除操作。如果要跳过确认，可以使用`--force`选项：

```bash
mcpm docs clean --force
```

#### 可用选项

- `-d, --dir <dir>`: 文档目录（默认：`docs/api`）
- `-f, --force`: 强制清理，不提示确认

## JSDoc注释格式

API文档工具基于源代码中的JSDoc注释生成文档。以下是支持的注释格式：

### 模块级注释

在文件顶部的JSDoc注释会被视为模块级注释：

```typescript
/**
 * 用户API模块
 * @module 用户管理
 */
```

### 类级注释

类声明前的JSDoc注释会被视为类级注释：

```typescript
/**
 * 用户服务
 * @interface 用户相关API
 * @baseUrl /api/users
 * @version 1.0.0
 * @group 用户管理
 * @since 2.0.0
 */
class UserService {
  // ...
}
```

支持的标签：
- `@interface`：接口描述
- `@baseUrl`：API基础URL
- `@version`：接口版本
- `@deprecated`：标记为已废弃
- `@since`：可用版本
- `@group`：分组

### 方法级注释

方法声明前的JSDoc注释会被视为方法级注释：

```typescript
/**
 * 获取用户详情
 * @get /users/{id}
 * @param {string} id 用户ID
 * @param {boolean} [includeDeleted=false] 是否包含已删除用户 默认值: false
 * @returns {User} 用户对象
 * @example
 * const user = await userService.getUser('123');
 * console.log(user);
 * @tag 读取
 * @group 用户操作
 * @since 1.5.0
 */
public async getUser(id: string, includeDeleted = false): Promise<User> {
  // ...
}
```

支持的标签：
- `@get`, `@post`, `@put`, `@delete`, `@patch`：HTTP方法和路径
- `@param`：参数描述
- `@returns`：返回值描述
- `@example`：使用示例
- `@deprecated`：标记为已废弃
- `@since`：可用版本
- `@group`：分组
- `@tag`：标签（可多个）

## 最佳实践

1. **一致的注释风格**：保持项目中JSDoc注释的一致性，使文档更加连贯。

2. **详细的描述**：提供清晰、简洁但完整的描述，帮助用户理解API的用途。

3. **示例代码**：为关键方法提供示例代码，展示如何正确使用API。

4. **维护文档**：在代码更改时更新相应的JSDoc注释，确保文档始终与代码同步。

5. **版本信息**：使用`@since`和`@deprecated`标签标记API的生命周期。

6. **分组和标签**：使用`@group`和`@tag`标签对API进行分类，使文档结构更清晰。

## 故障排除

1. **没有找到匹配的源文件**：确保您的`--input`参数正确指向源文件所在的位置。

2. **生成的文档缺少内容**：检查您的代码是否包含正确格式的JSDoc注释。

3. **无法启动预览服务**：确保指定的端口未被占用，或者尝试使用不同的端口。

4. **CSS样式问题**：如果文档样式异常，可以尝试重新生成文档或检查是否有自定义模板冲突。

## 示例

以下是一个完整示例，展示如何为API添加JSDoc注释，并生成文档：

```typescript
/**
 * 任务管理模块
 * @module 任务系统
 */

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 任务数据接口
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * 任务服务
 * @interface 任务管理API
 * @baseUrl /api/tasks
 * @version 1.0.0
 * @group 任务管理
 */
export class TaskService {
  /**
   * 创建新任务
   * @post /tasks
   * @param {string} title 任务标题
   * @param {string} [description] 任务描述
   * @returns {Task} 创建的任务
   * @example
   * const task = await taskService.createTask('完成文档', '编写API文档指南');
   * console.log(task.id);
   * @tag 写入
   */
  public async createTask(title: string, description?: string): Promise<Task> {
    // 实现代码...
  }

  /**
   * 获取任务详情
   * @get /tasks/{id}
   * @param {string} id 任务ID
   * @returns {Task} 任务详情
   * @example
   * const task = await taskService.getTask('task-123');
   * @tag 读取
   */
  public async getTask(id: string): Promise<Task> {
    // 实现代码...
  }

  /**
   * 更新任务状态
   * @put /tasks/{id}/status
   * @param {string} id 任务ID
   * @param {TaskStatus} status 新状态
   * @returns {Task} 更新后的任务
   * @example
   * const task = await taskService.updateTaskStatus('task-123', TaskStatus.COMPLETED);
   * @tag 写入
   */
  public async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    // 实现代码...
  }

  /**
   * 删除任务
   * @delete /tasks/{id}
   * @param {string} id 任务ID
   * @returns {boolean} 删除成功返回true
   * @tag 写入
   * @deprecated 使用 archiveTask 代替
   * @since 0.9.0
   */
  public async deleteTask(id: string): Promise<boolean> {
    // 实现代码...
  }
}
```

生成文档：

```bash
mcpm docs generate --input "src/task-service.ts" --title "任务管理API" --description "任务管理系统API文档"
```
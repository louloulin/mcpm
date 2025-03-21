# Chakra UI 到 Tailwind CSS + shadcn/ui 迁移计划

## 已完成的迁移

- [x] 从 `app/layout.tsx` 中移除 ChakraProvider
- [x] 修复重复导入的 globals.css 问题
- [x] 添加 ThemeProvider 组件
- [x] 将 Footer 组件从 Chakra UI 转换为 Tailwind CSS
- [x] 添加主题切换按钮组件
- [x] 导航组件 (`components/navbar.tsx`)
- [x] 基础布局组件 (`components/Layout.tsx`)
- [x] 服务器卡片组件 (`components/ServerCard.tsx`)
- [x] 头部组件 (`components/Header.tsx`)
- [x] 服务器API文档组件 (`components/ServerApiDocs.tsx`)
- [x] 个人资料页面相关组件：
  - [x] 个人资料头部 (`components/profile/ProfileHeader.tsx`)
  - [x] 个人资料选项卡 (`components/profile/ProfileTabs.tsx`)
  - [x] 个人资料编辑表单 (`components/profile/ProfileEditForm.tsx`)
  - [x] 活动卡片组件 (`components/profile/ActivityCard.tsx`)
- [x] 服务器页面相关组件：
  - [x] 服务器使用统计 (`components/servers/ServerUsageStats.tsx`)
  - [x] 文档查看器 (`components/servers/DocViewer.tsx`)
- [x] 页面迁移：
  - [x] 主页 (`app/page.tsx`)
  - [x] 个人资料页 (`app/profile/page.tsx`)
  - [x] 服务器页面 (`app/servers/page.tsx`)
  - [x] 服务器详情页 (`app/servers/[id]/page.tsx`)
  - [x] 上传页面 (`app/upload/page.tsx`)
  - [x] 文档页面 (`app/docs/page.tsx`)
- [x] 从 package.json 中移除 Chakra UI 相关依赖

## 待迁移的组件

所有组件和页面迁移已全部完成。

## 组件替换对照表

| Chakra UI 组件     | Tailwind/shadcn UI 替代方案              |
|-------------------|----------------------------------------|
| Box               | div + Tailwind 类                       |
| Container         | div + max-w-* 类                        |
| Flex              | div + flex 类                          |
| Stack             | div + flex + flex-col + space-y-*      |
| HStack            | div + flex + space-x-*                 |
| VStack            | div + flex + flex-col + space-y-*      |
| SimpleGrid        | div + grid + grid-cols-*               |
| Button            | shadcn Button 组件                      |
| Text              | p, span + Tailwind 文本类              |
| Heading           | h1-h6 + Tailwind 文本类                |
| Input             | shadcn Input 组件                      |
| Textarea          | shadcn Textarea 组件                   |
| FormControl       | shadcn Form 组件                       |
| FormLabel         | shadcn Label 组件                      |
| Modal             | shadcn Dialog 组件                     |
| Tabs              | shadcn Tabs 组件                       |
| useColorModeValue | 使用 dark: 类前缀                       |
| Avatar            | shadcn Avatar 组件                     |
| Badge             | shadcn Badge 组件                      |
| Switch            | shadcn Switch 组件                     |

## 迁移步骤

1. ✅ 先迁移所有共享组件（Footer、Navbar 等）
2. ⏳ 然后迁移每个页面的布局结构（如 Box -> div）
3. ⏳ 最后迁移交互式组件（按钮、表单等）

## 注意事项

- 确保主题切换功能正常工作
- 修复因为样式变化引起的布局问题
- 检查黑暗模式下的显示效果
- 如有需要，针对特定组件创建自定义替代方案

## 完成后的操作

1. 从 package.json 中移除 Chakra UI 相关依赖:
   - @chakra-ui/icons
   - @chakra-ui/react
   - @emotion/react
   - @emotion/styled
   - framer-motion (如不再需要)

2. 运行 `pnpm install` 更新依赖 
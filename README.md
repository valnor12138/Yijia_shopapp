<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1G4pHBjE7QByWAOUe9poq8E9kVz1z6UuT

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 优化说明

### v1.1 - 2024-12-01

1. **UI交互优化**
   - 创建了自定义的Dialog组件，替代了原始的alert提示
   - 提供了更美观、更符合现代UI设计的弹窗界面
   - 支持多种弹窗类型（信息、成功、警告、错误）
   - 优化了弹窗的动画效果和用户体验

2. **组件更新**
   - 在BottomNav组件中使用自定义Dialog替代原始alert
   - 在Home组件中使用自定义Dialog替代原始alert
   - 统一了未实现功能的提示风格

3. **响应式设计**
   - 确保底部导航条在移动设备上正确适配
   - 使用Tailwind CSS的响应式类确保界面在不同屏幕尺寸下的良好显示

4. **代码优化**
   - 修复了项目中的语法错误
   - 提高了代码的可维护性和可读性
   - 遵循了React最佳实践

## 功能说明

- **首页**：展示各类报表和数据分析功能
- **销售数据分析**：提供销售数据的可视化分析
- **底部导航**：快速访问不同功能模块（部分功能正在开发中）

## 技术栈

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Recharts
- Lucide React

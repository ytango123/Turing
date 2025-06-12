
样式:
使用 HTML + Tailwind CSS （或 Bootstrap ）开发所有原型界面。

代码结构：
每个界面以独立 HTML 文件形式存储，例如 home . html 、 profile . html 、 settings . html 等。
 index . html 作为主入口，不直接包含所有界面的完整代码，而是通过< iframe >嵌入各界面文件，并在 index 页面中平铺展示所有页面，避免使用链接跳转。
 
真实感增强：
界面尺寸需模拟 iPhone 15 Pro 的屏幕规格，并应用圆角设计，以贴近真实移动设备的外观。
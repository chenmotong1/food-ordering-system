This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

# food-ordering-system
This is an online food ordering system that allows AI to complete tasks autonomously by providing it with prompts

首先是这个“毛胚房”的首页面
<img width="1118" height="550" alt="image" src="https://github.com/user-attachments/assets/837138e6-9482-4fab-b271-c624866577a8" />
不过我觉得太简陋了，在下方有一个新做的首页。这里可以选择堂食或外带。

进入后就是一些菜品的预览图和下单加入购物车
<img width="1211" height="688" alt="image" src="https://github.com/user-attachments/assets/fc5a0a66-5c9b-41c6-80f9-3ab09e66543e" />

这是结算界面，还内带了优惠卷的使用功能，这个可以在管理者的账号后台进行发布和修改。同时搭配了一个登录的功能。
<img width="1022" height="620" alt="image" src="https://github.com/user-attachments/assets/98ae0bcc-0c2c-41b6-ab6b-37a656523b8c" />

登录界面是一个右侧带有动画的界面，当然用户资料全都保存在本地的数据库中，
在这里，我得感谢 https://github.com/a97242689/animated-characters-login-page  对  https://careercompassai.vercel.app/login  登录界面的功能特性的复现，
让我对这个登入界面的设计比较顺利。
<img width="1210" height="674" alt="image" src="https://github.com/user-attachments/assets/0a8067fd-7a6a-4f62-ab6a-6626063b8a83" />

之后就是管理后台的展示
<img width="1234" height="692" alt="image" src="https://github.com/user-attachments/assets/684c1a47-c51f-4f7a-9a22-9f36976dfbac" />
<img width="1241" height="686" alt="image" src="https://github.com/user-attachments/assets/d8442d8a-7778-48ec-adea-ba225ee062af" />

以上便是整个点餐系统。

下面是一个新首页的设计
在这里，我让AI分析了模板 https://landonorris.com/ 首页的特效功能，之后制作了这个新首页
<img width="1198" height="640" alt="image" src="https://github.com/user-attachments/assets/162aa769-3e8d-4083-b54c-8e8d30c0ae04" />
不过在这里，他并不完善，它只制作了与其首页差不多的鼠标移动来造成“头盔面”的透视效果，我的选图也不是很好。
并且，这个主页是及其吃GPU来渲染的，可能AI制作的也不一定靠谱。


这个主页面下滑后便是接入点餐系统的按钮页面，点击后就会回到刚开始那里。
<img width="1129" height="656" alt="image" src="https://github.com/user-attachments/assets/b9f94a05-df31-4b10-9972-a40f953fb878" />

以上便是全部内容了。




## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

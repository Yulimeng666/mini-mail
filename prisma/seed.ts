// 种子数据：商品分类 + 示例商品 + 管理员账号
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("开始填充种子数据...\n");

  // ========== 1. 创建管理员 ==========
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@minimail.com" },
    update: {},
    create: {
      email: "admin@minimail.com",
      password: adminPassword,
      name: "管理员",
      role: "ADMIN",
    },
  });
  console.log(`✓ 管理员账号: ${admin.email} / admin123`);

  // ========== 2. 创建普通用户 ==========
  const userPassword = await bcrypt.hash("user123", 10);
  await prisma.user.upsert({
    where: { email: "user@minimail.com" },
    update: {},
    create: {
      email: "user@minimail.com",
      password: userPassword,
      name: "测试用户",
      role: "USER",
    },
  });
  console.log(`✓ 测试用户: user@minimail.com / user123`);

  // ========== 3. 创建分类 ==========
  const categories = [
    { name: "手机数码", slug: "phone-digital" },
    { name: "电脑办公", slug: "computer-office" },
    { name: "家用电器", slug: "home-appliance" },
    { name: "服装鞋帽", slug: "clothing" },
    { name: "食品生鲜", slug: "food" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✓ ${categories.length} 个分类已创建`);

  // ========== 4. 创建示例商品 ==========
  const categoryRecords = await prisma.category.findMany();
  const catMap: Record<string, number> = {};
  categoryRecords.forEach((c) => { catMap[c.slug] = c.id; });

  const products = [
    // 手机数码
    { name: "iPhone 16 Pro Max", description: "苹果最新旗舰手机，A18 Pro 芯片，256GB 存储", price: 9999, stock: 50, image: "https://picsum.photos/seed/iphone16/400/400", categoryId: catMap["phone-digital"] },
    { name: "华为 Mate 70 Pro", description: "华为旗舰手机，麒麟芯片，卫星通信", price: 6999, stock: 30, image: "https://picsum.photos/seed/mate70/400/400", categoryId: catMap["phone-digital"] },
    { name: "小米 15 Ultra", description: "小米影像旗舰，徕卡光学镜头，1 英寸大底", price: 5999, stock: 40, image: "https://picsum.photos/seed/mi15ultra/400/400", categoryId: catMap["phone-digital"] },
    { name: "AirPods Pro 3", description: "苹果降噪耳机，H3 芯片，自适应音频", price: 1899, stock: 100, image: "https://picsum.photos/seed/airpods3/400/400", categoryId: catMap["phone-digital"] },
    // 电脑办公
    { name: "MacBook Pro 16 M4", description: "苹果笔记本电脑，M4 Pro 芯片，32GB 内存", price: 19999, stock: 20, image: "https://picsum.photos/seed/macbook16/400/400", categoryId: catMap["computer-office"] },
    { name: "ThinkPad X1 Carbon", description: "联想商务旗舰笔记本，14 英寸 2.8K OLED", price: 12999, stock: 15, image: "https://picsum.photos/seed/thinkpad-x1/400/400", categoryId: catMap["computer-office"] },
    { name: "iPad Pro M4", description: "苹果旗舰平板，M4 芯片，13 英寸 XDR 显示屏", price: 8999, stock: 35, image: "https://picsum.photos/seed/ipad-pro-m4/400/400", categoryId: catMap["computer-office"] },
    { name: "罗技 MX Master 3S", description: "无线办公鼠标，8000DPI，静音按键", price: 699, stock: 80, image: "https://picsum.photos/seed/mx-master-3s/400/400", categoryId: catMap["computer-office"] },
    // 家用电器
    { name: "戴森 V16 吸尘器", description: "戴森无线吸尘器，激光探测微尘，60 分钟续航", price: 4999, stock: 25, image: "https://picsum.photos/seed/dyson-v16/400/400", categoryId: catMap["home-appliance"] },
    { name: "小米空气净化器 5 Pro", description: "小米智能空气净化器，CADR 800m³/h", price: 1999, stock: 60, image: "https://picsum.photos/seed/mi-air-purifier/400/400", categoryId: catMap["home-appliance"] },
    // 服装鞋帽
    { name: "Nike Air Max 270", description: "耐克气垫运动鞋，经典复古款", price: 1099, stock: 45, image: "https://picsum.photos/seed/nike-airmax/400/400", categoryId: catMap["clothing"] },
    { name: "优衣库羽绒服", description: "轻薄保暖羽绒服，90% 白鹅绒", price: 599, stock: 70, image: "https://picsum.photos/seed/uniqlo-down/400/400", categoryId: catMap["clothing"] },
    // 食品生鲜
    { name: "智利车厘子 2.5kg", description: "智利进口车厘子，JJ 级，新鲜直达", price: 299, stock: 120, image: "https://picsum.photos/seed/cherry-chile/400/400", categoryId: catMap["food"] },
    { name: "阳澄湖大闸蟹 8只装", description: "阳澄湖大闸蟹，公蟹 4 两母蟹 3 两，鲜活礼盒", price: 399, stock: 40, image: "https://picsum.photos/seed/hairy-crab/400/400", categoryId: catMap["food"] },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log(`✓ ${products.length} 个商品已创建`);
  console.log("\n种子数据填充完成！");
}

main()
  .catch((e) => {
    console.error("种子数据填充失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

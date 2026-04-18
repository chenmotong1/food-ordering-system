import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log("🌱 开始填充种子数据...");

  // 清空所有表（按外键依赖顺序）
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.pointRecord.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.dishSpec.deleteMany();
  await prisma.comboItem.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ 已清空所有表");

  // ========== 1. 用户 ==========
  const passwordHash = (pw: string) => bcrypt.hashSync(pw, SALT_ROUNDS);

  const [admin, manager, staff, testuser] = await Promise.all([
    prisma.user.create({
      data: {
        username: "admin",
        password: passwordHash("admin123"),
        phone: "13800000001",
        role: "admin",
        memberLevel: "gold",
        points: 8000,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        username: "manager1",
        password: passwordHash("manager123"),
        phone: "13800000002",
        role: "manager",
        memberLevel: "silver",
        points: 2500,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        username: "staff1",
        password: passwordHash("staff123"),
        phone: "13800000003",
        role: "employee",
        memberLevel: "bronze",
        points: 120,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        username: "testuser",
        password: passwordHash("test123"),
        phone: "13800000004",
        role: "customer",
        memberLevel: "bronze",
        points: 280,
        isVerified: true,
      },
    }),
  ]);
  console.log("✅ 创建 4 个用户");

  // ========== 2. 菜品 ==========
  const dishesData = [
    // 饮料类 (beverages)
    {
      name: "可乐",
      category: "beverages",
      subcategory: "carbonated",
      price: 8,
      description: "冰镇可口可乐，清爽解渴，经典碳酸饮料。",
      imageUrl: "/dishes/可乐.jpg",
      tags: JSON.stringify(["热销"]),
      calories: 150,
      spicyLevel: 0,
      isRecommended: false,
      stock: 999,
      salesCount: 3200,
    },
    {
      name: "鲜榨橙汁",
      category: "beverages",
      subcategory: "juice",
      price: 12,
      description: "新鲜橙子现榨，富含维C，健康美味。",
      imageUrl: "/dishes/鲜榨橙汁.jpg",
      tags: JSON.stringify(["新品"]),
      calories: 120,
      spicyLevel: 0,
      isRecommended: false,
      stock: 200,
      salesCount: 80,
    },
    {
      name: "珍珠奶茶",
      category: "beverages",
      subcategory: "milk_tea",
      price: 18,
      description: "香浓奶茶搭配Q弹珍珠，经典人气饮品。",
      imageUrl: "/dishes/珍珠奶茶.jpg",
      tags: JSON.stringify(["热销", "招牌"]),
      calories: 380,
      spicyLevel: 0,
      isRecommended: true,
      stock: 150,
      salesCount: 2800,
    },
    {
      name: "拿铁咖啡",
      category: "beverages",
      subcategory: "coffee",
      price: 22,
      description: "意式浓缩与丝滑牛奶的完美融合，醇香回味。",
      imageUrl: "/dishes/拿铁咖啡.jpg",
      tags: JSON.stringify(["招牌"]),
      calories: 200,
      spicyLevel: 0,
      isRecommended: true,
      stock: 100,
      salesCount: 960,
    },

    // 小吃类 (snacks)
    {
      name: "薯条",
      category: "snacks",
      subcategory: "fried",
      price: 12,
      description: "金黄酥脆薯条，外酥里嫩，蘸酱更美味。",
      imageUrl: "/dishes/薯条.jpg",
      tags: JSON.stringify(["热销"]),
      calories: 320,
      spicyLevel: 0,
      isRecommended: false,
      stock: 999,
      salesCount: 4100,
    },
    {
      name: "鸡米花",
      category: "snacks",
      subcategory: "fried",
      price: 18,
      description: "香酥鸡米花，一口一个，蘸酱搭配更佳。",
      imageUrl: "/dishes/鸡米花.jpg",
      tags: JSON.stringify(["招牌"]),
      calories: 350,
      spicyLevel: 1,
      isRecommended: true,
      stock: 200,
      salesCount: 1800,
    },
    {
      name: "洋葱圈",
      category: "snacks",
      subcategory: "fried",
      price: 15,
      description: "酥炸洋葱圈，香脆可口，独具风味。",
      imageUrl: "/dishes/洋葱圈.jpg",
      tags: JSON.stringify(["新品"]),
      calories: 280,
      spicyLevel: 0,
      isRecommended: false,
      stock: 150,
      salesCount: 420,
    },
    {
      name: "香辣鸡翅",
      category: "snacks",
      subcategory: "grilled",
      price: 22,
      description: "秘制香辣鸡翅，外焦里嫩，辣味十足。",
      imageUrl: "/dishes/香辣鸡翅.jpg",
      tags: JSON.stringify(["热销"]),
      calories: 420,
      spicyLevel: 2,
      isRecommended: false,
      stock: 180,
      salesCount: 2200,
    },

    // 甜品类 (desserts)
    {
      name: "巧克力蛋糕",
      category: "desserts",
      subcategory: "cake",
      price: 25,
      description: "浓郁巧克力蛋糕，口感丝滑，甜蜜诱惑。",
      imageUrl: "/dishes/巧克力蛋糕.jpg",
      tags: JSON.stringify(["招牌"]),
      calories: 450,
      spicyLevel: 0,
      isRecommended: true,
      stock: 80,
      salesCount: 760,
    },
    {
      name: "三色冰淇淋",
      category: "desserts",
      subcategory: "ice_cream",
      price: 15,
      description: "香草、草莓、巧克力三色冰淇淋，清凉甜蜜。",
      imageUrl: "/dishes/三色冰淇淋.jpg",
      tags: JSON.stringify(["新品"]),
      calories: 280,
      spicyLevel: 0,
      isRecommended: false,
      stock: 100,
      salesCount: 330,
    },
    {
      name: "葡式蛋挞",
      category: "desserts",
      subcategory: "pastry",
      price: 8,
      description: "正宗葡式蛋挞，酥皮香脆，蛋液嫩滑。",
      imageUrl: "/dishes/葡式蛋挞.jpg",
      tags: JSON.stringify(["热销"]),
      calories: 210,
      spicyLevel: 0,
      isRecommended: true,
      stock: 200,
      salesCount: 3600,
    },
    {
      name: "马卡龙（6个装）",
      category: "desserts",
      subcategory: "pastry",
      price: 28,
      description: "法式马卡龙六色套装，色彩缤纷，甜而不腻。",
      imageUrl: "/dishes/马克龙.jpg",
      tags: JSON.stringify([]),
      calories: 320,
      spicyLevel: 0,
      isRecommended: false,
      stock: 60,
      salesCount: 180,
    },

    // 正餐类 (main_courses)
    {
      name: "双层牛肉汉堡",
      category: "main_courses",
      subcategory: "burger",
      price: 35,
      description: "双层澳洲牛肉饼，搭配新鲜蔬菜和特制酱汁。",
      imageUrl: "/dishes/双层牛肉汉堡.jpg",
      tags: JSON.stringify(["招牌"]),
      calories: 680,
      spicyLevel: 0,
      isRecommended: true,
      stock: 100,
      salesCount: 1400,
    },
    {
      name: "香辣鸡腿堡",
      category: "main_courses",
      subcategory: "burger",
      price: 28,
      description: "香脆鸡腿肉，搭配新鲜蔬菜和特制辣酱，回味无穷。",
      imageUrl: "/dishes/香辣鸡腿堡.jpg",
      tags: JSON.stringify(["热销", "招牌"]),
      calories: 420,
      spicyLevel: 2,
      isRecommended: true,
      stock: 120,
      salesCount: 3200,
    },
    {
      name: "红烧肉米饭套餐",
      category: "main_courses",
      subcategory: "rice",
      price: 32,
      description: "经典红烧肉搭配香糯米饭，回味无穷的家常味道。",
      imageUrl: "/dishes/红烧肉米饭套餐.jpg",
      tags: JSON.stringify(["热销"]),
      calories: 780,
      spicyLevel: 1,
      isRecommended: false,
      stock: 80,
      salesCount: 980,
    },
    {
      name: "番茄肉酱意面",
      category: "main_courses",
      subcategory: "noodles",
      price: 28,
      description: "意大利面搭配浓郁番茄肉酱，西式经典。",
      imageUrl: "/dishes/番茄肉酱意面.jpg",
      tags: JSON.stringify(["新品"]),
      calories: 620,
      spicyLevel: 0,
      isRecommended: false,
      stock: 60,
      salesCount: 260,
    },

    // 炒菜类 (stir_fry)
    {
      name: "宫保鸡丁",
      category: "stir_fry",
      subcategory: "meat",
      price: 38,
      description: "经典川菜宫保鸡丁，花生与鸡丁完美搭配。",
      imageUrl: "/dishes/宫保鸡丁.jpg",
      tags: JSON.stringify(["招牌"]),
      calories: 480,
      spicyLevel: 2,
      isRecommended: false,
      stock: 50,
      salesCount: 880,
    },
    {
      name: "清炒时蔬",
      category: "stir_fry",
      subcategory: "vegetable",
      price: 22,
      description: "新鲜时令蔬菜，清淡爽口，营养健康。",
      imageUrl: "/dishes/清炒时蔬.jpg",
      tags: JSON.stringify(["素食"]),
      calories: 180,
      spicyLevel: 0,
      isRecommended: false,
      stock: 80,
      salesCount: 440,
    },
    {
      name: "麻婆豆腐",
      category: "stir_fry",
      subcategory: "vegetable",
      price: 26,
      description: "正宗川味麻婆豆腐，麻辣鲜香，下饭利器。",
      imageUrl: "/dishes/麻婆豆腐.jpg",
      tags: JSON.stringify([]),
      calories: 280,
      spicyLevel: 3,
      isRecommended: false,
      stock: 60,
      salesCount: 560,
    },
    {
      name: "葱姜炒蟹",
      category: "stir_fry",
      subcategory: "seafood",
      price: 68,
      description: "新鲜螃蟹葱姜爆炒，鲜香浓郁，海鲜精品。",
      imageUrl: "/dishes/葱姜炒蟹.jpg",
      tags: JSON.stringify(["招牌"]),
      calories: 350,
      spicyLevel: 0,
      isRecommended: false,
      stock: 30,
      salesCount: 220,
    },
  ];

  const dishes = await Promise.all(
    dishesData.map((d) => prisma.dish.create({ data: d }))
  );
  console.log(`✅ 创建 ${dishes.length} 个菜品`);

  // 辅助：按名称查找菜品
  const findDish = (name: string) => dishes.find((d) => d.name === name)!;

  // ========== 3. 菜品规格 (DishSpec) ==========
  const specsData: Array<{
    dishId: string;
    specType: string;
    specName: string;
    priceAdjust: number;
    isDefault: boolean;
    sortOrder: number;
  }> = [];

  // 饮料类：中杯/大杯规格
  const beverageDishes = ["可乐", "鲜榨橙汁", "珍珠奶茶", "拿铁咖啡"];
  beverageDishes.forEach((name) => {
    const dish = findDish(name);
    specsData.push(
      { dishId: dish.id, specType: "size", specName: "中杯", priceAdjust: 0, isDefault: true, sortOrder: 0 },
      { dishId: dish.id, specType: "size", specName: "大杯", priceAdjust: 5, isDefault: false, sortOrder: 1 }
    );
  });

  // 珍珠奶茶：加料规格
  const milkTea = findDish("珍珠奶茶");
  specsData.push(
    { dishId: milkTea.id, specType: "addon", specName: "不加料", priceAdjust: 0, isDefault: true, sortOrder: 0 },
    { dishId: milkTea.id, specType: "addon", specName: "+珍珠", priceAdjust: 3, isDefault: false, sortOrder: 1 },
    { dishId: milkTea.id, specType: "addon", specName: "+椰果", priceAdjust: 3, isDefault: false, sortOrder: 2 },
    { dishId: milkTea.id, specType: "addon", specName: "+布丁", priceAdjust: 4, isDefault: false, sortOrder: 3 }
  );

  // 辣度规格：香辣鸡翅、香辣鸡腿堡、宫保鸡丁、麻婆豆腐
  const spicyDishes = ["香辣鸡翅", "香辣鸡腿堡", "宫保鸡丁", "麻婆豆腐"];
  spicyDishes.forEach((name) => {
    const dish = findDish(name);
    specsData.push(
      { dishId: dish.id, specType: "spicy", specName: "不辣", priceAdjust: 0, isDefault: true, sortOrder: 0 },
      { dishId: dish.id, specType: "spicy", specName: "微辣", priceAdjust: 0, isDefault: false, sortOrder: 1 },
      { dishId: dish.id, specType: "spicy", specName: "中辣", priceAdjust: 0, isDefault: false, sortOrder: 2 },
      { dishId: dish.id, specType: "spicy", specName: "重辣", priceAdjust: 0, isDefault: false, sortOrder: 3 }
    );
  });

  // 薯条：小份/大份规格
  const fries = findDish("薯条");
  specsData.push(
    { dishId: fries.id, specType: "size", specName: "小份", priceAdjust: 0, isDefault: true, sortOrder: 0 },
    { dishId: fries.id, specType: "size", specName: "大份", priceAdjust: 5, isDefault: false, sortOrder: 1 }
  );

  await Promise.all(
    specsData.map((s) => prisma.dishSpec.create({ data: s }))
  );
  console.log(`✅ 创建 ${specsData.length} 个菜品规格`);

  // ========== 4. 套餐配件 (ComboItem) ==========
  const doubleBurger = findDish("双层牛肉汉堡");
  const spicyBurger = findDish("香辣鸡腿堡");
  const friesDish = findDish("薯条");
  const colaDish = findDish("可乐");
  const orangeJuiceDish = findDish("鲜榨橙汁");
  const onionRingsDish = findDish("洋葱圈");

  const comboData = [
    // 双层牛肉汉堡：薯条（必选），可乐（必选）
    { comboDishId: doubleBurger.id, itemDishId: friesDish.id, isRequired: true, sortOrder: 0 },
    { comboDishId: doubleBurger.id, itemDishId: colaDish.id, isRequired: true, sortOrder: 1 },
    // 香辣鸡腿堡：薯条/洋葱圈（必选1），可乐/橙汁（必选1）
    { comboDishId: spicyBurger.id, itemDishId: friesDish.id, isRequired: true, sortOrder: 0 },
    { comboDishId: spicyBurger.id, itemDishId: onionRingsDish.id, isRequired: true, sortOrder: 1 },
    { comboDishId: spicyBurger.id, itemDishId: colaDish.id, isRequired: true, sortOrder: 2 },
    { comboDishId: spicyBurger.id, itemDishId: orangeJuiceDish.id, isRequired: true, sortOrder: 3 },
  ];

  await Promise.all(
    comboData.map((c) => prisma.comboItem.create({ data: c }))
  );
  console.log(`✅ 创建 ${comboData.length} 个套餐配件`);

  // ========== 5. 优惠券 ==========
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.coupon.create({
      data: {
        code: "WELCOME10",
        name: "新人专享满50减10",
        type: "fixed",
        value: 10,
        minOrderAmount: 50,
        totalCount: 1000,
        usedCount: 0,
        startAt: now,
        expireAt: thirtyDaysLater,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: "DISCOUNT9",
        name: "全场九折（最多减20）",
        type: "percent",
        value: 0.9,
        minOrderAmount: 0,
        maxDiscount: 20,
        totalCount: 500,
        usedCount: 0,
        startAt: now,
        expireAt: sevenDaysLater,
        isActive: true,
      },
    }),
  ]);
  console.log("✅ 创建 2 个优惠券");

  console.log("🎉 种子数据填充完成！");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据填充失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

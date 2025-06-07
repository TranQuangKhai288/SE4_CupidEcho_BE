import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User, Profile, UserCondition, Relationship } from "./models"; // Adjust path as needed
import Interest from "./models/interest";

// Vietnamese names data
const vietnameseNames = {
  male: [
    "Nguyễn Văn Anh",
    "Trần Minh Tùng",
    "Lê Quang Huy",
    "Phạm Đức Thắng",
    "Hoàng Việt Dũng",
    "Võ Minh Khoa",
    "Đỗ Thanh Long",
    "Bùi Quốc Huy",
    "Đinh Văn Nam",
    "Lý Minh Tuấn",
    "Ngô Đức Anh",
    "Dương Văn Hải",
    "Tạ Minh Quân",
    "Vũ Đình Khang",
    "Mai Quốc Việt",
    "Chu Văn Đức",
    "Phan Minh Tâm",
    "Lưu Quang Minh",
    "Hồ Văn Thành",
    "Cao Minh Hưng",
    "Trương Đức Duy",
    "Lê Văn Hoàng",
    "Nguyễn Minh Phúc",
    "Trần Quốc Bảo",
    "Phạm Văn Tú",
    "Hoàng Minh Đức",
    "Võ Quang Hùng",
    "Đỗ Văn Thịnh",
    "Bùi Minh Tài",
    "Đinh Quốc Dũng",
    "Lý Văn Phong",
    "Ngô Minh Hiếu",
    "Dương Quốc Trung",
    "Tạ Văn Lâm",
    "Vũ Minh Sơn",
    "Mai Quang Tuấn",
    "Chu Văn Hưng",
    "Phan Minh Nhật",
    "Lưu Quốc Khánh",
    "Hồ Minh Đạt",
    "Cao Văn Thắng",
    "Trương Minh An",
    "Lê Quốc Huy",
    "Nguyễn Văn Kiệt",
    "Trần Minh Khôi",
    "Phạm Quang Duy",
    "Hoàng Văn Bình",
    "Võ Minh Tân",
    "Đỗ Quốc Tuấn",
    "Bùi Văn Hòa",
  ],
  female: [
    "Nguyễn Thị Lan",
    "Trần Thu Hương",
    "Lê Thị Mai",
    "Phạm Thu Thảo",
    "Hoàng Thị Linh",
    "Võ Thu Hà",
    "Đỗ Thị Ngọc",
    "Bùi Thu Trang",
    "Đinh Thị Hoa",
    "Lý Thu Huyền",
    "Ngô Thị Ánh",
    "Dương Thu Phương",
    "Tạ Thị Loan",
    "Vũ Thu Giang",
    "Mai Thị Vân",
    "Chu Thu Hằng",
    "Phan Thị Yến",
    "Lưu Thu Hiền",
    "Hồ Thị Bích",
    "Cao Thu Hoài",
    "Trương Thị Diệu",
    "Lê Thu Nga",
    "Nguyễn Thị Xuân",
    "Trần Thu Dung",
    "Phạm Thị Kim",
    "Hoàng Thu Thủy",
    "Võ Thị Hạnh",
    "Đỗ Thu Huyền",
    "Bùi Thị Thanh",
    "Đinh Thu Quỳnh",
    "Lý Thị Phượng",
    "Ngô Thu Hiếu",
    "Dương Thị Tâm",
    "Tạ Thu Linh",
    "Vũ Thị Hồng",
    "Mai Thu Tuyết",
    "Chu Thị Hạnh",
    "Phan Thu Nhung",
    "Lưu Thị Cẩm",
    "Hồ Thu Thúy",
    "Cao Thị Mỹ",
    "Trương Thu Hà",
    "Lê Thị Bảo",
    "Nguyễn Thu Phương",
    "Trần Thị Minh",
    "Phạm Thu Hằng",
    "Hoàng Thị Duyên",
    "Võ Thu Tâm",
    "Đỗ Thị Lệ",
    "Bùi Thu Hiền",
  ],
};

// Vietnam locations (Ho Chi Minh City and Hanoi)
const vietnamLocations = {
  "Ho Chi Minh City": [
    {
      name: "Quận 1",
      coords: [106.7008, 10.7769],
      address: "Quận 1, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận 3",
      coords: [106.6917, 10.7756],
      address: "Quận 3, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận 5",
      coords: [106.6753, 10.7572],
      address: "Quận 5, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận 7",
      coords: [106.7219, 10.7333],
      address: "Quận 7, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận Bình Thạnh",
      coords: [106.7136, 10.8008],
      address: "Quận Bình Thạnh, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận Tân Bình",
      coords: [106.6528, 10.8006],
      address: "Quận Tân Bình, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận Gò Vấp",
      coords: [106.6772, 10.8372],
      address: "Quận Gò Vấp, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận Phú Nhuận",
      coords: [106.6881, 10.7975],
      address: "Quận Phú Nhuận, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận 2",
      coords: [106.7431, 10.7544],
      address: "Quận 2, TP. Hồ Chí Minh, Việt Nam",
    },
    {
      name: "Quận 4",
      coords: [106.7053, 10.7575],
      address: "Quận 4, TP. Hồ Chí Minh, Việt Nam",
    },
  ],
  Hanoi: [
    {
      name: "Quận Hoàn Kiếm",
      coords: [105.8542, 21.0285],
      address: "Quận Hoàn Kiếm, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Ba Đình",
      coords: [105.8342, 21.0369],
      address: "Quận Ba Đình, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Đống Đa",
      coords: [105.8278, 21.0139],
      address: "Quận Đống Đa, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Hai Bà Trưng",
      coords: [105.8619, 21.0139],
      address: "Quận Hai Bà Trưng, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Hoàng Mai",
      coords: [105.8681, 20.9819],
      address: "Quận Hoàng Mai, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Long Biên",
      coords: [105.8969, 21.0467],
      address: "Quận Long Biên, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Nam Từ Liêm",
      coords: [105.7647, 21.0381],
      address: "Quận Nam Từ Liêm, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Bắc Từ Liêm",
      coords: [105.7542, 21.0631],
      address: "Quận Bắc Từ Liêm, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Thanh Xuân",
      coords: [105.8053, 20.9908],
      address: "Quận Thanh Xuân, Hà Nội, Việt Nam",
    },
    {
      name: "Quận Cầu Giấy",
      coords: [105.7897, 21.0328],
      address: "Quận Cầu Giấy, Hà Nội, Việt Nam",
    },
  ],
};

// Zodiac signs
const zodiacs = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// Utility functions
const getRandomElement = (arr: any) =>
  arr[Math.floor(Math.random() * arr.length)];
const getRandomElements = (arr: any, min: any, max: any) => {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
const getRandomInt = (min: any, max: any) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomBirthDate = () => {
  const start = new Date(1990, 0, 1);
  const end = new Date(2002, 11, 31);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Generate random weights that sum to 10
const generateWeights = () => {
  let weights = [
    getRandomInt(1, 4), // interest_weight
    getRandomInt(1, 4), // distance_weight
    getRandomInt(1, 4), // zodiac_weight
    getRandomInt(1, 4), // age_weight
  ];

  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum !== 10) {
    // Adjust the first weight to make sum = 10
    weights[0] = weights[0] + (10 - sum);
    // Ensure no negative weights
    if (weights[0] < 1) {
      weights = [3, 3, 2, 2]; // fallback
    }
  }

  return weights;
};

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // // Clear existing data
    // console.log("🧹 Clearing existing data...");
    // await User.deleteMany({});
    // await Profile.deleteMany({});
    // await UserCondition.deleteMany({});
    // await Relationship.deleteMany({});

    // Get existing interests
    console.log("📋 Fetching existing interests...");
    const interests = await Interest.find();
    console.log(interests, "interests");
    if (interests.length === 0) {
      throw new Error(
        "No interests found in database. Please seed interests first."
      );
    }
    console.log(`Found ${interests.length} interests`);

    // Generate users
    console.log("👥 Creating 100 users...");
    const users = [];
    const profiles = [];
    const conditions = [];

    // Get all location options
    const allLocations = [
      ...vietnamLocations["Ho Chi Minh City"],
      ...vietnamLocations["Hanoi"],
    ];

    for (let i = 0; i < 100; i++) {
      const gender = Math.random() > 0.5 ? "male" : "female";
      const name = getRandomElement(vietnameseNames[gender]);
      const email = `user${i + 1}@example.com`;
      const password = await bcrypt.hash("123456", 10);
      const location = getRandomElement(allLocations);
      const birthDate = getRandomBirthDate();
      const userInterests = getRandomElements(interests, 6, 10);
      const weights = generateWeights();

      // Create user
      const user = new User({
        name,
        email,
        password,
        avatar: `https://i.pravatar.cc/300?img=${i + 1}`,
        phone: `+84${getRandomInt(900000000, 999999999)}`,
        isAdmin: false,
      });

      users.push(user);

      // Create profile
      const profile = new Profile({
        userId: user._id,
        gender,
        address: {
          formattedAddress: location.address,
          city: location.address.includes("Hồ Chí Minh")
            ? "Ho Chi Minh City"
            : "Hanoi",
          country: "Vietnam",
        },
        location: {
          type: "Point",
          coordinates: [
            location.coords[0] + (Math.random() - 0.5) * 0.01, // Add small random offset
            location.coords[1] + (Math.random() - 0.5) * 0.01,
          ],
        },
        bio: "",
        interests: userInterests.map((interest) => interest._id),
        birthDate,
        zodiac: getRandomElement(zodiacs),
        isActivated: true,
      });

      profiles.push(profile);

      // Create condition
      const condition = new UserCondition({
        userId: user._id,
        desired_gender: getRandomElement(["male", "female", "another"]),
        max_distance_km: getRandomInt(5, 50),
        interest_weight: weights[0],
        distance_weight: weights[1],
        zodiac_weight: weights[2],
        age_weight: weights[3],
        max_age_difference: getRandomInt(2, 10),
      });

      conditions.push(condition);

      if ((i + 1) % 20 === 0) {
        console.log(`Created ${i + 1} users...`);
      }
    }

    // Save all users, profiles, and conditions
    console.log("💾 Saving users to database...");
    await User.insertMany(users);

    console.log("💾 Saving profiles to database...");
    await Profile.insertMany(profiles);

    console.log("💾 Saving conditions to database...");
    await UserCondition.insertMany(conditions);

    // Create relationships
    console.log("💕 Creating relationships...");
    const relationships = [];

    for (let i = 0; i < users.length; i++) {
      const crushCount = getRandomInt(3, 7);
      const currentUser = users[i];

      // Get random users to crush on (excluding self)
      const potentialCrushes = users.filter((_, index) => index !== i);
      const crushTargets = getRandomElements(
        potentialCrushes,
        crushCount,
        crushCount
      );

      for (const target of crushTargets) {
        relationships.push(
          new Relationship({
            senderId: currentUser._id,
            receiverId: target._id,
            type: "crush",
            status: "pending",
          })
        );
      }
    }

    console.log("💾 Saving relationships to database...");
    await Relationship.insertMany(relationships);

    // Summary
    console.log("\n🎉 Seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   👥 Users created: ${users.length}`);
    console.log(`   📍 Profiles created: ${profiles.length}`);
    console.log(`   ⚙️  Conditions created: ${conditions.length}`);
    console.log(`   💕 Relationships created: ${relationships.length}`);
    console.log(`   🎯 Interests used: ${interests.length}`);

    // Sample data info
    console.log("\n📋 Sample data info:");
    console.log(`   🏙️  Cities: Ho Chi Minh City, Hanoi`);
    console.log(`   🎂 Age range: 22-34 years old`);
    console.log(`   🎨 Interests per user: 6-10`);
    console.log(`   💕 Crushes per user: 3-7`);
    console.log(`   ⚖️  All condition weights sum to 10`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
};

// Execute seeder
const runSeeder = async () => {
  try {
    // Connect to MongoDB
    mongoose.set("strictQuery", false);
    mongoose
      .connect(
        `mongodb+srv://21522185:TQKhai21522185@cluster0.87r1let.mongodb.net/CupidEchoTestData?retryWrites=true&w=majority`
      )
      .then(() => {
        console.log("Connect Db success!");
      })
      .catch((err) => {
        console.log(err);
      });

    await seedDatabase();

    console.log("✅ Seeding process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("💥 Seeding process failed:", error);
    process.exit(1);
  }
};

// Export functions for use in other files
export { seedDatabase, runSeeder };

// Run seeder if this file is executed directly
runSeeder();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User, Profile, UserCondition, Relationship } from "./models"; // Adjust path as needed
import Interest from "./models/interest";

// TPHCM locations - chỉ dùng các quận gần nhau để dễ test
const hcmcLocations = [
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
    name: "Quận Phú Nhuận",
    coords: [106.6881, 10.7975],
    address: "Quận Phú Nhuận, TP. Hồ Chí Minh, Việt Nam",
  },
];

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

// Demo users data - 6 nam + 6 nữ, được thiết kế để tạo ra matches thú vị
const demoUsers = [
  // MALE USERS (6 users)
  {
    name: "Nguyễn Văn Anh",
    email: "male1@demo.com",
    gender: "male",
    birthDate: new Date(1995, 2, 15), // 29 tuổi, Pisces
    zodiac: "Pisces",
    location: hcmcLocations[0], // Quận 1
    interests: ["technology", "travel", "music", "photography", "cooking"], // 5 interests
    condition: {
      desired_gender: "female",
      max_distance_km: 15,
      interest_weight: 4, // High priority on interests
      distance_weight: 2,
      zodiac_weight: 2,
      age_weight: 2,
      max_age_difference: 5,
    },
  },
  {
    name: "Trần Minh Tùng",
    email: "male2@demo.com",
    gender: "male",
    birthDate: new Date(1993, 6, 22), // 31 tuổi, Cancer
    zodiac: "Cancer",
    location: hcmcLocations[1], // Quận 3
    interests: ["sports", "travel", "music", "food", "movies"], // 5 interests
    condition: {
      desired_gender: "female",
      max_distance_km: 20,
      interest_weight: 3,
      distance_weight: 3, // Moderate distance priority
      zodiac_weight: 2,
      age_weight: 2,
      max_age_difference: 3,
    },
  },
  {
    name: "Lê Quang Huy",
    email: "male3@demo.com",
    gender: "male",
    birthDate: new Date(1996, 9, 8), // 28 tuổi, Libra
    zodiac: "Libra",
    location: hcmcLocations[2], // Quận 5
    interests: ["art", "music", "reading", "photography", "travel"], // 5 interests
    condition: {
      desired_gender: "female",
      max_distance_km: 10,
      interest_weight: 2,
      distance_weight: 4, // High priority on distance
      zodiac_weight: 3,
      age_weight: 1,
      max_age_difference: 4,
    },
  },
  {
    name: "Phạm Đức Thắng",
    email: "male4@demo.com",
    gender: "male",
    birthDate: new Date(1994, 11, 3), // 30 tuổi, Sagittarius
    zodiac: "Sagittarius",
    location: hcmcLocations[3], // Quận 7
    interests: ["fitness", "technology", "travel", "music", "gaming"], // 5 interests
    condition: {
      desired_gender: "female",
      max_distance_km: 25,
      interest_weight: 3,
      distance_weight: 1, // Low distance priority
      zodiac_weight: 3,
      age_weight: 3, // Higher age priority
      max_age_difference: 6,
    },
  },
  {
    name: "Hoàng Việt Dũng",
    email: "male5@demo.com",
    gender: "male",
    birthDate: new Date(1992, 4, 18), // 32 tuổi, Taurus
    zodiac: "Taurus",
    location: hcmcLocations[4], // Quận Bình Thạnh
    interests: ["cooking", "food", "travel", "photography", "nature"], // 5 interests
    condition: {
      desired_gender: "female",
      max_distance_km: 12,
      interest_weight: 4, // High interest priority
      distance_weight: 2,
      zodiac_weight: 2,
      age_weight: 2,
      max_age_difference: 4,
    },
  },
  {
    name: "Võ Minh Khoa",
    email: "male6@demo.com",
    gender: "male",
    birthDate: new Date(1997, 1, 25), // 27 tuổi, Aquarius
    zodiac: "Aquarius",
    location: hcmcLocations[5], // Quận Phú Nhuận
    interests: ["technology", "gaming", "music", "movies", "sports"], // 5 interests
    condition: {
      desired_gender: "female",
      max_distance_km: 18,
      interest_weight: 2,
      distance_weight: 2,
      zodiac_weight: 4, // High zodiac priority
      age_weight: 2,
      max_age_difference: 5,
    },
  },

  // FEMALE USERS (6 users)
  {
    name: "Nguyễn Thị Lan",
    email: "female1@demo.com",
    gender: "female",
    birthDate: new Date(1995, 8, 12), // 29 tuổi, Virgo
    zodiac: "Virgo",
    location: hcmcLocations[0], // Quận 1 - same as Anh
    interests: ["photography", "travel", "art", "reading", "music"], // 3 common với Anh
    condition: {
      desired_gender: "male",
      max_distance_km: 20,
      interest_weight: 4, // High interest priority
      distance_weight: 2,
      zodiac_weight: 2,
      age_weight: 2,
      max_age_difference: 4,
    },
  },
  {
    name: "Trần Thu Hương",
    email: "female2@demo.com",
    gender: "female",
    birthDate: new Date(1994, 3, 7), // 30 tuổi, Aries
    zodiac: "Aries",
    location: hcmcLocations[1], // Quận 3 - same as Tùng
    interests: ["cooking", "food", "travel", "movies", "nature"], // 3 common với Tùng
    condition: {
      desired_gender: "male",
      max_distance_km: 15,
      interest_weight: 3,
      distance_weight: 3,
      zodiac_weight: 2,
      age_weight: 2,
      max_age_difference: 3,
    },
  },
  {
    name: "Lê Thị Mai",
    email: "female3@demo.com",
    gender: "female",
    birthDate: new Date(1996, 5, 20), // 28 tuổi, Gemini
    zodiac: "Gemini",
    location: hcmcLocations[2], // Quận 5 - same as Huy
    interests: ["art", "photography", "reading", "music", "travel"], // 5 common với Huy!
    condition: {
      desired_gender: "male",
      max_distance_km: 12,
      interest_weight: 3,
      distance_weight: 4, // High distance priority
      zodiac_weight: 2,
      age_weight: 1,
      max_age_difference: 5,
    },
  },
  {
    name: "Phạm Thu Thảo",
    email: "female4@demo.com",
    gender: "female",
    birthDate: new Date(1993, 10, 15), // 31 tuổi, Scorpio
    zodiac: "Scorpio",
    location: hcmcLocations[3], // Quận 7 - same as Thắng
    interests: ["fitness", "travel", "music", "technology", "photography"], // 4 common với Thắng
    condition: {
      desired_gender: "male",
      max_distance_km: 30,
      interest_weight: 3,
      distance_weight: 1, // Low distance priority
      zodiac_weight: 3,
      age_weight: 3,
      max_age_difference: 7,
    },
  },
  {
    name: "Hoàng Thị Linh",
    email: "female5@demo.com",
    gender: "female",
    birthDate: new Date(1994, 7, 9), // 30 tuổi, Leo
    zodiac: "Leo",
    location: hcmcLocations[4], // Quận Bình Thạnh - same as Dũng
    interests: ["cooking", "food", "photography", "nature", "art"], // 4 common với Dũng
    condition: {
      desired_gender: "male",
      max_distance_km: 14,
      interest_weight: 4, // High interest priority
      distance_weight: 2,
      zodiac_weight: 2,
      age_weight: 2,
      max_age_difference: 3,
    },
  },
  {
    name: "Võ Thu Hà",
    email: "female6@demo.com",
    gender: "female",
    birthDate: new Date(1998, 0, 30), // 26 tuổi, Aquarius - same as Khoa!
    zodiac: "Aquarius",
    location: hcmcLocations[5], // Quận Phú Nhuận - same as Khoa
    interests: ["technology", "music", "movies", "gaming", "travel"], // 4 common với Khoa
    condition: {
      desired_gender: "male",
      max_distance_km: 16,
      interest_weight: 2,
      distance_weight: 2,
      zodiac_weight: 4, // High zodiac priority
      age_weight: 2,
      max_age_difference: 6,
    },
  },
];

const seedDemoUsers = async () => {
  try {
    console.log("🌱 Starting demo database seeding (12 users)...");

    // // Clear existing data
    // console.log("🧹 Clearing existing data...");
    // await User.deleteMany({});
    // await Profile.deleteMany({});
    // await UserCondition.deleteMany({});
    // await Relationship.deleteMany({});

    // Get existing interests
    console.log("📋 Fetching existing interests...");
    const interests = await Interest.find();
    if (interests.length === 0) {
      throw new Error(
        "No interests found in database. Please seed interests first."
      );
    }

    // Create interest name to ID mapping
    const interestMap = new Map();
    interests.forEach((interest) => {
      interestMap.set(interest.name.toLowerCase(), interest._id);
    });

    console.log("👥 Creating 12 demo users...");
    const users = [];
    const profiles = [];
    const conditions = [];

    for (let i = 0; i < demoUsers.length; i++) {
      const userData = demoUsers[i];
      const password = await bcrypt.hash("123456", 10);

      // Create user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password,
        avatar: `https://i.pravatar.cc/300?img=${i + 1}`,
        phone: `+84${900000000 + i}`,
        isAdmin: false,
      });
      users.push(user);

      // Map interest names to IDs
      const userInterestIds = userData.interests
        .map((interestName) => interestMap.get(interestName.toLowerCase()))
        .filter((id) => id !== undefined);

      // Create profile
      const profile = new Profile({
        userId: user._id,
        gender: userData.gender,
        address: {
          formattedAddress: userData.location.address,
          city: "Ho Chi Minh City",
          country: "Vietnam",
        },
        location: {
          type: "Point",
          coordinates: userData.location.coords,
        },
        bio: "",
        interests: userInterestIds,
        birthDate: userData.birthDate,
        zodiac: userData.zodiac,
        isActivated: true,
      });
      profiles.push(profile);

      // Create condition
      const condition = new UserCondition({
        userId: user._id,
        desired_gender: userData.condition.desired_gender,
        max_distance_km: userData.condition.max_distance_km,
        interest_weight: userData.condition.interest_weight,
        distance_weight: userData.condition.distance_weight,
        zodiac_weight: userData.condition.zodiac_weight,
        age_weight: userData.condition.age_weight,
        max_age_difference: userData.condition.max_age_difference,
      });
      conditions.push(condition);
    }

    // Save all users, profiles, and conditions
    console.log("💾 Saving to database...");
    await User.insertMany(users);
    await Profile.insertMany(profiles);
    await UserCondition.insertMany(conditions);

    // Summary với thông tin chi tiết để demo
    console.log("\n🎉 Demo seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   👥 Users created: ${users.length} (6 males, 6 females)`);
    console.log(`   📍 All users in Ho Chi Minh City`);
    console.log(`   🎂 Age range: 26-32 years old`);
    console.log(`   🎯 Each user has 5 interests`);
    console.log(`   ⚖️  All condition weights sum to 10`);

    console.log("\n🎮 Demo Scenarios for Testing:");
    console.log("1. Perfect matches by location + interests:");
    console.log("   - Anh (Q1) + Lan (Q1): 3 common interests");
    console.log("   - Huy (Q5) + Mai (Q5): 5 common interests");
    console.log("   - Dũng (BT) + Linh (BT): 4 common interests");

    console.log("\n2. Zodiac compatibility:");
    console.log("   - Khoa (Aquarius) + Hà (Aquarius): Same zodiac");

    console.log("\n3. Mixed preferences:");
    console.log("   - Some prioritize interests, others distance/zodiac");
    console.log("   - Different age tolerances for variety");

    console.log("\n📧 Login credentials:");
    demoUsers.forEach((user, i) => {
      console.log(`   ${user.name}: ${user.email} / 123456`);
    });

    console.log("\n🧪 Ready for Gale-Shapley algorithm testing!");

    return {
      users: users.map((u) => u._id),
      summary: {
        males: users.slice(0, 6).map((u) => ({ id: u._id, name: u.name })),
        females: users.slice(6, 12).map((u) => ({ id: u._id, name: u.name })),
      },
    };
  } catch (error) {
    console.error("❌ Demo seeding failed:", error);
    throw error;
  }
};

// Execute seeder
const runDemoSeeder = async () => {
  try {
    // Connect to MongoDB
    mongoose.set("strictQuery", false);
    await mongoose.connect(
      `mongodb+srv://21522185:TQKhai21522185@cluster0.87r1let.mongodb.net/CupidEchoTestData?retryWrites=true&w=majority`
    );
    console.log("Connect Db success!");

    const result = await seedDemoUsers();

    console.log("✅ Demo seeding process completed successfully!");
    console.log("🎯 User IDs for testing:", result.users);

    process.exit(0);
  } catch (error) {
    console.error("💥 Demo seeding process failed:", error);
    process.exit(1);
  }
};

// Export functions
export { seedDemoUsers, runDemoSeeder };

// Run seeder if this file is executed directly
runDemoSeeder();

import { Profile, UserCondition, ZodiacCompatibility } from "../../models";
import Redis from "../../config/redis"; // Giả sử đây là đường dẫn đến file Redis của bạn
import { Types } from "mongoose";

interface UserWithPreferences {
  userId: string;
  preferences: string[];
  currentMatch?: string;
}

async function calculateMatchScore(
  user1Id: string,
  user2Id: string
): Promise<number> {
  const cacheKey = `match_score:${user1Id}:${user2Id}`;
  const redis = await Redis.getInstance();
  const client = redis.getClient();
  const cachedScore = await client.get(cacheKey);
  if (cachedScore) {
    return parseFloat(cachedScore);
  }

  console.log("*************************************************");
  console.log(`Calculating match score of ${user1Id} for ${user2Id}`);

  const [condition1, condition2, profile1, profile2] = await Promise.all([
    UserCondition.findOne({ userId: user1Id }),
    UserCondition.findOne({ userId: user2Id }),
    Profile.findOne({ userId: user1Id }),
    Profile.findOne({ userId: user2Id }),
  ]);

  if (!condition1 || !condition2 || !profile1 || !profile2) {
    console.log("Failed basic check");
    return 0;
  }

  console.log("passed basic check");

  if (
    condition1.desired_gender !== profile2.gender ||
    condition2.desired_gender !== profile1.gender
  ) {
    console.log("Failed gender check");
    return 0;
  }

  console.log("pass gender check");

  let distanceScore = 0;
  let interestScore = 0;
  let ageScore = 0;
  let zodiacScore = 0;

  if (profile1.location && profile2.location) {
    const distance = calculateDistance(
      profile1.location.coordinates,
      profile2.location.coordinates
    );
    if (distance > condition1.max_distance_km) {
      console.log(
        `Distance ${distance} exceeds max_distance_km ${condition1.max_distance_km}`
      );
      return 0;
    }
    // Chuẩn hóa distanceScore: 10 khi distance = 0, 0 khi distance = max_distance_km
    distanceScore = 10 * (1 - distance / condition1.max_distance_km);
  }

  const sharedInterests = profile1.interests.filter((interest) =>
    profile2.interests.includes(interest)
  );
  const totalInterests = new Set([...profile1.interests, ...profile2.interests])
    .size;
  const matchRatio = totalInterests
    ? sharedInterests.length / totalInterests
    : 0;
  interestScore = 10 * matchRatio;

  if (profile1.birthDate && profile2.birthDate) {
    const age1 = calculateAge(profile1.birthDate);
    const age2 = calculateAge(profile2.birthDate);
    const ageDiff = Math.abs(age1 - age2);
    const maxAgeDiff = Math.min(
      condition1.max_age_difference,
      condition2.max_age_difference
    );
    ageScore = 10 * (1 - ageDiff / (maxAgeDiff + 1));
  }

  if (profile1.zodiac !== "Unknown" && profile2.zodiac !== "Unknown") {
    console.log("tinh diem zodiac");
    zodiacScore = await calculateZodiacCompatibility(
      profile1.zodiac,
      profile2.zodiac
    );
  }

  const totalScore =
    (condition1.interest_weight * interestScore +
      condition1.distance_weight * distanceScore +
      condition1.age_weight * ageScore +
      condition1.zodiac_weight * zodiacScore) *
    0.1;

  console.log("detail score:");
  console.log(
    `interest score = interest weight/10 * interestScore = ${
      condition1.interest_weight / 10
    } * ${interestScore} = ${(condition1.interest_weight * interestScore) / 10}`
  );
  console.log(
    `distance score = distance weight/10 * distanceScore = ${
      condition1.distance_weight / 10
    } * ${distanceScore} = ${(condition1.distance_weight * distanceScore) / 10}`
  );
  console.log(
    `age score = age weight/10 * ageScore = ${
      condition1.age_weight / 10
    } * ${ageScore} = ${(condition1.age_weight * ageScore) / 10}`
  );
  console.log(
    `zodiac score = zodiac weight/10 * zodiacScore = ${
      condition1.zodiac_weight / 10
    } * ${zodiacScore} = ${(condition1.zodiac_weight * zodiacScore) / 10}`
  );
  console.log(`total score: ${totalScore}`);

  const finalScore = Math.min(10, Math.max(0, totalScore));
  console.log(`Score for ${user1Id} and ${user2Id}: ${finalScore}`);
  await client.setEx(cacheKey, 3600, finalScore.toString()); // Cache 1 giờ
  return finalScore;
}

export async function runStableMatching(
  activeUserIds: (string | Types.ObjectId)[]
): Promise<Map<string, string>> {
  // Chuẩn hóa activeUserIds thành string
  const normalizedUserIds = activeUserIds.map((id) =>
    id instanceof Types.ObjectId ? id.toString() : id.toString()
  );

  // Lọc trước dựa trên giới tính và khoảng cách
  const users: UserWithPreferences[] = [];
  const profiles = await Profile.find({ userId: { $in: normalizedUserIds } });
  const conditions = await UserCondition.find({
    userId: { $in: normalizedUserIds },
  });

  // Chuẩn hóa userId thành string khi tạo Map
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const conditionMap = new Map(conditions.map((c) => [c.userId.toString(), c]));

  for (const userId of normalizedUserIds) {
    const profile = profileMap.get(userId);
    const condition = conditionMap.get(userId);
    if (!profile || !condition) continue;

    const preferences: { candidateId: string; score: number }[] = [];
    for (const candidateId of normalizedUserIds) {
      if (userId === candidateId) continue;

      const candidateProfile = profileMap.get(candidateId);
      const candidateCondition = conditionMap.get(candidateId);
      if (!candidateProfile || !candidateCondition) continue;

      // Lọc trước dựa trên giới tính và khoảng cách
      if (
        condition.desired_gender !== candidateProfile.gender ||
        candidateCondition.desired_gender !== profile.gender
      ) {
        continue;
      }

      if (profile.location && candidateProfile.location) {
        const distance = calculateDistance(
          profile.location.coordinates,
          candidateProfile.location.coordinates
        );
        if (distance > condition.max_distance_km) {
          continue;
        }
      }

      const score = await calculateMatchScore(userId, candidateId);
      console.log(`Score for ${userId} and ${candidateId}: ${score}`);
      if (score > 0) {
        preferences.push({ candidateId, score });
      }
    }

    if (preferences.length === 0) continue; // Bỏ qua người dùng không có ứng viên

    preferences.sort((a, b) => b.score - a.score);
    users.push({
      userId,
      preferences: preferences.map((p) => p.candidateId),
    });
  }

  const matches = new Map<string, string>();
  const freeUsers = [...users];
  const proposalIndex = new Map<string, number>();
  for (const user of users) {
    proposalIndex.set(user.userId, 0);
  }

  while (freeUsers.length > 0) {
    const proposer = freeUsers[0];
    const index = proposalIndex.get(proposer.userId)!;

    if (index >= proposer.preferences.length) {
      freeUsers.shift();
      continue;
    }

    const candidateId = proposer.preferences[index];
    const candidate = users.find((u) => u.userId === candidateId);
    if (!candidate) {
      proposalIndex.set(proposer.userId, index + 1);
      continue;
    }

    proposalIndex.set(proposer.userId, index + 1);

    if (!candidate.currentMatch) {
      proposer.currentMatch = candidateId;
      candidate.currentMatch = proposer.userId;
      matches.set(proposer.userId, candidateId);
      matches.set(candidateId, proposer.userId);
      freeUsers.shift();
    } else {
      const currentPartnerId = candidate.currentMatch;
      const currentPartner = users.find((u) => u.userId === currentPartnerId);
      const currentPartnerRank = candidate.preferences.indexOf(
        currentPartnerId!
      );
      const proposerRank = candidate.preferences.indexOf(proposer.userId);

      if (proposerRank < currentPartnerRank) {
        if (currentPartner) {
          currentPartner.currentMatch = undefined;
          freeUsers.push(currentPartner);
        }
        proposer.currentMatch = candidateId;
        candidate.currentMatch = proposer.userId;
        matches.set(proposer.userId, candidateId);
        matches.set(candidateId, proposer.userId);
        freeUsers.shift();
      }
    }
  }

  return matches;
}

function calculateDistance(coord1: number[], coord2: number[]): number {
  if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) {
    return Infinity;
  }
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateAge(birthDate: Date): number {
  if (!(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return 0;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

async function calculateZodiacCompatibility(
  zodiac1: string,
  zodiac2: string
): Promise<number> {
  const zodiacScore = await ZodiacCompatibility.findOne({
    zodiacSign: zodiac1,
  });
  return zodiacScore?.compatibility.get(zodiac2) || 0;
}

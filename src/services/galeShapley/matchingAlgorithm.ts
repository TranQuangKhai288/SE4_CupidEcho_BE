import {
  Profile,
  UserCondition,
  ZodiacCompatibility,
  User,
} from "../../models";
import Redis from "../../config/redis"; // Giả sử đây là đường dẫn đến file Redis của bạn
import { Types } from "mongoose";

interface UserInfo {
  id: string;
  name: string;
  email: string;
  profile: {
    gender: string;
    location: {
      type: "Point";
      coordinates: number[];
    };
    interests: string[];
    birthDate: Date;
    zodiac: string;
  };
  condition: {
    desired_gender: string;
    max_distance_km: number;
    interest_weight: number;
    distance_weight: number;
    zodiac_weight: number;
    age_weight: number;
    max_age_difference: number;
  };
}

interface CandidateRef {
  id: string;
  score: number;
}

interface UserWithRefs extends UserInfo {
  references: CandidateRef[];
}
type MatchMap = Map<string, string>;

function combineUserInfo(
  users: any[],
  profiles: any[],
  conditions: any[]
): UserInfo[] {
  // Tạo một map từ userId để dễ tra cứu profiles và conditions
  const profileMap = new Map<string, any>(
    profiles.map((p) => [p.userId.toString(), p])
  );
  const conditionMap = new Map<string, any>(
    conditions.map((c) => [c.userId.toString(), c])
  );

  // Chuyển đổi dữ liệu
  return users.map((user) => {
    const userId = user._id.toString();
    const profile = profileMap.get(userId);
    const condition = conditionMap.get(userId);

    return {
      id: userId,
      name: user.name,
      email: user.email,
      profile: profile
        ? {
            gender: profile.gender,
            location: {
              type: profile.location.type,
              coordinates: profile.location.coordinates,
            },
            interests: profile.interests.map((id: any) => id.toString()),
            birthDate: profile.birthDate,
            zodiac: profile.zodiac,
          }
        : {
            gender: "",
            location: { type: "Point", coordinates: [0, 0] },
            interests: [],
            birthDate: new Date(),
            zodiac: "",
          }, // Giá trị mặc định nếu không có profile
      condition: condition
        ? {
            desired_gender: condition.desired_gender,
            max_distance_km: condition.max_distance_km,
            interest_weight: condition.interest_weight,
            distance_weight: condition.distance_weight,
            zodiac_weight: condition.zodiac_weight,
            age_weight: condition.age_weight,
            max_age_difference: condition.max_age_difference,
          }
        : {
            desired_gender: "",
            max_distance_km: 0,
            interest_weight: 0,
            distance_weight: 0,
            zodiac_weight: 0,
            age_weight: 0,
            max_age_difference: 0,
          }, // Giá trị mặc định nếu không có condition
    };
  });
}

// async function calculateMatchScore(
//   user1Id: string,
//   user2Id: string
// ): Promise<number> {
//   const cacheKey = `match_score:${user1Id}:${user2Id}`;
//   const redis = await Redis.getInstance();
//   const client = redis.getClient();
//   const cachedScore = await client.get(cacheKey);
//   if (cachedScore) {
//     return parseFloat(cachedScore);
//   }

//   console.log("*************************************************");
//   console.log(`Calculating match score of ${user1Id} for ${user2Id}`);

//   const [condition1, condition2, profile1, profile2] = await Promise.all([
//     UserCondition.findOne({ userId: user1Id }),
//     UserCondition.findOne({ userId: user2Id }),
//     Profile.findOne({ userId: user1Id }),
//     Profile.findOne({ userId: user2Id }),
//   ]);

//   if (!condition1 || !condition2 || !profile1 || !profile2) {
//     console.log("Failed basic check");
//     return 0;
//   }

//   console.log("passed basic check");

//   if (
//     condition1.desired_gender !== profile2.gender ||
//     condition2.desired_gender !== profile1.gender
//   ) {
//     console.log("Failed gender check");
//     return 0;
//   }

//   console.log("pass gender check");

//   let distanceScore = 0;
//   let interestScore = 0;
//   let ageScore = 0;
//   let zodiacScore = 0;

//   if (profile1.location && profile2.location) {
//     const distance = calculateDistance(
//       profile1.location.coordinates,
//       profile2.location.coordinates
//     );
//     if (distance > condition1.max_distance_km) {
//       console.log(
//         `Distance ${distance} exceeds max_distance_km ${condition1.max_distance_km}`
//       );
//       return 0;
//     }
//     // Chuẩn hóa distanceScore: 10 khi distance = 0, 0 khi distance = max_distance_km
//     distanceScore = 10 * (1 - distance / condition1.max_distance_km);
//   }

//   const sharedInterests = profile1.interests.filter((interest) =>
//     profile2.interests.includes(interest)
//   );
//   const totalInterests = new Set([...profile1.interests, ...profile2.interests])
//     .size;
//   const matchRatio = totalInterests
//     ? sharedInterests.length / totalInterests
//     : 0;
//   interestScore = 10 * matchRatio;

//   if (profile1.birthDate && profile2.birthDate) {
//     const age1 = calculateAge(profile1.birthDate);
//     const age2 = calculateAge(profile2.birthDate);
//     const ageDiff = Math.abs(age1 - age2);
//     const maxAgeDiff = Math.min(
//       condition1.max_age_difference,
//       condition2.max_age_difference
//     );
//     ageScore = 10 * (1 - ageDiff / (maxAgeDiff + 1));
//   }

//   if (profile1.zodiac !== "Unknown" && profile2.zodiac !== "Unknown") {
//     console.log("tinh diem zodiac");
//     zodiacScore = await calculateZodiacCompatibility(
//       profile1.zodiac,
//       profile2.zodiac
//     );
//   }

//   const totalScore =
//     (condition1.interest_weight * interestScore +
//       condition1.distance_weight * distanceScore +
//       condition1.age_weight * ageScore +
//       condition1.zodiac_weight * zodiacScore) *
//     0.1;

//   console.log("detail score:");
//   console.log(
//     `interest score = interest weight/10 * interestScore = ${
//       condition1.interest_weight / 10
//     } * ${interestScore} = ${(condition1.interest_weight * interestScore) / 10}`
//   );
//   console.log(
//     `distance score = distance weight/10 * distanceScore = ${
//       condition1.distance_weight / 10
//     } * ${distanceScore} = ${(condition1.distance_weight * distanceScore) / 10}`
//   );
//   console.log(
//     `age score = age weight/10 * ageScore = ${
//       condition1.age_weight / 10
//     } * ${ageScore} = ${(condition1.age_weight * ageScore) / 10}`
//   );
//   console.log(
//     `zodiac score = zodiac weight/10 * zodiacScore = ${
//       condition1.zodiac_weight / 10
//     } * ${zodiacScore} = ${(condition1.zodiac_weight * zodiacScore) / 10}`
//   );
//   console.log(`total score: ${totalScore}`);

//   const finalScore = Math.min(10, Math.max(0, totalScore));
//   console.log(`Score for ${user1Id} and ${user2Id}: ${finalScore}`);
//   await client.setEx(cacheKey, 3600, finalScore.toString()); // Cache 1 giờ
//   return finalScore;
// }

// export async function runStableMatching(
//   activeUserIds: (string | Types.ObjectId)[]
// ): Promise<Map<string, string>> {
//   // Chuẩn hóa activeUserIds thành string
//   const normalizedUserIds = activeUserIds.map((id) =>
//     id instanceof Types.ObjectId ? id.toString() : id.toString()
//   );

//   // Lọc trước dựa trên giới tính và khoảng cách
//   const users: UserWithPreferences[] = [];
//   const profiles = await Profile.find({ userId: { $in: normalizedUserIds } });
//   const conditions = await UserCondition.find({
//     userId: { $in: normalizedUserIds },
//   });

//   // Chuẩn hóa userId thành string khi tạo Map
//   const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
//   const conditionMap = new Map(conditions.map((c) => [c.userId.toString(), c]));

//   for (const userId of normalizedUserIds) {
//     const profile = profileMap.get(userId);
//     const condition = conditionMap.get(userId);
//     if (!profile || !condition) continue;

//     const preferences: { candidateId: string; score: number }[] = [];
//     for (const candidateId of normalizedUserIds) {
//       if (userId === candidateId) continue;

//       const candidateProfile = profileMap.get(candidateId);
//       const candidateCondition = conditionMap.get(candidateId);
//       if (!candidateProfile || !candidateCondition) continue;

//       // Lọc trước dựa trên giới tính và khoảng cách
//       if (
//         condition.desired_gender !== candidateProfile.gender ||
//         candidateCondition.desired_gender !== profile.gender
//       ) {
//         continue;
//       }

//       if (profile.location && candidateProfile.location) {
//         const distance = calculateDistance(
//           profile.location.coordinates,
//           candidateProfile.location.coordinates
//         );
//         if (distance > condition.max_distance_km) {
//           continue;
//         }
//       }

//       const score = await calculateMatchScore(userId, candidateId);
//       console.log(`Score for ${userId} and ${candidateId}: ${score}`);
//       if (score > 0) {
//         preferences.push({ candidateId, score });
//       }
//     }

//     if (preferences.length === 0) continue; // Bỏ qua người dùng không có ứng viên

//     preferences.sort((a, b) => b.score - a.score);
//     users.push({
//       userId,
//       preferences: preferences.map((p) => p.candidateId),
//     });
//   }

//   const matches = new Map<string, string>();
//   const freeUsers = [...users];
//   const proposalIndex = new Map<string, number>();
//   for (const user of users) {
//     proposalIndex.set(user.userId, 0);
//   }

//   while (freeUsers.length > 0) {
//     const proposer = freeUsers[0];
//     const index = proposalIndex.get(proposer.userId)!;

//     if (index >= proposer.preferences.length) {
//       freeUsers.shift();
//       continue;
//     }

//     const candidateId = proposer.preferences[index];
//     const candidate = users.find((u) => u.userId === candidateId);
//     if (!candidate) {
//       proposalIndex.set(proposer.userId, index + 1);
//       continue;
//     }

//     proposalIndex.set(proposer.userId, index + 1);

//     if (!candidate.currentMatch) {
//       proposer.currentMatch = candidateId;
//       candidate.currentMatch = proposer.userId;
//       matches.set(proposer.userId, candidateId);
//       matches.set(candidateId, proposer.userId);
//       freeUsers.shift();
//     } else {
//       const currentPartnerId = candidate.currentMatch;
//       const currentPartner = users.find((u) => u.userId === currentPartnerId);
//       const currentPartnerRank = candidate.preferences.indexOf(
//         currentPartnerId!
//       );
//       const proposerRank = candidate.preferences.indexOf(proposer.userId);

//       if (proposerRank < currentPartnerRank) {
//         if (currentPartner) {
//           currentPartner.currentMatch = undefined;
//           freeUsers.push(currentPartner);
//         }
//         proposer.currentMatch = candidateId;
//         candidate.currentMatch = proposer.userId;
//         matches.set(proposer.userId, candidateId);
//         matches.set(candidateId, proposer.userId);
//         freeUsers.shift();
//       }
//     }
//   }

//   return matches;
// }

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

export async function runStableMatching(
  activeUserIds: (string | Types.ObjectId)[]
): Promise<any> {
  const users = await loadUserInfos(activeUserIds);
  const { males, females } = splitByGender(users);
  console.log(males, "males");
  console.log(females, "females");

  // Build preference lists for both sides
  const malePrefs = await buildPreferenceLists(males, females);
  const femalePrefs = await buildPreferenceLists(females, males);

  console.log(malePrefs, "malePrefs");
  console.log(femalePrefs, "femalePrefs");

  // const maleIds = males.map((u) => u.id);
  // const femaleIds = females.map((u) => u.id);

  // Male proposes to female
  return galeShapley(malePrefs, femalePrefs);
}

export async function buildPreferenceLists(
  proposers: UserInfo[],
  receivers: UserInfo[]
): Promise<UserWithRefs[]> {
  const result: UserWithRefs[] = [];

  for (const p of proposers) {
    const refs: CandidateRef[] = [];

    for (const r of receivers) {
      // Lọc giới tính và khoảng cách
      if (
        p.condition.desired_gender !== r.profile.gender ||
        r.condition.desired_gender !== p.profile.gender
      )
        continue;
      const dist =
        p.profile.location && r.profile.location
          ? calculateDistance(
              p.profile.location.coordinates,
              r.profile.location.coordinates
            )
          : Infinity;
      if (dist > p.condition.max_distance_km) continue;

      // Tính điểm từng phần giống trước
      const distanceScore =
        dist === Infinity ? 0 : 10 * (1 - dist / p.condition.max_distance_km);
      const shared = p.profile.interests.filter((i) =>
        r.profile.interests.includes(i)
      ).length;
      const totalUnique = new Set([
        ...p.profile.interests,
        ...r.profile.interests,
      ]).size;
      const interestScore = totalUnique ? (shared / totalUnique) * 10 : 0;
      let ageScore = 0;
      if (p.profile.birthDate && r.profile.birthDate) {
        const ageDiff = Math.abs(
          calculateAge(p.profile.birthDate) - calculateAge(r.profile.birthDate)
        );
        const maxDiff = Math.min(
          p.condition.max_age_difference,
          r.condition.max_age_difference
        );
        ageScore = 10 * (1 - ageDiff / (maxDiff + 1));
      }
      const zodiacScore =
        p.profile.zodiac !== "Unknown" && r.profile.zodiac !== "Unknown"
          ? await calculateZodiacCompatibility(
              p.profile.zodiac,
              r.profile.zodiac
            )
          : 0;

      const total =
        distanceScore * (p.condition.distance_weight / 10) +
        interestScore * (p.condition.interest_weight / 10) +
        ageScore * (p.condition.age_weight / 10) +
        zodiacScore * (p.condition.zodiac_weight / 10);

      refs.push({ id: r.id, score: total });
    }

    // Sort refs by score desc
    refs.sort((a, b) => b.score - a.score);

    result.push({ ...p, references: refs });
  }

  return result;
}

export function galeShapley(
  maleSide: UserWithRefs[],
  femaleSide: UserWithRefs[]
): MatchMap {
  const freeMen = maleSide.map((m) => m.id);
  const nextProposalIndex = new Map<string, number>();
  const currentMatches = new Map<string, string>();

  // Khởi tạo
  maleSide.forEach((m) => nextProposalIndex.set(m.id, 0));
  [...maleSide, ...femaleSide].forEach((u) => currentMatches.set(u.id, ""));

  // Chuyển đổi điểm số thành thứ tự ưu tiên cho nam
  // (sắp xếp references theo điểm từ cao xuống thấp)
  for (const man of maleSide) {
    man.references.sort((a, b) => b.score - a.score);
  }

  // Xây map ưu tiên cho phụ nữ: femaleId -> map<maleId, preference value>
  // Điểm cao hơn = ưu tiên cao hơn
  const femalePreferences = new Map<string, Map<string, number>>();
  for (const woman of femaleSide) {
    const preferenceMap = new Map<string, number>();
    woman.references.forEach((ref) => preferenceMap.set(ref.id, ref.score));
    femalePreferences.set(woman.id, preferenceMap);
  }

  while (freeMen.length > 0) {
    const manId = freeMen.shift()!;
    const man = maleSide.find((m) => m.id === manId)!;
    const proposalIndex = nextProposalIndex.get(manId)!;

    // Kiểm tra nếu người đàn ông đã đề xuất với tất cả references
    if (proposalIndex >= man.references.length) {
      // Không còn ai để đề xuất, bỏ qua
      continue;
    }

    const womanId = man.references[proposalIndex].id;
    nextProposalIndex.set(manId, proposalIndex + 1);

    const currentManId = currentMatches.get(womanId);
    if (!currentManId) {
      // Phụ nữ chưa có match -> match ngay
      currentMatches.set(manId, womanId);
      currentMatches.set(womanId, manId);
    } else {
      // So sánh preference (dựa trên score)
      const preferences = femalePreferences.get(womanId)!;

      // Kiểm tra xem phụ nữ có preference với người đàn ông mới không
      const newManScore = preferences.get(manId);
      if (newManScore === undefined) {
        // Người phụ nữ không có preference với người đàn ông mới
        freeMen.push(manId);
        continue;
      }

      // Kiểm tra xem phụ nữ có preference với người đàn ông hiện tại không
      const currentManScore = preferences.get(currentManId);
      if (currentManScore === undefined) {
        // Người phụ nữ không có preference với người đàn ông hiện tại
        // Thay thế bằng người đàn ông mới
        currentMatches.set(currentManId, "");
        currentMatches.set(manId, womanId);
        currentMatches.set(womanId, manId);
        freeMen.push(currentManId);
      } else {
        // So sánh điểm số - điểm cao hơn = ưu tiên cao hơn
        if (newManScore > currentManScore) {
          // Người đàn ông mới có điểm cao hơn -> thay thế
          currentMatches.set(currentManId, "");
          currentMatches.set(manId, womanId);
          currentMatches.set(womanId, manId);
          freeMen.push(currentManId);
        } else {
          // Người đàn ông mới có điểm thấp hơn -> bị từ chối
          freeMen.push(manId);
        }
      }
    }
  }

  // Lọc ra cặp match
  const matches: MatchMap = new Map();
  for (const [personId, partnerId] of currentMatches.entries()) {
    if (partnerId && !matches.has(partnerId)) {
      matches.set(personId, partnerId);
    }
  }
  return matches;
}
export async function loadUserInfos(
  activeUserIds: (string | Types.ObjectId)[]
) {
  console.log(activeUserIds, "  activeUserIds");
  //get list user
  const users = await User.find({ _id: { $in: activeUserIds } }).lean();
  const [profiles, conditions] = await Promise.all([
    Profile.find({ userId: { $in: activeUserIds } }).lean(),
    UserCondition.find({ userId: { $in: activeUserIds } }).lean(),
  ]);

  const userInfoArray = combineUserInfo(users, profiles, conditions);
  return userInfoArray;
}

export function splitByGender(users: UserInfo[]): {
  males: UserInfo[];
  females: UserInfo[];
} {
  const males: UserInfo[] = [];
  const females: UserInfo[] = [];

  for (const u of users) {
    if (u.profile.gender === "male") males.push(u);
    else if (u.profile.gender === "female") females.push(u);
  }

  return { males, females };
}

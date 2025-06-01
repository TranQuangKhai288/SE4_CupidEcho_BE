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

export async function runStableMatching(
  activeUserIds: (string | Types.ObjectId)[]
): Promise<any> {
  const users = await loadUserInfos(activeUserIds);
  const { males, females } = splitByGender(users);

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

// Phi tuyến: e^-(d / λ) với λ = max_distance_km / ln(10)
function calculateDistanceScoreNonLinear(
  distance: number,
  maxDistance: number,
  minScore: number = 1, // Cho phép tuỳ chỉnh điểm thấp nhất
  maxScore: number = 10
): number {
  if (distance === Infinity || maxDistance === 0) return 0;
  if (distance <= 0) return maxScore;
  const lambda = maxDistance / Math.log(maxScore / minScore);
  const score = maxScore * Math.exp(-distance / lambda);
  console.log("Distance Score:", score);
  return Math.max(0, Math.min(maxScore, score));
}

function calculateInterestScore(
  userA: UserInfo,
  userB: UserInfo,
  alpha = 0.5,
  beta = 0.5
): number {
  const setA = new Set(userA.profile.interests);
  const setB = new Set(userB.profile.interests);

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const onlyA = new Set([...setA].filter((x) => !setB.has(x)));
  const onlyB = new Set([...setB].filter((x) => !setA.has(x)));

  const denominator =
    intersection.size + alpha * onlyA.size + beta * onlyB.size;
  const score = denominator === 0 ? 0 : (intersection.size / denominator) * 10;
  console.log("InterestScore (Tversky):", score);
  return score;
}
function calculateAgeScore(
  userA: UserInfo,
  userB: UserInfo,
  minScore: number = 4, // Cho phép tuỳ chỉnh điểm thấp nhất
  maxScore: number = 10
): number {
  if (!userA.profile.birthDate || !userB.profile.birthDate) return 0;
  const lambda =
    userA.condition.max_age_difference / Math.log(maxScore / minScore);

  const ageA = calculateAge(userA.profile.birthDate);
  const ageB = calculateAge(userB.profile.birthDate);
  const ageDiff = Math.abs(ageA - ageB);

  const score = maxScore * Math.exp(-ageDiff / lambda);
  console.log("Age Score: ", score);
  return score; // tránh chia cho 0
}

async function calculateZodiacScoreAsync(
  userA: UserInfo,
  userB: UserInfo
): Promise<number> {
  if (
    userA.profile.zodiac === "Unknown" ||
    userB.profile.zodiac === "Unknown"
  ) {
    return 0;
  }

  const zodiacScore = await ZodiacCompatibility.findOne({
    zodiacSign: userA.profile.zodiac,
  });
  const score = zodiacScore?.compatibility.get(userB.profile.zodiac) || 0;
  console.log("Zodiac Score: ", score);
  return score;
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
      console.log("pass gender");
      const distance =
        p.profile.location && r.profile.location
          ? calculateDistance(
              p.profile.location.coordinates,
              r.profile.location.coordinates
            )
          : Infinity;
      // if (distance > p.condition.max_distance_km) continue;
      // console.log("pass distance");

      // Tính điểm từng phần giống trước
      const distanceScore = calculateDistanceScoreNonLinear(
        distance,
        p.condition.max_distance_km
      );
      const ageScore = calculateAgeScore(p, r);

      const zodiacScore = await calculateZodiacScoreAsync(p, r);
      const interestScore = calculateInterestScore(p, r);

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

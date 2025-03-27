import { Profile, UserCondition, ZodiacCompatibility } from "../../models";

// Định nghĩa interface cho người dùng với danh sách ưu tiên
interface UserWithPreferences {
  userId: string;
  preferences: string[]; // Danh sách userId theo thứ tự ưu tiên
  currentMatch?: string; // Ghép đôi hiện tại (nếu có)
}

// Hàm tính điểm ghép đôi giữa hai người dùng (giữ nguyên từ mã của bạn)
async function calculateMatchScore(
  user1Id: string,
  user2Id: string
): Promise<number> {
  console.log("*************************************************");
  console.log(`Calculating match score of ${user1Id} for ${user2Id}`);
  const [condition1, condition2, profile1, profile2] = await Promise.all([
    UserCondition.findOne({ userId: user1Id }),
    UserCondition.findOne({ userId: user2Id }),
    Profile.findOne({ userId: user1Id }),
    Profile.findOne({ userId: user2Id }),
  ]);

  // Kiểm tra thông tin cơ bản
  if (!condition1 || !condition2 || !profile1 || !profile2) {
    return 0; // Không đủ thông tin để tính điểm
  }

  console.log("passed basic check");

  // Kiểm tra giới tính mong muốn
  if (
    condition1.desired_gender !== profile2.gender ||
    condition2.desired_gender !== profile1.gender
  ) {
    return 0;
  }

  console.log("pass gender check");
  let distanceScore = 0;
  let interestScore = 0;
  let ageScore = 0;
  let zodiacScore = 0;

  // Tính điểm dựa trên khoảng cách
  if (profile1.location && profile2.location) {
    const distance = calculateDistance(
      profile1.location.coordinates,
      profile2.location.coordinates
    );
    //nếu khoảng cách lớn hơn khoảng cách tối đa thì trả về 0
    if (distance > condition1.max_distance_km) {
      distanceScore = 0;
    } else {
      // Hàm logistic không đạt đúng 1 và 0 tại hai đầu nên bạn có thể chuẩn hóa thêm nếu cần:
      distanceScore =
        10 / (1 + Math.exp(1 * (distance - condition1.max_distance_km / 2)));
    }
  }

  // Tính điểm dựa trên sở thích chung
  const sharedInterests = profile1.interests.filter((interest) =>
    profile2.interests.includes(interest)
  );
  const matchRatio = sharedInterests.length / profile1.interests.length;

  if (matchRatio >= 0.8) {
    // Đạt ngưỡng tối đa
    interestScore = 10;
  } else {
    // Sử dụng đường cong mượt: hàm sigmoid được điều chỉnh
    // Điều chỉnh để ở 80% cho 10 điểm, và giảm dần khi tỷ lệ thấp hơn
    interestScore = 10 * (matchRatio / 0.8);

    // Làm cho đường cong mượt hơn bằng cách sử dụng hàm bậc 2
    // interestScore = 10 * Math.pow(matchRatio / 0.8, 2);

    // Hoặc dùng hàm căn bậc hai để tạo đường cong mượt khác
    // interestScore = 10 * Math.sqrt(matchRatio / 0.8);
  }

  // Tính điểm dựa trên tuổi
  if (profile1.birthDate && profile2.birthDate) {
    const age1 = calculateAge(profile1.birthDate);
    const age2 = calculateAge(profile2.birthDate);

    const ageDiff = Math.abs(age1 - age2);
    const maxAgeDiff = Math.min(
      condition1.max_age_difference,
      condition2.max_age_difference
    );
    ageScore = 10 * (1 - ageDiff / (maxAgeDiff + 1));
    // ((condition1.age_weight + condition2.age_weight) / 2);
  }

  // Tính điểm dựa trên cung hoàng đạo
  if (profile1.zodiac !== "Unknown" && profile2.zodiac !== "Unknown") {
    console.log("tinh diem zodiac");
    zodiacScore = await calculateZodiacCompatibility(
      profile1.zodiac,
      profile2.zodiac
    );
    //  ((condition1.zodiac_weight + condition2.zodiac_weight) / 2);
  }

  // Tính tổng điểm
  const totalScore =
    (condition1.interest_weight * interestScore +
      condition1.distance_weight * distanceScore +
      condition1.age_weight * ageScore +
      condition1.zodiac_weight * zodiacScore) *
    0.1;
  console.log("detail score:");
  console.log(
    "interest score = interest weight/10 * interestScore =",
    0.1 * condition1.interest_weight,
    " * ",
    interestScore,
    " = ",
    (condition1.interest_weight * interestScore) / 10
  );
  console.log(
    "distance score = distance weight/10 * distanceScore =",
    0.1 * condition1.distance_weight,
    " * ",
    distanceScore,
    " = ",
    (condition1.distance_weight * distanceScore) / 10
  );
  console.log(
    "age score = age weight/10 * ageScore =",
    0.1 * condition1.age_weight,
    " * ",
    ageScore,
    " = ",
    (condition1.age_weight * ageScore) / 10
  );

  console.log(
    "zodiac score = zodiac weight/10 * zodiacScore =",
    0.1 * condition1.zodiac_weight,
    " * ",
    zodiacScore,
    " = ",
    (condition1.zodiac_weight * zodiacScore) / 10
  );

  console.log("total score: ", totalScore);

  return Math.min(10, totalScore); // Điểm tối đa là 10
}
// Thuật toán Gale-Shapley chính xác
export async function runStableMatching(
  activeUserIds: string[]
): Promise<Map<string, string>> {
  // Chuẩn bị dữ liệu: Tính danh sách ưu tiên cho mỗi người dùng
  const users: UserWithPreferences[] = [];

  // Tạo danh sách ưu tiên cho từng người dùng
  for (const userId of activeUserIds) {
    const preferences: { candidateId: string; score: number }[] = [];

    for (const candidateId of activeUserIds) {
      if (userId === candidateId) continue; // Bỏ qua chính họ

      const score = await calculateMatchScore(userId, candidateId);
      console.log(`Score for ${userId} and ${candidateId}: ${score}`);
      if (score > 0) {
        preferences.push({ candidateId, score });
      }
    }

    // Sắp xếp theo điểm số giảm dần
    preferences.sort((a, b) => b.score - a.score);

    users.push({
      userId,
      preferences: preferences.map((p) => p.candidateId),
    });
  }

  // Khởi tạo trạng thái
  const matches = new Map<string, string>(); // Lưu trữ các ghép đôi
  const freeUsers = [...users]; // Danh sách người chưa ghép đôi
  const proposalIndex = new Map<string, number>(); // Theo dõi chỉ số đề xuất tiếp theo

  for (const user of users) {
    proposalIndex.set(user.userId, 0);
  }

  // Vòng lặp chính của Gale-Shapley
  while (freeUsers.length > 0) {
    const proposer = freeUsers[0]; // Người đề xuất
    const index = proposalIndex.get(proposer.userId)!;

    // Nếu không còn ứng viên để đề xuất, loại người này khỏi danh sách
    if (index >= proposer.preferences.length) {
      freeUsers.shift();
      continue;
    }

    const candidateId = proposer.preferences[index];
    const candidate = users.find((u) => u.userId === candidateId);

    if (!candidate) continue;

    // Tăng chỉ số đề xuất cho lần tiếp theo
    proposalIndex.set(proposer.userId, index + 1);

    // Nếu ứng viên chưa có ghép đôi
    if (!candidate.currentMatch) {
      proposer.currentMatch = candidateId;
      candidate.currentMatch = proposer.userId;
      matches.set(proposer.userId, candidateId);
      matches.set(candidateId, proposer.userId);
      freeUsers.shift();
    } else {
      // Ứng viên đã có ghép đôi, kiểm tra ưu tiên
      const currentPartnerId = candidate.currentMatch;
      const currentPartner = users.find((u) => u.userId === currentPartnerId);

      // Xếp hạng của người hiện tại và người mới trong danh sách ưu tiên của ứng viên
      const currentPartnerRank = candidate.preferences.indexOf(
        currentPartnerId!
      );
      const proposerRank = candidate.preferences.indexOf(proposer.userId);

      if (proposerRank < currentPartnerRank) {
        // Ứng viên thích người mới hơn
        if (currentPartner) {
          currentPartner.currentMatch = undefined; // Hủy ghép đôi cũ
          freeUsers.push(currentPartner); // Đưa người cũ vào danh sách tự do
        }
        proposer.currentMatch = candidateId;
        candidate.currentMatch = proposer.userId;
        matches.set(proposer.userId, candidateId);
        matches.set(candidateId, proposer.userId);
        freeUsers.shift();
      }
      // Nếu không, proposer tiếp tục đề xuất người tiếp theo trong lần lặp sau
    }
  }

  return matches;
}

// Hàm hỗ trợ (giữ nguyên từ mã của bạn)
function calculateDistance(coord1: number[], coord2: number[]): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Bán kính trái đất (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateAge(birthDate: Date): number {
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
  if (!zodiacScore) {
    return 0;
  }

  const score = zodiacScore.compatibility.get(zodiac2);

  return score || 0;
}

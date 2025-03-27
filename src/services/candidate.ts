// services/candidateService.ts
import { Profile, UserCondition } from "../models";

export const updateCandidateList = async (userId: string) => {
  console.log("Update candidate list");
  const userProfile = await Profile.findOne({ userId }).populate("interests");
  const userCondition = await UserCondition.findOne({ userId });
  if (!userProfile || !userCondition) return;

  const candidates = await Profile.find({
    gender: userCondition.desired_gender,
    _id: { $ne: userProfile._id },
  }).populate("interests");

  const candidateList = candidates.map((candidate) => ({
    candidateId: candidate.userId,
    // score: calculateMatchScore(userProfile, candidate, userCondition),
    score: 8, // Tạm thời để 8, cần cải thiện sau
  }));

  // Lọc và sắp xếp theo điểm số (ví dụ: chỉ lấy top 30 candidates)
  const topCandidates = candidateList
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30); // Giới hạn số lượng để tối ưu

  await UserCondition.updateOne(
    { userId },
    { $set: { candidateList: topCandidates } }
  );
};

export const updateAllCandidateLists = async () => {
  const conditions = await UserCondition.find();
  for (const condition of conditions) {
    await updateCandidateList(condition.userId.toString());
  }
};

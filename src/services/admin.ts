import { ZodiacCompatibility, Algorithm, MatchHistory } from "../models"; // Adjust the import path as needed

class AdminService {
  constructor() {
    // Initialize any properties or dependencies if needed
  }

  // Example method to get all users (you can add more methods as needed)
  async getZodiac() {
    try {
      const zodiac = await ZodiacCompatibility.find(); // Fetch all zodiac compatibility data from the database
      return zodiac; // Return the fetched data
    } catch (error) {
      console.error("Error fetching zodiac compatibility:", error);
      throw new Error("Failed to fetch zodiac compatibility data"); // Handle errors appropriately
    }
  }

  async getAlgorithmConstant() {
    try {
      const algorithmConstant = await Algorithm.findOne({}); // Fetch the algorithm constant from the database\
      console.log("Algorithm constant:", algorithmConstant);
      return algorithmConstant; // Return the fetched data
    } catch (error) {
      console.error("Error fetching algorithm constant:", error);
      throw new Error("Failed to fetch algorithm constant data"); // Handle errors appropriately
    }
  }
  async getMatchingHistory(page: number = 1, limit: number = 50) {
    try {
      const matchingHistory = await MatchHistory.find({}, null, {
        skip: (page - 1) * limit,
        limit: limit,
        sort: { createdAt: -1 }, // Sort by createdAt in descending order
      })
        .populate("user1")
        .populate("user2");
      // Fetch all matching history data from the database
      return matchingHistory; // Return the fetched data
    } catch (error) {
      console.error("Error fetching matching history:", error);
      throw new Error("Failed to fetch matching history data"); // Handle errors appropriately
    }
  }
}

export default AdminService;

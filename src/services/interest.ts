import Interest from "../models/interest";

class InterestService {
  constructor() {
    // Initialize any properties or dependencies if needed
  }
  async getAllInterests() {
    return await Interest.find().populate("groupId");
  }

  async getInterestById(id: string) {
    return await Interest.findById(id).populate("groupId");
  }

  async createInterest(data: any) {
    return await Interest.create(data);
  }

  async updateInterest(id: string, data: any) {
    return await Interest.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteInterest(id: string) {
    return await Interest.findByIdAndDelete(id);
  }
}

export default InterestService;

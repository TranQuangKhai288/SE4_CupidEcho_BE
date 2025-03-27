import { Relationship, User } from "../../models";
import { IRelationship } from "../../interfaces/relationship.interface";
import { IRelationshipRepository } from "../interfaces";

export class RelationshipMongoRepository implements IRelationshipRepository {
  async create(request: IRelationship): Promise<IRelationship> {
    //check is user exist
    const checkUser = await User.findById(request.receiverId);
    if (!checkUser) {
      throw new Error("Người nhận không tồn tại");
    }
    const createdRequest = await Relationship.create(request);
    // return createdRequest as IRelationship;
    return this.mapToIRelationship(createdRequest.toObject());
  }

  async findById(id: string): Promise<IRelationship | null> {
    const request = await Relationship.findById(id);
    return request ? this.mapToIRelationship(request.toObject()) : null;
  }

  async findByUsers(
    senderId: string,
    receiverId: string
  ): Promise<IRelationship | null> {
    const request = await Relationship.findOne({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });
    return request ? this.mapToIRelationship(request.toObject()) : null;
  }

  async findPendingByReceiver(
    receiverId: string,
    type: string,
    page: number,
    limit: number
  ): Promise<{
    relationship: IRelationship[];
    pagination: { page: number; limit: number };
  }> {
    // set pagination
    const skip = (page - 1) * limit;

    const requests = await Relationship.find({
      receiverId: receiverId,
      status: "pending",
      type: type,
    })
      .skip(skip)
      .limit(limit);

    console.log("pagination", page, limit);

    return {
      relationship: requests.map((request) => this.mapToIRelationship(request)),
      pagination: { page, limit },
    };
  }

  async update(
    id: string,
    data: Partial<IRelationship>
  ): Promise<IRelationship | null> {
    const updatedRequest = await Relationship.findByIdAndUpdate(id, data, {
      new: true,
    });
    return updatedRequest
      ? this.mapToIRelationship(updatedRequest.toObject())
      : null;
  }

  async delete(id: string): Promise<void> {
    await Relationship.findByIdAndDelete(id);
  }

  // Hàm chuyển đổi an toàn từ đối tượng MongoDB sang IRelationship
  private mapToIRelationship(data: any): IRelationship {
    return data as IRelationship;
    // return {
    //   _id: data._id,
    //   __v: data.__v,
    //   senderId: data.senderId?.toString() || "", // Chuyển ObjectId sang string
    //   receiverId: data.receiverId?.toString() || "",
    //   status: data.status || "pending", // Đảm bảo có giá trị mặc định
    //   createdAt: data.createdAt || new Date(),
    // };
  }
}

export default new RelationshipMongoRepository();

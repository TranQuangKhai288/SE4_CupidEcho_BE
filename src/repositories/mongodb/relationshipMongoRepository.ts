import { Relationship, User } from "../../models";
import { IRelationship } from "../../interfaces/relationship.interface";
import { IRelationshipRepository } from "../interfaces";
import mongoose from "mongoose";

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
    relationship: any[];
    pagination: { page: number; limit: number };
  }> {
    const skip = (page - 1) * limit;

    const results = await Relationship.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(receiverId),
          status: "pending",
          type,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      // Join sender user
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "senderUser",
        },
      },
      { $unwind: "$senderUser" },

      // Join sender profile
      {
        $lookup: {
          from: "profiles",
          localField: "senderId",
          foreignField: "userId",
          as: "senderProfile",
        },
      },
      { $unwind: { path: "$senderProfile", preserveNullAndEmptyArrays: true } },

      // Join receiver user
      {
        $lookup: {
          from: "users",
          localField: "receiverId",
          foreignField: "_id",
          as: "receiverUser",
        },
      },
      { $unwind: "$receiverUser" },

      // Join receiver profile
      {
        $lookup: {
          from: "profiles",
          localField: "receiverId",
          foreignField: "userId",
          as: "receiverProfile",
        },
      },
      {
        $unwind: { path: "$receiverProfile", preserveNullAndEmptyArrays: true },
      },

      // Project only necessary fields
      {
        $project: {
          _id: 1,
          type: 1,
          status: 1,
          createdAt: 1,

          sender: {
            _id: "$senderUser._id",
            name: "$senderUser.name",
            email: "$senderUser.email",
            avatar: "$senderUser.avatar",
            birthDate: "$senderProfile.birthDate",
            zodiac: "$senderProfile.zodiac",
          },

          receiver: {
            _id: "$receiverUser._id",
            name: "$receiverUser.name",
            email: "$receiverUser.email",
            avatar: "$receiverUser.avatar",
            birthDate: "$receiverProfile.birthDate",
            zodiac: "$receiverProfile.zodiac",
          },
        },
      },
    ]);

    return {
      relationship: results.map((r) => ({
        _id: r._id,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt,
        sender: {
          _id: r.sender._id,
          name: r.sender.name,
          email: r.sender.email,
          avatar: r.sender.avatar,
          birthDate: r.sender.birthDate,
          zodiac: r.sender.zodiac,
          age: r.sender.birthDate
            ? Math.floor(
                (Date.now() - new Date(r.sender.birthDate).getTime()) /
                  (365 * 24 * 60 * 60 * 1000)
              )
            : null,
        },
        receiver: {
          _id: r.receiver._id,
          name: r.receiver.name,
          email: r.receiver.email,
          avatar: r.receiver.avatar,
          birthDate: r.receiver.birthDate,
          zodiac: r.receiver.zodiac,
          age: r.receiver.birthDate
            ? Math.floor(
                (Date.now() - new Date(r.receiver.birthDate).getTime()) /
                  (365 * 24 * 60 * 60 * 1000)
              )
            : null,
        },
      })),
      pagination: { page, limit },
    };
  }
  async findBySender(
    senderId: string,
    type: string,
    page: number,
    limit: number
  ): Promise<{
    relationship: any[];
    pagination: { page: number; limit: number };
  }> {
    const skip = (page - 1) * limit;

    const results = await Relationship.aggregate([
      {
        $match: {
          senderId: new mongoose.Types.ObjectId(senderId),
          status: "pending",
          type,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      // Join sender user
      {
        $lookup: {
          from: "users",
          localField: "senderId",
          foreignField: "_id",
          as: "senderUser",
        },
      },
      { $unwind: "$senderUser" },

      // Join sender profile
      {
        $lookup: {
          from: "profiles",
          localField: "senderId",
          foreignField: "userId",
          as: "senderProfile",
        },
      },
      { $unwind: { path: "$senderProfile", preserveNullAndEmptyArrays: true } },

      // Join receiver user
      {
        $lookup: {
          from: "users",
          localField: "receiverId",
          foreignField: "_id",
          as: "receiverUser",
        },
      },
      { $unwind: "$receiverUser" },

      // Join receiver profile
      {
        $lookup: {
          from: "profiles",
          localField: "receiverId",
          foreignField: "userId",
          as: "receiverProfile",
        },
      },
      {
        $unwind: { path: "$receiverProfile", preserveNullAndEmptyArrays: true },
      },

      // Project only necessary fields
      {
        $project: {
          _id: 1,
          type: 1,
          status: 1,
          createdAt: 1,

          sender: {
            _id: "$senderUser._id",
            name: "$senderUser.name",
            email: "$senderUser.email",
            avatar: "$senderUser.avatar",
            birthDate: "$senderProfile.birthDate",
            zodiac: "$senderProfile.zodiac",
          },

          receiver: {
            _id: "$receiverUser._id",
            name: "$receiverUser.name",
            email: "$receiverUser.email",
            avatar: "$receiverUser.avatar",
            birthDate: "$receiverProfile.birthDate",
            zodiac: "$receiverProfile.zodiac",
          },
        },
      },
    ]);

    return {
      relationship: results.map((r) => ({
        _id: r._id,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt,
        sender: {
          _id: r.sender._id,
          name: r.sender.name,
          email: r.sender.email,
          avatar: r.sender.avatar,
          birthDate: r.sender.birthDate,
          zodiac: r.sender.zodiac,
          age: r.sender.birthDate
            ? Math.floor(
                (Date.now() - new Date(r.sender.birthDate).getTime()) /
                  (365 * 24 * 60 * 60 * 1000)
              )
            : null,
        },
        receiver: {
          _id: r.receiver._id,
          name: r.receiver.name,
          email: r.receiver.email,
          avatar: r.receiver.avatar,
          birthDate: r.receiver.birthDate,
          zodiac: r.receiver.zodiac,
          age: r.receiver.birthDate
            ? Math.floor(
                (Date.now() - new Date(r.receiver.birthDate).getTime()) /
                  (365 * 24 * 60 * 60 * 1000)
              )
            : null,
        },
      })),
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

import { Conversation, User, Message } from "../../models";
import { IConversation } from "../../interfaces/conversation.interface";
import { IConversationRepository } from "../interfaces";
import mongoose, { ObjectId } from "mongoose";

export class ConversationMongoRepository implements IConversationRepository {
  // Tìm conversation theo ID
  async findById(id: string): Promise<IConversation | null> {
    const conversation = await Conversation.findById(id);
    return conversation ? (conversation.toObject() as IConversation) : null;
  }

  // Tìm conversation theo danh sách người tham gia
  async findByParticipants(
    participants: (string | ObjectId)[]
  ): Promise<IConversation | null> {
    const conversation = await Conversation.findOne({
      participants: { $all: participants, $size: participants.length },
    });
    // populate("participants") không phải user hiện tại
    if (conversation) {
      await conversation.populate("participants", "name avatar");
    }

    return conversation ? (conversation.toObject() as IConversation) : null;
  }

  // Lấy danh sách conversation của một người dùng, hỗ trợ phân trang
  async findAllByUser(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    conversations: IConversation[];
    pagination: { page: number; limit: number };
  }> {
    console.log(page, limit, search);

    const conversations = await Conversation.aggregate([
      // Lookup participants
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participantsData",
        },
      },
      // Lookup lastMessage và populate senderId
      {
        $lookup: {
          from: "messages",
          localField: "lastMessage",
          foreignField: "_id",
          as: "lastMessageData",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "senderId",
                foreignField: "_id",
                as: "senderData",
              },
            },
            {
              $unwind: {
                path: "$senderData",
                preserveNullAndEmptyArrays: true, // Giữ lại nếu không có senderData
              },
            },
            {
              $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                senderId: "$senderData", // Gán thông tin sender vào senderId
              },
            },
          ],
        },
      },
      // Match với userId và search
      {
        $match: {
          participants: { $in: [new mongoose.Types.ObjectId(userId)] },
          ...(search
            ? {
                $or: [
                  {
                    "participantsData.name": { $regex: search, $options: "i" },
                  },
                  {
                    "participantsData.email": { $regex: search, $options: "i" },
                  },
                  {
                    "lastMessageData.content": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              }
            : {}),
        },
      },
      // Project dữ liệu cần thiết
      {
        $project: {
          _id: 1,
          participants: "$participantsData",
          lastMessage: { $arrayElemAt: ["$lastMessageData", 0] },
        },
      },
      // Phân trang (nếu cần)
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ]);

    // Xử lý dữ liệu trả về
    const result = conversations.map((conv) => {
      const populatedConv = {
        ...conv,
        _id: conv._id.toString(),
        participants: conv.participants
          .filter((participant: any) => participant._id.toString() !== userId)
          .map((participant: any) => ({
            _id: participant._id.toString(),
            name: participant.name,
            avatar: participant.avatar,
          }))[0],
        lastMessage: conv.lastMessage
          ? {
              _id: conv.lastMessage._id.toString(),
              content: conv.lastMessage.content,
              createdAt: conv.lastMessage.createdAt,
              sender: {
                _id: conv.lastMessage.senderId._id.toString(),
                name: conv.lastMessage.senderId.name,
                // avatar: conv.lastMessage.senderId.avatar,
              },
            }
          : null,
      };
      return populatedConv as IConversation;
    });

    return {
      conversations: result,
      pagination: { page, limit },
    };
  }

  // Tạo một conversation mới
  async create(conversation: IConversation): Promise<IConversation> {
    const createdConversation = await Conversation.create(conversation);
    return createdConversation.toObject() as IConversation;
  }

  // Cập nhật thông tin conversation
  async update(
    id: string,
    data: Partial<IConversation>
  ): Promise<IConversation | null> {
    const updatedConversation = await Conversation.findByIdAndUpdate(id, data, {
      new: true,
    });
    return updatedConversation
      ? (updatedConversation.toObject() as IConversation)
      : null;
  }

  // Xóa một conversation
  async delete(id: string): Promise<void> {
    await Conversation.findByIdAndDelete(id);
  }
}

export default new ConversationMongoRepository();

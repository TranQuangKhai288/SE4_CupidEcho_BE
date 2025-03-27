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
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participantsData",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "lastMessage",
          foreignField: "_id",
          as: "lastMessageData",
        },
      },
      {
        $match: {
          participants: { $in: [new mongoose.Types.ObjectId(userId)] },
          ...(search
            ? {
                $or: [
                  {
                    participantsData: {
                      $elemMatch: { name: { $regex: search, $options: "i" } },
                    },
                  },
                  {
                    participantsData: {
                      $elemMatch: { email: { $regex: search, $options: "i" } },
                    },
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

      {
        $project: {
          _id: 1,
          participants: "$participantsData", // Trả về toàn bộ thông tin user          lastMessage: 1,
          lastMessage: { $arrayElemAt: ["$lastMessageData", 0] }, // Lấy phần tử đầu tiên của mảng lastMessage
        },
      },
    ]);

    // console.log(conversations[0].participants);
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
          })),
        lastMessage: conv.lastMessage
          ? {
              _id: conv.lastMessage._id.toString(),
              content: conv.lastMessage.content,
              createdAt: conv.lastMessage.createdAt,
            }
          : null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
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

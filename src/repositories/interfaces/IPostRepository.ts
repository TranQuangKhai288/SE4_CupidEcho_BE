import {
  IComment,
  // ICreateComment,
  ICreateMedia,
  ICreatePost,
  IMedia,
  IPost,
  ICommentDocument,
  // IMediaDocument,
  IPostDocument,
} from "../../interfaces/post.interface";

export interface IPostRepository {
  findAll(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    posts: IPostDocument[];
    pagination: { page: number; limit: number };
  }>;
  findAllByUser(
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<{
    posts: IPostDocument[];
    pagination: { page: number; limit: number };
  }>;
  findById(id: string): Promise<IPostDocument | null>;
  create(post: ICreatePost): Promise<IPostDocument>;
  update(userId: string, data: Partial<IPost>): Promise<IPostDocument | null>;
  delete(id: string): Promise<IPostDocument | null>;
  findCommentById(id: string): Promise<ICommentDocument | null>;
  createComment(comment: IComment): Promise<ICommentDocument>;
  updateComment(
    id: string,
    data: Partial<IComment>
  ): Promise<ICommentDocument | null>;
  deleteComment(id: string): Promise<ICommentDocument | null>;
  //like
  likePost(postId: string, userId: string): Promise<IPostDocument | null>;
}

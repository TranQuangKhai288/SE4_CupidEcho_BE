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
  update(
    userId: string,
    data: Partial<any>
  ): Promise<IPostDocument | null | string>;
  delete(id: string): Promise<IPostDocument | null>;
  findAllCommentsByPost(
    postId: string,
    page: number,
    limit: number
  ): Promise<{
    comments: ICommentDocument[];
    pagination: { page: number; limit: number };
  }>;
  createComment(comment: IComment): Promise<ICommentDocument | null | string>;
  updateComment(
    id: string,
    data: Partial<IComment>
  ): Promise<ICommentDocument | null | string>;
  deleteComment(
    id: string,
    userId: string
  ): Promise<ICommentDocument | null | string>;
  //like
  likePost(postId: string, userId: string): Promise<IPostDocument | null>;
}

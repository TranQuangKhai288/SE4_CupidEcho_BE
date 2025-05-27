import { IRelationship } from "../../interfaces/relationship.interface";

export interface IRelationshipRepository {
  create(request: IRelationship): Promise<IRelationship | null | string>;
  findById(id: string): Promise<IRelationship | null>;
  findByUsers(
    requesterId: string,
    receiverId: string
  ): Promise<IRelationship | null>;

  findAcceptedByUserId(
    userId: string,
    type: string,
    page: number,
    limit: number
  ): Promise<{
    relationship: any[];
    pagination: { page: number; limit: number };
  }>;
  findPendingByReceiver(
    receiverId: string,
    type: string,
    page: number,
    limit: number
  ): Promise<{
    relationship: any[];
    pagination: { page: number; limit: number };
  }>;

  findBySender(
    senderId: string,
    type: string,
    page: number,
    limit: number
  ): Promise<{
    relationship: any[];
    pagination: { page: number; limit: number };
  }>;
  update(
    id: string,
    data: Partial<IRelationship>
  ): Promise<IRelationship | null>;
  delete(id: string): Promise<void>;
}

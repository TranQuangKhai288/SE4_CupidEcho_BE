import { IRelationship } from "../../interfaces/relationship.interface";

export interface IRelationshipRepository {
  create(request: IRelationship): Promise<IRelationship>;
  findById(id: string): Promise<IRelationship | null>;
  findByUsers(
    requesterId: string,
    receiverId: string
  ): Promise<IRelationship | null>;
  findPendingByReceiver(
    receiverId: string,
    type: string,
    page: number,
    limit: number
  ): Promise<{
    relationship: IRelationship[];
    pagination: { page: number; limit: number };
  }>;
  update(
    id: string,
    data: Partial<IRelationship>
  ): Promise<IRelationship | null>;
  delete(id: string): Promise<void>;
}

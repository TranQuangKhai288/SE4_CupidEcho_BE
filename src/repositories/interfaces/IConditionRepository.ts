import { ICondition } from "../../interfaces/condition.interface";

export interface IConditionRepository {
  findByUserId(userId: string): Promise<ICondition | null>;
  create(condition: ICondition): Promise<ICondition>;
  update(userId: string, data: Partial<ICondition>): Promise<ICondition | null>;
}

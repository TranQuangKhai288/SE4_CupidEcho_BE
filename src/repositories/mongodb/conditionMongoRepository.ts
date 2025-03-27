import { UserCondition } from "../../models";
import { ICondition } from "../../interfaces/condition.interface";
import { IConditionRepository } from "../interfaces";

export class ConditionMongoRepository implements IConditionRepository {
  async create(condition: ICondition): Promise<ICondition> {
    const createdCondition = await UserCondition.create(condition);
    return createdCondition.toObject() as unknown as ICondition;
  }
  async findByUserId(userId: string): Promise<ICondition | null> {
    const condition = await UserCondition.findOne({
      userId,
    }).lean<ICondition>();
    return condition ? (condition as ICondition) : null;
  }

  async update(
    userId: string,
    data: Partial<ICondition>
  ): Promise<ICondition | null> {
    const updatedCondition = await UserCondition.findOneAndUpdate(
      { userId },
      data,
      { new: true }
    ).lean<ICondition>();
    return updatedCondition ? (updatedCondition as ICondition) : null;
  }
}

export default new ConditionMongoRepository();

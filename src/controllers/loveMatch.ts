import { Request, Response } from "express";
import { loveMatchService } from "../services/loveMatch";
import { IApiResponse } from "../interfaces/response.interface";

const getAllLoveMatches = async (req: Request, res: Response) => {
  try {
    const matches = await loveMatchService.getAllLoveMatches();
    res.status(200).json({
      status: "OK",
      message: "Get all love matches successfully",
      data: matches,
    } as IApiResponse<any>);
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to get love matches",
    });
  }
};

const getLoveMatchById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const match = await loveMatchService.getLoveMatchById(id);
    if (!match) {
      res.status(404).json({
        status: "ERR",
        message: "Love match not found",
      });
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Get love match successfully",
      data: match,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to get love match",
    });
  }
};

const createLoveMatch = async (req: Request, res: Response) => {
  try {
    const { fromUser, toUser } = req.body;

    const newMatch = await loveMatchService.createLoveMatch(fromUser, toUser);

    res.status(201).json({
      status: "OK",
      message: "Created love match successfully",
      data: newMatch,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to create love match",
    });
  }
};

const updateLoveMatch = async (req: Request, res: Response) => {
  try {
    const updatedMatch = await loveMatchService.updateLoveMatch(
      req.params.id,
      req.body
    );
    if (!updatedMatch) {
      res.status(404).json({
        status: "ERR",
        message: "Love match not found",
      });
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Updated love match successfully",
      data: updatedMatch,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to update love match",
    });
  }
};

const deleteLoveMatch = async (req: Request, res: Response) => {
  try {
    const deleted = await loveMatchService.deleteLoveMatch(req.params.id);
    if (!deleted) {
      res.status(404).json({
        status: "ERR",
        message: "Love match not found",
      });
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Deleted love match successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to delete love match",
    });
  }
};

const getLikesSentByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const likes = await loveMatchService.getLikesSentByUser(userId);
  res.status(200).json({ status: "OK", data: likes });
};

const getLikesReceivedByUser = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const likes = await loveMatchService.getLikesReceivedByUser(userId);
  res.status(200).json({ status: "OK", data: likes });
};

const getMatchedUsers = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const matches = await loveMatchService.getMatchedUsers(userId);
  res.status(200).json({ status: "OK", data: matches });
};

export default {
  getAllLoveMatches,
  getLoveMatchById,
  createLoveMatch,
  updateLoveMatch,
  deleteLoveMatch,
  getLikesSentByUser,
  getLikesReceivedByUser,
  getMatchedUsers,
};

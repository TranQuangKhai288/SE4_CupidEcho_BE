import { Request, Response } from "express";
import { interestService } from "../services";
import { IApiResponse } from "../interfaces/response.interface";

const getAllInterests = async (req: Request, res: Response) => {
  try {
    const interests = await interestService.getAllInterests();
    res.status(200).json({
      status: "OK",
      message: "Get all interests successfully",
      data: interests,
    } as IApiResponse<any>);
    return;
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to get interests",
    });
    return;
  }
};

const getInterestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const interest = await interestService.getInterestById(id);
    if (!interest) {
      res.status(404).json({
        status: "ERR",
        message: "Interest not found",
      });
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Get interest successfully",
      data: interest,
    });
    return;
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to get interest",
    });
    return;
  }
};

const createInterest = async (req: Request, res: Response) => {
  try {
    const newInterest = await interestService.createInterest(req.body);
    res.status(201).json({
      status: "OK",
      message: "Created interest successfully",
      data: newInterest,
    });
    return;
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to create interest",
    });
    return;
  }
};

const updateInterest = async (req: Request, res: Response) => {
  try {
    const updatedInterest = await interestService.updateInterest(
      req.params.id,
      req.body
    );
    if (!updatedInterest) {
      res.status(404).json({
        status: "ERR",
        message: "Interest not found",
      });
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Updated interest successfully",
      data: updatedInterest,
    });

    return;
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to update interest",
    });
    return;
  }
};

const deleteInterest = async (req: Request, res: Response) => {
  try {
    const deleted = await interestService.deleteInterest(req.params.id);
    if (!deleted) {
      res.status(404).json({
        status: "ERR",
        message: "Interest not found",
      });
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Deleted interest successfully",
    });
    return;
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Failed to delete interest",
    });
    return;
  }
};

export default {
  getAllInterests,
  getInterestById,
  createInterest,
  updateInterest,
  deleteInterest,
};

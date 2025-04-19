import { Request, Response } from "express";
import { adminService } from "../services";
import { IApiResponse } from "../interfaces/response.interface";
import {
  matchingQueue,
  processingBatches,
} from "../services/galeShapley/matching";
const getZodiac = async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await adminService.getZodiac();
    if (!response) {
      res.status(404).json({
        status: "ERR",
        message: "Zodiac score not found",
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Get Zodiac score successfully",
      data: response,
    } as IApiResponse<any>);
    console.log("Get Zodiac score successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Error when getting Zodiac score by ID",
    } as IApiResponse<null>);
  }
};

const getAlgorithmConstant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const response = await adminService.getAlgorithmConstant();
    if (!response) {
      res.status(404).json({
        status: "ERR",
        message: "Algorithm constant not found",
      } as IApiResponse<null>);
      return;
    }
    res.status(200).json({
      status: "OK",
      message: "Get Algorithm constant successfully",
      data: response,
    } as IApiResponse<any>);
    console.log("Get Algorithm constant successfully");
  } catch (error) {
    res.status(500).json({
      status: "ERR",
      message: "Error when getting Algorithm constant by ID",
    } as IApiResponse<null>);
  }
};

const getMatchingQueue = async (req: Request, res: Response) => {
  try {
    console.log("Get matching queue request received");
    const { limit = 50, page = 1 } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Lấy dữ liệu từ matchingQueue
    const queueArray = Array.from(matchingQueue.entries()).map(
      ([userId, { joinTime }]) => ({
        userId,
        joinTime: joinTime.toISOString(),
      })
    );

    // Phân trang
    const total = queueArray.length;
    const paginatedQueue = queueArray.slice(skip, skip + limitNum);

    res.status(200).json({
      status: "OK",
      message: "Get matching queue successfully",
      data: {
        total,
        page: pageNum,
        limit: limitNum,
        queue: paginatedQueue,
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy hàng đợi:", error);
    res.status(500).json({
      message: "Lỗi khi lấy thông tin hàng đợi",
      error: error,
    });
  }
};

const getMatchingHistory = async (req: Request, res: Response) => {
  try {
    console.log("Get matching history request received");
    const { limit = 50, page = 1 } = req.query;
    const response = await adminService.getMatchingHistory(
      parseInt(page as string, 10),
      parseInt(limit as string, 10)
    );
    if (!response) {
      res.status(404).json({
        status: "ERR",
        message: "Matching history not found",
      } as IApiResponse<null>);
      return;
    }
    const total = await adminService.getMatchingHistory(0, 0); // Get total count of matching history
    const paginatedHistory = response.slice(
      (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10),
      parseInt(page as string, 10) * parseInt(limit as string, 10)
    );
    res.status(200).json({
      status: "OK",
      message: "Get matching history successfully",
      data: {
        total: total.length,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        history: paginatedHistory,
      },
    } as IApiResponse<any>);
  } catch (error) {
    console.error("Lỗi khi lấy lịch sử ghép đôi:", error);
    res.status(500).json({
      message: "Lỗi khi lấy thông tin lịch sử ghép đôi",
      error: error,
    });
  }
};

export default {
  getZodiac,
  getAlgorithmConstant,
  getMatchingQueue,
  getMatchingHistory,
};

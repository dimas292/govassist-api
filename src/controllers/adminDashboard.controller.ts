import { Request, Response } from "express";
import { AdminDashboardService } from "../services/adminDashboard.service";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const service = new AdminDashboardService();

export class AdminDashboardController {
  getDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const dashboard = await service.getDashboard();
    res.json(ApiResponse.success(dashboard));
  });
}

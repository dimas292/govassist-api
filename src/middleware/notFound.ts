import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";

export const notFound = (req: Request, res: Response) => {
  res
    .status(404)
    .json(ApiResponse.error(`Route ${req.originalUrl} not found`, 404));
};

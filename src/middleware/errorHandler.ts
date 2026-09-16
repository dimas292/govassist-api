import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { config } from "../config";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res
      .status(err.statusCode)
      .json(ApiResponse.error(err.message, err.statusCode, err.errors));
  }

  console.error("Unhandled Error:", err);

  const statusCode = 500;
  const message =
    config.nodeEnv === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  return res.status(statusCode).json(ApiResponse.error(message, statusCode));
};

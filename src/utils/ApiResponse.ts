export class ApiResponse {
  static success<T>(data: T, message = "Success", statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
    };
  }

  static error(message = "Error", statusCode = 500, errors?: unknown[]) {
    return {
      success: false,
      statusCode,
      message,
      errors: errors || [],
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = "Success"
  ) {
    return {
      success: true,
      statusCode: 200,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

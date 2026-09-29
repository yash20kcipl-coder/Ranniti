export interface ApiResponseFormat<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}

export class ApiResponse {
  static success<T>(data: T, message = 'Success', statusCode = 200) {
    return {
      statusCode,
      body: {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString(),
      },
    };
  }

  static error(message: string, statusCode = 500, errors: any[] = []) {
    return {
      statusCode,
      body: {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

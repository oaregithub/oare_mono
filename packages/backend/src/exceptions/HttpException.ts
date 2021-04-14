class HttpException extends Error {
  status: number;

  message: string;

  preventLog?: boolean;

  constructor(status: number, message: string, preventLog?: boolean) {
    super(message);
    this.status = status;
    this.message = message;
    this.preventLog = preventLog;
  }
}

export default HttpException;

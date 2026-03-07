export class NestingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NestingError";
  }
}

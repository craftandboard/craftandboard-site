export class AmazonImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AmazonImportError";
  }
}

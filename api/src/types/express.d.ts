// Global type augmentations for Express
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        walletAddress: string;
        permissions: string[];
      };
    }
  }
}

export {};

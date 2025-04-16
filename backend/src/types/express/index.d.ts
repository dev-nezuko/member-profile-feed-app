import { Request } from 'express';
import { Multer } from 'multer';

export interface RequestWithUserId extends Request {
  userId?: string;
  file?: Multer.File;
}

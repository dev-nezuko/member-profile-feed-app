import { Request } from 'express';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Multer } from 'multer';

export interface RequestWithUserId extends Request {
  userId?: string;
  file?: Multer.File;
}

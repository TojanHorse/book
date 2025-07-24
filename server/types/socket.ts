import { Socket } from 'socket.io';
import { IUser } from '../models/User';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  user: IUser;
}

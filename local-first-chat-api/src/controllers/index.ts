import { Hono } from 'hono';

import conversationsController from './conversations';
import messagesController from './conversationMessages';
import usersController from './users';
import organizationsController from './organizations';
import { Env } from '../env';

export default new Hono<{ Bindings: Env }>()
  .basePath('v1')
  .route(`/`, conversationsController)
  .route(`/`, messagesController)
  .route('/', usersController)
  .route('/', organizationsController);

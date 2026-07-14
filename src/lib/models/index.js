import { sequelize } from '../db';
import defineUser from './user';
import definePost from './post';
import defineComment from './comment';
import defineLike from './like';
import defineNotification from './notification';
import defineConversation from './conversation';
import defineMessage from './message';

function init() {
  const User = defineUser(sequelize);
  const Post = definePost(sequelize);
  const Comment = defineComment(sequelize);
  const Like = defineLike(sequelize);
  const Notification = defineNotification(sequelize);
  const Conversation = defineConversation(sequelize);
  const Message = defineMessage(sequelize);

  Post.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Comment.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Comment.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
  Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId', onDelete: 'CASCADE' });
  Like.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  Notification.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });
  Notification.belongsTo(Post, { as: 'post', foreignKey: 'postId', onDelete: 'CASCADE' });
  Conversation.belongsTo(User, { as: 'userOne', foreignKey: 'userOneId' });
  Conversation.belongsTo(User, { as: 'userTwo', foreignKey: 'userTwoId' });
  // constraints:false — messages already FK to conversations; a second FK back
  // would create a circular reference on sync
  Conversation.belongsTo(Message, { as: 'lastMessage', foreignKey: 'lastMessageId', constraints: false });
  Message.belongsTo(Conversation, { as: 'conversation', foreignKey: 'conversationId', onDelete: 'CASCADE' });
  Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

  return { sequelize, User, Post, Comment, Like, Notification, Conversation, Message };
}

// Bump when model definitions change: the versioned key invalidates the
// dev-HMR cache so a running server re-defines models (the connection in
// db.js is reused either way).
const MODELS_VERSION = 3;

const globalRef = globalThis;
const key = `__models_v${MODELS_VERSION}`;
export const db = globalRef[key] || (globalRef[key] = init());

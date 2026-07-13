import { sequelize } from '../db';
import defineUser from './user';
import definePost from './post';
import defineComment from './comment';
import defineLike from './like';

function init() {
  const User = defineUser(sequelize);
  const Post = definePost(sequelize);
  const Comment = defineComment(sequelize);
  const Like = defineLike(sequelize);

  Post.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Comment.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  Comment.belongsTo(Post, { foreignKey: 'postId', onDelete: 'CASCADE' });
  Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId', onDelete: 'CASCADE' });
  Like.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  return { sequelize, User, Post, Comment, Like };
}

// Bump when model definitions change: the versioned key invalidates the
// dev-HMR cache so a running server re-defines models (the connection in
// db.js is reused either way).
const MODELS_VERSION = 2;

const globalRef = globalThis;
const key = `__models_v${MODELS_VERSION}`;
export const db = globalRef[key] || (globalRef[key] = init());

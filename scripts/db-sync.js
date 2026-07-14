// Creates/updates tables from the Sequelize models: npm run db:sync
import 'dotenv/config';
import { Sequelize } from 'sequelize';
import defineUser from '../src/lib/models/user.js';
import definePost from '../src/lib/models/post.js';
import defineComment from '../src/lib/models/comment.js';
import defineLike from '../src/lib/models/like.js';
import defineNotification from '../src/lib/models/notification.js';
import defineConversation from '../src/lib/models/conversation.js';
import defineMessage from '../src/lib/models/message.js';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
});

defineUser(sequelize);
definePost(sequelize);
defineComment(sequelize);
defineLike(sequelize);
defineNotification(sequelize);
defineConversation(sequelize);
defineMessage(sequelize);

try {
  await sequelize.sync({ alter: true });
  console.log('Database synced');
} finally {
  await sequelize.close();
}

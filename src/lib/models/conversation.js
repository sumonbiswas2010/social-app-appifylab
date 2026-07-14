import { DataTypes } from 'sequelize';

// 1:1 conversation; the pair is stored ordered (userOneId < userTwoId) so the
// unique index prevents duplicates regardless of who starts the chat.
export default (sequelize) =>
  sequelize.define(
    'Conversation',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      userOneId: { type: DataTypes.BIGINT, allowNull: false },
      userTwoId: { type: DataTypes.BIGINT, allowNull: false },
      lastMessageId: { type: DataTypes.BIGINT },
      lastMessageAt: { type: DataTypes.DATE },
    },
    {
      tableName: 'conversations',
      indexes: [
        { unique: true, fields: ['userOneId', 'userTwoId'] },
        { fields: ['userTwoId'] },
      ],
    }
  );

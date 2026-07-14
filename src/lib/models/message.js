import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Message',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      conversationId: { type: DataTypes.BIGINT, allowNull: false },
      senderId: { type: DataTypes.BIGINT, allowNull: false },
      content: { type: DataTypes.TEXT, allowNull: false },
      readAt: { type: DataTypes.DATE }, // set when the recipient reads it
    },
    {
      tableName: 'messages',
      indexes: [{ fields: ['conversationId', { name: 'id', order: 'DESC' }] }],
    }
  );

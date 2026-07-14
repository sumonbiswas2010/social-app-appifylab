import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.BIGINT, allowNull: false }, // recipient
      actorId: { type: DataTypes.BIGINT }, // who triggered it
      type: { type: DataTypes.STRING(30), allowNull: false }, // e.g. 'post'
      postId: { type: DataTypes.BIGINT },
      read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      tableName: 'notifications',
      indexes: [
        { fields: ['userId', { name: 'id', order: 'DESC' }] },
        { fields: ['userId', 'read'] },
      ],
    }
  );

import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Like',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.BIGINT, allowNull: false },
      targetType: { type: DataTypes.ENUM('post', 'comment'), allowNull: false },
      targetId: { type: DataTypes.BIGINT, allowNull: false },
      // Reaction kind (like/love/haha/wow/sad/angry) — one row per user+target
      type: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'like' },
    },
    {
      tableName: 'likes',
      indexes: [
        { unique: true, fields: ['userId', 'targetType', 'targetId'] },
        { fields: ['targetType', 'targetId'] },
      ],
    }
  );

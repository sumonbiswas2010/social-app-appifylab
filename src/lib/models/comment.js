import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Comment',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      postId: { type: DataTypes.BIGINT, allowNull: false },
      userId: { type: DataTypes.BIGINT, allowNull: false },
      parentId: { type: DataTypes.BIGINT }, // null = top-level, set = reply
      content: { type: DataTypes.TEXT, allowNull: false },
      likesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      repliesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'comments',
      indexes: [{ fields: ['postId', 'parentId', 'id'] }, { fields: ['parentId'] }],
    }
  );

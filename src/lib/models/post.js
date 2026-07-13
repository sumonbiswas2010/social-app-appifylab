import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'Post',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      userId: { type: DataTypes.BIGINT, allowNull: false },
      content: { type: DataTypes.TEXT },
      imageUrl: { type: DataTypes.STRING(500) },
      privacy: { type: DataTypes.ENUM('public', 'private'), allowNull: false, defaultValue: 'public' },
      likesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      commentsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      tableName: 'posts',
      indexes: [
        { fields: ['privacy', { name: 'id', order: 'DESC' }] },
        { fields: ['userId', { name: 'id', order: 'DESC' }] },
      ],
    }
  );

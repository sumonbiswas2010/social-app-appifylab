import { DataTypes } from 'sequelize';

export default (sequelize) =>
  sequelize.define(
    'User',
    {
      id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
      firstName: { type: DataTypes.STRING(50), allowNull: false },
      lastName: { type: DataTypes.STRING(50), allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(100) },
      googleId: { type: DataTypes.STRING(64), unique: true },
      avatar: { type: DataTypes.STRING(500) },
      tokenVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'users' }
  );

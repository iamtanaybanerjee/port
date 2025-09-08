"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Tracks", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      albumName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      artists: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      uri: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Tracks");
  },
};

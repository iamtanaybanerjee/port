module.exports = (sequelize, DataTypes) => {
  const Track = sequelize.define(
    "Track",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      albumName: {
        type: DataTypes.STRING,
      },
      artists: {
        type: DataTypes.ARRAY(DataTypes.STRING),
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    { timestamps: true }
  );

  return Track;
};

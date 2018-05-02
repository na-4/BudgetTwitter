module.exports = function(sequelize, DataTypes) {

    /* User Profile Schema */
    var User = sequelize.define("User", {

        firstname: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 50],
                isAlpha: true
            }
        },

        lastname: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 50],
                isAlpha: true
            }
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1, 100],
                isEmail : true
            }
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        bio1: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        bio2: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        bio3: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        profilepicture: {
            type: DataTypes.STRING,
            allowNull: false
        },

        follow_num: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });

    return User;
};


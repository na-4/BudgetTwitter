var path = require("path");
var express = require('express');
var router = express.Router();
var models = require('../models');
var fs = require('fs');
var multer  = require('multer');
var upload = multer({ dest: 'public/assets/images/post' });
var cloudinary = require('../config/cloudinary');
var notifier = require('node-notifier');

/* Retrieve USER Messages */
router.get('/dashboard', ensureAuthenticated, function(req, res) {

    try {
        if(res.locals.user){
            var id = res.locals.user.id;
            models.Messages.findAll({
                where: {
                    UserId: id
                },
                order: [
                    ['id', 'DESC']
                ],
                include: [
                    {
                        model: models.User
                    }
                ]
            }).then(function(result) {
                if(result.length > 0) {
                    var messages = [];
                    for(var i = 0; i < result.length; i++) {
                        messages.push(result[i].dataValues);
                    }
                    res.render('dashboard', { messages: messages});

                } else {
                    res.render('dashboard');
                }
            });

            models.User.findOne({
                where: {
                    id: id
                }
            }).then(function(result) {
                var pre_count = result.dataValues.follow_num;
                models.Followers.findAndCountAll({
                    where: {
                        following: id
                    }
                }).then(function (result) {
                    models.User.update({
                            follow_num: result.count
                        },
                        {
                            where: {
                                id: id
                            }
                        });
                    if (result.count > pre_count) {
                        notifier.notify({
  				title: 'Notification',
  				message: 'You have new follower(s).',
				wait: false,
				timeout: 1
			});
                    }
                })
            });
        }else {
            res.render('index');
        }
    } catch(err) {
        req.flash('error_msg', 'Something went wrong. ' + err);
        res.redirect('/users/signin');
    }
});

function ensureAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    else {
        res.render('signin');
    }
}

/* New User Post */
router.post('/dashboard', upload.any(), function(req, res) {
    var id = res.locals.user.id;
    var message = req.body.message;
    var imagePromise = [];
    var image = [];
    var isValid = false;

    req.checkBody('message', 'Your post is empty').notEmpty();

    if(req.files[0] !== undefined) {
        if(req.files[0].mimetype === 'image/jpeg' || req.files[0].mimetype === 'image/jpg' || req.files[0].mimetype === 'image/png') {
            imagePromise.push(cloudinary.uploadToCloudinary(req.files[0]));
            isValid = true;
        }
        else {
            isValid = false;
        }
    }
    else {
        image[0] = null;
        isValid = true;
    }

    var errors = req.validationErrors();
    if(errors && (image[0] === null) ) {
        req.flash('error_msg', 'Empty post');
        res.redirect('/users/dashboard');
    }
    else if(isValid === false) {
        req.flash('error_msg', 'Invalid picture extension');
        res.redirect('/users/dashboard');
    }
    else {
        if(imagePromise.length > 0 ) {
            Promise.all(imagePromise).then(results => {
                for(let i in results){
                    image.push(results[i].url);
                }
                /* Creating new message */
                var newMessage = {
                    message: message,
                    image: image[0],
                    UserId: id
                };
                /* Posting new message */
                models.Messages.create(newMessage).then(function(message) {
                    res.redirect('/users/dashboard');
                });
            });
        }
        else {
            /* Creating new message */
            var newMessage = {
                message: message,
                image: image[0],
                UserId: id
            };
            /* Posting new message */
            models.Messages.create(newMessage).then(function(message) {
                res.redirect('/users/dashboard');
            });
        }
    }
});

/* Edit User Message */
router.post('/update/:id', function(req, res) {
    var id = req.params.id;
    var updatedMessage = req.body.message;
    var date = new Date();
    models.Messages.update({
            message: updatedMessage,
            updatedAt: date
        },
        {
            where: {
                id: id
            }
        }).then(function(todos) {
        res.send('success');
    });
});

/* Delete Message */
router.post('/delete/:id', function(req, res){
    var id = req.params.id;
    models.Messages.destroy(
        {
            where: {
                id: id
            }
        }).then(function(todos) {
        res.send('success');
    });
});

/* Retrieve GLOBAL Messages */
router.get('/feed', ensureAuthenticated, function(req, res) {
    models.Messages.findAll({
        include: [
            {
                model: models.User
            }
        ],
        order: [
            ['createdAt', 'DESC']
        ]
    }).then(function(result){
        if (result) {
            var messages = [];
            for(var i = 0; i < result.length; i++){
                messages.push(result[i].dataValues);
            }
            res.json(messages);
        } else {
            res.render('dashboard');
        }
    });
});

/* Edit User Profile */
router.post('/profile/:id', function(req, res){
    var id = req.params.id;

    models.User.update({
            firstname: req.body.firstname,
            lastname:  req.body.lastname,
            bio1: req.body.bio1,
            bio2: req.body.bio2,
            bio3: req.body.bio3
        },
        {
            where: {
                id: id
            }
        }).then(function(todos) {
        res.send('success');
    });
});

/* user profile */
router.get('/profile/:id', function(req, res) {
    var id = req.params.id;
    if(id == res.locals.user.id) {
        res.redirect('/users/dashboard');
    }
    else {
        models.Messages.findAll({
            where: {
                UserId: id
            },
            include: [
                {
                    model: models.User
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        }).then(function(result) {
            if(result.length > 0) {
                var messages = [];
                for(var i = 0; i < result.length; i++) {
                    messages.push(result[i].dataValues);
                }
                res.render('profile', { messages: messages});

            } else {
                req.flash('error_msg', 'This user hasn\'t posted anything yet !');
                res.redirect('/users/dashboard');
            }
        });
    }
});

/* Follow */
router.get('/follow/:id', function(req, res) {
    /*User's input*/
    var following = req.params.id;
    models.Followers.findOrCreate({
        where: {
            followers: res.locals.user.id,
            following: following
        }
    }).spread((user, created) => {
        if(created) {
            req.flash('success_msg', 'User added to your following list');
            res.redirect('/users/dashboard');
        }
        else {
            req.flash('error_msg', 'You are already following this user');
            res.redirect('/users/dashboard');
        }
    });
});

/* Unfollow */
router.get('/unfollow/:id', function(req, res){
    var following = req.params.id;
    models.Followers.destroy({
        where: {
            followers: res.locals.user.id,
            following: following
        }
    }).then(function() {
        req.flash('success_msg', 'User unfollowed.');
        res.redirect('/users/dashboard');
    });
});

/* Find Following */
router.get('/following', function(req, res) {
    models.Followers.findAll({
        where: {
            followers: res.locals.user.id
        },
        include: [
            {
                model: models.User, as: 'followingfk'
            }
        ]
    }).then(function(result){
        res.json(result);
    });
});

/* Find Follower */
router.get('/followers', function(req, res) {
    models.Followers.findAll({
        where: {
            following: res.locals.user.id
        },
        include: [
            {
                model: models.User, as: 'followersfk'
            }
        ]
    }).then(function(result){
        res.json(result);
    });
});

/* Search Other Users */
router.post('/search', function(req, res) {

    /*User's input*/
    var search = req.body.search;

    /*If name, split the first and last name*/
    var searchParameter = search.split(' ');

    models.User.findAll({
        where: {
            $or: [
                {
                    firstname: searchParameter[0]
                },
                {
                    lastname: searchParameter[1]
                },
                {
                    firstname: searchParameter[1]
                },
                {
                    lastname: searchParameter[0]
                },
                {
                    email: searchParameter
                }
            ]
        }
    }).then(function(result){
        if(result.length > 0){
            var users = [];
            for(var i = 0; i < result.length; i++){
                users.push(result[i].dataValues);
            }
            res.render('searchresult', { users: users });

        } else {
            req.flash('error_msg', 'No user found');
            res.redirect('/users/dashboard');
        }
    });
});

module.exports = router;

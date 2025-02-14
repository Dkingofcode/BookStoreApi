const express = require('express');
const feedController = require('../controllers/feed');
const router = express.Router();
const { body } = require('express-validator/check');
const isAuth = require('../middleware/isAuth');

router.get('/posts', isAuth, feedController.getPosts);

router.post(
    '/post', 
    isAuth,
 [
     body('title')
     .trim()
     .isLength({ min: 5 }),
     body('content')
     .trim()
     .isLength({ min: 5 })       
],
 feedController.createPost
);

 router.put('posts/:postId', isAuth, [
    body('title').trim()
    .isLength({ min: 5 }),
    body('content').trim().isLength({ min: 5 })
 ],
 feedController.updatePost
);

router.delete('/post/:postId', isAuth, feedController.deletePost);



module.exports = router;
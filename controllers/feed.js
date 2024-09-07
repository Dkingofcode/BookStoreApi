const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const { validationResult }  = require('express-validator/check');

const Post = require('../models/post');
const { clear } = require('console');
const io = require('../socket');

exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    
    try{ 
        const totalItems = await Post.find().countDocuments();
        
        const posts = await Post.find().populate('creator')
        .sort({ createdAt: -1})
        .skip((currentPage - 1) * perPage)
        .limit(perPage);
        
        res.status(200)
        .json({
        message: 'Posts Fetched Successsfully!', 
        posts: posts, 
        totalItems: totalItems
    })
}catch(err){
    if(!err.statusCode) {
        err.statusCode = 500;
    }
     next(err);
}
    
};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
         const error = new Error('Validation failed, entered data is incorrect');
         error.statusCode = 422;
         throw error;
     }
     if (!req.file){
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
     }
    const imageUrl = req.body.image;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
     // Create post in db
    const post = new Post({
         title: title,
         content: content,
         imageUrl: imageUrl,
         creator: req.userId,
    });
    try{
        await post.save();
        const user = await  User.findById(req.userId);
           // creator = user;
            user.posts.push(post);
            await user.save();
            io.getIO().emit('posts', { 
                action: 'create', 
                post: { ...post._doc, creator: { _id: req.userId, name: user.name }  } });
            res.status(201).json({
            message: 'Post created successfully!',
            post: post,
            creator: { _id: creator._id, name: creator.name }
        });
    }catch(err)  {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
         next(err);
    };
}



exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId).then(result => {
       if(!post){
          const error = new Error('Couldnt find Id');
          error.statusCode = 404;
          throw error;
       }

    }).catch(err => {
        if(!err.statusCode){
            err.statusCode = 500;
        }
        next(err);
    })
}


exports.updatePost = async (req, res, next) => {
   const postId = req.params.postId;
   const errors = validationResult(req);
   if(!errors.isEmpty()) {
      const error = new Error('Validation failed, entered data is incorrect');
      error.statusCode = 422;
      throw error;
   } 
    
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.imageUrl;
   
    if (req.file) {
        imageUrl = req.file.path;
    }

    if(!imageUrl){
        const error = new Error('Failed to upload image');
        error.statusCode = 422;
        throw error;      
    }

    
    const post = await Post.findById(postId).populate('creator');
      try{

          if(!post) {
              const error = new Error('Could not find post.');
              error.statusCode = 404;
              throw error;
            }
            if(post.creator._id.toString() !== req.userId){
                const error = new Error('User not authorized to perform this action');
                error.statusCode = 403;
                throw error;
            }
            if(imageUrl !== post.imageUrl){
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            const result = await post.save();
            io.getIO().emit('posts', { action: 'update', post: result });
            res.status(200).json({message: "Post Updated Successfully!", post: result });
            
        }catch(err) {
                if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};



exports.deletePost = async (req, res, next) => {
    const postId = req.params.id;
    
    try{
        const post = Post.findById(postId)
        
        // Check logged in user
        if(!post){
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('User not authorized to perform this action');
            error.statusCode = 403;
            throw error;
        }
        // Check logged in user  
        clearImage(post.imageUrl);
       
        await Post.findByIdAndRemove(postId);
        
        const user = User.findById(req.userId);
        user.posts.pull(postId);
        await user.save();
       io.getIO().emit('posts', { action: 'delete', post: postId });
       res.status(200).json({ message: 'Deleted post.' });
    
    }catch(err){
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);       
    };

}


const clearImage = filePath => {
    filePath = path.join(__dirname, );
   fs.unlink(filePath, err => console.log());  

}






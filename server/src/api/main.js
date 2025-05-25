const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');   
const { getAllUsers, createUser, updateUser, deleteUser } = require('./controllers/userController');
const { getAllPosts, createPost, updatePost, deletePost } = require('./controllers/postController');
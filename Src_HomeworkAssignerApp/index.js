import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

import {handleHomePageDisplayRequest} from './httpGeneralRequestHandler.js'
import {handleNewUserFormDisplayRequest, handleEditUserRequest, handleLoginFormDisplayRequest, handleLoginRquest, handleLogoutRequest, handleGetAllUsersRequest, handleUserByIDRequest} from './httpUserHandler.js';
import {handleGetAllHomeworksByUserIDRequest, handleNewHomeworkDisplayRequest, handleNewHomeworkSubmitRequest, handleDisplayHomeworkByIDRequest, handleEditHomeworkFormDisplayRequest, handleEditHomeworkSubmitRequest, handleDisplayAnswerSubmitFormRequest, handleAnswerSubmitRequest} from './httpHomeworkHandler.js';
import {handleNewCommentRequest, handleNewReplyCommentRequest, handleEditCommentRequest} from './httpCommentHandler.js';

const PORT = process.argv[2];

const app = express();

// a library cookie-parser to parse the cookie string value in the header into a JavaScript Object.
app.use(cookieParser());

// Set the view engine to generate HTML responses through ejs files in view directory
app.set('view engine', 'ejs');
// To receive POST request data as an object
// This middleware function parses incoming requests with urlenconded payloads
app.use(express.urlencoded({ extended: false }));
// override with POST having ?_method=PUT & DELETE
app.use(methodOverride('_method'));
// To serve the static files like css files, image files.
// This will load the files that are in the public directory
app.use(express.static('public'));
app.use(express.static('images'));
app.use(express.static('uploads'));

/**
 * Home Page
 */
app.get('/',handleHomePageDisplayRequest);

/**
 * User Account Creation, Login and Logout
 */
// Render a form that will sign up a user.
app.get('/new-user', handleNewUserFormDisplayRequest);
// Accept a POST request to create a user.
app.post('/edit-user', handleEditUserRequest);
// Render a form that will log a user in.
app.get('/login', handleLoginFormDisplayRequest);
// Accept a POST request to log a user in.
app.post('/login', handleLoginRquest);
// Log a user out. Get rid of their cookie.
app.delete('/logout', handleLogoutRequest);
// To get the list of current users in the system
app.get('/all-users', handleGetAllUsersRequest)
// To get the details of a specific user
app.get('/user/:id', handleUserByIDRequest)

/**
 * Homework requests
 */
// To display the complete list of homework for a specific user
// Filtering by Subject & Grade
// Sorting by Latest order
app.get('/list-homeworks', handleGetAllHomeworksByUserIDRequest);
// New homework form display request
app.get('/newhw', handleNewHomeworkDisplayRequest);
// New homework submit request
app.get('/newhw', handleNewHomeworkSubmitRequest);
// Display details of a homework
app.get('homework/:id', handleDisplayHomeworkByIDRequest);
// Render a form to edit a homework.
app.get('/homework/:id/edit', handleEditHomeworkFormDisplayRequest);
// Accept a request to edit a single homework
app.put('/homework/:id/edit', handleEditHomeworkSubmitRequest);

/**
 * Comment requests handling
 */
// New comment request
app.post('/homework/:id/comment/', handleNewCommentRequest);
// Replying to a comment
app.post('/homework/:id/comment/:prev_cmt_id', handleNewReplyCommentRequest);
// Comment edit request
app.post('/homework/:id/comment/:cmt_id', handleEditCommentRequest);

/**
 * Answer Submission requests
 */
app.get('/submit/:id', handleDisplayAnswerSubmitFormRequest);
app.post('/submit/:id', handleAnswerSubmitRequest);
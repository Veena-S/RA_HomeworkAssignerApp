import express from 'express';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import multer from 'multer';

import { authenticateRequestUsingCookies } from './httpGeneralRequestHandler.js';

import {
  handleNewUserFormDisplayRequest, handleNewUserCreateRequest,
  handleEditUserFormDisplayRequest, handleEditUserRequest, handleLoginFormDisplayRequest,
  handleLoginRquest, handleLogoutRequest, handleGetAllUsersRequest, handleHomePageDisplayRequest,
  handleSearchUserFormDisplayRequest, handleDeleteRequest, handleSearchUserRequest,
} from './httpUserHandler.js';
import {
  handleGetAllHomeworksByUserRequest, handleNewHomeworkDisplayRequest,
  handleNewHomeworkSubmitRequest, handleSearchHomeworkFormDisplayRequest,
  handleSearchHomeworkRequest, handleDisplayHomeworkByIDRequest,
  handleEditHomeworkFormDisplayRequest, handleEditHomeworkSubmitRequest,
  handleDeleteHomeworkRequest,
} from './httpHomeworkHandler.js';
import {
  handleNewCommentRequest, handleNewReplyCommentRequest,
  handleEditCommentRequest,
} from './httpCommentHandler.js';
import { handleDisplayAnswerSubmitFormRequest, handleAnswerSubmitRequest } from './httpSubmissionHandler.js';

import db_config from './constants.js';

const PORT = process.argv[2];

const app = express();

// a library cookie-parser to parse the cookie string value in the header into a JavaScript Object.
app.use(cookieParser());

// Set the name of the upload directory
const multerUpload = multer({ dest: 'uploads/' });

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
app.get('/', authenticateRequestUsingCookies, handleHomePageDisplayRequest);

/**
 * User Account Creation, Login and Logout
 */
// To get the list of current users in the system
app.get('/all-users', authenticateRequestUsingCookies, handleGetAllUsersRequest);

// To view the details of a user
app.get('/user/:id/edit', handleEditUserFormDisplayRequest);
// Accept a PUT request to edit a user.
app.put('/user/:id/edit', handleEditUserRequest);

// To search for a user using given field
app.get('/search-user', handleSearchUserFormDisplayRequest);
app.post('/search-user', handleSearchUserRequest);

// To delete a user
app.put('/user/:id/delete', handleDeleteRequest);

// Render a form that will sign up a user.
app.get('/new-user', authenticateRequestUsingCookies, handleNewUserFormDisplayRequest);
// Accept a POST request to create new user
app.post('/new-user', authenticateRequestUsingCookies, handleNewUserCreateRequest);

/**
 * User Login, logout request handling
 */
// Render a form that will log a user in.
app.get('/login', handleLoginFormDisplayRequest);
// Accept a POST request to log a user in.
app.post('/login', handleLoginRquest);
// Log a user out. Get rid of their cookie.
app.delete('/logout', handleLogoutRequest);

/**
 * Homework requests
 */
// To display the complete list of homework for a specific user
// Filtering by Subject & Grade
// Sorting by Latest order
app.get('/list-homeworks', authenticateRequestUsingCookies, handleGetAllHomeworksByUserRequest);
// New homework form display request
app.get('/newhw', authenticateRequestUsingCookies, handleNewHomeworkDisplayRequest);
// New homework submit request
app.post('/newhw', multerUpload.single(db_config.colFilePath), authenticateRequestUsingCookies, handleNewHomeworkSubmitRequest);

// For search display form
app.get('/search-hw', handleSearchHomeworkFormDisplayRequest);
app.post('/search-hw', handleSearchHomeworkRequest);

// Display details of a homework
app.get('homework/:id', authenticateRequestUsingCookies, handleDisplayHomeworkByIDRequest);
// Render a form to edit a homework.
app.get('/homework/:id/edit', authenticateRequestUsingCookies, handleEditHomeworkFormDisplayRequest);
// Accept a request to edit a single homework
app.put('/homework/:id/edit', multerUpload.single(db_config.colFilePath), authenticateRequestUsingCookies, handleEditHomeworkSubmitRequest);
app.delete('/homework/:id/delete', authenticateRequestUsingCookies, handleDeleteHomeworkRequest);

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

app.listen(PORT);

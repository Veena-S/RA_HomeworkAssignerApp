import { request, response } from 'express';
import jsSHA from 'jssha';
import db_config from './constants.js';
import {
  createNewUser, getAllSubjectAndGrades, getAllUsers, getUserInfoByGivenField,
} from './psqlDataHandler.js';

const saltEnvVar = process.env.SALT_ENV_VAR;

let loggedInUserName = '';
let loggedInUserRoles = '';

// Function to detect the role of the user, based on the info retrieved from database
// 0 = not a valid user
// 1 = teacher
// 2 = student
// 3 = non-teaching staff
// Returned will be an array of role +- admin
const detectUserRole = (dbUserInfo) => {
  let role;
  if ((dbUserInfo[db_config.colRole] === db_config.roleTeacher
    && (dbUserInfo[db_config.colAdmin] === true)))
  {
    // teacher + admin
    role = [db_config.roleTeacher, db_config.roleAdmin];
  }
  else if ((dbUserInfo[db_config.colRole] === db_config.roleNonTeachingStaff
    && (dbUserInfo[db_config.colAdmin] === true))) {
    // non teaching staff + admin
    role = [db_config.roleNonTeachingStaff, db_config.roleAdmin];
  }
  else if (dbUserInfo[db_config.colRole] === db_config.roleStudent)
  {
    // student + no admin
    role = [db_config.roleStudent, 0];
  }
  else {
    // not a user
    role = [0, 0];
  }
  console.log(role);
  return role;
};

/**
 *
 * @param {*} unhashedValueInput - Value to be hashed
 * @param {*} useSalt - Boolean value expected indicating whether
 *                      to append Salt value also to hashed value
 *
 * This function generates the hashed value of the specified value.
 */
const generatedHashedValue = (unhashedValueInput, useSalt) => {
  /**
   * Hashing passwords using jsSHA library
   */
  let unhashedValue = unhashedValueInput;
  if (useSalt)
  {
    unhashedValue += `-${saltEnvVar}`;
  }
  // initialise the SHA object
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // input the password from the request to the SHA object
  shaObj.update(unhashedValue);
  // get the hashed password as output from the SHA object
  const hashedValue = shaObj.getHash('HEX');
  console.log(`UnhashedValue: ${unhashedValue}, HashedValue: ${hashedValue}`);
  return hashedValue;
};

/**
 *
 * @param {*} loginData  - username, email & password specified in the login request
 * @param {*} searchReturnUserInfoArray - Search result returned from the db query
 * @param {*} response  - to send HTTP response
 *
 * This function validates the given user name against the data retrieved from the database
 * Also, sends the cookie also along with response
 */
const validateAndLoginUser = (loginData, searchReturnUserInfoArray, response) => {
  if ((searchReturnUserInfoArray.length === 0) || (searchReturnUserInfoArray.length > 1))
  {
    response.status(300).render('messagePage', { message: 'User is not found', from: 'js' });
    return;
  }
  const userInfo = searchReturnUserInfoArray[0];

  // Get the hashed value of the user provided password
  const hashedInputPassword = generatedHashedValue(loginData.inputPassword, false);
  // If the user's hashed password in the database does not
  // match the hashed input password, login fails
  if (userInfo.password !== hashedInputPassword) {
    // the error for incorrect email and incorrect password are the same for security reasons.
    // This is to prevent detection of whether a user has an account for a given service.
    response.status(300).render('messagePage', { message: 'Login failed!', from: 'js' });
    return;
  }
  loggedInUserRoles = detectUserRole(userInfo);

  response.cookie('role', loggedInUserRoles);
  // If email was specified during login, use email in cookie.
  // Else use username.
  if (loginData.inputEmail.length !== 0)
  {
    // create an unhashed cookie string based on user ID and salt
    const hashedCookieString = generatedHashedValue(loginData.inputEmail, true);
    // set the loggedInHash and username cookies in the response
    response.cookie('loggedInBy', db_config.descEmail);
    response.cookie('loggedInSession', hashedCookieString);
    response.cookie('userInfo', userInfo[db_config.colEmail]);
    loggedInUserName = userInfo[db_config.colEmail];
  } else {
    // create an unhashed cookie string based on user ID and salt
    const hashedCookieString = generatedHashedValue(loginData.inputUserName, true);
    // set the loggedInHash and username cookies in the response
    response.cookie('loggedInBy', db_config.descUserName);
    response.cookie('loggedInSession', hashedCookieString);
    response.cookie('userInfo', userInfo[db_config.colUserName]);
    loggedInUserName = userInfo[db_config.colUserName];
  }

  // end the request-response cycle
  // response.send('logged in!');
  response.render('commonHomePage', {
    displayPage: 'userPage',
    userName: loggedInUserName,
    roles: loggedInUserRoles,
  });
};

/**
 *
 * @param {*} requestCookies - Cookies from the request
 *
 * This function validates the session, by checking the cookie values.
 * If cookies don't match, it will return false, else true.
 */
export const validateCookies = (requestCookies) => {
  console.log('validateCookies');
  const {
    role, loggedInBy, loggedInSession, userInfo,
  } = requestCookies;
  if (loggedInSession === undefined || userInfo === undefined)
  {
    return false;
  }
  // create hashed value for the user info provided.
  const hashedUserInfo = generatedHashedValue(userInfo, true);
  if (hashedUserInfo !== loggedInSession)
  {
    return false;
  }
  return true;
};

const displayNewUserForm = (allSubjectsAndGrades, response) => {
  const userTableColNames = {
    [db_config.descUserName]: db_config.colUserName,
    [db_config.descInstID]: db_config.colInstID,
    [db_config.descFirstName]: db_config.colFirstName,
    [db_config.descLastName]: db_config.colLastName,
    [db_config.descEmail]: db_config.colEmail,
    [db_config.descPassword]: db_config.colPassword,
    [db_config.descContactNumber]: db_config.colContactNumber,
    [db_config.descAddress]: db_config.colAddress,
  };
  const newUserRoles = {
    Teacher: db_config.roleTeacher,
    Student: db_config.roleStudent,
    Admin: db_config.roleAdmin,
    NonTeachingStaff: db_config.roleNonTeachingStaff,
  };

  console.log('typeof allSubjectsAndGrades: ', typeof allSubjectsAndGrades);
  if (allSubjectsAndGrades !== undefined)
  {
    console.log(allSubjectsAndGrades);
    console.log('Object.entries(allSubjectsAndGrades): ', Object.entries(allSubjectsAndGrades));
    // console.log('Object.entries(allSubjectsAndGrades.dataSubjectGrade): ',
    // Object.entries(allSubjectsAndGrades.dataSubjectGrade));
    console.log('Object.keys(allSubjectsAndGrades): ', Object.keys(allSubjectsAndGrades));

    console.log('typeof allSubjectsAndGrades.dataSubjectGrade: ', typeof allSubjectsAndGrades.dataSubjectGrade); }

  response.render('newUserForm', {
    userTableColNames,
    allSubjectsAndGrades,
    userName: loggedInUserName,
    roles: loggedInUserRoles,
    newUserRoles,
  });
};

const displayAllUsersList = (allUsersSearchResultRows, response) => {
  response.render('listAllUsers', {
    userData: allUsersSearchResultRows,
    userName: loggedInUserName,
    roles: loggedInUserRoles,
    dbDescColNames: db_config,
  });
};

// Render a form that will sign up a user.
export const handleNewUserFormDisplayRequest = (request, response) => {
  console.log('handleNewUserFormDisplayRequest');
  // Get all the existing Subjects and respective grades
  getAllSubjectAndGrades(
    (allSubjectsAndGrades) => {
      displayNewUserForm(allSubjectsAndGrades, response);
    },
    (error) => {
      console.log(error);
      response.status(300).render('messagePage', { message: 'New user creation failed', from: 'js' });
    },
  );
};

export const handleNewUserCreateRequest = (request, response) => {
  console.log('handleNewUserCreateRequest');

  console.log(`Before hashing: ${request.body[db_config.colPassword]}`);
  // set the hashed password back to the request, which will be set to users table in db
  request.body[db_config.colPassword] = generatedHashedValue(request.body[db_config.colPassword],
    false);
  console.log(`After hashing: ${request.body[db_config.colPassword]}`);

  createNewUser(request.body,
    (newUserData) => {
      displayAllUsersList(newUserData, response);
    },
    (error) => {
      console.log(error);
      response.status(300).render('messagePage',
        { message: 'No existing users found!!', from: 'js' }); });
};

export const handleEditUserFormDisplayRequest = (request, response) => {
  console.log('handleEditUserRequest');
  console.log(request.params.id);
};

// Accept a POST request to create a user.
export const handleEditUserRequest = (request, response) => {

};

// Render a form that will log a user in.
export const handleLoginFormDisplayRequest = (request, response) => {
  console.log('handleLoginFormDisplayRequest');

  const loginFormDetails = {
    [db_config.descUserName]: db_config.colUserName,
    [db_config.descEmail]: db_config.colEmail,
    [db_config.descPassword]: db_config.colPassword,
  };

  response.render('loginForm', { displayType: 'login', loginFormDetails });
};

// Accept a POST request to log a user in.
export const handleLoginRquest = (request, response) => {
  console.log('handleLoginRquest', request.body);
  const loginData = {
    inputUserName: request.body[db_config.colUserName],
    inputEmail: request.body[db_config.colEmail],
    inputPassword: request.body[db_config.colPassword],
  };
  console.log(loginData);
  // if any of the field, user name or email is specified, proceed with login
  let fieldName = '';
  let fieldValue = '';
  if (loginData.inputUserName.length !== 0)
  {
    fieldName = db_config.colUserName;
    fieldValue = loginData.inputUserName;
  } else {
    if (loginData.inputEmail.length === 0)
    {
      console.log('Neither user name nor email given for logging in');
      response.status(300).render('messagePage',
        { message: 'Please login with User Name or email!!', from: 'js' });
      return;
    }
    fieldName = db_config.colEmail;
    fieldValue = loginData.inputEmail;
  }
  getUserInfoByGivenField(fieldName, fieldValue, (searchResultRows) => {
    validateAndLoginUser(loginData, searchResultRows, response);
  },
  (searchError) => {
    console.log('Error occurred while logging in', searchError.stack);
    response.status(300).render('messagePage', { message: 'Error occurred while logging in', from: 'js' });
  });
};

// Log a user out. Get rid of their cookie.
export const handleLogoutRequest = (request, response) => {
  response.clearCookie('role');
  response.clearCookie('loggedInBy');
  response.clearCookie('loggedInSession');
  response.clearCookie('userInfo');
  response.send('Logged out');
};

// To get the list of current users in the system
export const handleGetAllUsersRequest = (request, response) => {
  getAllUsers(
    (searchResultRows) => { displayAllUsersList(searchResultRows, response); },
    (searchError) => {
      console.log(searchError);
      response.status(300).render('messagePage', { message: 'No existing users found!!', from: 'js' }); },
  );
};

// To search for a user using given field
export const handleSearchUserFormDisplayRequest = (request, response) => {

};

export const handleSearchUserRequest = (request, response) => {

};

// To delete a user using given field
export const handleDeleteRequest = (request, response) => {

};

// To get the details of a specific user
export const handleUserByIDRequest = (request, response) => {

};

export function handleHomePageDisplayRequest(request, response) {
  console.log(request.body);
  console.log('handleHomePageDisplayRequest');
  console.log('Cookie validation.', request.cookies);
  console.log(loggedInUserName, loggedInUserRoles);
  // Validate the session is logged in or not using cookies
  const {
    role, loggedInBy, loggedInSession, userInfo,
  } = request.cookies;
  if (!validateCookies(request.cookies))
  {
    console.log('Cookie validation failed');
    response.render('commonHomePage', {
      displayPage: 'homePage',
      userName: userInfo,
      roles: role,
    });
    return;
  }

  response.render('commonHomePage', {
    displayPage: 'userPage',
    userName: userInfo,
    roles: role,
  });
}

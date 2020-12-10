import jsSHA from 'jssha';
import dbConfig from './constants.js';
import {
  createNewUser, getAllSubjectAndGrades, getAllUsers,
  getUserInfoByGivenField, getListOfDistinctSubjects,
} from './psqlDataHandler.js';

const saltEnvVar = process.env.SALT_ENV_VAR;

// let loggedInUserName = '';
// let loggedInUserRoles = '';

// Function to detect the role of the user, based on the info retrieved from database
// 0 = not a valid user
// 1 = teacher
// 2 = student
// 3 = non-teaching staff
// Returned will be an array of role +- admin
export const detectUserRole = (dbUserInfo) => {
  let role;
  if ((dbUserInfo[dbConfig.colRole] === dbConfig.roleTeacher
    && (dbUserInfo[dbConfig.colAdmin] === true)))
  {
    // teacher + admin
    role = [dbConfig.roleTeacher, dbConfig.roleAdmin];
  }
  else if ((dbUserInfo[dbConfig.colRole] === dbConfig.roleNonTeachingStaff
    && (dbUserInfo[dbConfig.colAdmin] === true))) {
    // non teaching staff + admin
    role = [dbConfig.roleNonTeachingStaff, dbConfig.roleAdmin];
  }
  else if (dbUserInfo[dbConfig.colRole] === dbConfig.roleStudent)
  {
    // student + no admin
    role = [dbConfig.roleStudent, 0];
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
export const generatedHashedValue = (unhashedValueInput, useSalt) => {
  /**
   * Hashing passwords using jsSHA library
   */
  let unhashedValue = unhashedValueInput;
  if (useSalt)
  {
    unhashedValue += `-${saltEnvVar}`;
  }
  // initialise the SHA object
  // eslint-disable-next-line new-cap
  const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // input the password from the request to the SHA object
  shaObj.update(unhashedValue);
  // get the hashed password as output from the SHA object
  const hashedValue = shaObj.getHash('HEX');
  console.log(`UnhashedValue: ${unhashedValue}, HashedValue: ${hashedValue}`);
  return hashedValue;
};

// Function that validates the user id specified in the login details
export const extractLoggedInFieldDetails = (loginData) => {
  console.log(loginData);
  // if any of the field, user name or email is specified, proceed with login
  let fieldName = '';
  let fieldValue = '';
  if (loginData.inputUserName.length !== 0)
  {
    fieldName = dbConfig.colUserName;
    fieldValue = loginData.inputUserName;
  } else {
    if (loginData.inputEmail.length === 0)
    {
      console.log('Neither user name nor email given for logging in');
      return { fieldName: '', fieldValue: '' };
    }
    fieldName = dbConfig.colEmail;
    fieldValue = loginData.inputEmail;
  }
  return { fieldName, fieldValue };
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
    response.status(300).render('messagePage', {
      message: 'User is not found', userName: '', roles: [], from: 'js',
    });
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
    response.status(300).render('messagePage', {
      message: 'Login failed!', userName: '', roles: [], from: 'js',
    });
    return;
  }
  let loggedInUserName;
  const loggedInUserRoles = detectUserRole(userInfo);
  response.cookie('role', loggedInUserRoles);
  // If email was specified during login, use email in cookie.
  // Else use username.
  if (loginData.inputEmail.length !== 0)
  {
    // create an unhashed cookie string based on user ID and salt
    const hashedCookieString = generatedHashedValue(loginData.inputEmail, true);
    // set the loggedInHash and username cookies in the response
    response.cookie('loggedInBy', dbConfig.descEmail);
    response.cookie('loggedInSession', hashedCookieString);
    response.cookie('userInfo', userInfo[dbConfig.colEmail]);
    loggedInUserName = userInfo[dbConfig.colEmail];
  } else {
    // create an unhashed cookie string based on user ID and salt
    const hashedCookieString = generatedHashedValue(loginData.inputUserName, true);
    // set the loggedInHash and username cookies in the response
    response.cookie('loggedInBy', dbConfig.descUserName);
    response.cookie('loggedInSession', hashedCookieString);
    response.cookie('userInfo', userInfo[dbConfig.colUserName]);
    loggedInUserName = userInfo[dbConfig.colUserName];
  }

  // end the request-response cycle
  // response.send('logged in!');
  response.render('commonHomePage', {
    displayPage: 'userPage',
    userName: loggedInUserName,
    roles: loggedInUserRoles,
  });
};

const displayNewUserForm = (allSubjectsAndGrades, distinctSubjectsList, dbUserInfo, response) => {
  const userTableColNames = {
    [dbConfig.descUserName]: dbConfig.colUserName,
    [dbConfig.descInstID]: dbConfig.colInstID,
    [dbConfig.descFirstName]: dbConfig.colFirstName,
    [dbConfig.descLastName]: dbConfig.colLastName,
    [dbConfig.descEmail]: dbConfig.colEmail,
    [dbConfig.descPassword]: dbConfig.colPassword,
    [dbConfig.descContactNumber]: dbConfig.colContactNumber,
    [dbConfig.descAddress]: dbConfig.colAddress,
  };
  const newUserRoles = {
    Teacher: dbConfig.roleTeacher,
    Student: dbConfig.roleStudent,
    Admin: dbConfig.roleAdmin,
    NonTeachingStaff: dbConfig.roleNonTeachingStaff,
  };

  console.log('typeof allSubjectsAndGrades: ', typeof allSubjectsAndGrades);
  // if (allSubjectsAndGrades !== undefined)
  // {
  //   console.log(allSubjectsAndGrades);
  //   console.log('Object.entries(allSubjectsAndGrades): ', Object.entries(allSubjectsAndGrades));
  //   console.log('Object.entries(allSubjectsAndGrades.dataSubjectGrade): ',
  //     Object.entries(allSubjectsAndGrades.dataSubjectGrade));
  //   console.log('Object.keys(allSubjectsAndGrades): ', Object.keys(allSubjectsAndGrades));
  //   console.log('typeof allSubjectsAndGrades.dataSubjectGrade: ',
  //    typeof allSubjectsAndGrades.dataSubjectGrade);
  // }

  response.render('newUserForm', {
    userTableColNames,
    allSubjectsAndGrades,
    distinctSubjectsList,
    userName: dbUserInfo[dbConfig.colUserName],
    roles: detectUserRole(dbUserInfo),
    newUserRoles,
  });
};

const displayAllUsersList = (allUsersSearchResultRows, requestUserInfo, response) => {
  response.render('listAllUsers', {
    userData: allUsersSearchResultRows,
    userName: requestUserInfo[dbConfig.colUserName],
    roles: detectUserRole(requestUserInfo),
    dbDescColNames: dbConfig,
  });
};

const isRequestUserAmin = (request) =>
{
  // Validate User before displaying the new user form
  if (!request.isUserLoggedIn)
  {
    return { isValid: false, msg: 'You are not logged in' };
  }
  // If a valid user, check whether it's a admin
  if (!request.userInfo[dbConfig.colAdmin])
  {
    return { isValid: false, msg: 'You are not authorized.' };
  }
  return { isValid: true, msg: '' };
};

// Render a form that will sign up a user.
export const handleNewUserFormDisplayRequest = (request, response) => {
  console.log('handleNewUserFormDisplayRequest');
  // Validate User before displaying the new user form
  // If a valid user, check whether it's a admin
  const resValidity = isRequestUserAmin(request);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  // Get all the existing Subjects and respective grades
  getAllSubjectAndGrades(
    (allSubjectsAndGrades) => {
      getListOfDistinctSubjects((distinctSubjectsList) => {
        displayNewUserForm(allSubjectsAndGrades, distinctSubjectsList, request.userInfo, response);
      },
      (subError) => {
        console.log(subError);
        response.status(300).render('messagePage',
          {
            message: 'New user creation failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
          });
      });
    },
    (error) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: 'New user creation failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    },
  );
};

export const handleNewUserCreateRequest = (request, response) => {
  console.log('handleNewUserCreateRequest');
  const resValidity = isRequestUserAmin(request);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  console.log(`Before hashing: ${request.body[dbConfig.colPassword]}`);
  // set the hashed password back to the request, which will be set to users table in db
  request.body[dbConfig.colPassword] = generatedHashedValue(request.body[dbConfig.colPassword],
    false);
  console.log(`After hashing: ${request.body[dbConfig.colPassword]}`);

  createNewUser(request.body,
    (newUserData) => {
      displayAllUsersList(newUserData, request.userInfo, response);
    },
    (error) => {
      console.log(error);
      response.status(300).render('messagePage',
        {
          message: 'No existing users found!!', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
        }); });
};

export const handleEditUserFormDisplayRequest = (request, response) => {
  console.log('handleEditUserRequest');
  console.log(request.params.id);
  console.log(request, response);
};

// Accept a POST request to create a user.
export const handleEditUserRequest = (request, response) => {
  console.log(request, response);
};

// Render a form that will log a user in.
export const handleLoginFormDisplayRequest = (request, response) => {
  console.log('handleLoginFormDisplayRequest');

  const loginFormDetails = {
    [dbConfig.descUserName]: dbConfig.colUserName,
    [dbConfig.descEmail]: dbConfig.colEmail,
    [dbConfig.descPassword]: dbConfig.colPassword,
  };

  response.render('loginForm', { displayType: 'login', loginFormDetails });
};

// Accept a POST request to log a user in.
export const handleLoginRquest = (request, response) => {
  console.log('handleLoginRquest', request.body);
  const loginData = {
    inputUserName: request.body[dbConfig.colUserName],
    inputEmail: request.body[dbConfig.colEmail],
    inputPassword: request.body[dbConfig.colPassword],
  };
  console.log(loginData);

  const fieldData = extractLoggedInFieldDetails(loginData);
  if (fieldData.fieldName === '' || fieldData.fieldValue === '')
  {
    response.status(300).render('messagePage',
      {
        message: 'Please login with User Name or email!!', userName: '', roles: [], from: 'js',
      });
    return;
  }

  getUserInfoByGivenField(fieldData.fieldName, fieldData.fieldValue, (searchResultRows) => {
    validateAndLoginUser(loginData, searchResultRows, response);
  },
  (searchError) => {
    console.log('Error occurred while logging in', searchError.stack);
    response.status(300).render('messagePage', {
      message: 'Error occurred while logging in', userName: '', roles: [], from: 'js',
    });
  });
};

// Log a user out. Get rid of their cookie.
export const handleLogoutRequest = (request, response) => {
  response.clearCookie('role');
  response.clearCookie('loggedInBy');
  response.clearCookie('loggedInSession');
  response.clearCookie('userInfo');
  response.render('commonHomePage', {
    displayPage: 'homePage',
    userName: '',
    roles: [],
  });
};

// To get the list of current users in the system
export const handleGetAllUsersRequest = (request, response) => {
  console.log('handleGetAllUsersRequest');
  const resValidity = isRequestUserAmin(request);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  getAllUsers(
    (searchResultRows) => { displayAllUsersList(searchResultRows, request.userInfo, response); },
    (searchError) => {
      console.log(searchError);
      response.status(300).render('messagePage', {
        message: 'No existing users found!!', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      }); },
  );
};

// To search for a user using given field
export const handleSearchUserFormDisplayRequest = (request, response) => {
  console.log(request, response);
};

export const handleSearchUserRequest = (request, response) => {
  console.log(request, response);
};

// To delete a user using given field
export const handleDeleteRequest = (request, response) => {
  console.log(request, response);
};

// To get the details of a specific user
export const handleUserByIDRequest = (request, response) => {
  console.log(request, response);
};

export function handleHomePageDisplayRequest(request, response) {
  if (!request.isUserLoggedIn)
  {
    // If there is no logged in data, it's assumed to be the
    // simple homepage view request from anyone.
    response.render('commonHomePage', {
      displayPage: 'homePage',
      userName: '',
      roles: [],
    });
    return;
  }

  response.render('commonHomePage', {
    displayPage: 'userPage',
    userName: request[dbConfig.colUserName],
    roles: detectUserRole(request.userInfo),
  });
}

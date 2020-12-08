import { generatedHashedValue } from './httpUserHandler.js';
import * as dbConfig from './constants.js';
import { getUserInfoByGivenField } from './psqlDataHandler.js';

/**
 *
 * @param {*} requestCookies - Cookies from the request
 *
 * This function validates the session, by checking the cookie values.
 * If cookies don't match, it will return false, else true.
 */
export const validateSessionUserByCookies = (loggedInSession, userInfo /* , role */) => {
  console.log('validateCookies');
  if (loggedInSession === undefined || userInfo === undefined)
  {
    // return { loggedInUserName: '', loggedInUserRoles: '', isValid: false };
    return false;
  }
  // create hashed value for the user info provided.
  const hashedUserInfo = generatedHashedValue(userInfo, true);
  if (hashedUserInfo !== loggedInSession)
  {
    // return { loggedInUserName: '', loggedInUserRoles: '', isValid: false };
    return false;
  }
  // loggedInUserName = userInfo;
  // loggedInUserRoles = role;
  // return { loggedInUserName: userInfo, loggedInUserRoles: role, isValid: true };
  return true;
};

// Function to check whether the request is an authenticated user or not
export const authenticateRequestUsingCookies = (request) => {
  // set the default value
  request.isUserLoggedIn = false;

  // Validate the session is logged in or not using cookies
  const loggedInUser = request.cookies.userInfo;
  const { loggedInBy } = request.cookies;
  const { loggedInSession } = request.cookies;
  const fieldName = (loggedInBy === dbConfig.descEmail)
    ? dbConfig.colEmail : dbConfig.colUserName;

  if (fieldName === '' || loggedInUser === '')
  {
    return 'Please login with User Name or email!!';
  }
  // const dataValidity = validateSessionUserByCookies(loggedInSession, loggedInUser, role);
  // if (dataValidity.isValid)
  if (validateSessionUserByCookies(loggedInSession, loggedInUser))
  {
    // look for this user in the database
    getUserInfoByGivenField(fieldName, loggedInUser,
      ((searchResult) => {
        if (searchResult.length === 0)
        {
          return 'User not found';
        }
        request.userInfo = [...searchResult[0]];
        request.isUserLoggedIn = true;
        return 'Logged in';
      }),
      ((searchError) => {
        console.log(searchError);
        return 'User not found';
      }));
  }
  else {
    return 'User validation failed';
  }
  return '';
};

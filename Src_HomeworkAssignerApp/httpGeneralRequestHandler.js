import { generatedHashedValue } from './httpUserHandler.js';
import dbConfig from './constants.js';
import { getUserInfoByGivenField } from './psqlDataHandler.js';

/**
 *
 * @param {*} requestCookies - Cookies from the request
 *
 * This function validates the session, by checking the cookie values.
 * If cookies don't match, it will return false, else true.
 */
export const validateSessionUserByCookies = (loggedInSession, userInfo /* , role */) => {
  console.log('validateSessionUserByCookies');
  if (loggedInSession === undefined || userInfo === undefined)
  {
    // return { loggedInUserName: '', loggedInUserRoles: '', isValid: false };
    console.log('validateSessionUserByCookies - undefined values');
    return false;
  }
  // create hashed value for the user info provided.
  const hashedUserInfo = generatedHashedValue(userInfo, true);
  if (hashedUserInfo !== loggedInSession)
  {
    // return { loggedInUserName: '', loggedInUserRoles: '', isValid: false };
    console.log('validateSessionUserByCookies - hashed value is not matching: ', `hashedUserInfo: ${hashedUserInfo}`, `loggedInSession: ${loggedInSession}`);
    return false;
  }
  // loggedInUserName = userInfo;
  // loggedInUserRoles = role;
  // return { loggedInUserName: userInfo, loggedInUserRoles: role, isValid: true };
  console.log('validateSessionUserByCookies - success');
  return true;
};

// Function to check whether the request is an authenticated user or not
export const authenticateRequestUsingCookies = (request, response, next) => {
  console.log('authenticateRequestUsingCookies');
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
    console.log('authenticateRequestUsingCookies - not logged in');
    //    return 'Please login with User Name or email!!';
    throw new Error('Please login with User Name or email!!');
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
          console.log('authenticateRequestUsingCookies - User not found');
          // return 'User not found';
          throw new Error('User not found');
        }
        // eslint-disable-next-line prefer-destructuring
        request.userInfo = searchResult[0];
        request.isUserLoggedIn = true;
        console.log(`authenticateRequestUsingCookies - logged in: ${request.userInfo}`);
        console.log(`authenticateRequestUsingCookies - logged in: ${request.isUserLoggedIn}`);
        console.log('authenticateRequestUsingCookies - logged in');
        // return 'Logged in';
        next();
      }),
      ((searchError) => {
        console.log(searchError);
        // return 'User not found';
        throw new Error('User not found');
      }));
  }
  else {
    console.log('validateSessionUserByCookies failed');
    // return 'User validation failed';
    // throw new Error('User validation failed');
    next();
  }
  return '';
};

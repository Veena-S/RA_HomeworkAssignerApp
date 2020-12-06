import pg from 'pg';
import { default as db_config } from './constants.js';

// Initialize DB connection
const { Pool } = pg;

// create separate DB connection configs for production vs non-production environments.
// ensure our server still works on our local machines.
let pgConnectionConfigs;
if (process.env.ENV === 'PRODUCTION') {
  // determine how we connect to the remote Postgres server
  pgConnectionConfigs = {
    user: 'postgres',
    // set DB_PASSWORD as an environment variable for security.
    password: process.env.DB_PASSWORD,
    host: 'localhost',
    database: db_config.dbName,
    port: 5432,
  };
} else {
  // determine how we connect to the local Postgres server
  pgConnectionConfigs = {
    user: 'veenas',
    host: 'localhost',
    database: db_config.dbName,
    port: 5432,
  };
}
const pool = new Pool(pgConnectionConfigs);

/**
 * This is to store all the registered user info in the database table.
 * This will serve as a cache. And it will be updated whenever a new user is registered
 */
export const allUsersData = { usersData: [] };

/**
 *
 * @param {*} fieldName - column name to be searched for
 * @param {*} fieldValue - value to be searched for
 *
 * This function checks whether a specified user info is present in the cache
 */
const getUserIndexInCache = (fieldName, fieldValue) => {
  const index = allUsersData.usersData.findIndex((perUserInfo) => {
    if (perUserInfo[fieldName] === fieldValue)
    {
      return true;
    }
    return false;
  });
  return index;
};

// Cache to store the Subjects
let allSubjectsAndGrades;

/**
 *
 * @param {*} cbSuccess - success callback function
 * @param {*} cbFailure - failure callback function
 *
 * This function gets all the data present in the subjects table and stores in the cache
 */
export const getAllSubjectAndGrades = (cbSuccess, cbFailure) => {
  // Check whether the cache for Subjects is empty or not.
  if ((allSubjectsAndGrades === undefined)
   || (Object.keys(allSubjectsAndGrades).length === 0
   && allSubjectsAndGrades.constructor === Object))
  {
    // Cache is empty. Get data from database
    const selectQuery = `SELECT * FROM ${db_config.tableSubjects}`;
    console.log(selectQuery);
    pool.query(selectQuery)
      .then((searchResult) => {
        console.log('getAllSubjectAndGrades: searchresult', searchResult.rows);
        allSubjectsAndGrades = { dataSubjectGrade: searchResult.rows };
        console.log('getAllSubjectAndGrades: allSubjectsAndGrades', allSubjectsAndGrades);
        cbSuccess(allSubjectsAndGrades);
      })
      .catch((searchError) => cbFailure(searchError));
    return;
  }
  cbSuccess(allSubjectsAndGrades);
};

/**
 *
 * @param {*} grade - grade to be searched for
 * @param {*} cbSuccess - success cb
 * @param {*} cbFailure - failure cb
 *
 * This function gets the ids from the table Subject for the given grade.
 */
export const getSubjectIDsByGrade = (grade, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT ${db_config.colID} AS subject_id FROM ${db_config.tableSubjects} WHERE ${db_config.colGrade} = '${grade}'`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => { cbSuccess(searchResult.rows); })
    .catch((searchError) => cbFailure(searchError));
};

/**
 *
 * @param {*} cbSuccess - Callback function to be invoked when search is success
 * @param {*} cbFailure - Callback function to be invoked when search fails
 *
 * This function get the information on all registered users from the database.
 * It also stores the complete user data in an arraya, which will serve as a cache.
 */
export const getAllUsers = (cbSuccess, cbFailure) => {
  const selectUsersQuery = `SELECT * FROM ${db_config.tableUsers}`;
  // promise
  pool.query(selectUsersQuery)
    .then((searchResult) => {
      allUsersData.usersData = searchResult.rows;
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => cbFailure(searchError));
};

// Function to find the role and check whether the new user has admin privilege or not
const identifyUserRolesFromInput = (inputUserInfo) => {
  console.log(inputUserInfo);

  let inputRoles = inputUserInfo.role_ids;

  console.log('inputRoles: ', inputRoles);
  console.log('inputUserInfo.role_ids: ', inputUserInfo.role_ids);

  console.log('typeof inputRoles: ', typeof inputRoles);
  console.log('typeof inputUserInfo.role_ids: ', typeof inputUserInfo.role_ids);

  let isAdmin = false;
  // Only single role is specified
  if (typeof inputRoles === 'string')
  {
    inputRoles = Number(inputRoles);
    // Check whether admin flag is set or not
    isAdmin = (inputRoles === db_config.roleAdmin);
    // If the user is admin, but no other roles are specified, considered as non-teaching staff
    const dataRoleAdmin = (isAdmin) ? ({ role: db_config.roleNonTeachingStaff, admin: isAdmin })
      : { role: inputRoles, admin: isAdmin };
    return dataRoleAdmin;
  }

  // if multiple inputs are specified, the second value should correspond only to Admin.
  // If any other combination comes in, it's an invalid request.
  // Example: Teacher & Student.
  // Also, for Student the admin flag should not be set.
  // TO DO: returning with error
  // For the timebeing, in such invalid cases, only the first role is being taken into account.
  isAdmin = (Number(inputRoles[1]) === db_config.roleAdmin);
  // Check whether it's a student. If yes, set the admin flag as false.
  isAdmin = ((Number(inputRoles[0]) === db_config.roleStudent) && isAdmin) ? false : isAdmin;
  const dataRoleAdmin = { role: inputRoles[0], admin: isAdmin };
  return dataRoleAdmin;
};

// Function to insert the user ID to grade and subject mapping to the table User_Subjects
const mapNewUserToGradeSubjects = (inputUserInfo, newUserDBDataRows, cbSuccess, cbFailure) => {
  // If the user is a non-teaching staff, that user is not related to any grades or subjects.
  // So, no need to update the User_Subjects Table
  const newUserDBData = newUserDBDataRows[0];
  if (newUserDBData[db_config.colRole] === db_config.roleNonTeachingStaff)
  {
    cbSuccess(newUserDBDataRows);
    return;
  }
  // First get the subject-grade id from database.
  const selectSubjectIDQuery = `SELECT ${db_config.colID} FROM ${db_config.tableSubjects} WHERE ${db_config.colGrade} = '${inputUserInfo[db_config.colGrade]}'`;

  console.log(selectSubjectIDQuery);

  pool.query(selectSubjectIDQuery)
    .then((selectResult) => {
      const insertUserSubMapQuery = `INSERT INTO ${db_config.tableUserSubjects} (${db_config.colUserName}, ${db_config.colSubID}) VALUES ($1, $2)`;
      let queryDoneCounter = 0;
      selectResult.rows.forEach((singleRow) => {
        const insertValues = [newUserDBData[db_config.colID], singleRow[db_config.colID]];
        pool.query(insertUserSubMapQuery, insertValues)
          .then((insertResult) => {
            queryDoneCounter += 1;
            console.log(insertResult);
            // if all ros are processed,
            if (queryDoneCounter === selectResult.rowCount)
            {
              cbSuccess(newUserDBDataRows);
            }
          })
          .catch((insertError) => {
            cbFailure(insertError);
          });
      });
    })
    .catch((selectError) => { cbFailure(selectError); });
};

/**
 *
 * @param {*} newUserInfo - details of the new user
 * @param {*} cbSucess - Callback function to be invoked when search is success
 * @param {*} cbFailure - Callback function to be invoked when search fails
 *
 * This function inserts the details of the new user into the Users table.
 * Also, stores the info on newly created user in the cache
 */
export const createNewUser = (newUserInfo, cbSuccess, cbFailure) => {
  console.log(newUserInfo);
  const dataRoleAdmin = identifyUserRolesFromInput(newUserInfo);

  const insertUserQuery = `INSERT INTO ${db_config.tableUsers} (${db_config.colUserName}, ${db_config.colFirstName}, ${db_config.colLastName}, ${db_config.colEmail}, ${db_config.colPassword}, ${db_config.colContactNumber}, ${db_config.colAddress}, ${db_config.colRole}, ${db_config.colAdmin}, ${db_config.colInstID}) VALUES ('${newUserInfo[db_config.colUserName]}', '${newUserInfo[db_config.colFirstName]}', '${newUserInfo[db_config.colLastName]}', '${newUserInfo[db_config.colEmail]}', '${newUserInfo[db_config.colPassword]}', '${newUserInfo[db_config.colContactNumber]}', '${newUserInfo[db_config.colAddress]}', ${dataRoleAdmin.role}, ${dataRoleAdmin.admin}, '${newUserInfo[db_config.colInstID]}') RETURNING *`;

  console.log(insertUserQuery);

  // promise
  pool.query(insertUserQuery)
    .then((insertResult) => {
      console.log(insertResult.rows[0]);
      allUsersData.usersData.push(insertResult.rows[0]);
      mapNewUserToGradeSubjects(newUserInfo, insertResult.rows, cbSuccess, cbFailure);
    })
    .catch((insertError) => cbFailure(insertError));
};

/**
 *
 * @param {*} updateUserInfo - user info to be updated
 * @param {*} cbSuccess - success callback
 * @param {*} cbFailure - failure callback
 *
 * Function to update a specific user information. Updates cache too
 */
export const editUserInfoByID = (updateUserInfo, cbSuccess, cbFailure) => {
  const updateUserQuery = `UPDATE ${db_config.tableUsers} SET 
                          ${db_config.colUserName} = '${updateUserInfo[db_config.colUserName]}',
                          ${db_config.colFirstName} = '${updateUserInfo[db_config.colFirstName]}',
                          ${db_config.colLastName} = '${updateUserInfo[db_config.colLastName]}',
                          ${db_config.colEmail} = '${updateUserInfo[db_config.colEmail]}',
                          ${db_config.colPassword} = '${updateUserInfo[db_config.colPassword]}',
                          ${db_config.colContactNumber} = '${updateUserInfo[db_config.colContactNumber]}', 
                          ${db_config.colAddress} = '${updateUserInfo[db_config.colAddress]}',
                          ${db_config.colRole} = '${updateUserInfo[db_config.colRole]}',
                          ${db_config.colAdmin} = '${updateUserInfo[db_config.colAdmin]}',
                          ${db_config.colInstID} = '${updateUserInfo[db_config.colInstID]}' 
                          WHERE ${db_config.colID} = ${updateUserInfo[db_config.colID]} RETURNING *`;

  console.log(updateUserQuery);

  // promise
  pool.query(updateUserQuery)
    .then((updateResult) => {
      console.log(updateResult.rows[0]);
      // Get the exiting item index from the cache
      const index = getUserIndexInCache(db_config.colID, updateUserInfo[db_config.colID]);
      if (index !== -1)
      {
        // allUsersData.usersData[index] = updateResult.rows[0];
        allUsersData.usersData[index] = [...updateResult.rows[0]];
      }
      cbSuccess(updateResult.rows[0]);
    })
    .catch((updateError) => cbFailure(updateError));
};

/**
 *
 * @param {*} fieldName - column name of the specified value
 * @param {*} fieldValue - field value with which search has to be done
 * @param {*} cbSuccess - success callback
 * @param {*} cbFailure - failure callback
 *
 * To get the details of the user from db, using user ID
 */
export const getUserInfoByGivenField = (fieldName, fieldValue, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${db_config.tableUsers} WHERE ${fieldName} = '${fieldValue}'`;
  console.log(selectQuery);

  pool.query(selectQuery)
    .then((searchResult) => {
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => cbFailure(searchError));
};

/**
 *
 * @param {*} fieldName - column name of the specified value
 * @param {*} fieldValue - field value with which search has to be done
 * @param {*} cbSuccess - success callback
 * @param {*} cbFailure - failure callback
 */
export const deleteUserByGivenFiels = (fieldName, fieldValue, cbSuccess, cbFailure) => {
  const deleteQuery = `DELETE FROM ${db_config.tableUsers} WHERE ${fieldName} = '${fieldValue}'`;
  console.log(deleteQuery);

  pool.query(deleteQuery)
    .then((deleteResult) => {
      cbSuccess(deleteResult.rows);
    })
    .catch((deleteError) => cbFailure(deleteError));
};

/**
 *
 * @param {*} userID - User ID of row to be deleted
 * @param {*} cbSuccess - success callback
 * @param {*} cbFailure - failure callback
 */
export const deleteUserByUserID = (userID, cbSuccess, cbFailure) => {
  const deleteQuery = `DELETE FROM ${db_config.tableUsers} WHERE ${db_config.colID} = ${userID}`;
  console.log(deleteQuery);
  pool.query(deleteQuery)
    .then((deleteResult) => cbSuccess(deleteResult))
    .catch((deleteError) => cbFailure(deleteError));
};

export const createNewHomework = (cbSuccess, cbFailure) => {

  // const insertHomeworkQuery = `INSERT INTO ${}`;

};

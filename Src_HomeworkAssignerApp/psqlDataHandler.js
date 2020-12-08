import pg from 'pg';
import dbConfig from './constants.js';

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
    database: dbConfig.dbName,
    port: 5432,
  };
} else {
  // determine how we connect to the local Postgres server
  pgConnectionConfigs = {
    user: 'veenas',
    host: 'localhost',
    database: dbConfig.dbName,
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
let distinctSubjectsList;

// Function to insert a new grade-subject mapping
export const insertNewSubjectGradeData = (subject, grade, userID, cbSuccess, cbFailure) => {
  const insertSubjectQuery = `INSERT INTO ${dbConfig.tableSubjects} (${dbConfig.colGrade}, ${dbConfig.colSubjectName}) VALUES ('${grade}', '${subject}') RETURNING ${dbConfig.colID}`;
  console.log(insertSubjectQuery);
  pool.query(insertSubjectQuery)
    .then((insertResult) => {
      // Insert the user-subjectid mapping into User_Subjects
      const insertUserSubject = `INSERT INTO ${dbConfig.tableUserSubjects} (${dbConfig.colUserID}, ${dbConfig.colSubID}) VALUES (${userID}, ${insertResult.rows[0][dbConfig.colID]})`;
      console.log(insertUserSubject);
      pool.query(insertUserSubject)
        .then((result) => {
          console.log(`New entry in ${dbConfig.tableUserSubjects}: ${result}`);
          cbSuccess(insertResult.rows[0][dbConfig.colID]); })
        .catch((error) => { cbFailure(error); });
    })
    .catch((insertError) => { cbFailure(insertError); });
};

// Function to get the list of distinct subjects already registered
export const getListOfDistinctSubjects = (cbSuccess, cbFailure) => {
  const selectQuery = `SELECT DISTINCT ${dbConfig.colSubjectName} FROM ${dbConfig.tableSubjects}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => {
      distinctSubjectsList = searchResult.rows;
      cbSuccess(distinctSubjectsList);
    })
    .catch((searchError) => { cbFailure(searchError); });
};

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
    const selectQuery = `SELECT * FROM ${dbConfig.tableSubjects}`;
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
  const selectQuery = `SELECT ${dbConfig.colID} AS subject_id FROM ${dbConfig.tableSubjects} WHERE ${dbConfig.colGrade} = '${grade}'`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => { cbSuccess(searchResult.rows); })
    .catch((searchError) => cbFailure(searchError));
};

// Function to get the id from subjects table with given grade and subject
export const getSubjectIDByGradeAndSubject = (grade, subject, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT ${dbConfig.colID} FROM ${dbConfig.tableSubjects} WHERE ${dbConfig.colGrade} = '${grade}' AND ${dbConfig.colSubjectName} = '${subject}'`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => { cbSuccess(searchResult.rows); })
    .catch((searchError) => cbFailure(searchError));
};

// Function to get the subject info using id
export const getSubjectAndGradeBySubjectID = (subjectID, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableSubjects} WHERE ${dbConfig.colID} = '${subjectID}'`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => { cbSuccess(searchResult.rows); })
    .catch((searchError) => cbFailure(searchError));
};

// Function to get the details from Subjects table with a given UserID
export const getSubjectDetailsByUserID = (userID, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableSubjects} WHERE ${dbConfig.colID} IN (SELECT ${dbConfig.colSubID} FROM ${dbConfig.tableUserSubjects} WHERE ${dbConfig.colUserID} = ${userID});`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => { cbSuccess(searchResult.rows); })
    .catch((searchError) => { cbFailure(searchError); });
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
  const selectUsersQuery = `SELECT * FROM ${dbConfig.tableUsers}`;
  // promise
  pool.query(selectUsersQuery)
    .then((searchResult) => {
      allUsersData.usersData = searchResult.rows;
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => cbFailure(searchError));
};

// Function to get all the homeworks created by the given teacher_id
export const getAllHomeworkByTeacherID = (idTeacher, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.colTeacherID} = ${idTeacher}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => cbSuccess(searchResult.rows))
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
    isAdmin = (inputRoles === dbConfig.roleAdmin);
    // If the user is admin, but no other roles are specified, considered as non-teaching staff
    const dataRoleAdmin = (isAdmin) ? ({ role: dbConfig.roleNonTeachingStaff, admin: isAdmin })
      : { role: inputRoles, admin: isAdmin };
    return dataRoleAdmin;
  }

  // if multiple inputs are specified, the second value should correspond only to Admin.
  // If any other combination comes in, it's an invalid request.
  // Example: Teacher & Student.
  // Also, for Student the admin flag should not be set.
  // TO DO: returning with error
  // For the timebeing, in such invalid cases, only the first role is being taken into account.
  isAdmin = (Number(inputRoles[1]) === dbConfig.roleAdmin);
  // Check whether it's a student. If yes, set the admin flag as false.
  isAdmin = ((Number(inputRoles[0]) === dbConfig.roleStudent) && isAdmin) ? false : isAdmin;
  const dataRoleAdmin = { role: inputRoles[0], admin: isAdmin };
  return dataRoleAdmin;
};

// Function to insert the user ID to grade and subject mapping to the table User_Subjects
const mapNewUserToGradeSubjects = (inputUserInfo, newUserDBDataRows, cbSuccess, cbFailure) => {
  // If the user is a non-teaching staff, that user is not related to any grades or subjects.
  // So, no need to update the User_Subjects Table
  const newUserDBData = newUserDBDataRows[0];
  if (newUserDBData[dbConfig.colRole] === dbConfig.roleNonTeachingStaff)
  {
    cbSuccess(newUserDBDataRows);
    return;
  }
  // First get the subject-grade id from database.
  const selectSubjectIDQuery = `SELECT ${dbConfig.colID} FROM ${dbConfig.tableSubjects} WHERE ${dbConfig.colGrade} = '${inputUserInfo[dbConfig.colGrade]}'`;

  console.log(selectSubjectIDQuery);

  pool.query(selectSubjectIDQuery)
    .then((selectResult) => {
      const insertUserSubMapQuery = `INSERT INTO ${dbConfig.tableUserSubjects} (${dbConfig.colUserName}, ${dbConfig.colSubID}) VALUES ($1, $2)`;
      let queryDoneCounter = 0;
      selectResult.rows.forEach((singleRow) => {
        const insertValues = [newUserDBData[dbConfig.colID], singleRow[dbConfig.colID]];
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

  const insertUserQuery = `INSERT INTO ${dbConfig.tableUsers} (${dbConfig.colUserName}, ${dbConfig.colFirstName}, ${dbConfig.colLastName}, ${dbConfig.colEmail}, ${dbConfig.colPassword}, ${dbConfig.colContactNumber}, ${dbConfig.colAddress}, ${dbConfig.colRole}, ${dbConfig.colAdmin}, ${dbConfig.colInstID}) VALUES ('${newUserInfo[dbConfig.colUserName]}', '${newUserInfo[dbConfig.colFirstName]}', '${newUserInfo[dbConfig.colLastName]}', '${newUserInfo[dbConfig.colEmail]}', '${newUserInfo[dbConfig.colPassword]}', '${newUserInfo[dbConfig.colContactNumber]}', '${newUserInfo[dbConfig.colAddress]}', ${dataRoleAdmin.role}, ${dataRoleAdmin.admin}, '${newUserInfo[dbConfig.colInstID]}') RETURNING *`;

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
  const updateUserQuery = `UPDATE ${dbConfig.tableUsers} SET 
                          ${dbConfig.colUserName} = '${updateUserInfo[dbConfig.colUserName]}',
                          ${dbConfig.colFirstName} = '${updateUserInfo[dbConfig.colFirstName]}',
                          ${dbConfig.colLastName} = '${updateUserInfo[dbConfig.colLastName]}',
                          ${dbConfig.colEmail} = '${updateUserInfo[dbConfig.colEmail]}',
                          ${dbConfig.colPassword} = '${updateUserInfo[dbConfig.colPassword]}',
                          ${dbConfig.colContactNumber} = '${updateUserInfo[dbConfig.colContactNumber]}', 
                          ${dbConfig.colAddress} = '${updateUserInfo[dbConfig.colAddress]}',
                          ${dbConfig.colRole} = '${updateUserInfo[dbConfig.colRole]}',
                          ${dbConfig.colAdmin} = '${updateUserInfo[dbConfig.colAdmin]}',
                          ${dbConfig.colInstID} = '${updateUserInfo[dbConfig.colInstID]}' 
                          WHERE ${dbConfig.colID} = ${updateUserInfo[dbConfig.colID]} RETURNING *`;

  console.log(updateUserQuery);

  // promise
  pool.query(updateUserQuery)
    .then((updateResult) => {
      console.log(updateResult.rows[0]);
      // Get the exiting item index from the cache
      const index = getUserIndexInCache(dbConfig.colID, updateUserInfo[dbConfig.colID]);
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
  const selectQuery = `SELECT * FROM ${dbConfig.tableUsers} WHERE ${fieldName} = '${fieldValue}'`;
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
export const deleteUserByGivenField = (fieldName, fieldValue, cbSuccess, cbFailure) => {
  const deleteQuery = `DELETE FROM ${dbConfig.tableUsers} WHERE ${fieldName} = '${fieldValue}'`;
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
  const deleteQuery = `DELETE FROM ${dbConfig.tableUsers} WHERE ${dbConfig.colID} = ${userID}`;
  console.log(deleteQuery);
  pool.query(deleteQuery)
    .then((deleteResult) => cbSuccess(deleteResult))
    .catch((deleteError) => cbFailure(deleteError));
};

// Function to get all the homework associated with the specified user
export const getAllHomeworkByUser = (userInfo, cbSuccess, cbFailure) => {
  // 1. Get the id of the user, which should be a teacher. i.e. teacher_id in Homeworks table
  const userID = userInfo[dbConfig.colID];

  // 2. Get the Subject IDs related to this user ID from the User_Subjects table.
  //    Get the Subject Name for this subject ID
  //    This is for further mapping of subject_id in Homeworks table
  //    to subject Name in the display
  getSubjectDetailsByUserID(userID,
    ((subjectList) => {
      // 3. Get All the list of assignments for this user
      getAllHomeworkByTeacherID(userID,
        ((homeworkList) => {
          // Update the respective subject and grade also in the final homework list
          homeworkList.forEach((eachHomework) => {
            // Find the details corresponding to the subject ID
            const hwSubID = eachHomework[dbConfig.colSubID];
            const subInfo = subjectList.find((element) => (element[dbConfig.colID] === hwSubID));
            if (subInfo === undefined)
            {
              cbFailure('', 'Failed to get homework details of the user');
              return;
            }
            eachHomework[dbConfig.colSubjectName] = subInfo[dbConfig.colSubjectName];
            eachHomework[dbConfig.colGrade] = subInfo[dbConfig.colGrade];
          });
          cbSuccess({ homeworkList, userData: userInfo });
        }),
        ((hwError) => { cbFailure(hwError, 'Failed to get homework details of the user'); }));
    }),
    (subjectError) => {
      cbFailure(subjectError, 'Failed to get subject details of the user');
    });
};

// Function to get the details of a homework with unique id
export const getHomeworkByID = (homeworkID, cbSuccess, cbFailure) => {
// 1. Get the homwework
  const selectHomeworkQuery = `SELECT * FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.colID} = ${homeworkID}`;
  console.log(selectHomeworkQuery);
  pool.query(selectHomeworkQuery)
    .then((searchResult) => {
      if (searchResult.rowCount === 0 || searchResult.rowCount > 1) {
        cbFailure('', 'Homework not found!'); }
      else {
        const homeworkData = searchResult.rows[0];
        const hwSubID = homeworkData[dbConfig.colSubID];
        getSubjectAndGradeBySubjectID(hwSubID,
          ((subData) => {
            homeworkData[dbConfig.colSubjectName] = subData[0][dbConfig.colSubjectName];
            homeworkData[dbConfig.colGrade] = subData[0][dbConfig.colGrade];
            cbSuccess(homeworkData);
          }),
          ((subError) => { cbFailure(subError, 'Related subject and grade is not found'); }));
      }
    })
    .catch((error) => cbFailure(error));

// 2. Get the subject details
};

// Function to insert data into homework table. no other queries
const insertDataIntoHomeWorkTable = (requestUserInfo, newHomeWorkInfo, newFileData, subjectID,
  cbSuccess, cbFailure) => {
  const insertHomeworkQuery = `INSERT INTO ${dbConfig.tableHomeworks} (${dbConfig.colSubID}, ${dbConfig.colTeacherID}, ${dbConfig.colTitle}, ${dbConfig.colHwrkDesc}, ${dbConfig.colFilePath}, ${dbConfig.colCurrentStatus}) VALUES (${subjectID}, ${requestUserInfo[dbConfig.colID]}, '${newHomeWorkInfo[dbConfig.colTitle]}', '${newHomeWorkInfo[dbConfig.colHwrkDesc]}', '${newFileData[dbConfig.fileName]}', '${dbConfig.statusActive}') RETURNING *`;

  console.log(insertHomeworkQuery);

  pool.query(insertHomeworkQuery)
    .then((insertResult) => {
      const newHomeworkRes = insertResult.rows[0];
      newHomeworkRes[dbConfig.colSubjectName] = newHomeWorkInfo[dbConfig.colSubjectName];
      newHomeworkRes[dbConfig.colGrade] = newHomeWorkInfo[dbConfig.colGrade];
      cbSuccess(newHomeworkRes);
    })
    .catch((insertError) => { cbFailure(insertError); });
};

// Function to insert new data into homework table.
export const createNewHomework = (requestUserInfo, newHomeWorkInfo, newFileData,
  cbSuccess, cbFailure) => {
  // Before creating check whether the grade - subject combination exists for this user.
  // If not add that data
  getSubjectIDByGradeAndSubject(newHomeWorkInfo[dbConfig.colGrade],
    newHomeWorkInfo[dbConfig.colSubjectName],
    ((searchResult) => {
      if (searchResult.length === 0)
      {
        // Inserted new subject item
        insertNewSubjectGradeData(newHomeWorkInfo[dbConfig.colSubjectName],
          newHomeWorkInfo[dbConfig.colGrade], requestUserInfo[dbConfig.colID],
          ((insertSubjectResult) => {
            insertDataIntoHomeWorkTable(requestUserInfo, newHomeWorkInfo,
              newFileData, insertSubjectResult, cbSuccess, cbFailure);
          }),
          ((insertSubjectError) => { cbFailure(insertSubjectError);
          }));
      }
      else {
        // Subject ID is in the search result.
        // Insert new data
        insertDataIntoHomeWorkTable(requestUserInfo, newHomeWorkInfo,
          newFileData, searchResult[0][dbConfig.colID], cbSuccess, cbFailure);
      }
    }),
    ((searchError) => { cbFailure(searchError); }));
};

const updateDataIntoHomeWorkTable = (requestUserInfo, updatedHomeWorkInfo, updatedFileData,
  subjectID, cbSuccess, cbFailure) => {
  let updateHomeworkQuery = `UPDATE TABLE ${dbConfig.tableHomeworks} SET 
  ${dbConfig.colSubID} = ${subjectID}, ${dbConfig.colTeacherID} = ${requestUserInfo[dbConfig.colID]}, ${dbConfig.colTitle} = '${updatedHomeWorkInfo[dbConfig.colTitle]}', ${dbConfig.colHwrkDesc} = '${updatedHomeWorkInfo[dbConfig.colHwrkDesc]}', ${dbConfig.colCurrentStatus} = '${updatedHomeWorkInfo[dbConfig.colCurrentStatus]}`;
  if (updatedFileData[dbConfig.fileName] !== undefined && updatedFileData[dbConfig.fileName] !== '')
  { updateHomeworkQuery += `, ${dbConfig.colFilePath} = '${updatedFileData[dbConfig.fileName]}'`; }
  updateHomeworkQuery += ' ) RETURNING *';

  console.log(updateHomeworkQuery);

  pool.query(updateHomeworkQuery)
    .then((updateResult) => {
      const newHomeworkRes = updateResult.rows[0];
      newHomeworkRes[dbConfig.colSubjectName] = updatedHomeWorkInfo[dbConfig.colSubjectName];
      newHomeworkRes[dbConfig.colGrade] = updatedHomeWorkInfo[dbConfig.colGrade];
      cbSuccess(newHomeworkRes);
    })
    .catch((updateError) => { cbFailure(updateError); });
};

// Function to update a homework
export const updateHomework = (requestUserInfo, updatedHomeWorkInfo, updatedFileData,
  cbSuccess, cbFailure) => {
  getSubjectIDByGradeAndSubject(updatedHomeWorkInfo[dbConfig.colGrade],
    updatedHomeWorkInfo[dbConfig.colSubjectName],
    ((searchResult) => {
      if (searchResult.length === 0)
      {
        // Inserted new subject item
        insertNewSubjectGradeData(updatedHomeWorkInfo[dbConfig.colSubjectName],
          updatedHomeWorkInfo[dbConfig.colGrade], requestUserInfo[dbConfig.colID],
          ((insertSubjectResult) => {
            updateDataIntoHomeWorkTable(requestUserInfo, updatedHomeWorkInfo,
              updatedFileData, insertSubjectResult, cbSuccess, cbFailure);
          }),
          ((insertSubjectError) => { cbFailure(insertSubjectError);
          }));
      }
      else {
        // Subject ID is in the search result.
        // Insert new data
        updateDataIntoHomeWorkTable(requestUserInfo, updatedHomeWorkInfo,
          updatedFileData, searchResult[0][dbConfig.colID], cbSuccess, cbFailure);
      }
    }),
    ((searchError) => { cbFailure(searchError); }));
};

// Function to delete a homework
export const deleteHomeworkByID = (requestUserInfo, homeworkID, cbSuccess, cbFailure) => {
  const deleteHomeworkQuery = `DELETE FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.colID} = ${homeworkID}`;

  console.log(deleteHomeworkQuery);

  pool.query(deleteHomeworkQuery)
    .then((deleteResult) => {
      cbSuccess(deleteResult);
    })
    .catch((deleteError) => { cbFailure(deleteError); });
};

export const deleteHomeworkByGivenField = (fieldName, fieldValue, cbSuccess, cbFailure) => {
  const deleteHomeworkQuery = `DELETE FROM ${dbConfig.tableHomeworks} WHERE ${fieldName} = ${fieldValue}`;

  console.log(deleteHomeworkQuery);

  pool.query(deleteHomeworkQuery)
    .then((deleteResult) => {
      cbSuccess(deleteResult);
    })
    .catch((deleteError) => { cbFailure(deleteError); });
};

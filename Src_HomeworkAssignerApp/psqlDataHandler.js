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
let distinctGradeList;

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

// Function to get the list of distinct subjects already registered
export const getListOfDistinctGrades = (cbSuccess, cbFailure) => {
  const selectQuery = `SELECT DISTINCT ${dbConfig.colGrade} FROM ${dbConfig.tableSubjects}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => {
      distinctGradeList = searchResult.rows;
      cbSuccess(distinctGradeList);
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

const constructFilterCondition = (requestQueryParams) => {
  console.log('constructFilterCondition');
  /**
 Possible formats of the filter query are:
 { grade: [ 'P2', 'P1' ], subject_name: [ 'Mathematics', 'History' ] }
 { grade: 'P2', subject_name: 'English' }
 */
  let filterCondition = '';
  if (requestQueryParams === undefined)
  {
    return '';
  }
  // Sample query:
  // select * from subjects where (grade = 'P1' OR  grade = 'P2')
  // AND (subject_name = 'English' OR subject_name = 'Mathematics');
  if (requestQueryParams[dbConfig.colGrade] !== undefined)
  {
    const inputGrades = requestQueryParams[dbConfig.colGrade];
    if (typeof inputGrades === 'string')
    {
      // There is only one checkbox selected
      filterCondition = `( ${dbConfig.colGrade} = '${inputGrades}' )`;
    }
    else {
      filterCondition += '( ';
      inputGrades.forEach((grade, index) => {
        filterCondition += `${dbConfig.colGrade} = '${grade}'`;
        if (index < (inputGrades.length - 1))
        {
          filterCondition += ' OR ';
        }
      });
      filterCondition += ' ) ';
    }
  }

  if (requestQueryParams[dbConfig.colSubjectName] !== undefined)
  {
    if (filterCondition.length !== 0)
    {
      filterCondition += ' AND ';
    }

    const inputSubjects = requestQueryParams[dbConfig.colSubjectName];
    if (typeof inputSubjects === 'string')
    {
      // There is only one checkbox selected
      filterCondition += `( ${dbConfig.colSubjectName} = '${inputSubjects}' )`;
    }
    else {
      filterCondition += '( ';
      inputSubjects.forEach((grade, index) => {
        filterCondition += `${dbConfig.colSubjectName} = '${grade}'`;
        if (index < (inputSubjects.length - 1))
        {
          filterCondition += ' OR ';
        }
      });
      filterCondition += ' ) ';
    }
  }

  return filterCondition;
};

// Function to get the details from Subjects table with a given UserID
export const getSubjectDetailsByUserID = (userID, requestQueryParams, cbSuccess, cbFailure) => {
  let filterCondition = '';
  console.log(`requestQueryParams: ${requestQueryParams}`);
  if (requestQueryParams !== undefined)
  {
    filterCondition = constructFilterCondition(requestQueryParams);
    console.log(filterCondition);
  }

  let selectQuery = `SELECT * FROM ${dbConfig.tableSubjects} WHERE ${dbConfig.colID} IN (SELECT ${dbConfig.colSubID} FROM ${dbConfig.tableUserSubjects} WHERE `;
  selectQuery += (filterCondition.length > 0) ? (`( ${dbConfig.colUserID} = ${userID} ) AND ${filterCondition} );`) : (`${dbConfig.colUserID} = ${userID} );`);
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => { cbSuccess(searchResult.rows); })
    .catch((searchError) => {
      console.log(searchError);
      cbFailure(searchError); });
};

// Function to get all the homeworks created by the given teacher_id
export const getAllHomeworkByUserID = (userInfo, subjectList, requestQueryParams,
  cbSuccess, cbFailure) => {
  let selectQuery = '';
  // Prepare the array of subject IDs
  const subjectIDArray = [];
  subjectList.forEach((item) => {
    subjectIDArray.push(item[dbConfig.colID]);
  });
  console.log(subjectIDArray);
  if (userInfo[dbConfig.colRole] === dbConfig.roleTeacher)
  {
    // If the user is a teacher, search with teacher id
    if (subjectIDArray.length === 0)
    {
      if (requestQueryParams !== undefined)
      {
        // There is no matching subject id for the query given. So return from here
        cbSuccess([]);
        return;
      }
      selectQuery = `SELECT * FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.colTeacherID} = ${userInfo[dbConfig.colID]}`;
      console.log(selectQuery);
      pool.query(selectQuery)
        .then((searchResult) => {
        // console.log(searchResult.rows);
          cbSuccess(searchResult.rows);
        })
        .catch((searchError) => {
          console.log(searchError);
          cbFailure(searchError); });
    } else {
      let queryCounter = 0;
      const resSubjectRows = [];
      subjectIDArray.forEach((subID) => {
        console.log(`queryCounter: ${queryCounter}`);

        selectQuery = `SELECT * FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.colTeacherID} = ${userInfo[dbConfig.colID]} AND ${dbConfig.colSubID} = ${subID}`;
        console.log(selectQuery);
        pool.query(selectQuery)
          .then((res) => {
            queryCounter += 1;
            console.log(`queryCounter incremented: ${queryCounter}`);
            if (res.rowCount > 0)
            {
              resSubjectRows.push(res.rows[0]);
            }
            if (queryCounter === subjectIDArray.length)
            {
              console.log(`queryCounter sending cbSuccess: ${queryCounter}`);
              console.log(resSubjectRows);
              cbSuccess(resSubjectRows);
            }
          })
          .catch((err) => {
            queryCounter += 1;
            console.log(`queryCounter incremented: ${queryCounter}`);
            console.log(err);
            if (queryCounter === subjectIDArray.length)
            {
              console.log(resSubjectRows);
              cbSuccess(resSubjectRows);
            }
          });
      });
    }
  }
  else if (userInfo[dbConfig.colRole] === dbConfig.roleStudent && subjectList.length !== 0)
  {
    // If the user is a student, search with the subject id
    let queryCounter = 0;
    const resSubjectRows = [];
    subjectIDArray.forEach((subID) => {
      console.log(`queryCounter: ${queryCounter}`);

      selectQuery = `SELECT * FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.colSubID} = ${subID}`;
      console.log(selectQuery);
      pool.query(selectQuery)
        .then((res) => {
          queryCounter += 1;
          console.log(`queryCounter incremented: ${queryCounter}`);
          if (res.rowCount > 0)
          {
            resSubjectRows.push(res.rows[0]);
          }
          if (queryCounter === subjectIDArray.length)
          {
            console.log(`queryCounter sending cbSuccess: ${queryCounter}`);
            console.log(resSubjectRows);
            cbSuccess(resSubjectRows);
          }
        })
        .catch((err) => {
          queryCounter += 1;
          console.log(`queryCounter incremented: ${queryCounter}`);
          console.log(err);
          if (queryCounter === subjectIDArray.length)
          {
            console.log(resSubjectRows);
            cbSuccess(resSubjectRows);
          }
        });
    });
  }
  else {
    // cbSuccess([]);
  }
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

/*
 * Homeworks table
 */

// Function to get all the homework associated with the specified user
export const getAllHomeworkByUser = (userInfo, requestQueryParams, cbSuccess, cbFailure) => {
  // 1. Get the id of the user, which should be a teacher. i.e. teacher_id in Homeworks table
  const userID = userInfo[dbConfig.colID];

  // 2. Get the Subject IDs related to this user ID from the User_Subjects table.
  //    Get the Subject Name for this subject ID
  //    This is for further mapping of subject_id in Homeworks table
  //    to subject Name in the display
  getSubjectDetailsByUserID(userID, requestQueryParams,
    ((subjectList) => {
      // 3. Get All the list of assignments for this user
      getAllHomeworkByUserID(userInfo, subjectList, requestQueryParams,
        ((homeworkList) => {
          // console.log('homeworkList', homeworkList);
          // Update the respective subject and grade also in the final homework list
          homeworkList.forEach((eachHomework) => {
            // console.log(`eachHomework: ${eachHomework}`);
            // Find the details corresponding to the subject ID
            const hwSubID = eachHomework[dbConfig.colSubID];
            const subInfo = subjectList.find((element) => (element[dbConfig.colID] === hwSubID));
            if (subInfo !== undefined)
            {
              eachHomework[dbConfig.colSubjectName] = subInfo[dbConfig.colSubjectName];
              eachHomework[dbConfig.colGrade] = subInfo[dbConfig.colGrade];
            }
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
  let insertHomeworkQuery = `INSERT INTO ${dbConfig.tableHomeworks} (${dbConfig.colSubID}, ${dbConfig.colTeacherID}, ${dbConfig.colTitle}, ${dbConfig.colHwrkDesc}, ${dbConfig.colCurrentStatus})`;
  if (newFileData !== undefined && newFileData[dbConfig.fileName] !== '')
  {
    insertHomeworkQuery += `, ${dbConfig.colFilePath}`;
  }
  insertHomeworkQuery += ` VALUES (${subjectID}, ${requestUserInfo[dbConfig.colID]}, '${newHomeWorkInfo[dbConfig.colTitle]}', '${newHomeWorkInfo[dbConfig.colHwrkDesc]}', '${dbConfig.statusActive}'`;

  if (newFileData !== undefined && newFileData[dbConfig.fileName] !== '')
  {
    insertHomeworkQuery += `, '${newFileData[dbConfig.fileName]}'`;
  }

  insertHomeworkQuery += ') RETURNING *';

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

const updateDataIntoHomeWorkTable = (hwID, requestUserInfo, updatedHomeWorkInfo, updatedFileData,
  subjectID, cbSuccess, cbFailure) => {
  let updateHomeworkQuery = `UPDATE ${dbConfig.tableHomeworks} SET 
  ${dbConfig.colSubID} = ${subjectID}, ${dbConfig.colTeacherID} = ${requestUserInfo[dbConfig.colID]}, ${dbConfig.colTitle} = '${updatedHomeWorkInfo[dbConfig.colTitle]}', ${dbConfig.colHwrkDesc} = '${updatedHomeWorkInfo[dbConfig.colHwrkDesc]}', ${dbConfig.colCurrentStatus} = '${updatedHomeWorkInfo[dbConfig.colCurrentStatus]}', ${dbConfig.colEditedAt} = CURRENT_TIMESTAMP`;

  if (updatedFileData !== undefined && updatedFileData[dbConfig.fileName] !== '')
  {
    updateHomeworkQuery += `, ${dbConfig.colFilePath} = '${updatedFileData[dbConfig.fileName]}'`;
  }
  updateHomeworkQuery += ` WHERE ${dbConfig.colID} = ${hwID} RETURNING *`;

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
export const updateHomework = (hwID, requestUserInfo, updatedHomeWorkInfo, updatedFileData,
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
            updateDataIntoHomeWorkTable(hwID, requestUserInfo, updatedHomeWorkInfo,
              updatedFileData, insertSubjectResult, cbSuccess, cbFailure);
          }),
          ((insertSubjectError) => { cbFailure(insertSubjectError);
          }));
      }
      else {
        // Subject ID is in the search result.
        // Insert new data
        updateDataIntoHomeWorkTable(hwID, requestUserInfo, updatedHomeWorkInfo,
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

/**
 * Submissions table
 */

// This function checks whether this student can submit answer to this homework or not.
// Done by checking the subject-id & user-id mapping in User_Subject table
export const validateStudentPermissionToHomework = (idHomework, studentInfo,
  cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableUserSubjects} WHERE ${dbConfig.colUserID} = ${studentInfo[dbConfig.colID]} AND ${dbConfig.colSubID} IN (SELECT ${dbConfig.colSubID} FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.tableHomeworks}.${dbConfig.colID} = ${idHomework})`;
  console.log(selectQuery);

  pool.query(selectQuery)
    .then((searchResult) => {
      if (searchResult.rowCount === 0)
      {
        cbFailure(searchResult);
        return;
      }
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => {
      cbFailure(searchError);
    });
};

export const submitNewAnswer = (idHomework, requestUserInfo, newAnswerInfo, newFileData,
  cbSuccess, cbFailure) => {
  console.log(newFileData);
  console.log(newFileData !== undefined);

  let insertQuery = `INSERT INTO ${dbConfig.tableSubmissions} (${dbConfig.colHwrkID}, ${dbConfig.colStudentID}, ${dbConfig.colDesc}`;
  if (newFileData !== undefined && newFileData[dbConfig.fileName] !== '')
  {
    insertQuery += `, ${dbConfig.colFilePath}`;
  }
  insertQuery += `) VALUES (${idHomework}, ${requestUserInfo[dbConfig.colID]}, '${newAnswerInfo[dbConfig.colDesc]}'`;
  if (newFileData !== undefined && newFileData[dbConfig.fileName] !== '')
  {
    insertQuery += `, '${newFileData[dbConfig.fileName]}'`;
  }
  insertQuery += ') RETURNING *';

  console.log(insertQuery);
  pool.query(insertQuery)
    .then((insertResult) => {
      if (insertResult.rowCount === 0)
      {
        cbFailure('Can\'t find the newly submitted answer');
        return;
      }
      cbSuccess(insertResult.rows[0]);
    })
    .catch((insertError) => {
      console.log(insertError);
      cbFailure(insertError);
    });
};

// This function checks whether the given user is allowed to access the requested answer
export const validateUserPermission = (userInfo, homeworkID, cbSuccess, cbFailure) => {
  // If the user is a teacher, check whether the specified homeworkID is made by that user.
  // If yes, access is granted
  if (userInfo[dbConfig.colRole] === dbConfig.roleTeacher)
  {
    const selectQuery = `SELECT * FROM ${dbConfig.tableHomeworks} WHERE ${dbConfig.colTeacherID} = ${userInfo[dbConfig.colID]} AND ${dbConfig.colID} = ${homeworkID}`;
    console.log(selectQuery);
    pool.query(selectQuery)
      .then((searchResult) => {
        if (searchResult.rowCount === 0)
        {
          cbFailure(searchResult);
          return;
        }
        cbSuccess(searchResult.rows[0]);
      })
      .catch((searchError) => { cbFailure(searchError); });
  }
  // If the user is a student, as of now no other verification is done.
  // Because, the select query to get answer will fail on it's own
  // if the homeworkID and StudentID deon't match in the Submissions table
};

export const getAllSubmittedAnswersByStudentID = (homeworkID, studentUserInfo,
  cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableSubmissions} WHERE ${dbConfig.colHwrkID} = ${homeworkID} AND ${dbConfig.colStudentID} = ${studentUserInfo[dbConfig.colID]}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => {
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => {
      cbFailure(searchError);
    });
};

export const getAllSubmittedAnswersByHomeworkID = (homeworkID, teacherUserInfo,
  cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableSubmissions} WHERE ${dbConfig.colHwrkID} = ${homeworkID}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => {
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => {
      cbFailure(searchError);
    });
};

export const getStudentSubmittedAnswerByIDs = (homeworkID, answerID, studentInfo,
  cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableSubmissions} WHERE ${dbConfig.colHwrkID} = ${homeworkID} AND ${dbConfig.colID} = ${answerID} AND ${dbConfig.colStudentID} = ${studentInfo[dbConfig.colID]}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => {
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => {
      cbFailure(searchError);
    });
};

export const getSubmittedAnswerByIDs = (homeworkID, answerID, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableSubmissions} WHERE ${dbConfig.colHwrkID} = ${homeworkID} AND ${dbConfig.colID} = ${answerID}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((searchResult) => {
      cbSuccess(searchResult.rows);
    })
    .catch((searchError) => {
      cbFailure(searchError);
    });
};

export const deleteAnswerByIDs = (homeworkID, answerID, cbSuccess, cbFailure) => {
  const deleteQuery = `DELETE FROM ${dbConfig.tableSubmissions} WHERE ${dbConfig.colHwrkID} = ${homeworkID} AND ${dbConfig.colID} = ${answerID}`;
  console.log(deleteQuery);
  pool.query(deleteQuery)
    .then((deleteResult) => {
      cbSuccess(deleteResult.rows);
    })
    .catch((deleteError) => {
      cbFailure(deleteError);
    });
};

export const editAnswerByIDs = (homeworkID, answerID, updatedData,
  updatedFileData, userInfo, cbSuccess, cbFailure) => {
  let updateQuery = `UPDATE ${dbConfig.tableSubmissions} SET ${dbConfig.colDesc} = '${updatedData[dbConfig.colDesc]}', ${dbConfig.colUpdatedAt} = CURRENT_TIMESTAMP`;
  if (updatedFileData !== undefined && updatedFileData[dbConfig.fileName] !== '')
  {
    updateQuery += `, ${dbConfig.colFilePath} = '${updatedFileData[dbConfig.fileName]}'`;
  }
  updateQuery += ` WHERE  ${dbConfig.colHwrkID} = ${homeworkID} AND ${dbConfig.colID} = ${answerID} AND ${dbConfig.colStudentID} = ${userInfo[dbConfig.colID]} RETURNING *`;

  console.log(updateQuery);

  pool.query(updateQuery)
    .then((updateResult) => {
      cbSuccess(updateResult.rows[0]);
    })
    .catch((updateError) => {
      cbFailure(updateError);
    });
};

/**
 * Comments table
 */

export const addNewCommentsForHomework = (homeworkID, commentData, commenterInfo,
  cbSuccess, cbFailure) =>
{
  console.log(commenterInfo);

  const insertQuery = `INSERT INTO ${dbConfig.tableComments} (${dbConfig.colCommenterID}, ${dbConfig.colHwrkID}, ${dbConfig.colComments}) VALUES (${commenterInfo[dbConfig.colID]}, ${homeworkID}, '${commentData[dbConfig.colComments]}') RETURNING *`;
  console.log(insertQuery);

  pool.query(insertQuery)
    .then((insertResult) => {
      if (insertResult.rowCount === 0)
      {
        cbFailure(insertResult);
      }
      cbSuccess(insertResult.rows[0]);
    })
    .catch((insertError) => { cbFailure(insertError); });
};

export const addReplyComment = (homeworkID, parentCommentID, commentData,
  commenterInfo, cbSuccess, cbFailure) => {
  const insertQuery = `INSERT INTO ${dbConfig.tableComments} (${dbConfig.colCommenterID}, ${dbConfig.colHwrkID}, ${dbConfig.colPrevCmtID}, ${dbConfig.colComments}) VALUES (${commenterInfo[dbConfig.colID]}, ${homeworkID}, ${parentCommentID}, '${commentData[dbConfig.colComments]}') RETURNING *`;
  console.log(insertQuery);

  pool.query(insertQuery)
    .then((insertResult) => {
      if (insertResult.rowCount === 0)
      {
        cbFailure(insertResult);
      }
      cbSuccess(insertResult.rows[0]);
    })
    .catch((insertError) => { cbFailure(insertError); });
};

// Function to read all the comments and it's replies to a particular homework
export const getAllCommentsForHomework = (homeworkID, requestedUser, cbSuccess, cbFailure) => {
  const selectQuery = `SELECT * FROM ${dbConfig.tableComments} WHERE ${dbConfig.colHwrkID} = ${homeworkID}`;
  console.log(selectQuery);
  pool.query(selectQuery)
    .then((selectedResult) => {
      // Prepare a mapping between parent comment - to child comments
      const parentChildCommentList = {};
      if (selectedResult.rowCount > 0) {
        selectedResult.rows.forEach((comment) => {
          if (comment[dbConfig.colPrevCmtID] === undefined || comment[dbConfig.colPrevCmtID] === ''
        || comment[dbConfig.colPrevCmtID] === null)
          {
            parentChildCommentList[comment[dbConfig.colID]] = [];
          }
          else // A reply to another comment
          {
          // Check whether ther is an entry already in the map
          // eslint-disable-next-line no-lonely-if
            if (comment[dbConfig.colPrevCmtID] in parentChildCommentList)
            {
              parentChildCommentList[comment[dbConfig.colPrevCmtID]].push(
                parentChildCommentList[comment[dbConfig.colID]],
              );
            }
            else {
            // eslint-disable-next-line max-len
              parentChildCommentList[comment[dbConfig.colPrevCmtID]] = [parentChildCommentList[comment[dbConfig.colID]]];
            }
          }
        }); }
      cbSuccess(selectedResult.rows, parentChildCommentList);
    })
    .catch((selectedError) => { cbFailure(selectedError); });
};

export const deleteComment = (homeworkID, commentID, requestUserInfo, cbSuccess, cbFailure) => {
  const deleteQuery = `DELETE FROM ${dbConfig.tableComments} WHERE ${dbConfig.colID} = ${commentID} AND ${dbConfig.colHwrkID} = ${homeworkID} AND ${dbConfig.colCommenterID} = ${requestUserInfo[dbConfig.colID]}`;
  console.log(deleteQuery);
  pool.query(deleteQuery)
    .then((deleteResult) => { cbSuccess(deleteResult); })
    .catch((deleteError) => { cbFailure(deleteError); });
};

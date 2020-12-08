import dbConfig from './constants.js';
import {
  getListOfDistinctSubjects, getAllSubjectAndGrades,
  getAllHomeworkByUser, createNewHomework, getHomeworkByID, updateHomework, deleteHomeworkByID,
} from './psqlDataHandler.js';

import { detectUserRole } from './httpUserHandler.js';

const isRequestUserAndRoleValid = (request, roleToBeChecked) => {
  // Validate User before processing further
  if (!request.isUserLoggedIn)
  {
    return { isValid: false, msg: 'You are not logged in' };
  }
  // Also verify whether the user's role is that of specified
  // Can't return at every iteration of forEach. So disabling eslint comment
  // eslint-disable-next-line consistent-return
  roleToBeChecked.forEach((role) => {
    if (Number(request.userInfo[dbConfig.colRole]) === role)
    {
      // If any of the role is matching, it will return true.
      return { isValid: true, msg: '' };
    }
  });
  // Here, the user doesn't match any of the roles specified
  return { isValid: false, msg: 'You are not authorized.' };
};

const displayNewHomeWorkForm = (allSubjectsAndGrades, distinctSubjectsList,
  userInfo, response) => {
  console.log('typeof allSubjectsAndGrades: ', typeof allSubjectsAndGrades);
  // if (allSubjectsAndGrades !== undefined)
  // {
  //   console.log(allSubjectsAndGrades);
  //   console.log('Object.entries(allSubjectsAndGrades): ', Object.entries(allSubjectsAndGrades));
  //   console.log('Object.entries(allSubjectsAndGrades.dataSubjectGrade): ',
  //     Object.entries(allSubjectsAndGrades.dataSubjectGrade));
  //   console.log('Object.keys(allSubjectsAndGrades): ', Object.keys(allSubjectsAndGrades));
  //   console.log('typeof allSubjectsAndGrades.dataSubjectGrade: ',
  //  typeof allSubjectsAndGrades.dataSubjectGrade);
  // }

  const renderData = {
    dbConfig,
    allSubjectsAndGrades,
    distinctSubjectsList,
    userName: userInfo[dbConfig.colUserName],
    roles: detectUserRole(userInfo),
  };
  console.log(renderData);

  response.render('newHomework', renderData);
};

const displayAllHomeworkList = (dataHomeworkSubject, response) => {
  // console.log('userData: ', dataHomeworkSubject.userData);
  // console.log(`${[dataHomeworkSubject.userData[db_config.colUserName],
  // dataHomeworkSubject.userData[db_config.colRole],
  // dataHomeworkSubject.userData[db_config.colAdmin]]}`);

  const data = {
    homeworkList: dataHomeworkSubject.homeworkList,
    userData: dataHomeworkSubject.userData,
    dbConfig,
  };

  // console.log(data);

  response.render('listAllHomeworks', data);
};

// Function to get all the homework for a specific user
// Filtering by Grade and Subject also possible
// Sorting by latest is possible
export const handleGetAllHomeworksByUserRequest = (request, response) => {
  console.log('handleGetAllHomeworksByUserRequest');

  // Also verify whether the user is a teacher or not: TO DO for student also
  const resValidity = isRequestUserAndRoleValid(request,
    [dbConfig.roleTeacher, dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', { message: resValidity.msg, from: 'js' });
    return;
  }

  getAllHomeworkByUser(request.userInfo,
    ((dataHomeworkSubject) => {
      // homeworkList, userData;
      displayAllHomeworkList(dataHomeworkSubject, response);
    }),
    ((error, errorMessage) => {
      console.log(error);
      response.status(300).render('messagePage', { message: errorMessage, from: 'js' });
    }));
};

/**
 *
 * @param {*} request - HTTP Request
 * @param {*} response - HTTP Response
 *
 * This function handles the request to display new homework form
 */
export const handleNewHomeworkDisplayRequest = (request, response) => {
  // Validate User before displaying the new homework form
  // If a valid user, check whether it's a teacher
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', { message: resValidity.msg, from: 'js' });
    return;
  }

  // Get all the existing Subjects and respective grades
  getAllSubjectAndGrades(
    (allSubjectsAndGrades) => {
      getListOfDistinctSubjects((distinctSubjectsList) => {
        displayNewHomeWorkForm(allSubjectsAndGrades, distinctSubjectsList,
          request.userInfo, response);
      },
      (subError) => {
        console.log(subError);
        response.status(300).render('messagePage',
          { message: 'New homework creation failed', from: 'js' });
      });
    },
    (error) => {
      console.log(error);
      response.status(300).render('messagePage', { message: 'New homework creation failed', from: 'js' });
    },
  );
};

// Function to handle the POST request for creating new homework
export const handleNewHomeworkSubmitRequest = (request, response) => {
  console.log(request.body);
  console.log(request.file);

  // If a valid user, check whether it's a teacher
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', { message: resValidity.msg, from: 'js' });
    return;
  }

  createNewHomework(request.userInfo, request.body, request.file,
    ((newHomeworkData) => {
      response.render('viewSingleHomework', {
        homeworkData: newHomeworkData,
        userData: request.userInfo,
        dbConfig,
      });
    }),
    ((dbError) => {
      console.log(dbError);
      response.status(300).render('messagePage', { message: 'New homework creation failed', from: 'js' });
    }));
};

export const handleDisplayHomeworkByIDRequest = (request, response) => {
  console.log(' handleDisplayHomeworkByIDRequest');

  const resValidity = isRequestUserAndRoleValid(request,
    [dbConfig.roleTeacher, dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', { message: resValidity.msg, from: 'js' });
    return;
  }
  getHomeworkByID(request.params.id,
    ((homeworkData) => {
      // TO DO: Read Comments

      response.render('viewSingleHomework', {
        homeworkData,
        userData: request.userInfo,
        dbConfig,
      });
    }),
    ((error) => {
      console.log(error);
      response.status(300).render('messagePage', { message: 'Requested homework not found', from: 'js' });
    }));
};

export const handleSearchHomeworkFormDisplayRequest = (request, response) => {
  console.log(request, response);
};

export const handleSearchHomeworkRequest = (request, response) => {
  console.log(request, response);
};

export const handleEditHomeworkFormDisplayRequest = (request, response) => {
  console.log(' handleEditHomeworkFormDisplayRequest');

  // Only teachers are allowed to edit a homework
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', { message: resValidity.msg, from: 'js' });
    return;
  }
  getHomeworkByID(request.params.id,
    ((homeworkData) => {
      // Get the list of existing grades and subjects too
      getAllSubjectAndGrades(
        (allSubjectsAndGrades) => {
          getListOfDistinctSubjects((distinctSubjectsList) => {
            response.render('editSingleHomework', {
              homeworkData,
              allSubjectsAndGrades,
              distinctSubjectsList,
              userData: request.userInfo,
              dbConfig,
            });
          },
          (subError) => {
            console.log(subError);
            response.status(300).render('messagePage',
              { message: 'New homework creation failed', from: 'js' });
          });
        },
        (error) => {
          console.log(error);
          response.status(300).render('messagePage', { message: 'Failed to load edit', from: 'js' });
        },
      );
    }),
    ((error) => {
      console.log(error);
      response.status(300).render('messagePage', { message: 'Requested homework not found', from: 'js' });
    }));
};

export const handleEditHomeworkSubmitRequest = (request, response) => {
  // Only teachers are allowed to edit a homework
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', { message: resValidity.msg, from: 'js' });
    return;
  }

  updateHomework(request.user, request.body, request.file,
    (updatedHomeworkData) => {
      response.render('viewSingleHomework', {
        homeworkData: updatedHomeworkData,
        userData: request.userInfo,
        dbConfig,
      });
    },
    (updateError) => {
      console.log(updateError);
      response.status(300).render('messagePage', { message: 'Update failed', from: 'js' });
    });
};

export const handleDeleteHomeworkRequest = (request, response) => {
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', { message: resValidity.msg, from: 'js' });
    return;
  }
  deleteHomeworkByID(request.userInfo, request.params.id,
    (deleteResult) => {
      console.log(deleteResult);
      response.redirect('/list-homeworks');
    },
    (deleteError) => {
      console.log(deleteError);
      response.status(300).render('messagePage', { message: 'Update failed', from: 'js' });
    });
};

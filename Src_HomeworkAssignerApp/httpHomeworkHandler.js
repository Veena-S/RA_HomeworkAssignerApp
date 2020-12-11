import dbConfig from './constants.js';
import {
  getListOfDistinctSubjects, getAllSubjectAndGrades, getListOfDistinctGrades,
  getAllHomeworkByUser, createNewHomework, getHomeworkByID, updateHomework,
  deleteHomeworkByID, getAllCommentsForHomework,
} from './psqlDataHandler.js';

import { detectUserRole } from './httpUserHandler.js';

export const isRequestUserAndRoleValid = (request, roleToBeChecked) => {
  console.log('isRequestUserAndRoleValid');
  console.log('roleToBeChecked', roleToBeChecked);
  console.log('request.userInfo', request.userInfo);

  let validRole = false;

  // Validate User before processing further
  if (!request.isUserLoggedIn)
  {
    return { isValid: false, msg: 'You are not logged in' };
  }
  // Also verify whether the user's role is that of specified
  // Can't return at every iteration of forEach. So disabling eslint comment
  // eslint-disable-next-line consistent-return
  roleToBeChecked.forEach((role) => {
    if (Number(request.userInfo[dbConfig.colRole]) === Number(role))
    {
      console.log('Roles are matching');
      // If any of the role is matching, it will return true.
      validRole = true;
      return { isValid: true, msg: '' };
    }
  });
  if (validRole)
  {
    console.log('\'return { isValid: true, msg: \'\' };\'');
    return { isValid: true, msg: '' };
  }
  // Here, the user doesn't match any of the roles specified
  return { isValid: false, msg: 'You are not authorized.' };
};

const displayNewHomeWorkForm = (allSubjectsAndGrades, distinctSubjectsList,
  userInfo, response) => {
  console.log('typeof allSubjectsAndGrades: ', typeof allSubjectsAndGrades);

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
  getListOfDistinctGrades(
    (distinctGradeList) => {
      getListOfDistinctSubjects((distinctSubjectsList) => {
        response.render('listAllHomeworks', {
          homeworkList: dataHomeworkSubject.homeworkList,
          distinctGradeList,
          distinctSubjectsList,
          userData: dataHomeworkSubject.userData,
          dbConfig,
        });
      },
      (subError) => {
        console.log(subError);
        response.status(300).render('messagePage',
          {
            message: 'Failed to get all the homework', userName: dataHomeworkSubject.userData[dbConfig.colUserName], roles: detectUserRole(dataHomeworkSubject.userData), from: 'js',
          });
      });
    },
    (error) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: 'Failed to load homework', userName: dataHomeworkSubject.userData[dbConfig.colUserName], roles: detectUserRole(dataHomeworkSubject.userData), from: 'js',
      });
    },
  );
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
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  console.log(request.params);
  console.log(request.body);
  console.log(request.query);

  getAllHomeworkByUser(request.userInfo, request.query,
    ((dataHomeworkSubject) => {
      // homeworkList, userData;
      displayAllHomeworkList(dataHomeworkSubject, response);
    }),
    ((error, errorMessage) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: errorMessage, userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
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
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
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
          {
            message: 'New homework creation failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
          });
      });
    },
    (error) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: 'New homework creation failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
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
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  createNewHomework(request.userInfo, request.body, request.file,
    ((newHomeworkData) => {
      console.log(newHomeworkData);

      console.log(newHomeworkData[dbConfig.colEditedAt]);
      console.log(typeof newHomeworkData[dbConfig.colEditedAt]);
      // https://stackoverflow.com/a/6003958/7670117
      // Use == instead of ===
      if (newHomeworkData[dbConfig.colEditedAt] != null)
      {
        console.log(newHomeworkData[dbConfig.colEditedAt].toDateString());
      }

      response.render('viewSingleHomework', {
        homeworkData: newHomeworkData,
        userData: request.userInfo,
        commentsList: [],
        parentChildCommentList: [],
        dbConfig,
      });
    }),
    ((dbError) => {
      console.log(dbError);
      response.status(300).render('messagePage', {
        message: 'New homework creation failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    }));
};

export const handleDisplayHomeworkByIDRequest = (request, response) => {
  console.log(' handleDisplayHomeworkByIDRequest');

  const resValidity = isRequestUserAndRoleValid(request,
    [dbConfig.roleTeacher, dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }
  getHomeworkByID(request.params.id,
    ((homeworkData) => {
      // Read Comments
      let commentsList;
      let parentChildCommentList;
      getAllCommentsForHomework(request.params.id, request.userInfo,
        ((returnCommentsList, returnParentChildCommentList) => {
          commentsList = returnCommentsList;
          console.log(commentsList);
          parentChildCommentList = returnParentChildCommentList;

          response.render('viewSingleHomework', {
            homeworkData,
            userData: request.userInfo,
            commentsList,
            parentChildCommentList,
            dbConfig,
          });
        }),
        ((returnError) => {
          console.log(returnError);
          response.render('viewSingleHomework', {
            homeworkData,
            userData: request.userInfo,
            commentsList,
            parentChildCommentList,
            dbConfig,
          });
        }));
    }),
    ((error) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: 'Requested homework not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
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
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
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
              {
                message: 'New homework creation failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
              });
          });
        },
        (error) => {
          console.log(error);
          response.status(300).render('messagePage', {
            message: 'Failed to load edit', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
          });
        },
      );
    }),
    ((error) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: 'Requested homework not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    }));
};

export const handleEditHomeworkSubmitRequest = (request, response) => {
  // Only teachers are allowed to edit a homework
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  // Read already existing comments for the homework
  let commentsList;
  let parentChildCommentList;
  getAllCommentsForHomework(request.params.id, request.userInfo,
    ((returnCommentsList, returnParentChildCommentList) => {
      console.log(returnCommentsList);
      commentsList = returnCommentsList;
      parentChildCommentList = returnParentChildCommentList;

      updateHomework(request.params.id, request.userInfo, request.body, request.file,
        (updatedHomeworkData) => {
          response.render('viewSingleHomework', {
            homeworkData: updatedHomeworkData,
            userData: request.userInfo,
            commentsList,
            parentChildCommentList,
            dbConfig,
          });
        },
        (updateError) => {
          console.log(updateError);
          response.status(300).render('messagePage', {
            message: 'Update failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
          });
        });
    }),
    ((returnError) => {
      console.log(returnError);
      updateHomework(request.params.id, request.userInfo, request.body, request.file,
        (updatedHomeworkData) => {
          response.render('viewSingleHomework', {
            homeworkData: updatedHomeworkData,
            userData: request.userInfo,
            commentsList: [],
            parentChildCommentList: {},
            dbConfig,
          });
        },
        (updateError) => {
          console.log(updateError);
          response.status(300).render('messagePage', {
            message: 'Update failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
          });
        });
    }));
};

export const handleDeleteHomeworkRequest = (request, response) => {
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }
  deleteHomeworkByID(request.userInfo, request.params.id,
    (deleteResult) => {
      console.log(deleteResult);
      response.redirect('/list-homeworks');
    },
    (deleteError) => {
      console.log(deleteError);
      response.status(300).render('messagePage', {
        message: 'Update failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    });
};

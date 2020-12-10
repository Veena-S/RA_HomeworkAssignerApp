import dbConfig from './constants.js';
import { isRequestUserAndRoleValid } from './httpHomeworkHandler.js';
import {
  getHomeworkByID, submitNewAnswer, validateUserPermission, validateStudentPermissionToHomework,
  getAllSubmittedAnswersByStudentID, getAllSubmittedAnswersByHomeworkID,
  getSubmittedAnswerByIDs, getStudentSubmittedAnswerByIDs, deleteAnswerByIDs, editAnswerByIDs,
} from './psqlDataHandler.js';
import { detectUserRole } from './httpUserHandler.js';

export const handleDisplayAnswerSubmitFormRequest = (request, response) => {
  console.log('handleDisplayAnswerSubmitFormRequest');
  // verify whether the user is a teacher or student
  // Currently, only submission by student is allowed
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    console.log(resValidity.msg);
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }
  // Answer submission form will have a display of the homework description
  getHomeworkByID(request.params.id,
    ((homeworkData) => {
      response.render('submitAnswerForm', {
        homeworkData,
        userData: request.userInfo,
        dbConfig,
      });
    }),
    ((error) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: 'Requested homework not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    }));
};

export const handleAnswerSubmitRequest = (request, response) => {
  console.log('handleAnswerSubmitRequest');
  // verify whether the user is a student
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  // Validate whether the student is allowed to submit answer to this homework
  validateStudentPermissionToHomework(request.params.id, request.userInfo,
    ((searchResult) => {
      console.log(searchResult);
      submitNewAnswer(request.params.id, request.userInfo, request.body, request.file,
        (submitResult) => {
          response.render('viewSingleAnswer', {
            answerData: submitResult,
            homeworkID: request.params.id,
            requesterInfo: request.userInfo,
            dbConfig,
          });
        },
        (submitError) => {
          console.log(submitError);
          response.status(300).render('messagePage', {
            message: 'Submission failed', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
          });
        });
    }),
    ((searchError) => {
      console.log(searchError);
      response.status(300).render('messagePage', {
        message: 'Not authorized to submit answer to this homework', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    }));
};

export const handleViewAllAnswersRequest = (request, response) => {
  console.log('handleViewAllAnswersRequest');

  // verify whether the user is a student
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent,
    dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }
  // If the requested user is a teacher, get all the answers submitted for that homework,
  // from all students
  if (Number(request.userInfo[dbConfig.colRole]) === dbConfig.roleTeacher) {
    validateUserPermission(request.userInfo, request.params.hwID,
      ((homeworkData) => {
        console.log(homeworkData);
        getAllSubmittedAnswersByHomeworkID(request.params.hwID, request.userInfo,
          (resultAnswerList) => {
            response.render('listAllAnswers', {
              answerDataList: resultAnswerList,
              homeworkID: request.params.hwID,
              requesterInfo: request.userInfo,
              dbConfig,
            });
          },
          ((error) => {
            console.log(error);
            response.status(300).render('messagePage', {
              message: 'Answers not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
            });
          }));
      }),
      ((permissionError) => {
        console.log(permissionError);
        response.status(300).render('messagePage', {
          message: resValidity.msg, userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
        });
      }));
  }
  // If the requested user is a student, get all the answers submitted by the same user
  else if (Number(request.userInfo[dbConfig.colRole]) === dbConfig.roleStudent) {
    getAllSubmittedAnswersByStudentID(request.params.hwID, request.userInfo,
      (resultAnswerList) => {
        response.render('listAllAnswers', {
          answerDataList: resultAnswerList,
          homeworkID: request.params.hwID,
          requesterInfo: request.userInfo,
          dbConfig,
        });
      },
      ((error) => {
        console.log(error);
        response.status(300).render('messagePage', {
          message: 'Answers not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
        });
      }));
  }
  else {
    response.status(300).render('messagePage', {
      message: 'Not authorized to view the answers', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
    });
  }
};

export const handleViewAnswerRequest = (request, response) => {
  console.log('handleViewAnswerRequest');

  // verify whether the user is a student
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent,
    dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }
  // If the requested user is a teacher, check whether he is the owner of that homework ID
  if (Number(request.userInfo[dbConfig.colRole]) === dbConfig.roleTeacher) {
    validateUserPermission(request.userInfo, request.params.hwID,
      ((homeworkData) => {
        console.log(homeworkData);
        getSubmittedAnswerByIDs(request.params.hwID, request.params.answerID,
          (resultAnswerList) => {
            response.render('viewSingleAnswer', {
              answerData: resultAnswerList[0],
              homeworkID: request.params.hwID,
              requesterInfo: request.userInfo,
              dbConfig,
            });
          },
          ((error) => {
            console.log(error);
            response.status(300).render('messagePage', {
              message: 'Answers not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
            });
          }));
      }),
      ((permissionError) => {
        console.log(permissionError);
        response.status(300).render('messagePage', {
          message: resValidity.msg, userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
        });
      }));
  }
  // If the requested user is a student, get all the answers submitted by the same user
  else if (Number(request.userInfo[dbConfig.colRole]) === dbConfig.roleStudent) {
    getStudentSubmittedAnswerByIDs(request.params.hwID, request.params.answerID, request.userInfo,
      (resultAnswerList) => {
        response.render('viewSingleAnswer', {
          answerData: resultAnswerList[0],
          homeworkID: request.params.hwID,
          requesterInfo: request.userInfo,
          dbConfig,
        });
      },
      ((error) => {
        console.log(error);
        response.status(300).render('messagePage', {
          message: 'Answers not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
        });
      }));
  }
  else {
    response.status(300).render('messagePage', {
      message: 'Not authorized to view the answers', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
    });
  }
};

export const handleDeleteAnswerRequest = (request, response) => {
  console.log('handleDeleteAnswerRequest');

  // An answer can be deleted only by the student owner of that submission
  // verify whether the user is a student
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }
  deleteAnswerByIDs(request.params.hwID, request.params.answerID, request.userInfo,
    ((deleteResult) => {
      console.log(deleteResult);
      response.redirect(`/answer/${request.params.hwID}`);
    }),
    ((deleteError) => {
      console.log(deleteError);
      response.status(300).render('messagePage', {
        message: 'Not authorized to delete the answer', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    }));
};

export const handleEditAnswerFormDisplayRequest = (request, response) => {
// Only a student user can edit a submitted answer
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  getStudentSubmittedAnswerByIDs(request.params.hwID, request.params.answerID, request.userInfo,
    (resultAnswerList) => {
      response.render('editAnswerForm', {
        answerData: resultAnswerList[0],
        homeworkID: request.params.hwID,
        requesterInfo: request.userInfo,
        dbConfig,
      });
    },
    ((error) => {
      console.log(error);
      response.status(300).render('messagePage', {
        message: 'Answers not found', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    }));
};

export const handleEditAnswerRequest = (request, response) => {
// Answer can be edited only by the owner of the answer
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
    return;
  }

  editAnswerByIDs(request.params.hwID, request.params.answerID,
    request.body, request.file, request.userInfo,
    ((editResultRow) => {
      response.render('viewSingleAnswer', {
        answerData: editResultRow,
        homeworkID: request.params.hwID,
        requesterInfo: request.userInfo,
        dbConfig,
      });
    }),
    ((editError) => {
      console.log(editError);
      response.status(300).render('messagePage', {
        message: 'Edit Failed.', userName: request.userInfo[dbConfig.colUserName], roles: detectUserRole(request.userInfo), from: 'js',
      });
    }));
};

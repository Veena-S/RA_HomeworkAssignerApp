import dbConfig from './constants.js';
import { isRequestUserAndRoleValid } from './httpHomeworkHandler.js';
import { addNewCommentsForHomework, addReplyComment, deleteComment } from './psqlDataHandler.js';

export const handleNewCommentRequest = (request, response) => {
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
  addNewCommentsForHomework(request.params.id, request.body, request.userInfo,
    ((newCommentRow) => {
      console.log(newCommentRow);
      console.log('redirect to homeworkpage');
      // Irrespective of comment creation success / failure, always reload the
      // respective homework page where the newly added comments will be shown
      response.redirect(`/homework/${request.params.id}`);
    }),
    ((commentError) => {
      console.log(commentError);
      response.redirect(`/homework/${request.params.id}`);
    }));
};

export const handleNewReplyCommentFormRequest = (request, response) => {
  // verify whether the user is a student
  const resValidity = isRequestUserAndRoleValid(request, [dbConfig.roleStudent,
    dbConfig.roleTeacher]);
  if (!resValidity.isValid)
  {
    response.status(300).render('messagePage', {
      message: resValidity.msg, userName: '', roles: [], from: 'js',
    });
  }
};

// /homework/:id/comment/:prev_cmt_id
export const handleNewReplyCommentRequest = (request, response) => {
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
  addReplyComment(request.params.id, request.params.prev_comt_id, request.body, request.user,
    ((newCommentRow) => {
      console.log(newCommentRow);
      response.redirect(`/homework/${request.params.id}`);
    }),
    ((commentError) => {
      console.log(commentError);
      response.redirect(`/homework/${request.params.id}`);
    }));
};

// export const handleEditCommentFormRequest = (request, response) => {

// };

// export const handleEditCommentRequest = (request, response) => {

// };

export const handleDeleteCommentRequest = (request, response) => {
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
  // The comment can be deleted by only it's owner
  deleteComment(request.params.id, request.params.cmt_id, request.userInfo,
    ((deleteRes) => {
      console.log(deleteRes);
      response.redirect(`/homework/${request.params.id}`);
    }),
    ((deleteError) => {
      console.log(deleteError);
      response.redirect(`/homework/${request.params.id}`);
    }));
};

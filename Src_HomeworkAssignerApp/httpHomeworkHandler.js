import { getAllSubjectAndGrades } from './psqlDataHandler.js';

const displayErrorForm = (error) => {

};

const displayNewHomeWorkForm = (allSubjectsAndGrades, response) => {
  response.render('newHomework', {});
};

// Function to get all the homework for a specific user
// Filtering by Grade and Subject also possible
// Sorting by latest is possible
export const handleGetAllHomeworksByUserIDRequest = (request, response) => {

};

/**
 *
 * @param {*} request - HTTP Request
 * @param {*} response - HTTP Response
 *
 * This function handles the request to display new homework form
 */
export const handleNewHomeworkDisplayRequest = (request, response) => {
  // Get all the existing Subjects and respective grades
  getAllSubjectAndGrades(
    (allSubjectsAndGrades) => {
      displayNewHomeWorkForm(allSubjectsAndGrades, response);
    },
    (error) => {
      displayErrorForm(error, response);
    },
  );
};

export const handleNewHomeworkSubmitRequest = (request, response) => {

};

export const handleSearchHomeworkFormDisplayRequest = (request, response) => {

};

export const handleSearchHomeworkRequest = (request, response) => {

};

export const handleDisplayHomeworkByIDRequest = (request, response) => {

};

export const handleEditHomeworkFormDisplayRequest = (request, response) => {

};

export const handleEditHomeworkSubmitRequest = (request, response) => {

};

export const handleDisplayAnswerSubmitFormRequest = (request, response) => {

};

export const handleAnswerSubmitRequest = (request, response) => {

};

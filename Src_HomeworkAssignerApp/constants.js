
const db_config = {
  DB_NAME: 'homework_assigner',

  TABLE_SUBJECTS: 'Subjects',
  COL_ID: 'id',
  COL_SUBJECT_NAME: 'subject_name',
  COL_GRADE: 'grade',

  TABLE_USERS: 'Users',
  COL_USER_NAME: 'user_name',
  COL_FIRST_NAME: 'first_name',
  COL_LAST_NAME: 'last_name',
  COL_EMAIL: 'email',
  COL_PASSWORD: 'password',
  COL_CONTACT_NUMBER: 'contact_number',
  COL_ADDRESS: 'address',
  COL_ROLE: 'role',
  COL_ADMIN: 'admin',
  COL_INST_ID: 'institution_id', 


  TABLE_USERS_SUBJECTS: 'User_Subjects',
  COL_USER_ID: 'user_id',
  COL_SUB_ID: 'subject_id', 


  TABLE_HOMEWORKS: 'Homeworks', 
  COL_TEACHER_ID: 'teacher_id',
  COL_HWRK_DESC: 'homework_desc',
  COL_FILE_PATH: 'filepath',
  COL_CREATED_AT: 'created_at',
  COL_CURRENT_STATUS: 'current_status',
  COL_EDITED_AT: 'edited_at',


  TABLE_COMMENTS: 'Comments',
  COL_COMMENTER_ID:  'commenter_id',
  COL_HWRK_ID:  'homework_id',
  COL_PREV_CMT_ID:  'previous_comment_id',
  COL_POSTED_AT:  'posted_at',
  COL_COMMENTS:  'comments', 


  TABLE_SUBMISSIONS: 'Submissions',
  COL_STUDENT_ID: 'student_id',
  COL_DESC: 'description',
  COL_SUBMITTED_AT: 'submitted_at',


};

export default db_config;
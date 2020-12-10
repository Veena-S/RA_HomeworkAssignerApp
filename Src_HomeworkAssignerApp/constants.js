const dbConfig = {
  dbName: 'homework_assigner',

  tableSubjects: 'Subjects',
  colID: 'id',

  colSubjectName: 'subject_name',
  descSubjectName: 'Subject',

  colGrade: 'grade',
  descGrade: 'Grade',

  tableUsers: 'Users',
  colUserName: 'user_name',
  descUserName: 'User Name',

  colFirstName: 'first_name',
  descFirstName: 'First Name',

  colLastName: 'last_name',
  descLastName: 'Last Name',

  colEmail: 'email',
  descEmail: 'E-mail',

  colPassword: 'password',
  descPassword: 'Password',

  colContactNumber: 'contact_number',
  descContactNumber: 'Contact Number',

  colAddress: 'address',
  descAddress: 'Address',

  colRole: 'role',
  descRole: 'Role',

  colAdmin: 'admin',
  descAdmin: 'Admin',

  colInstID: 'institution_id',
  descInstID: 'Institution ID',

  colJoiningDate: 'joining_date',
  descJoiningDate: 'Joining Date',

  tableUserSubjects: 'User_Subjects',
  colUserID: 'user_id',
  descUserID: 'User ID',

  colSubID: 'subject_id',
  descSubID: 'Subject ID',

  tableHomeworks: 'Homeworks',
  colTeacherID: 'teacher_id',
  descTeacherID: 'Teacher ID',

  colTitle: 'title',
  descTitle: 'Title',

  colHwrkDesc: 'homework_desc',
  descHwrkDesc: 'Homework Description',

  colFilePath: 'filepath',
  descFilePath: 'File',

  colCreatedAt: 'created_at',
  descCreatedAt: 'Created On',

  colCurrentStatus: 'current_status',
  descCurrentStatus: 'Current Status',

  colEditedAt: 'edited_at',
  descEditedAt: 'Edited On',

  tableComments: 'Comments',
  colCommenterID: 'commenter_id',
  descCommenterID: 'Commenter',

  colHwrkID: 'homework_id',
  descHwrkID: 'Homework ID',

  colPrevCmtID: 'previous_comment_id',
  descPrevCmtID: 'previous_comment_id',

  colPostedAt: 'posted_at',
  descPostedAt: 'Posted On',

  colComments: 'comments',
  descComments: 'Comments',

  tableSubmissions: 'Submissions',
  colStudentID: 'student_id',
  descStudentID: 'Student ID',

  colDesc: 'description',
  descDesc: 'Answer',

  colSubmittedAt: 'submitted_at',
  descSubmittedAt: 'Submitted On',

  colUpdatedAt: 'updated_at',
  descUpdatedAt: 'Updated At',

  roleTeacher: 1,
  roleStudent: 2,
  roleNonTeachingStaff: 3,
  roleAdmin: 4,

  statusActive: 'Active',
  statusClosed: 'Closed',

  fileName: 'filename',

};

export default dbConfig;

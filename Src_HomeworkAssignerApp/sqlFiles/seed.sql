-- Subjects
INSERT INTO Subjects (subject_name, grade ) VALUES ('English', 'P1');
INSERT INTO Subjects (subject_name, grade ) VALUES ('English', 'P2');
INSERT INTO Subjects (subject_name, grade ) VALUES ( 'Mathematics', 'S1');
INSERT INTO Subjects (subject_name, grade ) VALUES ( 'Mathematics', 'S2');
INSERT INTO Subjects (subject_name, grade ) VALUES ('Science', 'P1');
INSERT INTO Subjects (subject_name, grade ) VALUES ('Science', 'P2');
INSERT INTO Subjects (subject_name, grade ) VALUES ('Science', 'S1');
INSERT INTO Subjects (subject_name, grade ) VALUES ('Science', 'S2');
INSERT INTO Subjects (subject_name, grade ) VALUES ('History', 'S1');
INSERT INTO Subjects (subject_name, grade ) VALUES ('History', 'S2');

-- Users
INSERT INTO Users (user_name, first_name, last_name, email, password, contact_number,
  address, role, admin, institution_id  ) VALUES ('kathy_clair', 'Kathy', 'Clair', 'kathyclair@myschool.com', 'kathy@123', '+85-123123', 'Somewhere, Street1, You know where', 1, TRUE, 'A01101T');


INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 1);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 2);

INSERT INTO Homeworks (  id, subject_id, teacher_id, homework_desc, filepath, created_at, current_status, edited_at ) VALUES ();

INSERT INTO Comments (  id, commenter_id, homework_id, previous_comment_id, -- in case if the current comment is a reply to aher comment
  posted_at, comments, edited_at );

INSERT INTO Submissions (  id, homework_id, student_id, description, filepath, submitted_at   );


-- Subjects
INSERT INTO Subjects (subject_name, grade ) VALUES ('English', 'P1');
INSERT INTO Subjects (subject_name, grade ) VALUES ('English', 'S1');
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
  address, role, admin, institution_id  ) VALUES ('kathy_clair', 'Kathy', 'Clair', 'kathyclair@myschool.com', '0486a7b7a57e69ca2b294e88a33b3d6925d550d32764b3edd002366e06540ab3926d275d1c4e2d5c34100061a4796e3d72754503be54b78308360f07f3ce074a', '+85-123123', 'Somewhere, Street1, You know where', 1, TRUE, 'A01101T');

  -- Hashed Value of kathy@123 = 0486a7b7a57e69ca2b294e88a33b3d6925d550d32764b3edd002366e06540ab3926d275d1c4e2d5c34100061a4796e3d72754503be54b78308360f07f3ce074a


INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 1);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 2);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 3);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 4);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 5);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 6);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 7);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 8);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 9);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(1, 10);

INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(4, 6);
INSERT INTO User_Subjects ( user_id, subject_id ) VALUES(4, 2);


INSERT INTO Homeworks (  id, subject_id, teacher_id, homework_desc, filepath, created_at, current_status, edited_at ) VALUES ();

INSERT INTO Comments (  id, commenter_id, homework_id, previous_comment_id, -- in case if the current comment is a reply to aher comment
  posted_at, comments, edited_at );

INSERT INTO Submissions (  id, homework_id, student_id, description, filepath, submitted_at   );

insert into comments(commenter_id, homework_id, comments ) values (3, 1, 'Not clear ' );

insert into comments(commenter_id, homework_id, previous_comment_id, comments, edited_at, like_count ) values (2, 1, 1, 'Specify', CURRENT_TIMESTAMP, 0);
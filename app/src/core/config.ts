export const APP_CONFIG = {
  schoolName: "Meteor-Edu",
  tagline: "Institutional Management Redefined",
};

export const USER_MOCK_DATA = {
  name: "Mr. Yash Vardhan",
  role: "Teacher",
  school: "Meteor-Edu",
  avatar: 'https://i.pravatar.cc/150?u=teacher_yash',
  email: "yash1@meteoredu.com",
  password: "Password123!",
};



export const STUDENT_MOCK_DATA = {
  name: "Daisy Wick",
  role: "Grade 10A • Roll No. 1001",
  school: "Meteor-Edu",
  avatar: 'https://i.pravatar.cc/150?u=student_daisy',
  email: "daisy@wick.com",
  admissionNo: "ADM-2026-0001",
  password: "Password123!",
};

export const PARENT_MOCK_DATA_SINGLE = {
  name: "Jonathan Wick",
  role: "Parent",
  email: "parent1@school.com",
  password: "Password123!",
  children: [
    { id: 'stud_1', name: "Daisy Wick", grade: "Grade 10A", avatar: 'https://i.pravatar.cc/150?u=daisy' }
  ]
};

export const PARENT_MOCK_DATA_MULTI = {
  name: "Jonathan Wick",
  role: "Parent",
  email: "parent1@school.com",
  password: "Password123!",
  children: [
    { id: 'stud_1', name: "Daisy Wick", grade: "Grade 10A", avatar: 'https://i.pravatar.cc/150?u=daisy' },
    { id: 'stud_2', name: "Helen Wick", grade: "Grade 10A", avatar: 'https://i.pravatar.cc/150?u=helen' }
  ]
};


export interface Attachment {
  id: string;
  uri: string;
  title: string;
  type: 'image' | 'video' | 'document';
  thumbnail?: string;
  size?: string;
  mimeType?: string;
}

export interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  section: string;
  classSectionId?: string;
  dueDate: string;
  attachments: Attachment[];
  subjectId: string;
  subjectName: string;
}



export const ATTENDANCE_STATUS_FILTERS = [
  { id: 'all', label: 'All', icon: 'account-group' },
  { id: 'present', label: 'Present', icon: 'check-circle' },
  { id: 'absent', label: 'Absent', icon: 'close-circle' },
  { id: 'leave', label: 'Leave', icon: 'calendar-remove' },
];

export const STAFF_ATTENDANCE_STATUS_FILTERS = [
  { id: 'all', label: 'All', icon: 'account-group' },
  { id: 'present', label: 'Present', icon: 'check-circle' },
  { id: 'late', label: 'Late', icon: 'clock' },
  { id: 'absent', label: 'Absent', icon: 'close-circle' },
  { id: 'leave', label: 'Leave', icon: 'calendar-remove' },
];
import { SCREENS } from './constants';
import Splash from '../screens/Splash';
import Login from '../screens/AuthModule/Login';
import FullSchedule from '../screens/FullSchedule';
import Gallery from '../screens/EventModule/Gallery';
import AddEvent from '../screens/EventModule/AddEvent';
import EventHub from '../screens/EventModule/EventHub';
import CollectFee from '../screens/FeeModule/CollectFee';
import NotificationScreen from '../screens/Notification';
import MyLeave from '../screens/AttendanceModule/MyLeave';
import StudentFees from '../screens/FeeModule/StudentFees';
import AllNotices from '../screens/NoticeModule/AllNotices';
import EventDetail from '../screens/EventModule/EventDetail';
import StudentHub from '../screens/StudentModule/StudentHub';
import FeeDashboard from '../screens/FeeModule/FeeDashboard';
import ExamDetails from '../screens/ExamsModule/ExamDetails';
import StudentList from '../screens/StudentModule/StudentList';
import HolidayList from '../screens/CalendarModule/HolidayList';
import ApplyLeave from '../screens/AttendanceModule/ApplyLeave';
import ProfileOption from '../screens/AuthModule/ProfileOption';
import NoticeDetail from '../screens/NoticeModule/NoticeDetail';
import AddHomework from '../screens/HomeworkModule/AddHomework';
import StaffProfile from '../screens/ProfileModule/StaffProfile';
import EventCalendar from '../screens/EventModule/EventCalendar';
import MyGrievances from '../screens/SupportModule/MyGrievances';
import ForgotPassword from '../screens/AuthModule/ForgotPassword';
import ContactSupport from '../screens/AuthModule/ContactSupport';
import LeaveDetail from '../screens/AttendanceModule/LeaveDetail';
import HomeworkList from '../screens/HomeworkModule/HomeworkList';
import SyllabusList from '../screens/SyllabusModule/SyllabusList';
import ManageStudent from '../screens/StudentModule/ManageStudent';
import MeetingDetail from '../screens/MeetingModule/MeetingDetail';
import ExamMarksEntry from '../screens/ExamsModule/ExamMarksEntry';
import MyAttendance from '../screens/AttendanceModule/MyAttendance';
import ExamsModuleNavigator from '../screens/ExamsModule/ExamsList';
import StudentProfile from '../screens/ProfileModule/StudentProfile';
import SyllabusDetail from '../screens/SyllabusModule/SyllabusDetail';
import HomeworkDetail from '../screens/HomeworkModule/HomeworkDetail';
import AttendanceHub from '../screens/AttendanceModule/AttendanceHub';
import ParentProfiles from '../screens/DashboardModule/ParentProfiles';
import SubmitGrievance from '../screens/SupportModule/SubmitGrievance';
import LeaveManagement from '../screens/AttendanceModule/LeaveManagement';
import StaffAttendance from '../screens/AttendanceModule/StaffAttendance';
import StudentDashboard from '../screens/DashboardModule/StudentDashboard';
import TeacherDashboard from '../screens/DashboardModule/TeacherDashboard';
import GrievanceDetail from '../screens/SupportModule/GrievanceDetail/index';
import StudentAttendance from '../screens/AttendanceModule/StudentAttendance';
import StudentFeeDetail from '../screens/FeeModule/StudentFees/StudentFeeDetail';
import StudentAttendanceHub from '../screens/AttendanceModule/StudentAttendanceHub';

import FAQ from '../screens/SupportModule/FAQ';
import Support from '../screens/SupportModule/Support';
import MySalary from '../screens/SalaryModule/MySalary';
import Settings from '../screens/SupportModule/Settings';
import Downloads from '../screens/SupportModule/Downloads';
import PrivacyPolicy from '../screens/SupportModule/PrivacyPolicy';
import TermsConditions from '../screens/SupportModule/TermsConditions';

export const navigationRoutes = [
  { name: SCREENS.LOGIN, component: Login },
  { name: SCREENS.SPLASH, component: Splash },
  { name: SCREENS.FORGOT_PASSWORD, component: ForgotPassword },
  { name: SCREENS.CONTACT_SUPPORT, component: ContactSupport },

  { name: SCREENS.PROFILE_OPTION, component: ProfileOption },
  { name: SCREENS.PARENT_PROFILES, component: ParentProfiles },

  { name: SCREENS.FAQ, component: FAQ },
  { name: SCREENS.SUPPORT, component: Support },
  { name: SCREENS.SETTINGS, component: Settings },
  { name: SCREENS.DOWNLOADS, component: Downloads },
  { name: SCREENS.PRIVACY_POLICY, component: PrivacyPolicy },
  { name: SCREENS.TERMS_CONDITIONS, component: TermsConditions },

  { name: SCREENS.MY_GRIEVANCES, component: MyGrievances },
  { name: SCREENS.SUBMIT_GRIEVANCE, component: SubmitGrievance },
  { name: SCREENS.GRIEVANCE_DETAIL, component: GrievanceDetail },

  { name: SCREENS.COLLECT_FEE, component: CollectFee },
  { name: SCREENS.STUDENT_FEES, component: StudentFees },
  { name: SCREENS.FEE_DASHBOARD, component: FeeDashboard },
  { name: SCREENS.STUDENT_FEE_DETAIL, component: StudentFeeDetail },

  { name: SCREENS.GALLERY, component: Gallery },
  { name: SCREENS.ADD_EVENT, component: AddEvent },
  { name: SCREENS.EVENT_DETAIL, component: EventDetail },
  { name: SCREENS.MEETING_DETAIL, component: MeetingDetail },
  { name: SCREENS.EVENT_CALENDAR, component: EventCalendar },

  { name: SCREENS.ALL_NOTICES, component: AllNotices },
  { name: SCREENS.NOTICE_DETAIL, component: NoticeDetail },

  { name: SCREENS.MY_LEAVES, component: MyLeave },
  { name: SCREENS.APPLY_LEAVE, component: ApplyLeave },
  { name: SCREENS.LEAVE_DETAIL, component: LeaveDetail },
  { name: SCREENS.LEAVE_MANAGEMENT, component: LeaveManagement },

  { name: SCREENS.ATTENDANCE, component: MyAttendance },
  { name: SCREENS.STAFF_ATTENDANCE, component: StaffAttendance },
  { name: SCREENS.STUDENT_ATTENDANCE, component: StudentAttendance },

  { name: SCREENS.ADD_HOMEWORK, component: AddHomework },
  { name: SCREENS.HOMEWORK_DETAIL, component: HomeworkDetail },

  { name: SCREENS.STUDENT_LIST, component: StudentList },
  { name: SCREENS.MANAGE_STUDENT, component: ManageStudent },

  { name: SCREENS.FULL_SCHEDULE, component: FullSchedule },
  { name: SCREENS.NOTIFICATIONS, component: NotificationScreen },
  { name: SCREENS.SYLLABUS_DETAIL, component: SyllabusDetail },

  { name: SCREENS.EXAMS_DETAIL, component: ExamDetails },
  { name: SCREENS.EXAMS_MARKS_ENTRY, component: ExamMarksEntry },
];

export const teacherDrawerRoutes = [
  { name: SCREENS.DASHBOARD, component: TeacherDashboard },
  { name: SCREENS.PROFILE, component: StaffProfile },
  { name: SCREENS.MY_SALARY, component: MySalary },
  { name: SCREENS.STUDENT_HUB, component: StudentHub },
  { name: SCREENS.ATTENDANCE_HUB, component: AttendanceHub },
  { name: SCREENS.FEE_DASHBOARD, component: FeeDashboard },
  { name: SCREENS.EVENT_HUB, component: EventHub },
  { name: SCREENS.HOLIDAY_LIST, component: HolidayList },
  { name: SCREENS.HOMEWORK_LIST, component: HomeworkList },
  { name: SCREENS.SYLLABUS_LIST, component: SyllabusList },
  { name: SCREENS.EXAMS_LIST, component: ExamsModuleNavigator },
];

export const studentDrawerRoutes = [
  { name: SCREENS.DASHBOARD, component: StudentDashboard },
  { name: SCREENS.STUDENT_FEES, component: StudentFees },
  { name: SCREENS.STUDENT_ATTENDANCE_HUB, component: StudentAttendanceHub },
  { name: SCREENS.PROFILE, component: StudentProfile },
  { name: SCREENS.EVENT_HUB, component: EventHub },
  { name: SCREENS.HOLIDAY_LIST, component: HolidayList },
  { name: SCREENS.HOMEWORK_LIST, component: HomeworkList },
  { name: SCREENS.SYLLABUS_LIST, component: SyllabusList },
  { name: SCREENS.EXAMS_LIST, component: ExamsModuleNavigator },
];

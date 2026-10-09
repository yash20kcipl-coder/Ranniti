import { SCREENS } from './constants';
import Splash from '../screens/Splash';
import Login from '../screens/AuthModule/Login';
import ForgotPassword from '../screens/AuthModule/ForgotPassword';
import ContactSupport from '../screens/AuthModule/ContactSupport';
import VoterDetailScreen from '../screens/VoterModule/VoterDetailScreen';
import AddEditVoterScreen from '../screens/VoterModule/AddEditVoterScreen';
import VolunteerDetailScreen from '../screens/TeamModule/VolunteerDetailScreen';
import OnboardTeamMemberScreen from '../screens/TeamModule/OnboardTeamMemberScreen';

export const routes = [
  {
    name: SCREENS.SPLASH,
    component: Splash,
  },
  {
    name: SCREENS.LOGIN,
    component: Login,
  },
  {
    name: SCREENS.FORGOT_PASSWORD,
    component: ForgotPassword,
  },
  {
    name: SCREENS.CONTACT_SUPPORT,
    component: ContactSupport,
  },
  {
    name: SCREENS.ADD_EDIT_VOTER,
    component: AddEditVoterScreen,
  },
  {
    name: SCREENS.VOTER_DETAIL,
    component: VoterDetailScreen,
  },
  {
    name: SCREENS.ONBOARD_TEAM_MEMBER,
    component: OnboardTeamMemberScreen,
  },
  {
    name: SCREENS.VOLUNTEER_DETAIL,
    component: VolunteerDetailScreen,
  },
];



import { SCREENS } from './constants';
import Splash from '../screens/Splash';
import Login from '../screens/AuthModule/Login';
import ForgotPassword from '../screens/AuthModule/ForgotPassword';
import ContactSupport from '../screens/AuthModule/ContactSupport';
import AddEditVoterScreen from '../screens/VoterModule/AddEditVoterScreen';

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
];



import { SET_CONTACT_INFO } from "../actions/support";

const initialState = {
  contactInfo: {
    email: 'support@ranniti.in',
    phone: '+91 98290 12345',
  },
  loading: false,
};

const supportReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case SET_CONTACT_INFO:
      return {
        ...state,
        contactInfo: action.payload,
      };
    default:
      return state;
  }
};

export default supportReducer;

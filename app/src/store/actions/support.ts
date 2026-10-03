import { Dispatch } from "redux";

export const SET_CONTACT_INFO = "SET_CONTACT_INFO";

export const fetchContactInfoAction = () => {
  return (dispatch: Dispatch) => {
    dispatch({
      type: SET_CONTACT_INFO,
      payload: {
        email: 'support@ranniti.in',
        phone: '+91 98290 12345',
      },
    });
  };
};

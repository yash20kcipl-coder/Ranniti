import { SET_SYNCED_VOTERS, SET_SYNC_LOADING, DEMO_SYNCED_VOTERS } from "../reducers/contactSync";
import toast from "../../utils/toast";
import { Dispatch } from "redux";

export const syncDeviceContactsAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_SYNC_LOADING, payload: true });
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
      dispatch({ type: SET_SYNCED_VOTERS, payload: DEMO_SYNCED_VOTERS });
      toast.success(`${DEMO_SYNCED_VOTERS.length} voters matched from phone contacts!`);
    } catch (e) {
      toast.error("Contact sync failed.");
    } finally {
      dispatch({ type: SET_SYNC_LOADING, payload: false });
    }
  };
};

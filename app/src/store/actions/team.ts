import { SET_TEAM_MEMBERS, ADD_TEAM_MEMBER, SET_TEAM_LOADING, TeamMember, DEMO_TEAM_MEMBERS } from "../reducers/team";
import toast from "../../utils/toast";
import { Dispatch } from "redux";

export const fetchTeamMembersAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch({ type: SET_TEAM_LOADING, payload: true });
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 400));
      dispatch({ type: SET_TEAM_MEMBERS, payload: DEMO_TEAM_MEMBERS });
    } finally {
      dispatch({ type: SET_TEAM_LOADING, payload: false });
    }
  };
};

export const addTeamMemberAction = (memberData: Partial<TeamMember>, onSuccess?: () => void) => {
  return (dispatch: Dispatch) => {
    const roleLabels: Record<string, string> = {
      ac_leader: 'AC Leader',
      sub_leader: 'Sub Leader',
      supporter: 'Supporter',
    };

    const newMember: TeamMember = {
      id: 'team-' + Date.now(),
      name: memberData.name || 'New Team Member',
      role: memberData.role || 'supporter',
      roleLabel: roleLabels[memberData.role || 'supporter'] || 'Supporter',
      mobile: memberData.mobile || '+919829000000',
      email: memberData.email || 'user@ranniti.in',
      assignedAc: memberData.assignedAc || 'Hawa Mahal Assembly',
      assignedBooth: memberData.assignedBooth || 'Booth #12',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: new Date().toISOString().split('T')[0],
    };

    dispatch({ type: ADD_TEAM_MEMBER, payload: newMember });
    toast.success(`${newMember.roleLabel} added successfully!`);
    if (onSuccess) onSuccess();
  };
};

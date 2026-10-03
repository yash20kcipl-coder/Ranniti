export const SET_TEAM_MEMBERS = "SET_TEAM_MEMBERS";
export const ADD_TEAM_MEMBER = "ADD_TEAM_MEMBER";
export const SET_TEAM_LOADING = "SET_TEAM_LOADING";

export interface TeamMember {
  id: string;
  name: string;
  role: 'ac_leader' | 'sub_leader' | 'supporter';
  roleLabel: string;
  mobile: string;
  email: string;
  assignedAc: string;
  assignedBooth: string;
  avatar: string;
  createdAt: string;
}

export const DEMO_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'team-01',
    name: 'Rajesh Sharma',
    role: 'ac_leader',
    roleLabel: 'AC Leader',
    mobile: '+919829011221',
    email: 'rajesh.ac@ranniti.in',
    assignedAc: 'Hawa Mahal Assembly',
    assignedBooth: '42 Booths',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2026-09-15',
  },
  {
    id: 'team-02',
    name: 'Amit Verma',
    role: 'sub_leader',
    roleLabel: 'Sub Leader',
    mobile: '+919829011222',
    email: 'amit.sub@ranniti.in',
    assignedAc: 'Hawa Mahal Assembly',
    assignedBooth: 'Booth #12 - #20',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2026-09-18',
  },
  {
    id: 'team-03',
    name: 'Rahul Gujjar',
    role: 'supporter',
    roleLabel: 'Supporter',
    mobile: '+919829011223',
    email: 'rahul.supporter@ranniti.in',
    assignedAc: 'Hawa Mahal Assembly',
    assignedBooth: 'Booth #14',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    createdAt: '2026-09-20',
  },
];

interface TeamState {
  members: TeamMember[];
  loading: boolean;
}

const initialState: TeamState = {
  members: DEMO_TEAM_MEMBERS,
  loading: false,
};

const teamReducer = (state = initialState, action: any): TeamState => {
  switch (action.type) {
    case SET_TEAM_LOADING:
      return { ...state, loading: action.payload };
    case SET_TEAM_MEMBERS:
      return { ...state, members: action.payload, loading: false };
    case ADD_TEAM_MEMBER:
      return { ...state, members: [action.payload, ...state.members] };
    default:
      return state;
  }
};

export default teamReducer;

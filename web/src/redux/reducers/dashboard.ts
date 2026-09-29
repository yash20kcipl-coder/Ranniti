const initialState = {
  stats: {
    totalStudents: 1250,
    totalStaff: 84,
    totalRevenue: 452000,
    totalFees: 452000,
    attendanceRate: 94.2,
    activeClasses: 36,
  },
  loading: false,
};

export default function dashboardreducers(state = initialState, action: any) {
  switch (action.type) {
    default:
      return state;
  }
}

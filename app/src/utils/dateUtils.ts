import moment from 'moment';

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const m = moment(dateString);
  if (!m.isValid()) return dateString;
  return m.format('DD MMM, YYYY');
};

export const formatShortDate = (dateString: string) => {
  if (!dateString) return '';
  const m = moment(dateString);
  if (!m.isValid()) return dateString;
  return m.format('DD MMM');
};

export const getDayMonth = (dateString: string) => {
  if (!dateString) return { day: '', month: '' };
  const m = moment(dateString);
  if (!m.isValid()) return { day: '', month: '' };

  return {
    day: m.format('DD'),
    month: m.format('MMM').toUpperCase(),
  };
};

export const formatTime = (timeString: string) => {
  if (!timeString) return '';
  // Handles both HH:mm and hh:mm A
  const m = moment(timeString, ['HH:mm', 'hh:mm A', 'YYYY-MM-DD HH:mm']);
  if (!m.isValid()) return timeString;
  return m.format('hh:mm A');
};

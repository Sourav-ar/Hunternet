export const ROLES = ['Guild Leader', 'Vice Leader', 'Analyzer', 'Team Leader', 'Hunter'];

export const can = (role, permission) => {
  const access = {
    manageGuild: ['Guild Leader', 'Vice Leader'],
    createGuild: ['Guild Leader'],
    createAnnouncement: ['Guild Leader', 'Vice Leader'],
    appraiseItem: ['Guild Leader', 'Vice Leader', 'Analyzer'],
    approveItem: ['Guild Leader', 'Vice Leader'],
    cancelAuction: ['Guild Leader', 'Vice Leader'],
    officerChat: ['Guild Leader', 'Vice Leader', 'Analyzer'],
  };
  return (access[permission] || []).includes(role);
};

export const apiError = (error) => error.response?.data?.message || error.message || 'Request failed.';

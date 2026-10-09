import api from '../api/axiosClient';

const data = (response) => response.data.data;

export const hunterNet = {
  health: () => api.get('/health').then((response) => response.data),
  guild: (id) => (id ? api.get(`/guilds/${id}`).then(data) : api.get('/guilds/me').then(data)),
  myGuild: () => api.get('/guilds/me').then(data),
  allGuilds: (params) => api.get('/guilds', { params }).then(data),
  createGuild: (payload) => api.post('/guilds', payload).then(data),
  updateGuild: (id, payload) => api.put(`/guilds/${id}`, payload).then(data),
  leaveGuild: () => api.post('/guilds/leave').then(data),
  applications: () => api.get('/guilds/applications').then(data),
  applyToGuild: (id) => api.post(`/guilds/${id}/apply`).then(data),
  approveApp: (id) => api.patch(`/guilds/applications/${id}/approve`).then(data),
  rejectApp: (id) => api.patch(`/guilds/applications/${id}/reject`).then(data),
  updateRole: (id, role) => api.patch(`/guilds/members/${id}/role`, { role }).then(data),
  kickMember: (id) => api.delete(`/guilds/members/${id}`).then((res) => res.data),
  members: (guildId) => api.get(`/guilds/${guildId}/members`).then(data),
  items: (params) => api.get('/items', { params }).then(data),
  createItem: (payload) => api.post('/items', payload).then(data),
  updateItemStatus: (id, payload) => api.patch(`/items/${id}/status`, payload).then(data),
  deleteItem: (id) => api.delete(`/items/${id}`).then(data),
  auctions: (params) => api.get('/auctions', { params }).then(data),
  createAuction: (payload) => api.post('/auctions', payload).then(data),
  placeBid: (auctionId, payload) => api.post(`/auctions/${auctionId}/bid`, payload).then(data),
  endAuction: (id) => api.post(`/auctions/${id}/end`).then(data),
  cancelAuction: (id) => api.post(`/auctions/${id}/cancel`).then(data),
  messages: (channel) => api.get('/messages', { params: { channel } }).then(data),
  sendMessage: (payload) => api.post('/messages', payload).then(data),
  timeline: (params) => api.get('/timeline', { params }).then(data),
  createTimeline: (payload) => api.post('/timeline', payload).then(data),
};

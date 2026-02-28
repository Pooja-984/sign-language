// Dynamically set base URL based on hostname
// This allows accessing from localhost or local network IP (e.g. 192.168.x.x) if backend is listening there.
const hostname = window.location.hostname;
export const baseURL = `http://${hostname}:5000/api`;

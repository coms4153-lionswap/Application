// Use proxy in development, direct URL in production
export const API_CONFIG = {
  IDENTITY_SERVICE_URL: import.meta.env.DEV
    ? "/api/identity"
    : "https://ms1-identity-157498364441.us-east1.run.app",
  CATALOG_SERVICE_URL: import.meta.env.DEV
    ? "/api/catalog"
    : "https://catalog-okz7qtaq4a-ue.a.run.app",
  CONVERSATION_SERVICE_URL: import.meta.env.DEV
    ? "/api/conversation"
    : "https://34.23.14.69",
  RESERVATION_SERVICE_URL: import.meta.env.DEV
    ? "/api/reservation"
    : "https://reservation-service-157498364441.us-east1.run.app",
};

// Simple logger for production deployment
// In production, the platform handles logging, so we use console

const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  }
};

export default logger;

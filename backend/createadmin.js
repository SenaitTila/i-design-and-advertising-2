const patchLegacyUsers = async () => {
  const User = require('./models/User');
  await User.updateMany(
    { 
      $or: [
        { isOnline: { $exists: false } }, 
        { lastSeen: { $exists: false } }
      ] 
    },
    { 
      $set: { 
        isOnline: false, 
        lastSeen: new Date() 
      } 
    }
  );
};
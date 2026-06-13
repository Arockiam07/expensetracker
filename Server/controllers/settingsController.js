import Settings from "../models/Settings.js";

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });
    
    if (!settings) {
      settings = await Settings.create({ user: req.user._id });
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ user: req.user._id });

    if (!settings) {
      settings = new Settings({ user: req.user._id });
    }

    const fieldsToUpdate = [
      "theme",
      "language",
      "currency",
      "accountStatus",
      "notifications",
      "dataSharing",
      "encryption",
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

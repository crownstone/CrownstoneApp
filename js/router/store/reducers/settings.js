let defaultSettings = {
  complexity: {
    presets: false,
    statistics: false,
    onHomeEnterExit: true,
    presenceWithoutDevices: false,
    linkedDevices: true
  }
};

// settingsReducer
export default (state = defaultSettings.complexity, action = {}) => {
  switch (action.type) {
    default:
      return state;
  }
};
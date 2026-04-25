export const Platform = {
  async init() {
    if (typeof WavedashJS !== 'undefined' && WavedashJS.init) {
      try {
        await WavedashJS.init();
      } catch (error) {
        console.error('[Platform] Init error:', error);
      }
    }
  },

  updateLoadProgress(fraction) {
    if (typeof WavedashJS !== 'undefined' && WavedashJS.updateLoadProgressZeroToOne) {
      WavedashJS.updateLoadProgressZeroToOne(fraction);
    }
  },

  async submitScore(leaderboardId, score) {
    if (typeof WavedashJS !== 'undefined' && WavedashJS.uploadLeaderboardScore) {
      try {
        const response = await WavedashJS.uploadLeaderboardScore(leaderboardId, score, true);
        if (!response.success) {
          console.error(`[Platform] Score error: ${response.message}`);
        }
      } catch (error) {
        console.error('[Platform] Submit error:', error);
      }
    }
  }
};

export default Platform;

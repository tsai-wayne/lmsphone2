const diveLinker = new DiveLinker("dive");
const db = firebase.firestore();
const auth = firebase.auth();

const targetId = "edebe72a9bd44de89fbdbc768b3bd6c5"; // 你的分數屬性ID

// 等 DiVE 載入完畢
function waitForDiveLoaded(callback) {
  const intervalId = setInterval(() => {
    if (diveLinker.getLoadingStatus()) {
      clearInterval(intervalId);
      callback();
    } else {
      console.log("⏳ 等待 DiVE 專案載入中...");
    }
  }, 300);
}

window.onload = () => {
  waitForDiveLoaded(() => {
    diveLinker.start();

    auth.onAuthStateChanged(user => {
      if (!user) {
        console.warn("請先登入");
        return;
      }

      setInterval(() => {
        let score = parseInt(diveLinker.getAttr(targetId));
        if (isNaN(score)) score = 0;

        const userScoreRef = db.collection("user_scores").doc(user.uid);

        userScoreRef.get().then(doc => {
          let bestScore = score;
          if (doc.exists) {
            const prevScore = doc.data().score || 0;
            if (prevScore > bestScore) bestScore = prevScore;
          }

          userScoreRef.set({ score: bestScore, updated: new Date() })
            .then(() => console.log("分數存入成功", bestScore))
            .catch(err => console.error("存分數錯誤", err));

        }).catch(err => console.error("讀取分數錯誤", err));
      }, 2000);
    });
  });
};

// 初始化
const diveLinker = new DiveLinker("dive");
const db = firebase.firestore();
const auth = firebase.auth();

// 成績屬性 ID（請用正確的 UUID）
const targetId = "edebe72a9bd44de89fbdbc768b3bd6c5";

// 當 DOM 完成載入時執行
window.addEventListener("load", () => {
  const iframe = document.getElementById("diveFrame");
  const fullscreenBtn = document.getElementById("fullscreenBtn");

  // ✅ 設定全螢幕按鈕功能
  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (!document.fullscreenElement) {
        await iframe.requestFullscreen();
        fullscreenBtn.textContent = "退出全螢幕";

        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock("landscape");
            console.log("✅ 鎖定橫屏成功");
          } catch (err) {
            console.warn("⚠️ 無法鎖定橫屏：", err.message);
          }
        }
      } else {
        await document.exitFullscreen();
        fullscreenBtn.textContent = "進入全螢幕";
      }
    } catch (e) {
      alert("⚠️ 無法切換全螢幕：" + e.message);
    }
  });

  // ✅ 切換按鈕文字
  document.addEventListener("fullscreenchange", () => {
    const isFull = !!document.fullscreenElement;
    fullscreenBtn.textContent = isFull ? "退出全螢幕" : "進入全螢幕";
  });

  // ✅ 等待 DiVE 載入後執行後續邏輯
  const wait = setInterval(() => {
    if (diveLinker.getLoadingStatus()) {
      clearInterval(wait);
      console.log("✅ DiVE 載入完成");

      diveLinker.enableBlock(false);
      diveLinker.start();

      // ✅ 成績監控與 Firebase 上傳（需登入）
      auth.onAuthStateChanged(user => {
        if (!user) {
          console.warn("⚠️ 未登入，無法上傳分數");
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

            userScoreRef.set({
              score: bestScore,
              updated: new Date()
            }).then(() => {
              console.log("✅ 分數已更新", bestScore);
            }).catch(err => {
              console.error("❌ 分數上傳失敗", err);
            });
          });
        }, 2000);
      });

      // ✅ 判斷是否完成
      const checkDone = setInterval(() => {
        const done = diveLinker.checkComplete();
        console.log("🎯 完成狀態：", done);

        if (done === true) {
          clearInterval(checkDone);
          if (document.fullscreenElement) {
            document.exitFullscreen().then(() => {
              alert("✅ 測驗完成，已退出全螢幕！");
            });
          } else {
            alert("✅ 測驗完成！");
          }
        }
      }, 1000);
    }
  }, 300);
});
const diveLinker = new DiveLinker("dive");
const db = firebase.firestore();

const targetIds = [
  "edebe72a9bd44de89fbdbc768b3bd6c5", // 勾
  "9a5a32d3f67243e5adc1c3c10f043aa2", // 施銲
  "8af095e7983b4a1a9fa8551cbac549e3", // 無超銲道
  "2111110d39d5428797bc5ead346ce229", // 穩定度
];

// 分數計算函式，根據你規則調整
function calculateGrade(score) {
  // score 是 0~3 的數字
  if (score <= 0) return "F";
  else if (score === 1) return "B";
  else if (score === 2) return "A";
  else return "S";
}

// 把勾的數值轉成分數
function getScore(val) {
  // 勾是3，其他是0，錯了沒勾是-1，扣1分
  const v = Number(val);
  if (v === 3) return 2;  // 扣1分後 3-1=2
  else if (v === 0) return 0;
  else return -1;
}

window.onload = () => {
  // 等 DiVE 載入完成
  const waitDive = setInterval(() => {
    if (diveLinker.getLoadingStatus()) {
      clearInterval(waitDive);
      diveLinker.start();

      setInterval(async () => {
        // 讀取勾的值
        const val = diveLinker.getAttr(targetIds[0]); // "勾" 的 UUID
        const score = getScore(val);

        // 計算評分
        const grade = calculateGrade(score);

        // 使用者ID這裡假設你從 Firebase Auth 取得
        const user = firebase.auth().currentUser;
        if (!user) return; // 未登入就不存

        // 先讀取先前成績，如果有比這次好就不更新
        const docRef = db.collection("grades").doc(user.uid);
        const docSnap = await docRef.get();

        if (!docSnap.exists || docSnap.data().score < score) {
          await docRef.set({
            score,
            grade,
            updatedAt: new Date().toISOString()
          });
          console.log("✅ 成績更新", {score, grade});
        } else {
          console.log("ℹ️ 先前成績更好，不更新");
        }
      }, 2000);
    }
  }, 300);
};

// 修复现有项目的图片位置数据
// 这个脚本用于更新 Firebase 中现有项目的 cropX, cropY, cropSize 字段

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "jkeroro-website.firebaseapp.com",
  projectId: "jkeroro-website",
  storageBucket: "jkeroro-website.appspot.com",
  messagingSenderId: "518841981397",
  appId: "1:518841981397:web:ac6b8202d7c29dc45ec55c",
  databaseURL: "https://jkeroro-website-default-rtdb.firebaseio.com/"
};

async function fixImagePositions() {
  try {
    // 初始化 Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // 获取所有项目
    const querySnapshot = await getDocs(collection(db, "carouselItems"));
    
    console.log(`找到 ${querySnapshot.docs.length} 个项目`);
    
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data();
      const docId = docSnapshot.id;
      
      // 检查是否需要更新
      const needsUpdate = 
        data.cropX === undefined || 
        data.cropY === undefined || 
        data.cropSize === undefined ||
        data.cropX !== 50 || 
        data.cropY !== 50 || 
        data.cropSize !== 100;
      
      if (needsUpdate) {
        console.log(`更新项目: ${data.title || docId}`);
        
        await updateDoc(doc(db, "carouselItems", docId), {
          cropX: 50,
          cropY: 50,
          cropSize: 100,
          imagePosition: 'center'
        });
        
        console.log(`✅ 已更新: ${data.title || docId}`);
      } else {
        console.log(`⏭️ 跳过: ${data.title || docId} (已是最新)`);
      }
    }
    
    console.log('🎉 所有项目已更新完成！');
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

// 运行脚本
fixImagePositions();

import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

// 🔒 Firebase 설정 타입 안전하게 유지
const firebaseConfig = {
    apiKey: "발급받은 API KEY",
    authDomain: "xxx.firebaseapp.com",
    projectId: "xxx",
    storageBucket: "xxx.appspot.com",
    messagingSenderId: "xxxx",
    appId: "앱 ID"
};

// 🔧 Firebase 초기화
const app = initializeApp(firebaseConfig);

// 🔧 인증 객체 생성
const auth = getAuth(app);
auth.languageCode = 'ko'; // 인증 문구 한글화

// ✅ 타입 자동 추론됨
export { auth, RecaptchaVerifier };

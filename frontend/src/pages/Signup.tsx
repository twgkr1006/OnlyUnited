import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import Logo from '../Tools/Logo'; // 로고 제거

interface SignupProps {
  onClose: () => void;
}

// 1단계: 약관 동의
function TermsStep({ onNext }: { onNext: () => void }) {
  const [allChecked, setAllChecked] = useState(false);
  const [terms1, setTerms1] = useState(false); // 필수
  const [terms2, setTerms2] = useState(false); // 선택

  useEffect(() => {
    setAllChecked(terms1 && terms2);
  }, [terms1, terms2]);

  const handleAll = (v: boolean) => {
    setTerms1(v);
    setTerms2(v);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="h-32 overflow-y-auto bg-gray-800 text-gray-200 p-3 rounded text-xs whitespace-pre-line">
        {`
[OnlyUnited 팬페이지 회원가입 약관]

제1조 (목적)  
이 약관은 OnlyUnited(이하 "회사")가 운영하는 맨체스터 유나이티드 팬페이지(이하 "서비스")에서 제공하는 회원가입, 이용 및 관리에 관한 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (수집하는 회원 정보 및 목적)

회사는 서비스 제공을 위해 아래와 같은 정보를 수집하며, 동의 없이 제3자에게 제공하지 않습니다.

- user_id (사용자 ID): 회원 식별 및 서비스 이용 계정
- user_email (이메일): 공지사항 발송, 비밀번호 찾기 등
- user_pw (비밀번호): 계정 보안 유지
- user_name (이름): 본인 확인, 커뮤니티 질서 유지
- user_nickname (닉네임): 커뮤니티 활동명 (기본값: 소셜+이름)
- user_gender (성별): 팬 분석 및 커뮤니티 통계 목적
- user_birthday (생년월일): 연령 확인, 서비스 이용 조건 충족 확인
- user_phone (전화번호): 보안인증, 고객센터 응대용
- user_profile (프로필 이미지): 기본 이미지 제공, URL 업로드 가능
- user_social (소셜 로그인 식별): 구글, 네이버, 카카오 등 연동 로그인
- user_role (권한): 관리자 여부 식별 (user, admin)
- user_tier (등급): 활동 이력 기반 등급 (아마, 세미, 프로, 챌린저 등)
- user_status (계정상태): 활성, 비활성 관리용

제3조 (회원가입 조건 및 의무)

1. 회원은 본인의 정확한 정보를 기입해야 하며, 허위 정보 입력 시 서비스 이용이 제한될 수 있습니다.
2. 닉네임은 커뮤니티 규칙에 어긋나지 않는 선에서 자유롭게 설정하되, 운영자가 부적절하다고 판단할 경우 변경이 요구될 수 있습니다.
3. 회원은 회사의 서비스 운영 목적에 따라 수집된 정보를 제공받는 데 동의하며, 이는 별도 개인정보처리방침에 따릅니다.

제4조 (서비스 이용 및 계정 관리)

1. 회원은 하나의 이메일 주소로 하나의 계정만 생성할 수 있습니다.
2. 소셜 로그인 사용 시 해당 플랫폼의 인증을 통해 로그인되며, 별도 비밀번호 설정은 선택입니다.
3. 회원은 자신의 계정 정보를 보호할 책임이 있으며, 타인의 계정 정보를 도용해서는 안 됩니다.
4. 계정 등급(user_tier)은 활동 이력, 참여도에 따라 조정될 수 있습니다.

제5조 (회원 탈퇴 및 계정 상태)

1. 회원은 언제든지 서비스 내 [회원탈퇴] 기능을 통해 탈퇴할 수 있으며, 이 경우 모든 데이터는 내부 보관 기간을 거쳐 삭제됩니다.
2. 회사는 다음의 사유에 해당하는 경우 회원의 계정을 비활성화(user_status: 비활성)하거나 탈퇴 조치할 수 있습니다:
    - 커뮤니티 가이드라인 위반
    - 타인에 대한 명예 훼손, 악성 댓글 등
    - 반복적인 신고 접수

제6조 (기타)

- 이 약관은 추후 변경될 수 있으며, 변경 시 이메일 또는 서비스 내 공지를 통해 회원에게 고지됩니다.
- 본 약관에서 명시되지 않은 사항은 회사의 개인정보처리방침 및 관련 법령을 따릅니다.

[개인정보처리방침 요약]

- 보관 기간: 회원 탈퇴 시까지 보관하며, 일부 항목은 관련 법령에 따라 일정 기간 보관될 수 있음
- 제3자 제공: 원칙적으로 없음, 필요한 경우 사전 동의 절차 진행
- 보안 조치: 비밀번호는 암호화 저장, 이메일/전화번호는 유출 방지를 위한 기술적 보호 조치 적용
`}
      </div>
      <label className="flex items-center gap-2 text-white">
        <input type="checkbox" checked={allChecked} onChange={e => handleAll(e.target.checked)} /> 전체 동의
      </label>
      <label className="flex items-center gap-2 text-white">
        <input type="checkbox" checked={terms1} onChange={e => setTerms1(e.target.checked)} /> (필수) 서비스 이용약관 동의
      </label>
      <label className="flex items-center gap-2 text-white">
        <input type="checkbox" checked={terms2} onChange={e => setTerms2(e.target.checked)} /> (선택) 마케팅 정보 수신 동의
      </label>
      <button
        className="w-full p-3 rounded bg-white text-black font-semibold mt-2 disabled:opacity-50"
        disabled={!terms1}
        onClick={onNext}
      >
        다음
      </button>
    </div>
  );
}

// 2단계: 이메일 인증
function EmailStep({ onNext }: { onNext: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (sent && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      setTimerId(timer);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setSent(false);
      setError('인증 시간이 만료되었습니다. 다시 시도해주세요.');
    }
  }, [sent, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSend = async () => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    
    if (!emailRegex.test(email)) {
      setError('올바른 이메일 형식이 아닙니다. (예: example@domain.com)');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('http://localhost:3001/email/authnumsend', {
        email: email
      }, {
        withCredentials: true
      });
      
      setSent(true);
      setTimeLeft(300); // 타이머 리셋
      setError('');
    } catch (err) {
      console.error(err);
      setError('메일 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!inputCode) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    if (timeLeft === 0) {
      setError('인증 시간이 만료되었습니다. 다시 시도해주세요.');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:3001/email/verifycode', {
        email: email,
        code: inputCode
      }, {
        withCredentials: true
      });
      
      if (timerId) clearInterval(timerId);
      onNext(email);
    } catch (err) {
      console.error(err);
      setError('인증 코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="이메일"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
        disabled={sent}
      />
      {!sent ? (
        <button
          className="w-full p-3 rounded bg-white text-black font-semibold mt-2 disabled:opacity-50"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? '전송 중...' : '인증 메일 발송'}
        </button>
      ) : (
        <>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="인증 코드 입력"
              value={inputCode}
              onChange={e => setInputCode(e.target.value)}
              className="flex-1 p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
            />
            <div className="text-blue-500 font-mono font-bold">{formatTime(timeLeft)}</div>
          </div>
          <button
            className="w-full p-3 rounded bg-white text-black font-semibold mt-2 disabled:opacity-50"
            onClick={handleCheck}
            disabled={loading || timeLeft === 0}
          >
            {loading ? '확인 중...' : '인증 코드 확인'}
          </button>
          {timeLeft < 60 && timeLeft > 0 && (
            <div className="text-yellow-500 text-xs text-center">
              인증 시간이 1분 미만 남았습니다!
            </div>
          )}
        </>
      )}
      {error && <div className="text-red-400 text-xs ml-1">{error}</div>}
      {sent && !error && (
        <div className="text-green-500 text-xs ml-1">
          인증 코드가 이메일로 전송되었습니다. 이메일을 확인해주세요.
        </div>
      )}
    </div>
  );
}

// 3단계: 전화번호 인증 (더미)
function PhoneStep({ onNext }: { onNext: (phone: string) => void }) {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  // 전화번호 형식화 함수
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    if (formattedValue.length <= 13) { // 010-1234-5678 형식의 최대 길이
      setPhone(formattedValue);
    }
  };

  const handleSend = () => {
    if (!/^01[0-9]-\d{3,4}-\d{4}$/.test(phone)) {
      setError('올바른 전화번호를 입력하세요. (예: 010-1234-5678)');
      return;
    }
    setSent(true);
    setCode('123456'); // 더미 코드
    setError('');
  };

  const handleCheck = () => {
    if (inputCode === code) {
      onNext(phone);
    } else {
      setError('인증 코드가 올바르지 않습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="tel"
        placeholder="전화번호 (숫자만 입력)"
        value={phone}
        onChange={handlePhoneChange}
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
        disabled={sent}
        maxLength={13}
      />
      {!sent ? (
        <button
          className="w-full p-3 rounded bg-white text-black font-semibold mt-2"
          onClick={handleSend}
        >
          인증 코드 발송
        </button>
      ) : (
        <>
          <input
            type="text"
            placeholder="인증 코드 입력"
            value={inputCode}
            onChange={e => setInputCode(e.target.value)}
            className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
          />
          <button
            className="w-full p-3 rounded bg-white text-black font-semibold mt-2"
            onClick={handleCheck}
          >
            인증 코드 확인
          </button>
        </>
      )}
      {error && <div className="text-red-400 text-xs ml-1">{error}</div>}
      {sent && !error && (
        <div className="text-green-400 text-xs ml-1">인증 코드가 발송되었습니다. (코드: 123456)</div>
      )}
    </div>
  );
}

// 4단계: 비밀번호 설정
function PasswordStep({ onNext }: { onNext: (password: string) => void }) {
  const [pw, setPw] = useState('');
  const [pwCheck, setPwCheck] = useState('');
  const isPwMatch = pw && pw === pwCheck;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPwMatch) onNext(pw);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="password"
        placeholder="비밀번호"
        value={pw}
        onChange={e => setPw(e.target.value)}
        required
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
      />
      <input
        type="password"
        placeholder="비밀번호 재입력"
        value={pwCheck}
        onChange={e => setPwCheck(e.target.value)}
        required
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
      />
      {pwCheck && !isPwMatch && (
        <div className="text-red-400 text-xs ml-1">비밀번호가 일치하지 않습니다.</div>
      )}
      <button
        type="submit"
        className="w-full p-3 rounded bg-white text-black font-semibold mt-2 disabled:opacity-50"
        disabled={!isPwMatch}
      >
        다음
      </button>
    </form>
  );
}

// 5단계: 개인정보 입력
function InfoStep({ signupData, onNext }: { signupData: any, onNext: () => void }) {
  const [form, setForm] = useState({
    user_name: '',
    user_nickname: '',
    user_gender: '남',
    user_birthday: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/user/signup', {
        user_email: signupData.email,
        user_pw: signupData.password,
        user_phone: signupData.user_phone,  // 전화번호 추가
        user_name: form.user_name,
        user_nickname: form.user_nickname,
        user_gender: form.user_gender === '남' ? 'MALE' : 'FEMALE',
        user_birthday: form.user_birthday
      }, {
        withCredentials: true
      });

      if (response.status === 201) {
        onNext();
      }
    } catch (err) {
      console.error('회원가입 실패:', err);
      setError('회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="text"
        name="user_name"
        placeholder="이름"
        value={form.user_name}
        onChange={handleChange}
        required
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
      />
      <input
        type="text"
        name="user_nickname"
        placeholder="닉네임"
        value={form.user_nickname}
        onChange={handleChange}
        required
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
      />
      <select
        name="user_gender"
        value={form.user_gender}
        onChange={handleChange}
        required
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
      >
        <option value="남">남</option>
        <option value="여">여</option>
      </select>
      <input
        type="date"
        name="user_birthday"
        placeholder="연도-월-일"
        value={form.user_birthday}
        onChange={handleChange}
        required
        className="w-full p-3 rounded bg-black border border-gray-600 focus:outline-none text-white placeholder-gray-400"
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="w-full p-3 rounded bg-white text-black font-semibold mt-2 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? '처리 중...' : '회원가입'}
      </button>
    </form>
  );
}

// 6단계: 완료
function CompleteStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10">
      <div className="text-2xl text-white font-bold">회원가입이 완료되었습니다!</div>
      <button
        className="w-full p-3 rounded bg-white text-black font-semibold mt-2"
        onClick={onClose}
      >
        확인
      </button>
    </div>
  );
}

const Signup: React.FC<SignupProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    user_phone: '',
    user_name: '',
    user_nickname: '',
    user_gender: '남',
    user_birthday: '',
  });

  useEffect(() => {
    setShow(true);
  }, []);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const updateSignupData = (data: Partial<typeof signupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className={`bg-black p-6 rounded shadow w-[26rem] min-h-[36rem] flex flex-col justify-start relative transition-all duration-300 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl"
        >×</button>
        <div className="text-center font-bold text-lg text-white mb-2 mt-2 tracking-wide">
          회원가입
        </div>
        {/* 진행 바 (6단계) */}
        <div className="w-full h-1 bg-gray-600 rounded mb-8 overflow-hidden">
          <div
            className="h-1 bg-white rounded transition-all duration-300"
            style={{ width: `${step * 16.66}%` }}
          />
        </div>
        {/* 단계별 내용 */}
        {step === 1 && <TermsStep onNext={() => setStep(2)} />}
        {step === 2 && (
          <EmailStep
            onNext={(email) => {
              updateSignupData({ email });
              setStep(3);
            }}
          />
        )}
        {step === 3 && (
          <PhoneStep
            onNext={(phone) => {
              updateSignupData({ user_phone: phone });
              setStep(4);
            }}
          />
        )}
        {step === 4 && (
          <PasswordStep
            onNext={(password) => {
              updateSignupData({ password });
              setStep(5);
            }}
          />
        )}
        {step === 5 && (
          <InfoStep
            signupData={signupData}
            onNext={() => setStep(6)}
          />
        )}
        {step === 6 && <CompleteStep onClose={handleClose} />}
        <div className="text-xs mt-6 text-gray-400 text-center">© OnlyUnited All Rights Reserved.</div>
      </div>
    </div>
  );
};

export default Signup;

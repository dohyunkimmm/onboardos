'use strict';

const statusConfig = {
  auto:     { label:'자동 지급',  cls:'status-auto',     cta:'',                 timing:'계정 생성 후 1시간 이내 자동 지급' },
  request:  { label:'신청 필요',  cls:'status-request',  cta:'신청하기',        timing:'신청 후 영업일 기준 1~2일 이내 처리' },
  approval: { label:'승인 필요',  cls:'status-approval', cta:'승인 요청하기',   timing:'담당 부서 확인·관리자 승인 후 영업일 기준 2~3일 이내 처리' },
  pending:  { label:'검토 대기',  cls:'status-pending',  cta:'상태 보기',          timing:'담당자 처리 대기 중' },
  approved: { label:'지급 대기',  cls:'status-approved', cta:'상태 보기', timing:'검토 또는 승인 완료 · 라이선스 지급 대기' },
  rejected: { label:'반려',      cls:'status-rejected', cta:'사유 확인·재신청', timing:'반려 사유 확인 후 재신청 가능' },
  completed:{ label:'지급 완료',  cls:'status-completed',cta:'접속하기',        timing:'라이선스 지급 완료' }
};


const commonLicenses = [
  { mono:'SL', icon:'icons/slack.svg',  name:'Slack',            cat:'협업툴', owner:'IT팀', audience:'전사 구성원', status:'auto', url:'https://slack.com' },
  { mono:'NT', icon:'icons/notion.svg',  name:'Notion',              cat:'협업툴', owner:'IT팀', audience:'전사 구성원', status:'auto', url:'https://notion.so' },
  { mono:'CF', icon:'icons/confluence.svg', name:'Confluence',       cat:'협업툴', owner:'IT팀', audience:'전사 구성원', status:'auto', url:'https://confluence.atlassian.com' },
  { mono:'JR', icon:'icons/jira.svg',    name:'Jira',                cat:'협업툴', owner:'IT팀', audience:'전사 구성원', status:'auto', url:'https://jira.atlassian.com' },
  { mono:'JSM', icon:'icons/jsm.svg', name:'Jira Service Management', cat:'IT 요청 포털', owner:'IT팀', audience:'전사 구성원', status:'auto', url:'https://jira.atlassian.com' },
];

const roles = {
  design: {
    label:'디자인',
    heading:'디자인 추가 라이선스',
    cards:[
      { mono:'CC', icon:'icons/adobe-cc.svg', name:'Adobe Creative Cloud', cat:'디자인툴', owner:'디자인팀 라이선스 담당', audience:'디자인 직군', status:'approval', url:'https://creativecloud.adobe.com' },
      { mono:'FG', icon:'icons/figma.svg',   name:'Figma',   cat:'디자인툴·UI툴', owner:'디자인팀 라이선스 담당', audience:'디자인 직군', status:'request', url:'https://figma.com' },
      { mono:'FJ', icon:'icons/figjam.svg',   name:'FigJam',  cat:'UX툴', owner:'디자인팀 라이선스 담당', audience:'디자인 직군', status:'request', url:'https://figma.com/figjam' },
      { mono:'MZ', icon:'icons/maze.svg',    name:'Maze',    cat:'UX툴', owner:'디자인팀 라이선스 담당', audience:'디자인 직군', status:'request', url:'https://maze.co' },
    ]
  },
  dev: {
    label:'개발',
    heading:'개발 추가 라이선스',
    cards:[
      { mono:'GH', icon:'icons/github.svg',        name:'GitHub',          cat:'개발툴', owner:'개발팀 라이선스 담당', audience:'개발 직군', status:'request', url:'https://github.com' },
      { mono:'JB', icon:'icons/jetbrains.svg',     name:'JetBrains',       cat:'개발툴', owner:'개발팀 라이선스 담당', audience:'개발 직군', status:'request', url:'https://jetbrains.com' },
      { mono:'AWS', icon:'icons/aws.svg',     name:'AWS',             cat:'클라우드 접근 권한', owner:'개발팀 라이선스 담당', audience:'개발 직군', status:'approval', url:'https://aws.amazon.com' },
      { mono:'PM', icon:'icons/postman.svg', name:'Postman', cat:'API 개발·테스트', owner:'개발팀 라이선스 담당', audience:'개발 직군', status:'request', url:'https://www.postman.com' },
      { mono:'CP', icon:'icons/github-copilot.svg', name:'GitHub Copilot',  cat:'AI툴',   owner:'IT팀·개발팀', audience:'개발 직군', status:'request', url:'https://github.com/features/copilot' },
    ]
  },
  data: {
    label:'데이터',
    heading:'데이터 추가 라이선스',
    cards:[
      { mono:'SF', icon:'icons/snowflake.svg',  name:'Snowflake',          cat:'데이터 접근 권한', owner:'데이터팀 라이선스 담당', audience:'데이터 직군', status:'approval', url:'https://snowflake.com' },
      { mono:'DB', icon:'icons/dbeaver.svg',    name:'DBeaver',            cat:'DB툴', owner:'데이터팀 라이선스 담당', audience:'데이터 직군', status:'auto', url:'https://dbeaver.io' },
      { mono:'GPT', icon:'icons/openai.svg',     name:'ChatGPT Enterprise', cat:'AI툴', owner:'IT팀·데이터팀', audience:'데이터 직군', status:'request', url:'https://chat.openai.com' },
      { mono:'PBI', icon:'icons/power-bi.svg', name:'Power BI Pro', cat:'BI·데이터 시각화', owner:'데이터팀 라이선스 담당', audience:'데이터 직군', status:'request', url:'https://app.powerbi.com' },
      { mono:'PX', icon:'icons/perplexity.svg', name:'Perplexity',         cat:'AI툴', owner:'IT팀·데이터팀', audience:'데이터 직군', status:'request', url:'https://perplexity.ai' },
    ]
  },
  office: {
    label:'경영지원·총무',
    heading:'경영지원·총무 추가 라이선스',
    cards:[
      { mono:'HG', icon:'icons/hancom.svg',             name:'한글(HWP)',           cat:'오피스·문서툴', owner:'IT팀', audience:'경영지원·총무 직군', status:'request', url:'https://hancom.com' },
      { mono:'MO', icon:'icons/microsoft-office.svg',    name:'Microsoft Office',    cat:'오피스·문서툴', owner:'IT팀', audience:'경영지원·총무 직군', status:'request', url:'https://office.com' },
      { mono:'MD', icon:'icons/modusign.svg', name:'모두싸인', cat:'전자계약·서명', owner:'경영지원팀 라이선스 담당', audience:'경영지원·총무 직군', status:'request', url:'https://modusign.co.kr' },
      { mono:'AD', icon:'icons/adobe-acrobat.svg', name:'Adobe Acrobat Pro DC',cat:'오피스·문서툴', owner:'IT팀', audience:'경영지원·총무 직군', status:'request', url:'https://acrobat.adobe.com' },
    ]
  },
  unmapped: {
    label:'직무 미매핑',
    heading:'직무 정보를 확인할 수 없습니다',
    cards:[],
    exception:true
  }
};

// Role-first use cases: the UI and Gemini API share this allowlisted source of truth.
const recommendationCases = {
  "design": [
    {
      "id": "ui",
      "label": "UI·UX 화면 디자인",
      "description": "웹·앱 화면 설계 및 인터페이스 디자인",
      "recommendations": [
        {
          "toolId": "FG",
          "reason": "화면 설계와 컴포넌트 디자인 협업에 활용합니다."
        },
        {
          "toolId": "FJ",
          "reason": "아이디어와 사용자 흐름을 시각적으로 정리합니다."
        },
        {
          "toolId": "MZ",
          "reason": "시안의 사용성을 검증하는 데 활용합니다."
        }
      ]
    },
    {
      "id": "graphic",
      "label": "그래픽·브랜딩",
      "description": "브랜드 시각물·이미지·그래픽 제작",
      "recommendations": [
        {
          "toolId": "CC",
          "reason": "브랜드 그래픽과 이미지를 제작·편집합니다."
        },
        {
          "toolId": "FG",
          "reason": "브랜드 시안과 디자인 자산을 공유합니다."
        },
        {
          "toolId": "NT",
          "reason": "브랜드 가이드와 관련 자료를 정리합니다."
        }
      ]
    },
    {
      "id": "research",
      "label": "UX 리서치·검증",
      "description": "사용자 조사와 디자인 테스트·프로토타입 검증",
      "recommendations": [
        {
          "toolId": "MZ",
          "reason": "사용성 테스트와 리서치 결과를 확인합니다."
        },
        {
          "toolId": "FG",
          "reason": "인터랙션 화면과 프로토타입을 공유합니다."
        },
        {
          "toolId": "FJ",
          "reason": "사용자 여정과 리서치 의견을 정리합니다."
        }
      ]
    },
    {
      "id": "collab",
      "label": "디자인 협업·워크숍",
      "description": "디자인 팀 협업과 워크숍·아이디어 정리",
      "recommendations": [
        {
          "toolId": "FJ",
          "reason": "워크숍과 아이디어 도출에 활용합니다."
        },
        {
          "toolId": "FG",
          "reason": "디자인 시안과 변경 사항을 공유합니다."
        },
        {
          "toolId": "CF",
          "reason": "디자인 결정 사항과 가이드를 문서화합니다."
        }
      ]
    }
  ],
  "dev": [
    {
      "id": "code",
      "label": "코드 작성·개발",
      "description": "애플리케이션 개발과 코드 협업",
      "recommendations": [
        {
          "toolId": "GH",
          "reason": "소스 코드 버전 관리와 리뷰에 활용합니다."
        },
        {
          "toolId": "JB",
          "reason": "코드 작성과 디버깅 환경으로 활용합니다."
        },
        {
          "toolId": "CP",
          "reason": "코드 작성·리뷰를 보조합니다."
        }
      ]
    },
    {
      "id": "api",
      "label": "API·백엔드",
      "description": "API 구현과 서버 연동·테스트",
      "recommendations": [
        {
          "toolId": "GH",
          "reason": "백엔드 코드를 관리하고 협업합니다."
        },
        {
          "toolId": "PM",
          "reason": "API 요청과 응답을 테스트합니다."
        },
        {
          "toolId": "AWS",
          "reason": "승인받은 클라우드 리소스에 접근합니다."
        }
      ]
    },
    {
      "id": "review",
      "label": "코드 리뷰·AI 보조",
      "description": "코드 리뷰와 개발 생산성 지원",
      "recommendations": [
        {
          "toolId": "GH",
          "reason": "PR과 변경 이력을 검토합니다."
        },
        {
          "toolId": "CP",
          "reason": "코드 제안과 검토를 보조합니다."
        },
        {
          "toolId": "JB",
          "reason": "구현과 리팩터링 작업에 활용합니다."
        }
      ]
    },
    {
      "id": "issue",
      "label": "개발 협업·이슈 관리",
      "description": "개발 이슈 추적과 일정 협업",
      "recommendations": [
        {
          "toolId": "JR",
          "reason": "개발 이슈와 작업 상태를 관리합니다."
        },
        {
          "toolId": "GH",
          "reason": "코드 변경과 작업 이력을 연계합니다."
        },
        {
          "toolId": "CF",
          "reason": "기술 문서와 개발 가이드를 정리합니다."
        }
      ]
    }
  ],
  "data": [
    {
      "id": "sql",
      "label": "SQL·데이터 분석",
      "description": "SQL 쿼리 및 데이터 분석",
      "recommendations": [
        {
          "toolId": "DB",
          "reason": "데이터베이스 조회와 SQL 작업에 활용합니다."
        },
        {
          "toolId": "SF",
          "reason": "승인받은 분석 데이터에 접근합니다."
        },
        {
          "toolId": "PBI",
          "reason": "분석 결과를 시각화합니다."
        }
      ]
    },
    {
      "id": "bi",
      "label": "대시보드·리포트",
      "description": "분석 리포트 및 대시보드 작성",
      "recommendations": [
        {
          "toolId": "PBI",
          "reason": "대시보드를 제작하고 지표를 시각화합니다."
        },
        {
          "toolId": "DB",
          "reason": "데이터를 조회해 분석에 활용합니다."
        },
        {
          "toolId": "SF",
          "reason": "승인된 데이터 환경에서 분석 자료를 활용합니다."
        }
      ]
    },
    {
      "id": "research",
      "label": "AI·업무 리서치",
      "description": "AI 활용 자료 조사와 데이터 업무 생산성",
      "recommendations": [
        {
          "toolId": "GPT",
          "reason": "업무 분석과 문서 작성을 보조합니다."
        },
        {
          "toolId": "PX",
          "reason": "자료 조사와 정보 탐색에 활용합니다."
        },
        {
          "toolId": "NT",
          "reason": "리서치 결과와 지식을 정리합니다."
        }
      ]
    },
    {
      "id": "share",
      "label": "데이터 공유·협업",
      "description": "분석 결과 공유와 팀 협업",
      "recommendations": [
        {
          "toolId": "PBI",
          "reason": "분석 결과를 팀에 시각적으로 공유합니다."
        },
        {
          "toolId": "NT",
          "reason": "데이터 정의와 분석 내용을 기록합니다."
        },
        {
          "toolId": "CF",
          "reason": "데이터 활용 가이드를 문서화합니다."
        }
      ]
    }
  ],
  "office": [
    {
      "id": "design-edit",
      "label": "디자인·이미지 편집",
      "description": "디자인 편집·화면 시안 제작·간단한 그래픽 작업. 경영지원 직군이라도 직군 외 라이선스를 검토할 수 있습니다.",
      "recommendations": [
        {"toolId":"FG","reason":"디자인 화면과 시안을 제작·편집하고 협업합니다. 현재 직군 외 라이선스이므로 IT 검토가 필요합니다."},
        {"toolId":"CC","reason":"브랜드 이미지와 그래픽을 편집할 때 활용합니다. 현재 직군 외 라이선스이므로 IT 검토가 필요합니다."}
      ]
    },
    {
      "id": "docs",
      "label": "문서·보고서 작성",
      "description": "문서 작성·스프레드시트·보고서 편집",
      "recommendations": [
        {
          "toolId": "MO",
          "reason": "보고서와 스프레드시트를 작성합니다."
        },
        {
          "toolId": "HG",
          "reason": "한글 문서 작성과 편집에 활용합니다."
        },
        {
          "toolId": "AD",
          "reason": "PDF 문서를 검토하고 편집합니다."
        }
      ]
    },
    {
      "id": "contract",
      "label": "계약·전자서명",
      "description": "계약서 검토와 전자서명 요청",
      "recommendations": [
        {
          "toolId": "MD",
          "reason": "계약 문서의 전자서명을 요청·관리합니다."
        },
        {
          "toolId": "AD",
          "reason": "계약서 PDF를 검토하고 주석을 작성합니다."
        },
        {
          "toolId": "MO",
          "reason": "계약 관련 서식과 자료를 정리합니다."
        }
      ]
    },
    {
      "id": "ops",
      "label": "사내 운영·협업",
      "description": "경영지원 및 총무 업무 협업",
      "recommendations": [
        {
          "toolId": "NT",
          "reason": "사내 운영 안내와 업무 자료를 정리합니다."
        },
        {
          "toolId": "MO",
          "reason": "운영 현황과 업무 자료를 작성합니다."
        },
        {
          "toolId": "CF",
          "reason": "운영 절차와 가이드를 공유합니다."
        }
      ]
    },
    {
      "id": "support",
      "label": "IT 요청·권한 문의",
      "description": "IT 서비스 요청과 지급 현황 확인",
      "recommendations": [
        {
          "toolId": "JSM",
          "reason": "IT 요청과 처리 상태를 확인합니다."
        },
        {
          "toolId": "NT",
          "reason": "요청 관련 안내 자료를 정리합니다."
        },
        {
          "toolId": "MO",
          "reason": "요청 자료와 현황을 작성합니다."
        }
      ]
    }
  ]
};

const tooltipText = {
  auto:     '별도 신청 없이 계정 생성 후 1시간 이내 자동으로 지급됩니다.',
  request:  '신청 버튼을 눌러 요청하면 IT팀이 검토 후 영업일 1~2일 이내 처리합니다.',
  approval: '비용·관리 권한 또는 담당 부서 확인이 필요한 항목입니다. 신청 → 담당자 검토 → 관리자 승인 순으로 진행되며 영업일 2~3일 이내 처리됩니다.',
  pending: '신청이 접수되어 담당자 처리를 기다리고 있습니다.',
  approved: '필요한 검토 또는 승인이 완료되어 라이선스 지급을 기다리고 있습니다.',
  rejected: '요청이 반려되었습니다. 신청현황에서 사유를 확인하고 다시 신청할 수 있습니다.',
  completed: '라이선스 지급이 완료되었습니다. 접속하기 버튼으로 서비스를 이용할 수 있습니다.'
};

const REJECT_REASONS = [
  '사용 목적과 필요 기간이 확인되지 않았습니다.',
  '동일 기능의 대체 라이선스가 이미 지급되어 있습니다.',
  '예산 코드 또는 비용 부담 부서가 확인되지 않았습니다.',
  '권한 범위 또는 관리자 승인 근거가 확인되지 않았습니다.'
];

// The server uses the same allowlisted catalog as the employee screen.
if(typeof module !== 'undefined' && module.exports) module.exports = { commonLicenses, roles, recommendationCases };

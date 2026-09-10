'use strict';

const statusConfig = {
  auto:     { label:'자동 지급',  cls:'status-auto',     cta:'',                 timing:'계정 생성 후 1시간 이내 자동 지급' },
  request:  { label:'신청 필요',  cls:'status-request',  cta:'신청하기',        timing:'신청 후 영업일 기준 1~2일 이내 처리' },
  approval: { label:'승인 필요',  cls:'status-approval', cta:'승인 요청하기',   timing:'담당 부서 확인·관리자 승인 후 영업일 기준 2~3일 이내 처리' },
  pending:  { label:'처리 중',    cls:'status-pending',  cta:'상태 보기',          timing:'담당자 검토 및 승인 대기 중' },
  approved: { label:'지급 대기',  cls:'status-approved', cta:'상태 보기', timing:'검토·승인 완료 · 라이선스 지급 대기' },
  rejected: { label:'반려',      cls:'status-rejected', cta:'사유 확인·재신청', timing:'반려 사유 확인 후 재신청 가능' },
  completed:{ label:'지급 완료',  cls:'status-completed',cta:'접속하기',        timing:'라이선스 지급 완료' }
};


const commonLicenses = [
  { mono:'GW', icon:'icons/google-workspace.svg', name:'Google Workspace', cat:'협업툴', owner:'IT팀', audience:'전사 구성원', status:'auto', url:'https://workspace.google.com' },
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
      { mono:'PX', icon:'icons/perplexity.svg', name:'Perplexity',         cat:'AI툴', owner:'IT팀·데이터팀', audience:'데이터 직군', status:'request', url:'https://perplexity.ai' },
    ]
  },
  office: {
    label:'경영지원·총무',
    heading:'경영지원·총무 추가 라이선스',
    cards:[
      { mono:'HG', icon:'icons/hancom.svg',             name:'한글(HWP)',           cat:'오피스·문서툴', owner:'IT팀', audience:'경영지원·총무 직군', status:'request', url:'https://hancom.com' },
      { mono:'MO', icon:'icons/microsoft-office.svg',    name:'Microsoft Office',    cat:'오피스·문서툴', owner:'IT팀', audience:'경영지원·총무 직군', status:'request', url:'https://office.com' },
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

const tooltipText = {
  auto:     '별도 신청 없이 계정 생성 후 1시간 이내 자동으로 지급됩니다.',
  request:  '신청 버튼을 눌러 요청하면 IT팀이 검토 후 영업일 1~2일 이내 처리합니다.',
  approval: '비용·관리 권한 또는 담당 부서 확인이 필요한 항목입니다. 신청 → 담당자 검토 → 관리자 승인 순으로 진행되며 영업일 2~3일 이내 처리됩니다.',
  pending: '신청이 접수되어 담당자 검토 또는 관리자 승인 대기 중입니다.',
  approved: '검토·승인이 완료되어 라이선스 지급을 기다리고 있습니다.',
  rejected: '요청이 반려되었습니다. 신청현황에서 사유를 확인하고 다시 신청할 수 있습니다.',
  completed: '라이선스 지급이 완료되었습니다. 접속하기 버튼으로 서비스를 이용할 수 있습니다.'
};

const REJECT_REASONS = [
  '사용 목적과 필요 기간이 확인되지 않았습니다.',
  '동일 기능의 대체 라이선스가 이미 지급되어 있습니다.',
  '예산 코드 또는 비용 부담 부서가 확인되지 않았습니다.',
  '권한 범위 또는 관리자 승인 근거가 확인되지 않았습니다.'
];

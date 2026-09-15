from pathlib import Path

path = Path('experience-refinement.css')
css = path.read_text(encoding='utf-8')
marker = '/* ONBOARD·OS v14 candidate — operational command center.'
if marker in css:
    print('v14 block already present')
    raise SystemExit(0)

block = r'''

/* ONBOARD·OS v14 candidate — operational command center.
   Scope: post-login information architecture, task priority, state legibility, execution surfaces, and mobile ergonomics.
   Business logic, login baseline, P6 state machine, role isolation, request semantics, and canonical v13 release provenance remain unchanged. */
:root{
  --v14-canvas:#090b10;
  --v14-panel:rgba(17,20,27,.965);
  --v14-panel-soft:rgba(255,255,255,.027);
  --v14-panel-raised:rgba(28,32,42,.985);
  --v14-line:rgba(255,255,255,.082);
  --v14-line-strong:rgba(203,190,255,.24);
  --v14-text:#fafafe;
  --v14-muted:rgba(226,227,234,.68);
  --v14-dim:rgba(226,227,234,.47);
  --v14-brand:#b7a5ff;
  --v14-brand-strong:#8b5cf6;
  --v14-info:#7dd3fc;
  --v14-positive:#86efac;
  --v14-warning:#fde68a;
  --v14-danger:#fda4af;
  --v14-radius-xl:26px;
  --v14-radius-lg:20px;
  --v14-radius-md:13px;
  --v14-shadow-panel:0 34px 86px -60px rgba(0,0,0,.98),0 1px 0 rgba(255,255,255,.035) inset;
  --v14-shadow-card:0 20px 52px -42px rgba(0,0,0,.96),0 1px 0 rgba(255,255,255,.025) inset;
  --v14-shadow-active:0 28px 64px -42px rgba(124,58,237,.52),0 1px 0 rgba(255,255,255,.045) inset;
  --v14-ease:cubic-bezier(.2,.76,.2,1);
}

/* V14-1: make the page read as an operational workspace rather than stacked components. */
body:not(.login-open){background:var(--v14-canvas);}
body:not(.login-open) .bg-atmosphere{
  background:
    radial-gradient(940px 620px at 8% -12%,rgba(99,102,241,.082),transparent 67%),
    radial-gradient(820px 620px at 96% 4%,rgba(168,85,247,.058),transparent 69%),
    linear-gradient(180deg,rgba(255,255,255,.008),transparent 22%);
}
body:not(.login-open) main{
  max-width:1280px;
  padding-top:34px;
  padding-bottom:84px;
}
body:not(.login-open) .topbar{
  border-bottom-color:rgba(255,255,255,.06);
  background:linear-gradient(180deg,rgba(9,11,16,.94),rgba(9,11,16,.80));
  box-shadow:0 16px 40px -36px rgba(0,0,0,.98);
}
body:not(.login-open) .topbar .logo{font-weight:820;letter-spacing:-.05em;}
body:not(.login-open) .topbar .sub{color:var(--v14-dim);}
body:not(.login-open) .top-actions{padding:3px;border:1px solid rgba(255,255,255,.045);border-radius:13px;background:rgba(255,255,255,.018);}
body:not(.login-open) #statusBtn{
  border-color:rgba(203,190,255,.34);
  background:linear-gradient(135deg,rgba(124,58,237,.96),rgba(67,56,202,.88));
  box-shadow:0 14px 32px -20px rgba(124,58,237,.98),inset 0 1px 0 rgba(255,255,255,.11);
}
body:not(.login-open) #adminBtn{background:rgba(255,255,255,.05);}
body:not(.login-open) #resetBtn,
body:not(.login-open) #moreBtn{background:transparent;border-color:transparent;}

/* V14-2: overview becomes the command header — identity left, operating mode right, progress anchored below. */
body:not(.login-open) .overview-panel{
  position:relative;
  overflow:hidden;
  border-radius:24px;
  border-color:rgba(255,255,255,.095);
  background:
    radial-gradient(78% 155% at 100% -18%,rgba(139,92,246,.20),transparent 58%),
    radial-gradient(56% 120% at -5% 108%,rgba(14,165,233,.065),transparent 66%),
    linear-gradient(145deg,rgba(29,33,44,.99),rgba(12,14,20,.985));
  box-shadow:0 38px 94px -64px rgba(124,58,237,.56),var(--v14-shadow-panel);
}
body:not(.login-open) .overview-panel::before{
  content:"";
  position:absolute;inset:0 0 auto 0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(216,205,255,.34),transparent);
  pointer-events:none;
}
body:not(.login-open) .overview-panel .avatar{
  width:60px;height:60px;
  border-color:rgba(203,190,255,.25);
  background:linear-gradient(145deg,rgba(124,58,237,.38),rgba(14,165,233,.10));
  box-shadow:0 16px 34px -24px rgba(124,58,237,.96),inset 0 1px 0 rgba(255,255,255,.08);
}
body:not(.login-open) .overview-panel .badge-id label{
  color:rgba(220,211,255,.76);
  font-weight:760;
  letter-spacing:.05em;
  text-transform:uppercase;
}
body:not(.login-open) .overview-panel .name-input{
  color:var(--v14-text);
  font-size:33px;
  font-weight:820;
  letter-spacing:-.052em;
  line-height:1.04;
}
body:not(.login-open) .overview-panel .emp-meta{color:var(--v14-dim);}
body:not(.login-open) .role-meta-pill{
  border-color:rgba(203,190,255,.18);
  background:rgba(183,165,255,.07);
  color:rgba(238,234,255,.82);
}
body:not(.login-open) .role-picker>label{
  color:rgba(226,227,234,.52);
  font-size:10.5px;
  font-weight:800;
  letter-spacing:.105em;
  text-transform:uppercase;
}
body:not(.login-open) .role-tabs{
  padding:4px;
  border:1px solid rgba(255,255,255,.07);
  border-radius:15px;
  background:rgba(1,3,7,.22);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.018);
}
body:not(.login-open) .role-tab{
  min-height:40px;
  border-radius:11px;
  color:rgba(226,227,234,.60);
  font-weight:720;
}
body:not(.login-open) .role-tab:hover{color:#fff;background:rgba(255,255,255,.046);}
body:not(.login-open) .role-tab.active{
  color:#fff;
  border-color:rgba(203,190,255,.25);
  background:linear-gradient(145deg,rgba(124,58,237,.31),rgba(67,56,202,.16));
  box-shadow:0 12px 28px -22px rgba(124,58,237,.98),inset 0 1px 0 rgba(255,255,255,.055);
}
@media (min-width:960px){
  body:not(.login-open) .overview-panel{grid-template-columns:minmax(0,.82fr) minmax(440px,1.18fr);}
  body:not(.login-open) .overview-panel .badge-top{padding:32px 32px 29px;}
  body:not(.login-open) .overview-panel .role-picker{padding:28px 32px;border-left-color:rgba(255,255,255,.065);background:rgba(255,255,255,.012);}
  body:not(.login-open) .overview-panel .progress-wrap{padding:15px 30px 16px;}
}

/* V14-3: progress reads like a live operating rail with one obvious current step. */
body:not(.login-open) .progress-wrap{
  border-top:1px solid rgba(255,255,255,.055);
  background:linear-gradient(180deg,rgba(3,5,9,.12),rgba(3,5,9,.30));
}
body:not(.login-open) .progress-step{opacity:.48;}
body:not(.login-open) .progress-step.done{opacity:.62;}
body:not(.login-open) .progress-step.current{opacity:1;transform:none;}
body:not(.login-open) .progress-step .step-circle{
  border-color:rgba(255,255,255,.10);
  background:rgba(255,255,255,.025);
}
body:not(.login-open) .progress-step.current .step-circle{
  border-color:rgba(203,190,255,.42);
  background:linear-gradient(145deg,rgba(124,58,237,.95),rgba(67,56,202,.82));
  box-shadow:0 0 0 5px rgba(139,92,246,.11),0 12px 28px -18px rgba(124,58,237,.98);
}
body:not(.login-open) .progress-step.current .step-label{color:#fff;font-weight:800;}
body:not(.login-open) .progress-hint{
  margin-top:10px;
  padding:9px 12px;
  border:1px solid rgba(203,190,255,.09);
  border-radius:11px;
  background:rgba(183,165,255,.035);
  color:var(--v14-muted);
}

/* V14-4: filters become a full command shelf that visually connects overview and content. */
body:not(.login-open) .tools-bar{
  top:72px;
  width:100%;
  max-width:none;
  margin:24px 0 22px;
  padding:6px;
  border-color:rgba(255,255,255,.075);
  border-radius:16px;
  background:rgba(12,14,19,.86);
  box-shadow:0 18px 42px -34px rgba(0,0,0,.96),inset 0 1px 0 rgba(255,255,255,.02);
  backdrop-filter:blur(18px) saturate(125%);
  -webkit-backdrop-filter:blur(18px) saturate(125%);
}
body:not(.login-open) .filter-tabs{gap:4px;}
body:not(.login-open) .filter-chip{
  min-height:38px;
  padding-inline:14px;
  border-radius:11px;
  color:rgba(226,227,234,.61);
  font-weight:720;
}
body:not(.login-open) .filter-chip:hover{color:#fff;background:rgba(255,255,255,.045);}
body:not(.login-open) .filter-chip.active{
  color:#fff;
  border-color:rgba(203,190,255,.24);
  background:linear-gradient(145deg,rgba(124,58,237,.27),rgba(79,70,229,.14));
  box-shadow:0 10px 24px -20px rgba(124,58,237,.86),inset 0 1px 0 rgba(255,255,255,.045);
}

/* V14-5: license groups become purposeful work zones; preserve existing grid contracts. */
body:not(.login-open) .licenses{
  position:relative;
  margin-top:0;
  padding:20px;
  border:1px solid rgba(255,255,255,.067);
  border-radius:24px;
  background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(255,255,255,.009));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.016);
}
body:not(.login-open) .licenses.role-secondary{margin-top:22px;}
body:not(.login-open) .section-head{
  margin-bottom:15px;
  padding-bottom:13px;
  border-bottom:1px solid rgba(255,255,255,.055);
}
body:not(.login-open) .section-head h2{
  color:var(--v14-text);
  font-size:20px;
  font-weight:810;
  letter-spacing:-.035em;
}
body:not(.login-open) .section-head .count{
  color:var(--v14-muted);
  padding:4px 8px;
  border:1px solid rgba(255,255,255,.06);
  border-radius:999px;
  background:rgba(255,255,255,.025);
  font-size:11px;
}

/* V14-6: cards optimize scanning — identity first, state second, action always in the same visual lane. */
body:not(.login-open) .card{
  border-radius:20px;
  border-color:rgba(255,255,255,.078);
  background:
    linear-gradient(130deg,rgba(255,255,255,.025),transparent 34%),
    linear-gradient(165deg,rgba(27,31,40,.975),rgba(15,18,24,.965));
  box-shadow:var(--v14-shadow-card);
}
body:not(.login-open) .card::before{
  content:"";
  position:absolute;left:0;top:18px;bottom:18px;width:2px;
  border-radius:0 2px 2px 0;
  background:rgba(255,255,255,.09);
  pointer-events:none;
}
body:not(.login-open) .card[data-status="request"]::before,
body:not(.login-open) .card[data-status="approval"]::before{background:linear-gradient(180deg,var(--v14-brand),var(--v14-brand-strong));}
body:not(.login-open) .card[data-status="pending"]::before,
body:not(.login-open) .card[data-status="approved"]::before{background:var(--v14-info);}
body:not(.login-open) .card[data-status="completed"]::before,
body:not(.login-open) .card[data-status="auto"]::before{background:var(--v14-positive);}
body:not(.login-open) .card[data-status="rejected"]::before{background:var(--v14-danger);}
body:not(.login-open) .card:hover{
  transform:translateY(-2px);
  border-color:rgba(203,190,255,.21);
  box-shadow:var(--v14-shadow-active);
}
body:not(.login-open) .logo-chip{
  border-color:rgba(255,255,255,.075);
  background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.022));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
}
body:not(.login-open) .card-title{color:var(--v14-text);font-weight:800;letter-spacing:-.025em;}
body:not(.login-open) .card-cat{color:var(--v14-dim);}
body:not(.login-open) .card-owner{color:var(--v14-dim);}
body:not(.login-open) .card-owner b{color:rgba(236,237,242,.78);font-weight:700;}
body:not(.login-open) .card-bottom{gap:12px;}
body:not(.login-open) .card-status-group{gap:6px;}
body:not(.login-open) .status-pill{
  min-height:26px;
  padding-inline:9px;
  border-radius:999px;
  font-weight:760;
  letter-spacing:-.008em;
}
body:not(.login-open) .sla-pill,
body:not(.login-open) .sla-health{
  min-height:25px;
  display:inline-flex;align-items:center;
  color:rgba(226,227,234,.61);
}
body:not(.login-open) #roleGrid .cta{
  min-height:40px;
  min-width:92px;
  padding-inline:16px;
  border-radius:12px;
  background:linear-gradient(135deg,rgba(124,58,237,.99),rgba(67,56,202,.95));
  box-shadow:0 15px 32px -19px rgba(124,58,237,.98),inset 0 1px 0 rgba(255,255,255,.12);
  font-weight:800;
  letter-spacing:-.01em;
}
body:not(.login-open) #roleGrid .cta:hover{transform:translateY(-1px);filter:brightness(1.065);}

/* V14-7: execution surfaces use a consistent shell and anchored action zone. */
body:not(.login-open) .request-modal,
body:not(.login-open) .action-modal{
  border:1px solid rgba(255,255,255,.09);
  border-radius:22px;
  background:
    radial-gradient(76% 110% at 100% 0%,rgba(124,58,237,.11),transparent 62%),
    linear-gradient(165deg,rgba(28,31,40,.99),rgba(14,16,22,.99));
  box-shadow:0 36px 96px -54px rgba(0,0,0,.98),0 0 0 1px rgba(255,255,255,.02) inset;
}
body:not(.login-open) .modal-actions{
  border-top-color:rgba(255,255,255,.075);
  background:linear-gradient(180deg,rgba(20,23,30,.86),rgba(11,13,18,.995));
  box-shadow:0 -20px 42px -36px rgba(0,0,0,.98);
}
body:not(.login-open) .modal-actions .primary-btn,
body:not(.login-open) .modal-actions .btn-primary{
  border-radius:12px;
  background:linear-gradient(135deg,rgba(124,58,237,.99),rgba(67,56,202,.96));
  box-shadow:0 14px 30px -18px rgba(124,58,237,.96),inset 0 1px 0 rgba(255,255,255,.10);
}
body:not(.login-open) .drawer-head{
  border-bottom-color:rgba(255,255,255,.07);
  background:rgba(12,14,19,.965);
}
body:not(.login-open) .request-item{
  border-color:rgba(255,255,255,.075);
  background:rgba(255,255,255,.018);
}
body:not(.login-open) .request-item:hover{border-color:rgba(203,190,255,.17);background:rgba(183,165,255,.035);}
body:not(.login-open) .request-actions{gap:7px;border-top-color:rgba(255,255,255,.06);}
body:not(.login-open) .request-actions button{min-height:44px;border-radius:11px;font-weight:730;}

/* V14-8: empty/completion states keep context and feel intentional. */
body:not(.login-open) .empty-state{
  border-color:rgba(203,190,255,.16);
  border-radius:18px;
  background:
    radial-gradient(66% 130% at 50% -12%,rgba(124,58,237,.085),transparent 66%),
    rgba(255,255,255,.012);
  color:var(--v14-muted);
}
body:not(.login-open) .empty-state::before{
  border-color:rgba(203,190,255,.21);
  background:rgba(183,165,255,.065);
  color:rgba(220,211,255,.78);
}
body:not(.login-open) .complete-box.is-complete{
  border-color:rgba(134,239,172,.17);
  background:radial-gradient(70% 130% at 50% 0%,rgba(134,239,172,.075),transparent 64%),rgba(255,255,255,.012);
  box-shadow:0 24px 58px -42px rgba(34,197,94,.32);
}

/* V14-9: tablet/mobile prioritize actions without violating verified density contracts. */
@media (max-width:1024px) and (min-width:769px){
  body:not(.login-open) main{max-width:960px;}
  body:not(.login-open) .licenses{padding:18px;}
  body:not(.login-open) .tools-bar{top:68px;}
  body:not(.login-open) #commonGrid,
  body:not(.login-open) #roleGrid,
  body:not(.login-open) #roleGrid.balanced-four{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:768px){
  body:not(.login-open) main{padding-inline:14px;padding-top:22px;padding-bottom:64px;}
  body:not(.login-open) .top-actions{padding:2px;}
  body:not(.login-open) .overview-panel{border-radius:24px;}
  body:not(.login-open) .overview-panel .name-input{font-size:27px;}
  body:not(.login-open) .role-tabs{overflow-x:auto;scroll-snap-type:x proximity;scrollbar-width:none;}
  body:not(.login-open) .role-tabs::-webkit-scrollbar{display:none;}
  body:not(.login-open) .role-tab{flex:0 0 auto;scroll-snap-align:start;min-height:42px;}
  body:not(.login-open) .progress-bar{overflow-x:visible;justify-content:space-between;padding-bottom:0;}
  body:not(.login-open) .progress-step{flex:1 1 0;min-width:0;}
  body:not(.login-open) .progress-hint{justify-content:flex-start;}
  body:not(.login-open) .tools-bar{top:62px;overflow-x:auto;scrollbar-width:none;}
  body:not(.login-open) .tools-bar::-webkit-scrollbar{display:none;}
  body:not(.login-open) .filter-tabs{width:max-content;}
  body:not(.login-open) .licenses{padding:16px;border-radius:21px;}
  body:not(.login-open) .section-head{align-items:flex-start;flex-direction:column;gap:7px;}
  body:not(.login-open) .section-head .count{text-align:left;}
  body:not(.login-open) #roleGrid,
  body:not(.login-open) #roleGrid.balanced-four{grid-template-columns:1fr;}
  body:not(.login-open) #roleGrid .card{min-height:0;padding:18px 17px 15px;}
  body:not(.login-open) #roleGrid .card-bottom{align-items:stretch;flex-direction:column;}
  body:not(.login-open) #roleGrid .card-action{width:100%;}
  body:not(.login-open) #roleGrid .cta{width:100%;min-height:44px;}
  body:not(.login-open) .request-modal,
  body:not(.login-open) .action-modal{border-radius:19px;}
}
@media (min-width:360px) and (max-width:768px){
  body:not(.login-open) #commonGrid{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:359px){
  body:not(.login-open) #commonGrid{grid-template-columns:1fr;}
}
@media (max-width:560px){
  body:not(.login-open) .topbar{padding-block:10px;}
  body:not(.login-open) .overview-panel .badge-top{gap:12px;}
  body:not(.login-open) .overview-panel .name-input{font-size:25px;}
  body:not(.login-open) .licenses{padding:13px;border-radius:19px;}
  body:not(.login-open) .section-head{padding-bottom:11px;margin-bottom:12px;}
  body:not(.login-open) .section-head h2{font-size:19px;}
  body:not(.login-open) .filter-chip{min-height:40px;padding-inline:12px;}
}

/* V14-10: motion, focus, contrast and forced-colors remain first-class. */
body:not(.login-open) :where(.role-tab,.filter-chip,.cta,.request-actions button,.modal-actions button):focus-visible{
  outline:2px solid rgba(216,205,255,.92);
  outline-offset:2px;
  box-shadow:0 0 0 4px rgba(124,58,237,.16);
}
@media (hover:hover) and (pointer:fine){
  body:not(.login-open) .card,
  body:not(.login-open) .cta,
  body:not(.login-open) .filter-chip,
  body:not(.login-open) .role-tab,
  body:not(.login-open) .request-item{
    transition-property:transform,border-color,background-color,box-shadow,filter,color;
    transition-duration:165ms;
    transition-timing-function:var(--v14-ease);
  }
}
@media (prefers-reduced-motion:reduce){
  body:not(.login-open) .card,
  body:not(.login-open) .cta,
  body:not(.login-open) .filter-chip,
  body:not(.login-open) .role-tab,
  body:not(.login-open) .request-item{transition-duration:0s!important;}
  body:not(.login-open) .card:hover,
  body:not(.login-open) #roleGrid .cta:hover{transform:none;}
}
@media (forced-colors:active){
  body:not(.login-open) .licenses,
  body:not(.login-open) .card,
  body:not(.login-open) .status-pill,
  body:not(.login-open) .role-tab.active,
  body:not(.login-open) .filter-chip.active,
  body:not(.login-open) .request-modal,
  body:not(.login-open) .action-modal{border:1px solid CanvasText;}
  body:not(.login-open) .card::before{background:CanvasText;}
}
'''

path.write_text(css.rstrip() + block + '\n', encoding='utf-8')
print('appended v14 operational command center CSS')

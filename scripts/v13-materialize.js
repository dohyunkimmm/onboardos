'use strict';

const fs = require('fs');
const path = require('path');

const target = path.join(process.cwd(), 'experience-refinement.css');
const marker = 'ONBOARD·OS v13 candidate — product-grade visual system';
const current = fs.readFileSync(target, 'utf8');

if (current.includes(marker)) {
  console.log('v13 visual system already materialized; no change.');
  process.exit(0);
}

const css = String.raw`

/* ONBOARD·OS v13 candidate — product-grade visual system.
   Scope: post-login product composition, hierarchy, state legibility, and responsive ergonomics.
   Business logic, login baseline, P6 state machine, role isolation, and release provenance remain unchanged. */
:root{
  --v13-canvas:#0b0d12;
  --v13-surface:rgba(18,21,28,.94);
  --v13-surface-soft:rgba(255,255,255,.026);
  --v13-surface-raised:rgba(29,33,43,.97);
  --v13-line:rgba(255,255,255,.085);
  --v13-line-strong:rgba(199,187,255,.22);
  --v13-text:#f7f7fa;
  --v13-muted:rgba(224,225,232,.68);
  --v13-dim:rgba(224,225,232,.48);
  --v13-brand:#a78bfa;
  --v13-brand-strong:#8b5cf6;
  --v13-blue:#7dd3fc;
  --v13-green:#86efac;
  --v13-amber:#fde68a;
  --v13-red:#fda4af;
  --v13-radius-xl:24px;
  --v13-radius-lg:20px;
  --v13-radius-md:13px;
  --v13-shadow-panel:0 28px 74px -52px rgba(0,0,0,.96),0 1px 0 rgba(255,255,255,.035) inset;
  --v13-shadow-card:0 18px 46px -38px rgba(0,0,0,.96),0 1px 0 rgba(255,255,255,.025) inset;
  --v13-shadow-active:0 24px 58px -38px rgba(124,58,237,.48),0 1px 0 rgba(255,255,255,.04) inset;
  --v13-ease:cubic-bezier(.2,.72,.2,1);
}

/* V13-1: the post-login page reads as one product workspace. */
body:not(.login-open) .bg-atmosphere{
  background:
    radial-gradient(920px 620px at 12% -8%,rgba(99,102,241,.075),transparent 66%),
    radial-gradient(760px 560px at 92% 8%,rgba(168,85,247,.055),transparent 70%);
}
body:not(.login-open) main{
  max-width:1240px;
  padding-top:30px;
  padding-bottom:72px;
}
body:not(.login-open) .topbar{
  border-bottom:1px solid rgba(255,255,255,.055);
  background:linear-gradient(180deg,rgba(11,13,18,.92),rgba(11,13,18,.78));
  box-shadow:0 14px 36px -34px rgba(0,0,0,.94);
  backdrop-filter:blur(18px) saturate(118%);
  -webkit-backdrop-filter:blur(18px) saturate(118%);
}
body:not(.login-open) .topbar .logo{letter-spacing:-.045em;}
body:not(.login-open) .topbar .sub{color:var(--v13-dim);letter-spacing:-.01em;}
body:not(.login-open) #statusBtn{
  border-color:rgba(196,181,253,.32);
  background:linear-gradient(135deg,rgba(109,40,217,.92),rgba(79,70,229,.82));
  box-shadow:0 12px 30px -20px rgba(124,58,237,.92),inset 0 1px 0 rgba(255,255,255,.10);
}
body:not(.login-open) #adminBtn{
  border-color:rgba(255,255,255,.105);
  background:rgba(255,255,255,.045);
}

/* V13-2: identity and role selection become a deliberate workspace header. */
body:not(.login-open) .overview-panel{
  border-radius:24px;
  border-color:rgba(255,255,255,.09);
  background:
    radial-gradient(76% 130% at 92% -8%,rgba(139,92,246,.17),transparent 57%),
    radial-gradient(52% 96% at 0% 100%,rgba(14,165,233,.07),transparent 66%),
    linear-gradient(145deg,rgba(28,32,42,.985),rgba(13,15,21,.97));
  box-shadow:0 34px 82px -58px rgba(124,58,237,.54),var(--v13-shadow-panel);
}
body:not(.login-open) .overview-panel .badge-top{gap:17px;}
body:not(.login-open) .overview-panel .avatar{
  width:58px;height:58px;
  border:1px solid rgba(196,181,253,.22);
  background:linear-gradient(145deg,rgba(124,58,237,.34),rgba(59,130,246,.12));
  box-shadow:0 14px 32px -24px rgba(124,58,237,.9),inset 0 1px 0 rgba(255,255,255,.07);
}
body:not(.login-open) .overview-panel .badge-id label{
  color:rgba(216,205,255,.72);
  font-weight:720;
  letter-spacing:.035em;
}
body:not(.login-open) .overview-panel .name-input{
  color:var(--v13-text);
  font-size:32px;
  font-weight:790;
  letter-spacing:-.045em;
  line-height:1.08;
}
body:not(.login-open) .overview-panel .emp-meta{margin-top:8px;color:var(--v13-dim);}
body:not(.login-open) .role-meta-pill{
  margin-top:12px;
  border-color:rgba(196,181,253,.18);
  background:rgba(167,139,250,.065);
  color:rgba(230,225,255,.82);
}
body:not(.login-open) .role-picker>label{
  color:rgba(224,225,232,.56);
  font-size:11px;
  font-weight:760;
  letter-spacing:.075em;
  text-transform:uppercase;
}
body:not(.login-open) .role-tabs{
  padding:4px;
  border:1px solid rgba(255,255,255,.065);
  border-radius:14px;
  background:rgba(2,4,8,.18);
}
body:not(.login-open) .role-tab{
  min-height:38px;
  border-radius:10px;
  color:rgba(225,226,232,.62);
  font-weight:680;
}
body:not(.login-open) .role-tab:hover{color:#fff;background:rgba(255,255,255,.045);}
body:not(.login-open) .role-tab.active{
  color:#fff;
  border-color:rgba(196,181,253,.24);
  background:linear-gradient(145deg,rgba(124,58,237,.27),rgba(79,70,229,.15));
  box-shadow:0 10px 24px -20px rgba(124,58,237,.86),inset 0 1px 0 rgba(255,255,255,.055);
}
body:not(.login-open) .demo-preview-note{
  margin-top:12px;
  border-left-color:rgba(167,139,250,.34);
  background:rgba(167,139,250,.045);
  color:var(--v13-muted);
}
@media (min-width:960px){
  body:not(.login-open) .overview-panel{grid-template-columns:minmax(0,.9fr) minmax(430px,1.1fr);}
  body:not(.login-open) .overview-panel .badge-top{padding:34px 32px 31px;}
  body:not(.login-open) .overview-panel .role-picker{padding:30px 32px 28px;background:linear-gradient(180deg,rgba(255,255,255,.018),rgba(255,255,255,.006));}
}

/* V13-3: progress behaves like an operational rail with a clear current step. */
body:not(.login-open) .overview-panel .progress-wrap{
  border-top-color:rgba(255,255,255,.065);
  background:linear-gradient(180deg,rgba(4,6,10,.24),rgba(4,6,10,.38));
}
body:not(.login-open) .progress-step{color:var(--v13-dim);}
body:not(.login-open) .progress-step.done{opacity:.58;}
body:not(.login-open) .progress-step .step-circle{
  border-color:rgba(255,255,255,.11);
  background:rgba(255,255,255,.03);
  color:rgba(232,233,238,.64);
}
body:not(.login-open) .progress-step.done .step-circle{
  border-color:rgba(134,239,172,.18);
  background:rgba(134,239,172,.055);
  color:rgba(167,243,208,.74);
}
body:not(.login-open) .progress-step.current .step-circle{
  width:32px;height:32px;
  border-color:rgba(216,205,255,.52);
  background:linear-gradient(145deg,#8b5cf6,#4f46e5);
  box-shadow:0 0 0 5px rgba(139,92,246,.105),0 14px 30px -18px rgba(139,92,246,.95);
}
body:not(.login-open) .progress-step.current .step-label{color:#fff;font-weight:780;}
body:not(.login-open) .progress-hint{
  border-color:rgba(167,139,250,.12);
  background:linear-gradient(90deg,rgba(124,58,237,.075),rgba(79,70,229,.025));
  color:var(--v13-muted);
}

/* V13-4: status filtering is a full-width command surface, not a floating chip island. */
body:not(.login-open) .tools-bar{
  width:100%;
  margin:24px 0 22px;
  padding:6px;
  border-color:rgba(255,255,255,.075);
  border-radius:16px;
  background:rgba(12,14,19,.88);
  box-shadow:0 18px 46px -40px rgba(0,0,0,.98),inset 0 1px 0 rgba(255,255,255,.025);
}
body:not(.login-open) .filter-tabs{display:inline-flex;gap:4px;}
body:not(.login-open) .filter-chip{
  min-height:38px;
  padding-inline:15px;
  border-radius:11px;
  color:rgba(224,225,232,.60);
  font-weight:710;
}
body:not(.login-open) .filter-chip.active{
  color:#fff;
  border-color:rgba(196,181,253,.24);
  background:linear-gradient(140deg,rgba(124,58,237,.38),rgba(79,70,229,.22));
  box-shadow:0 12px 26px -22px rgba(124,58,237,.88),inset 0 1px 0 rgba(255,255,255,.055);
}

/* V13-5: license groups become coherent workspace sections. */
body:not(.login-open) .licenses{
  position:relative;
  padding:24px;
  border:1px solid rgba(255,255,255,.065);
  border-radius:24px;
  background:linear-gradient(160deg,rgba(255,255,255,.018),rgba(255,255,255,.007));
  box-shadow:0 24px 56px -50px rgba(0,0,0,.94),inset 0 1px 0 rgba(255,255,255,.018);
}
body:not(.login-open) .licenses.role-secondary{margin-top:20px;}
body:not(.login-open) .section-head{margin-bottom:17px;align-items:center;}
body:not(.login-open) .section-head h2{
  color:var(--v13-text);
  font-size:22px;
  font-weight:790;
  letter-spacing:-.035em;
}
body:not(.login-open) .section-head .count{
  padding:6px 9px;
  border:1px solid rgba(255,255,255,.07);
  border-radius:999px;
  background:rgba(255,255,255,.026);
  color:var(--v13-muted);
  font-size:10.5px;
  line-height:1.25;
}
body:not(.login-open) .card-grid{gap:12px;}

/* V13-6: common tools stay compact; role-specific work receives stronger action depth. */
body:not(.login-open) .card{
  border-color:rgba(255,255,255,.08);
  background:linear-gradient(165deg,rgba(29,33,42,.95),rgba(17,20,26,.94));
  box-shadow:var(--v13-shadow-card);
}
body:not(.login-open) .licenses.common-first .card{
  background:linear-gradient(165deg,rgba(26,29,37,.88),rgba(17,19,24,.90));
}
body:not(.login-open) #roleGrid .card{
  min-height:176px;
  padding:21px 20px 18px;
  border-radius:20px;
}
body:not(.login-open) .card:hover{
  transform:translateY(-2px);
  border-color:rgba(196,181,253,.21);
  box-shadow:var(--v13-shadow-active);
}
body:not(.login-open) .card:focus-within{
  border-color:rgba(196,181,253,.28);
  box-shadow:0 0 0 3px rgba(167,139,250,.11),var(--v13-shadow-active);
}
body:not(.login-open) .card-title{font-size:15.5px;font-weight:780;letter-spacing:-.022em;}
body:not(.login-open) #roleGrid .card-title{font-size:16.5px;}
body:not(.login-open) .card-cat{color:var(--v13-dim);}
body:not(.login-open) #roleGrid .card-owner{
  margin-bottom:14px;
  padding-bottom:14px;
  border-bottom-color:rgba(255,255,255,.065);
  color:var(--v13-dim);
}
body:not(.login-open) .logo-chip{
  border-color:rgba(255,255,255,.08);
  background:rgba(255,255,255,.038);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
}
body:not(.login-open) .status-pill{
  border-color:rgba(255,255,255,.11);
  background:rgba(255,255,255,.035);
  font-weight:740;
}
body:not(.login-open) .status-request,
body:not(.login-open) .status-approval{border-color:rgba(196,181,253,.20);background:rgba(139,92,246,.075);}
body:not(.login-open) .status-pending,
body:not(.login-open) .status-approved{border-color:rgba(125,211,252,.16);background:rgba(14,165,233,.055);}
body:not(.login-open) .status-rejected{border-color:rgba(253,164,175,.18);background:rgba(244,63,94,.055);}
body:not(.login-open) .status-completed,
body:not(.login-open) .status-auto{border-color:rgba(134,239,172,.15);background:rgba(34,197,94,.045);}
body:not(.login-open) .sla-pill,
body:not(.login-open) .sla-health{color:rgba(224,225,232,.62);}
body:not(.login-open) #roleGrid .cta{
  min-height:40px;
  min-width:94px;
  padding-inline:16px;
  border-radius:12px;
  background:linear-gradient(135deg,#7c3aed,#4f46e5);
  box-shadow:0 14px 30px -20px rgba(124,58,237,.95),inset 0 1px 0 rgba(255,255,255,.12);
}
body:not(.login-open) #roleGrid .cta:hover{filter:brightness(1.08);transform:translateY(-1px);}

/* V13-7: empty and completion states feel intentional rather than residual. */
body:not(.login-open) .empty-state{
  padding:46px 28px;
  border-color:rgba(196,181,253,.18);
  border-radius:20px;
  background:
    radial-gradient(70% 120% at 50% 0%,rgba(139,92,246,.09),transparent 68%),
    rgba(255,255,255,.012);
  color:var(--v13-muted);
}
body:not(.login-open) .empty-state::before{
  width:38px;height:38px;
  border-color:rgba(196,181,253,.22);
  background:rgba(167,139,250,.065);
  color:rgba(216,205,255,.78);
}
body:not(.login-open) .complete-box.is-complete{
  border-color:rgba(134,239,172,.18);
  background:radial-gradient(70% 130% at 50% 0%,rgba(34,197,94,.085),transparent 62%),rgba(255,255,255,.014);
  box-shadow:0 24px 58px -42px rgba(34,197,94,.30);
}

/* V13-8: execution surfaces share one elevated action language. */
body:not(.login-open) .request-modal,
body:not(.login-open) .action-modal{
  border-radius:26px;
  border-color:rgba(255,255,255,.10);
  background:
    radial-gradient(90% 70% at 100% 0%,rgba(139,92,246,.11),transparent 64%),
    linear-gradient(160deg,rgba(29,33,43,.99),rgba(15,17,23,.99));
  box-shadow:0 34px 90px -52px rgba(0,0,0,.98),inset 0 1px 0 rgba(255,255,255,.035);
}
body:not(.login-open) .request-modal h3,
body:not(.login-open) .action-modal h3{font-size:24px;font-weight:790;letter-spacing:-.035em;}
body:not(.login-open) .modal-actions{
  border-top-color:rgba(255,255,255,.075);
  background:linear-gradient(180deg,rgba(22,25,33,.88),rgba(13,15,20,.995));
}
body:not(.login-open) .drawer{
  border-left-color:rgba(255,255,255,.085);
  background:linear-gradient(180deg,rgba(21,24,32,.99),rgba(12,14,19,.995));
  box-shadow:-26px 0 70px -48px rgba(0,0,0,.98);
}
body:not(.login-open) .drawer-head{
  border-bottom-color:rgba(255,255,255,.075);
  background:rgba(15,18,24,.94);
}
body:not(.login-open) .admin-kpis{
  border-bottom:1px solid rgba(255,255,255,.055);
  background:rgba(15,18,24,.92);
  backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
}
body:not(.login-open) .request-item{
  border-color:rgba(255,255,255,.075);
  border-radius:16px;
  background:rgba(255,255,255,.022);
}
body:not(.login-open) .request-item:focus-within{
  border-color:rgba(196,181,253,.23);
  box-shadow:0 0 0 3px rgba(167,139,250,.10);
}
body:not(.login-open) .request-actions button{min-height:44px;border-radius:11px;font-weight:700;}

/* V13-9: preserve proven responsive density while simplifying the small-screen composition. */
@media (max-width:1024px) and (min-width:769px){
  body:not(.login-open) main{max-width:960px;padding-inline:20px;}
  body:not(.login-open) .licenses{padding:21px;}
  body:not(.login-open) #commonGrid,
  body:not(.login-open) #roleGrid,
  body:not(.login-open) #roleGrid.balanced-four{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:768px){
  body:not(.login-open) main{padding:20px 14px 56px;}
  body:not(.login-open) .overview-panel{border-radius:24px;}
  body:not(.login-open) .overview-panel .name-input{font-size:26px;}
  body:not(.login-open) .overview-panel .avatar{width:52px;height:52px;}
  body:not(.login-open) .role-tabs{padding:3px;}
  body:not(.login-open) .progress-bar{overflow-x:visible;justify-content:space-between;padding-bottom:0;}
  body:not(.login-open) .progress-step{flex:1 1 0;min-width:0;}
  body:not(.login-open) .progress-step.current .step-circle{width:30px;height:30px;}
  body:not(.login-open) .tools-bar{width:100%;margin-top:18px;overflow-x:auto;scrollbar-width:none;}
  body:not(.login-open) .tools-bar::-webkit-scrollbar{display:none;}
  body:not(.login-open) .filter-tabs{width:max-content;}
  body:not(.login-open) .licenses{padding:17px 14px;border-radius:20px;}
  body:not(.login-open) .licenses.role-secondary{margin-top:14px;}
  body:not(.login-open) .section-head{align-items:flex-start;flex-direction:column;gap:7px;margin-bottom:14px;}
  body:not(.login-open) .section-head .count{padding:0;border:0;background:transparent;text-align:left;}
  body:not(.login-open) .card-grid{gap:9px;}
  body:not(.login-open) #roleGrid,
  body:not(.login-open) #roleGrid.balanced-four{grid-template-columns:1fr;}
  body:not(.login-open) #roleGrid .card{min-height:0;padding:18px 17px 15px;border-radius:18px;}
  body:not(.login-open) #roleGrid .card-bottom{align-items:stretch;flex-direction:column;}
  body:not(.login-open) #roleGrid .card-action{width:100%;}
  body:not(.login-open) #roleGrid .cta{width:100%;min-height:44px;}
}
@media (min-width:360px) and (max-width:768px){
  body:not(.login-open) #commonGrid{grid-template-columns:repeat(2,minmax(0,1fr));}
}
@media (max-width:359px){
  body:not(.login-open) #commonGrid{grid-template-columns:1fr;}
}
@media (max-width:560px){
  body:not(.login-open) .topbar{padding-block:11px;}
  body:not(.login-open) .overview-panel .badge-top{gap:12px;}
  body:not(.login-open) .filter-chip{min-height:40px;padding-inline:12px;}
  body:not(.login-open) .section-head h2{font-size:20px;}
}

/* V13-10: motion and accessibility remain deliberate. */
@media (hover:hover) and (pointer:fine){
  body:not(.login-open) .card,
  body:not(.login-open) .cta,
  body:not(.login-open) .filter-chip,
  body:not(.login-open) .role-tab,
  body:not(.login-open) .request-item{
    transition-property:transform,border-color,background-color,box-shadow,filter,color;
    transition-duration:170ms;
    transition-timing-function:var(--v13-ease);
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
  body:not(.login-open) .filter-chip.active{border:1px solid CanvasText;}
}
`;

fs.writeFileSync(target, `${current.trimEnd()}${css}\n`, 'utf8');
console.log('Materialized v13 product-grade visual system into experience-refinement.css');

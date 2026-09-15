from pathlib import Path
import json
import re

version = '12.0.0'
tag = f'v{version}'
video = f'ONBOARD_OS_{tag}_P6_production_demo.mp4'

release_path = Path('release.json')
release = json.loads(release_path.read_text())
release['version'] = version
release['releaseClass'] = 'action-first-ui-ux-refinement'
release['scope'] = 'post-login-action-first-ui-ux-refinement'
for artifact in ['production-demo.html', 'README.md', f'RELEASE-{tag}.md']:
    if artifact not in release['syncedArtifacts']:
        release['syncedArtifacts'].append(artifact)
if video not in release['evidenceContract']['releaseAssets']:
    release['evidenceContract']['releaseAssets'].append(video)
release_path.write_text(json.dumps(release, ensure_ascii=False, indent=2) + '\n')

Path('version.txt').write_text(
    f'ONBOARD·OS {tag}\n'
    'P6 feature freeze\n'
    'canonicalVersionSource=release.json\n'
    'releaseChannel=production\n'
    'releaseClass=action-first-ui-ux-refinement\n'
    'scope=post-login-action-first-ui-ux-refinement\n'
    'freeze=P6\n'
    'businessFlowChanged=false\n'
    'securityContract=S1-S8\n'
    'uxContract=U1-U8\n'
    'designSystemContract=V1-V8\n'
    'designPolishContract=D1-D8\n'
    'experienceRefinementContract=E1-E8\n'
    'integrityManifest=integrity-assets.json\n'
)

demo_path = Path('production-demo.html')
demo_path.write_text(demo_path.read_text().replace('v1.7.0', tag))

css_path = Path('experience-refinement.css')
css_path.write_text(css_path.read_text().replace(
    '/* ONBOARD·OS v11 candidate — experience refinement.',
    '/* ONBOARD·OS v12 production — action-first experience refinement.'
))

readme_path = Path('README.md')
readme = readme_path.read_text()
current_block = (
    f'> **Portfolio release — {tag} / P6 Production verified.** '
    '제품 기능 범위와 사용자·관리자 Business Flow는 P6에서 그대로 동결하고, v12.0.0은 로그인 이후 경험을 action-first 구조로 고도화했습니다. '
    '현재 단계·다음 행동, 필터 command surface, 카드 scanability, semantic state cue, CTA hierarchy, 모바일 조작성과 WCAG AA 대비를 개선했으며 R/S/U/V/D/E 1–8 계약과 Production integrity/smoke를 유지합니다. '
    f'[GitHub Release {tag}](https://github.com/dohyunkimmm/onboardos/releases/tag/{tag}) · '
    '[Live Production](https://onboardos-rho.vercel.app/)'
)
readme, count = re.subn(r'> \*\*Portfolio release — .*?(?=\n\n> 포트폴리오용)', current_block, readme, count=1, flags=re.S)
if count != 1:
    raise SystemExit('README current release block not found exactly once')
readme = readme.replace('v1.7.0', tag)
readme = readme.replace('│   ├── demo-video-request.json\n', '')
readme = readme.replace('│       ├── release.yml\n│       └── demo-video.yml', '│       └── release.yml')
readme_path.write_text(readme)

changelog_path = Path('CHANGELOG.md')
changelog = changelog_path.read_text()
entry = f'''## {tag} — Action-first UI/UX refinement — 2026-09-16

P6에서 동결한 Business Flow와 상태 모델은 유지하면서, v11 후보로 Production 검증한 action-first UI/UX 레이어를 정식 v12 릴리즈 계약으로 승격했습니다. 현재 단계와 다음 행동의 우선순위, 카드 스캔성, semantic 상태 단서, CTA 계층, 모바일 조작성, focus-visible/reduced-motion/WCAG AA 대비를 정리했으며 JavaScript·data·request-state·role logic은 변경하지 않았습니다.

### Release/link synchronization
- `release.json`, `version.txt`, `package.json`, `package-lock.json`을 v12.0.0으로 동기화
- `production-demo.html`의 설명·ARIA·MP4 asset·GitHub Release 링크를 v12.0.0으로 동기화
- Release workflow가 canonical tag에서 36초 Production Demo를 녹화해 동일 immutable GitHub Release에 evidence와 함께 발행하도록 통합
- 기존 v1.7.0 전용 demo workflow/request 파일 제거
- release contract가 Production Demo와 README의 canonical 버전 링크 불일치를 자동으로 차단

### Preserved contracts
- P6 feature freeze / `businessFlowChanged: false`
- R1–R8 Resilience/Recovery
- S1–S8 Security/Failure-containment
- U1–U8 Interaction UX/Accessibility
- V1–V8 Visual System/Usability
- D1–D8 Design Polish/Responsive Hierarchy
- E1–E8 Experience Refinement

'''
if not changelog.startswith('# Changelog\n\n'):
    raise SystemExit('Unexpected CHANGELOG header')
if f'## {tag} —' not in changelog:
    changelog = '# Changelog\n\n' + entry + changelog[len('# Changelog\n\n'):]
changelog_path.write_text(changelog)

Path(f'RELEASE-{tag}.md').write_text(f'''# ONBOARD·OS {tag}

## Scope

v12.0.0 formalizes the action-first post-login UI/UX refinement already validated against the P6 business-flow freeze. No JavaScript business logic, catalog data, request-state machine, or role-isolation behavior is changed by the v12 experience layer.

## Experience changes

- Stronger current-step and next-action hierarchy
- Compact sticky filter command surface
- Faster license-card scanning with semantic state cues
- Clearer primary/secondary CTA hierarchy
- Mobile density and touch-target refinement
- WCAG AA text contrast, focus-visible, and reduced-motion preservation

## Release integrity

The release is created only for an exact Production-verified commit with a successful main E2E run. Required evidence assets and the version-aligned 36-second Production Demo are attached to the same immutable GitHub Release. Production source integrity and Desktop Chromium + iPhone WebKit smoke remain mandatory release gates.

## Canonical links

- Live Production: https://onboardos-rho.vercel.app/
- Production Demo: https://onboardos-rho.vercel.app/production-demo
- GitHub Release: https://github.com/dohyunkimmm/onboardos/releases/tag/{tag}
''')

record_path = Path('scripts/record-demo.mjs')
record = record_path.read_text()
old = "const webmPath = path.join(outputDir, 'ONBOARD_OS_v1.7.0_P6_production_demo.webm');"
new = "const webmName = process.env.DEMO_WEBM_NAME || 'ONBOARD_OS_current_P6_production_demo.webm';\nconst webmPath = path.join(outputDir, webmName);"
if old not in record:
    raise SystemExit('record-demo hardcoded output path not found')
record_path.write_text(record.replace(old, new))

contract_path = Path('scripts/release-contract.js')
contract = contract_path.read_text()
anchor = "  const versionMatch = versionText.match(/^ONBOARD·OS v(\\d+\\.\\d+\\.\\d+)$/m);"
checks = """  const expectedTag = `v${release.version}`;\n  const expectedVideo = `ONBOARD_OS_${expectedTag}_P6_production_demo.mp4`;\n  const productionDemo = fs.readFileSync('production-demo.html', 'utf8');\n  const readme = fs.readFileSync('README.md', 'utf8');\n  if(!productionDemo.includes(`releases/download/${expectedTag}/${expectedVideo}`)) fail(`production-demo.html video asset is not aligned to ${expectedTag}`);\n  if(!productionDemo.includes(`releases/tag/${expectedTag}`)) fail(`production-demo.html release link is not aligned to ${expectedTag}`);\n  if(!productionDemo.includes(`ONBOARD·OS ${expectedTag} 36초 Production Demo`)) fail(`production-demo.html accessible label is not aligned to ${expectedTag}`);\n  if(!readme.includes(`Portfolio release — ${expectedTag} / P6 Production verified.`)) fail(`README current release block is not aligned to ${expectedTag}`);\n  if(!readme.includes(`releases/tag/${expectedTag}`)) fail(`README current release link is not aligned to ${expectedTag}`);\n\n"""
if anchor not in contract:
    raise SystemExit('release-contract insertion anchor not found')
if 'production-demo.html video asset is not aligned' not in contract:
    contract = contract.replace(anchor, checks + anchor)
contract_path.write_text(contract)

workflow_path = Path('.github/workflows/release.yml')
workflow = workflow_path.read_text()
workflow = workflow.replace("  push:\n    branches: [main]\n    paths:\n      - .github/release-request.json\n", '')
setup_anchor = "      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0\n        with:\n          node-version: 22\n"
install = setup_anchor + "\n      - name: Install release/demo dependencies\n        run: npm ci\n\n      - name: Install Chromium for release demo\n        run: npx playwright install --with-deps chromium\n"
if setup_anchor not in workflow:
    raise SystemExit('release workflow setup-node anchor not found')
if 'Install release/demo dependencies' not in workflow:
    workflow = workflow.replace(setup_anchor, install)

create_anchor = '      - name: Create evidence-backed immutable release\n'
demo_step = """      - name: Record version-aligned Production demo
        id: demo
        shell: bash
        env:
          TAG: ${{ steps.request.outputs.tag }}
          DEMO_URL: https://onboardos-rho.vercel.app/
        run: |
          set -euo pipefail
          VERSION="${TAG#v}"
          VIDEO_NAME="ONBOARD_OS_v${VERSION}_P6_production_demo.mp4"
          WEBM_NAME="ONBOARD_OS_v${VERSION}_P6_production_demo.webm"
          DEMO_WEBM_NAME="$WEBM_NAME" node scripts/record-demo.mjs
          if ! command -v ffmpeg >/dev/null 2>&1; then
            sudo apt-get update
            sudo apt-get install -y ffmpeg
          fi
          ffmpeg -y -i "demo-output/${WEBM_NAME}" -t 36 -c:v libx264 -preset medium -crf 24 -pix_fmt yuv420p -movflags +faststart -an "demo-output/${VIDEO_NAME}"
          test -s "demo-output/${VIDEO_NAME}"
          DURATION="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "demo-output/${VIDEO_NAME}")"
          awk -v d="${DURATION}" 'BEGIN { exit !(d >= 35.9 && d <= 36.1) }'
          echo "video_name=$VIDEO_NAME" >> "$GITHUB_OUTPUT"

"""
if create_anchor not in workflow:
    raise SystemExit('release workflow create-release anchor not found')
if 'Record version-aligned Production demo' not in workflow:
    workflow = workflow.replace(create_anchor, demo_step + create_anchor)

env_anchor = '          NOTES_FILE: ${{ steps.request.outputs.notes_file }}\n'
if '          VIDEO_NAME:' not in workflow:
    if env_anchor not in workflow:
        raise SystemExit('release workflow env anchor not found')
    workflow = workflow.replace(env_anchor, env_anchor + '          VIDEO_NAME: ${{ steps.demo.outputs.video_name }}\n')
old_loop = '            for asset in verification-summary.json verification-summary.md asset-integrity.json resilience-summary.json security-summary.json ux-summary.json visual-system-summary.json; do'
new_loop = '            for asset in verification-summary.json verification-summary.md asset-integrity.json resilience-summary.json security-summary.json ux-summary.json visual-system-summary.json "$VIDEO_NAME"; do'
if old_loop not in workflow:
    raise SystemExit('release workflow existing-asset loop not found')
workflow = workflow.replace(old_loop, new_loop)
array_anchor = '            release-evidence/visual-system/visual-system-summary.json\n          )'
array_new = '            release-evidence/visual-system/visual-system-summary.json\n            "demo-output/${VIDEO_NAME}"\n          )'
if array_anchor not in workflow:
    raise SystemExit('release workflow asset-array anchor not found')
workflow = workflow.replace(array_anchor, array_new)
workflow_path.write_text(workflow)

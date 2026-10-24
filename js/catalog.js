'use strict';

let defaultCatalogRole = null;
const CATALOG_WORK_TYPES = {
  SL:'collaboration', NT:'collaboration', CF:'collaboration', JR:'collaboration', JSM:'support',
  CC:'design', FG:'design', FJ:'design', MZ:'design',
  GH:'development', JB:'development', AWS:'development', PM:'development', CP:'ai',
  SF:'data', DB:'data', GPT:'ai', PBI:'data', PX:'ai',
  HG:'documents', MO:'documents', MD:'documents', AD:'documents'
};

// Keep filtering separate from entitlement and request state.
function catalogItemMatches(item, status, options){
  if(!item) return false;
  const text = [item.name, item.cat, options.purpose || '', item.owner, item.audience].join(' ').toLocaleLowerCase();
  const words = String(options.query || '').trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const provided = item.status === 'auto';
  return (!options.statusGroup || options.statusGroup.has(status))
    && words.every(word => text.includes(word))
    && (!options.workType || CATALOG_WORK_TYPES[item.mono] === options.workType)
    && (!options.requirement || (options.requirement === 'provided' ? provided
      : !provided && options.requirement === (options.required ? 'required' : 'optional')));
}

function matchesCatalogFilters(item, status, group){
  return catalogItemMatches(item, status, {
    query: document.getElementById('toolSearch')?.value || '',
    workType: document.getElementById('workTypeFilter')?.value || '',
    requirement: document.getElementById('requirementFilter')?.value || '',
    purpose: item ? LICENSE_PURPOSES[item.mono] || '' : '',
    required: item ? requirementFor(item) === '필수' : false,
    statusGroup: group
  });
}

function sortCatalogGrids(){
  const byName = document.getElementById('catalogSort')?.value === 'name';
  for(const id of ['roleGrid', 'commonGrid']){
    const grid = document.getElementById(id);
    if(!grid) continue;
    const source = id === 'commonGrid' ? commonLicenses : roles[currentRole].cards;
    const rank = new Map(source.map((item, index) => [item.name, index]));
    const cards = [...grid.querySelectorAll('.card')];
    cards.sort((a,b) => {
      if(byName) return a.dataset.name.localeCompare(b.dataset.name, 'ko', {sensitivity:'base'});
      const ai = findLicenseByName(a.dataset.name), bi = findLicenseByName(b.dataset.name);
      const requiredRank = (requirementFor(ai)==='필수'?0:1) - (requirementFor(bi)==='필수'?0:1);
      return requiredRank || rank.get(ai.name) - rank.get(bi.name);
    });
    // Do not detach focused controls when a status update re-applies filters.
    if(cards.some((card,index) => grid.children[index] !== card)) grid.append(...cards);
  }
}

function syncCatalogUI(){
  if(defaultCatalogRole === null) defaultCatalogRole = currentRole;
  const count = document.querySelectorAll('#roleGrid .card:not(.is-hidden), #commonGrid .card:not(.is-hidden)').length;
  const result = document.getElementById('catalogResultCount');
  if(result) result.innerHTML = `검색 결과 <strong>${count}</strong>개`;
  const selected = document.getElementById('selectedCatalogFilters');
  if(!selected) return;
  const entries = [];
  if(currentRole !== defaultCatalogRole) entries.push(['role', '직군 · '+roles[currentRole].label]);
  for(const [id,label,key] of [['workTypeFilter','업무','workType'],['requirementFilter','구분','requirement']]){
    const input = document.getElementById(id);
    if(input?.value) entries.push([key, label+' · '+input.selectedOptions[0].textContent]);
  }
  if(selectedFilter !== 'all'){
    const chip = document.querySelector(`#filterTabs [data-filter="${selectedFilter}"]`);
    entries.push(['status', '상태 · '+chip.textContent]);
  }
  const query = document.getElementById('toolSearch')?.value.trim();
  if(query) entries.push(['query', '검색 · '+query]);
  selected.replaceChildren();
  selected.hidden = entries.length === 0;
  for(const [key,label] of entries){
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'catalog-selected-tag';
    button.dataset.catalogClear = key;
    button.setAttribute('aria-label', label+' 해제');
    const cross = document.createElement('span');
    cross.textContent = '×';
    cross.setAttribute('aria-hidden','true');
    button.append(document.createTextNode(label),cross);
    selected.append(button);
  }
}

function clearCatalogFilter(key){
  if(key === 'role'){
    setRole(defaultCatalogRole || 'office');
  } else if(key === 'status'){
    setFilter('all');
  } else {
    const id = {query:'toolSearch',workType:'workTypeFilter',requirement:'requirementFilter'}[key];
    const input = id && document.getElementById(id);
    if(input) input.value = '';
    applyFilters();
  }
}

function resetCatalogFilters(){
  for(const id of ['toolSearch','workTypeFilter','requirementFilter']) document.getElementById(id).value = '';
  document.getElementById('catalogSort').value = 'recommended';
  const common = document.getElementById('commonTools');
  if(common) common.open = true;
  if(typeof commonWasOpenBeforeSearch !== 'undefined') commonWasOpenBeforeSearch = null;
  selectedFilter = 'all';
  syncFilterUI();
  if(currentRole !== defaultCatalogRole) setRole(defaultCatalogRole || 'office');
  else applyFilters();
  saveSession();
}

for(const id of ['workTypeFilter','requirementFilter','catalogSort']){
  document.getElementById(id)?.addEventListener('change', () => {
    if(id !== 'catalogSort' && document.getElementById(id).value){
      const common = document.getElementById('commonTools');
      if(common) common.open = true;
    }
    applyFilters();
  });
}
document.addEventListener('click', event => {
  const clear = event.target.closest('[data-catalog-clear]');
  if(clear){
    clearCatalogFilter(clear.dataset.catalogClear);
    const control = document.getElementById({query:'toolSearch',workType:'workTypeFilter',requirement:'requirementFilter',role:'roleSelect',status:'filterTabs'}[clear.dataset.catalogClear]);
    (control?.querySelector('button') || control)?.focus();
  }
  if(event.target.closest('[data-action="reset-catalog-filters"]')) resetCatalogFilters();
});

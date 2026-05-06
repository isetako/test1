const TOTAL_POKEMON = 1025;

const STAT_LABELS = {
  hp:              'HP',
  attack:          'こうげき',
  defense:         'ぼうぎょ',
  'special-attack':  'とくこう',
  'special-defense': 'とくぼう',
  speed:           'すばやさ',
};

const app    = document.getElementById('app');
const hint   = document.getElementById('hint');
const card   = document.getElementById('card');
const loader = document.getElementById('loader');

let loading = false;

async function fetchRandom() {
  if (loading) return;
  loading = true;

  hint.classList.add('hidden');
  card.classList.add('hidden');
  loader.classList.remove('hidden');

  const id = Math.floor(Math.random() * TOTAL_POKEMON) + 1;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    render(data);
  } catch {
    hint.textContent = 'エラーが発生しました。もう一度クリックしてください。';
    hint.classList.remove('hidden');
  } finally {
    loader.classList.add('hidden');
    loading = false;
  }
}

function render(data) {
  document.getElementById('pokemonId').textContent =
    `#${String(data.id).padStart(4, '0')}`;

  const typesEl = document.getElementById('types');
  typesEl.innerHTML = data.types
    .map(t => `<span class="type-badge type-${t.type.name}">${t.type.name}</span>`)
    .join('');

  const artwork = data.sprites?.other?.['official-artwork']?.front_default;
  const sprite  = artwork || data.sprites?.front_default;
  const img = document.getElementById('sprite');
  img.src = sprite || '';
  img.alt = data.name;

  document.getElementById('pokemonName').textContent = data.name;

  const statsEl = document.getElementById('stats');
  statsEl.innerHTML = data.stats.map(s => {
    const label = STAT_LABELS[s.stat.name] || s.stat.name;
    const val   = s.base_stat;
    const pct   = Math.min(100, Math.round(val / 255 * 100));
    const color = statColor(val);
    return `
      <div class="stat-row">
        <span class="stat-name">${label}</span>
        <span class="stat-val">${val}</span>
        <div class="stat-bar-bg">
          <div class="stat-bar" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');

  const metaEl = document.getElementById('meta');
  metaEl.innerHTML = `
    <div class="meta-item">
      <span class="meta-val">${(data.height / 10).toFixed(1)} m</span>
      <span>たかさ</span>
    </div>
    <div class="meta-item">
      <span class="meta-val">${(data.weight / 10).toFixed(1)} kg</span>
      <span>おもさ</span>
    </div>
    <div class="meta-item">
      <span class="meta-val">${data.base_experience ?? '—'}</span>
      <span>基本EXP</span>
    </div>`;

  card.classList.remove('hidden');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = '';
}

function statColor(val) {
  if (val >= 150) return '#a78bfa';
  if (val >= 100) return '#34d399';
  if (val >= 60)  return '#60a5fa';
  return '#f87171';
}

app.addEventListener('click', fetchRandom);

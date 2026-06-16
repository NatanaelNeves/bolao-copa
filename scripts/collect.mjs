/* ============================================================
   Coletor automático de odds (roda no GitHub Actions, de hora em hora).
   Busca as fontes, monta a previsão POR FONTE de cada jogo ainda não
   iniciado e grava em data/snapshots.json. O app lê esse arquivo, então
   a coleta de closing odds e os dados do backtest acontecem sozinhos,
   sem depender de alguém abrir o site.

   Mantém os mesmos nomes, normalização e matemática do index.html para
   que as chaves dos jogos batam exatamente.
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));
const ARQ = RAIZ + "/data/snapshots.json";

const PIN_KEY = "CmX2KcMrXuFmNg6YFbmTxE0y9CIrOi0R";
const COMP_365 = 5930;
const ELO_PADRAO = 1620, BONUS_CASA = 80, RHO = -0.12;
const ANFITRIOES = new Set(["Estados Unidos", "México", "Canadá"]);

const ELO = {
  "Argentina": 2143, "Espanha": 2188, "França": 2086, "Inglaterra": 2103,
  "Brasil": 2046, "Portugal": 2034, "Holanda": 2050, "Alemanha": 1986,
  "Colômbia": 1996, "Uruguai": 1968, "Bélgica": 1965, "Itália": 1934,
  "Croácia": 1944, "Marrocos": 1925, "Japão": 1934, "Equador": 1916,
  "Noruega": 1880, "México": 1850, "Estados Unidos": 1838, "Suíça": 1843,
  "Dinamarca": 1846, "Áustria": 1832, "Senegal": 1812, "Irã": 1814,
  "Turquia": 1812, "Coreia do Sul": 1796, "Canadá": 1791, "Ucrânia": 1777,
  "Algéria": 1775, "Paraguai": 1771, "Polônia": 1770, "Sérvia": 1770,
  "Nigéria": 1770, "Costa do Marfim": 1769, "Austrália": 1762, "Egito": 1750,
  "Escócia": 1750, "Tunísia": 1742, "Grécia": 1740, "República Tcheca": 1740,
  "País de Gales": 1730, "Camarões": 1720, "Suécia": 1720, "Hungria": 1700,
  "Eslováquia": 1700, "Gana": 1700, "Panamá": 1700, "Venezuela": 1700,
  "Chile": 1700, "África do Sul": 1690, "Romênia": 1690, "Irlanda": 1690,
  "Uzbequistão": 1684, "Peru": 1680, "Mali": 1680, "Albânia": 1660,
  "Burkina Faso": 1650, "Jordânia": 1644, "Costa Rica": 1640, "Bolívia": 1640,
  "RD Congo": 1640, "Arábia Saudita": 1640, "Bósnia": 1640, "Catar": 1633,
  "Macedônia do Norte": 1620, "Iraque": 1620, "Jamaica": 1600, "Honduras": 1600,
  "Kosovo": 1600, "Cabo Verde": 1592, "Nova Zelândia": 1590,
  "Emirados Árabes": 1590, "Curaçao": 1560, "Haiti": 1540
};
const ALIAS = {
  "Spain": "Espanha", "France": "França", "England": "Inglaterra",
  "Brazil": "Brasil", "Netherlands": "Holanda", "Germany": "Alemanha",
  "Colombia": "Colômbia", "Uruguay": "Uruguai", "Belgium": "Bélgica",
  "Italy": "Itália", "Croatia": "Croácia", "Morocco": "Marrocos",
  "Japan": "Japão", "Ecuador": "Equador", "Norway": "Noruega",
  "Mexico": "México", "United States": "Estados Unidos", "USA": "Estados Unidos",
  "Switzerland": "Suíça", "Denmark": "Dinamarca", "Austria": "Áustria",
  "Iran": "Irã", "Turkey": "Turquia", "Turkiye": "Turquia", "Türkiye": "Turquia",
  "South Korea": "Coreia do Sul", "Korea Republic": "Coreia do Sul",
  "Canada": "Canadá", "Ukraine": "Ucrânia", "Algeria": "Algéria",
  "Paraguay": "Paraguai", "Poland": "Polônia", "Serbia": "Sérvia",
  "Nigeria": "Nigéria", "Ivory Coast": "Costa do Marfim", "Cote d'Ivoire": "Costa do Marfim",
  "Côte d'Ivoire": "Costa do Marfim",
  "Australia": "Austrália", "Egypt": "Egito", "Scotland": "Escócia",
  "Tunisia": "Tunísia", "Greece": "Grécia", "Czech Republic": "República Tcheca",
  "Czechia": "República Tcheca", "Cameroon": "Camarões", "Sweden": "Suécia",
  "Hungary": "Hungria", "Slovakia": "Eslováquia", "Ghana": "Gana",
  "Panama": "Panamá", "South Africa": "África do Sul", "Romania": "Romênia",
  "Republic of Ireland": "Irlanda", "Ireland": "Irlanda",
  "Uzbekistan": "Uzbequistão", "Albania": "Albânia",
  "Jordan": "Jordânia", "Bolivia": "Bolívia", "DR Congo": "RD Congo",
  "Congo DR": "RD Congo", "Saudi Arabia": "Arábia Saudita",
  "Bosnia and Herzegovina": "Bósnia", "Bosnia-Herzegovina": "Bósnia",
  "Bosnia & Herzegovina": "Bósnia", "Bosnia": "Bósnia",
  "Qatar": "Catar", "North Macedonia": "Macedônia do Norte", "Iraq": "Iraque",
  "Cape Verde": "Cabo Verde", "Cabo Verde Islands": "Cabo Verde",
  "New Zealand": "Nova Zelândia", "United Arab Emirates": "Emirados Árabes",
  "UAE": "Emirados Árabes", "Curacao": "Curaçao", "Wales": "País de Gales"
};
const FIFA_COD = {
  "Argentina": "arg", "Espanha": "esp", "França": "fra", "Inglaterra": "eng",
  "Brasil": "bra", "Portugal": "por", "Holanda": "ned", "Alemanha": "ger",
  "Colômbia": "col", "Uruguai": "uru", "Bélgica": "bel", "Itália": "ita",
  "Croácia": "cro", "Marrocos": "mar", "Japão": "jpn", "Equador": "ecu",
  "Noruega": "nor", "México": "mex", "Estados Unidos": "usa", "Suíça": "sui",
  "Dinamarca": "den", "Áustria": "aut", "Senegal": "sen", "Irã": "irn",
  "Turquia": "tur", "Coreia do Sul": "kor", "Canadá": "can", "Ucrânia": "ukr",
  "Algéria": "alg", "Paraguai": "par", "Polônia": "pol", "Sérvia": "srb",
  "Nigéria": "nga", "Costa do Marfim": "civ", "Austrália": "aus", "Egito": "egy",
  "Escócia": "sco", "Tunísia": "tun", "Grécia": "gre", "República Tcheca": "cze",
  "País de Gales": "wal", "Camarões": "cmr", "Suécia": "swe", "Hungria": "hun",
  "Eslováquia": "svk", "Gana": "gha", "Panamá": "pan", "Venezuela": "ven",
  "Chile": "chi", "África do Sul": "rsa", "Romênia": "rou", "Irlanda": "irl",
  "Uzbequistão": "uzb", "Peru": "per", "Mali": "mli", "Albânia": "alb",
  "Burkina Faso": "bfa", "Jordânia": "jor", "Costa Rica": "crc", "Bolívia": "bol",
  "RD Congo": "cod", "Arábia Saudita": "ksa", "Bósnia": "bih", "Catar": "qat",
  "Macedônia do Norte": "mkd", "Iraque": "irq", "Jamaica": "jam", "Honduras": "hon",
  "Kosovo": "kos", "Cabo Verde": "cpv", "Nova Zelândia": "nzl",
  "Emirados Árabes": "uae", "Curaçao": "cuw", "Haiti": "hai"
};

const NORM_IDX = {};
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "");
for (const pt of Object.keys(ELO)) NORM_IDX[norm(pt)] = pt;
for (const [k, v] of Object.entries(ALIAS)) NORM_IDX[norm(k)] = v;
const nomeBR = apiName => NORM_IDX[norm(apiName)] ?? apiName;
const chave = (a, b) => [norm(a), norm(b)].sort().join("|");
const chaveHist = (nA, nB, data) => chave(nA, nB) + "|" + new Date(data).toISOString().slice(0, 10);

/* ---- matemática (idêntica ao app) ---- */
function fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
function pois(k, l) { return Math.exp(-l) * Math.pow(l, k) / fact(k); }
function matrizPlacares(lA, lB) {
  const N = 8, M = []; let soma = 0;
  for (let i = 0; i < N; i++) { M[i] = []; for (let j = 0; j < N; j++) {
    let p = pois(i, lA) * pois(j, lB);
    if (i === 0 && j === 0) p *= 1 - lA * lB * RHO;
    else if (i === 0 && j === 1) p *= 1 + lA * RHO;
    else if (i === 1 && j === 0) p *= 1 + lB * RHO;
    else if (i === 1 && j === 1) p *= 1 - RHO;
    M[i][j] = p; soma += p;
  } }
  let pV = 0, pE = 0, pD = 0, pO25 = 0;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const p = M[i][j] / soma;
    if (i > j) pV += p; else if (i === j) pE += p; else pD += p;
    if (i + j > 2.5) pO25 += p;
  }
  return { lA, lB, pV, pE, pD, pO25 };
}
function lambdaDaLinha(k, pOver) {
  const alvo = Math.min(0.9, Math.max(0.1, pOver));
  let lo = 0.1, hi = 6.0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2; let cdf = 0;
    for (let t = 0; t <= k; t++) cdf += pois(t, mid);
    if (1 - cdf < alvo) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}
const pOver25DeLambda = l => 1 - Math.exp(-l) * (1 + l + l * l / 2);
function preverElo(nomeA, nomeB) {
  let eloA = ELO[nomeA] ?? ELO_PADRAO, eloB = ELO[nomeB] ?? ELO_PADRAO;
  if (ANFITRIOES.has(nomeA)) eloA += BONUS_CASA;
  if (ANFITRIOES.has(nomeB)) eloB += BONUS_CASA;
  const diff = (eloA - eloB) * 0.0045, mu = 2.5;
  return matrizPlacares(Math.max(0.25, (mu + diff) / 2), Math.max(0.25, (mu - diff) / 2));
}
function probAmericana(odds) {
  if (odds == null) return null;
  const o = typeof odds === "string" ? parseFloat(odds.replace("+", "")) : odds;
  if (!isFinite(o) || o === 0) return null;
  return o < 0 ? -o / (-o + 100) : 100 / (o + 100);
}
function lambdaTimePin(mercados) {
  if (!mercados?.length) return null;
  const ls = [];
  for (const t of mercados) {
    const linha = t.prices?.[0]?.points;
    if (linha == null || Math.abs(linha % 1) !== 0.5) continue;
    const po = probAmericana(t.prices.find(p => p.designation === "over")?.price);
    const pu = probAmericana(t.prices.find(p => p.designation === "under")?.price);
    if (po == null || pu == null) continue;
    ls.push(lambdaDaLinha(Math.floor(linha), po / (po + pu)));
  }
  return ls.length ? ls.reduce((s, x) => s + x, 0) / ls.length : null;
}

const fmtISO = d => d.toISOString().slice(0, 10).replace(/-/g, "");
const fmtBR = d => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
async function jget(url, opts) { const r = await fetch(url, opts); if (!r.ok) throw new Error(url.slice(0, 60) + " HTTP " + r.status); return r.json(); }
const log = (...a) => console.log(...a);

/* ---- fontes ---- */
async function buscarESPN(ini, fim) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fmtISO(ini)}-${fmtISO(fim)}&limit=200`;
  return (await jget(url)).events ?? [];
}
function oddsESPN(comp) {
  const o = comp.odds?.[0]; if (!o) return null;
  const pegar = n => n?.close?.odds ?? n?.open?.odds;
  const h = probAmericana(pegar(o.moneyline?.home) ?? o.homeTeamOdds?.moneyLine);
  const d = probAmericana(pegar(o.moneyline?.draw) ?? o.drawOdds?.moneyLine);
  const a = probAmericana(pegar(o.moneyline?.away) ?? o.awayTeamOdds?.moneyLine);
  if (h == null || d == null || a == null) return null;
  const s = h + d + a;
  const f = { tipo: "dk", wdl: [h / s, d / s, a / s], pOver: null, lamA: null, lamB: null };
  const po = probAmericana(pegar(o.total?.over)), pu = probAmericana(pegar(o.total?.under));
  if (po != null && pu != null && (o.overUnder ?? 2.5) === 2.5) f.pOver = po / (po + pu);
  return f;
}
async function buscarPinnacle() {
  const cfg = { headers: { "X-API-Key": PIN_KEY } };
  const jogos = (await jget("https://guest.api.arcadia.pinnacle.com/0.1/sports/29/matchups?withSpecials=false", cfg))
    .filter(m => m.league?.name === "FIFA - World Cup" && m.participants?.length >= 2);
  if (!jogos.length) return {};
  const ligas = [...new Set(jogos.map(j => j.league.id))];
  const mercados = [];
  for (const id of ligas) {
    try { mercados.push(...await jget(`https://guest.api.arcadia.pinnacle.com/0.1/leagues/${id}/markets/straight`, cfg)); } catch (_) {}
  }
  const porJogo = {};
  for (const mk of mercados) {
    if (mk.period !== 0) continue;
    const s = porJogo[mk.matchupId] ?? (porJogo[mk.matchupId] = { totais: [], tt: { home: [], away: [] } });
    if (mk.type === "moneyline") s.ml = mk.prices;
    else if (mk.type === "total") s.totais.push(mk);
    else if (mk.type === "team_total" && s.tt[mk.side]) s.tt[mk.side].push(mk);
  }
  const idx = {};
  for (const j of jogos) {
    const home = j.participants.find(p => p.alignment === "home") ?? j.participants[0];
    const away = j.participants.find(p => p.alignment === "away") ?? j.participants[1];
    const d = porJogo[j.id]; if (!d?.ml) continue;
    const h = probAmericana(d.ml.find(p => p.designation === "home")?.price);
    const dr = probAmericana(d.ml.find(p => p.designation === "draw")?.price);
    const a = probAmericana(d.ml.find(p => p.designation === "away")?.price);
    if (h == null || dr == null || a == null) continue;
    const s = h + dr + a;
    const f = { tipo: "pinnacle", wdl: [h / s, dr / s, a / s], pOver: null, lamA: null, lamB: null };
    const lc = lambdaTimePin(d.tt.home), lf = lambdaTimePin(d.tt.away);
    if (lc != null && lf != null) { f.lamA = lc; f.lamB = lf; }
    const meias = d.totais.filter(t => t.points != null && Math.abs(t.points % 1) === 0.5 && t.prices?.length >= 2)
      .sort((x, y) => Math.abs(x.points - 2.5) - Math.abs(y.points - 2.5));
    if (meias.length) {
      const t = meias[0];
      const po = probAmericana(t.prices.find(p => p.designation === "over")?.price);
      const pu = probAmericana(t.prices.find(p => p.designation === "under")?.price);
      if (po != null && pu != null) f.pOver = pOver25DeLambda(lambdaDaLinha(Math.floor(t.points), po / (po + pu)));
    }
    idx[chave(nomeBR(home.name), nomeBR(away.name))] = f;
  }
  return idx;
}
async function buscarPolymarket(jogosPre) {
  const idx = {};
  for (const j of jogosPre) {
    const ca = FIFA_COD[j.nA], cb = FIFA_COD[j.nB]; if (!ca || !cb) continue;
    const dataET = new Date(j.data).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
    try {
      const ev = (await jget(`https://gamma-api.polymarket.com/events?slug=fifwc-${ca}-${cb}-${dataET}`))[0];
      if (!ev?.markets) continue;
      let pH = null, pD = null, pA = null;
      for (const mk of ev.markets) {
        const preco = parseFloat(JSON.parse(mk.outcomePrices ?? "[]")[0]); if (!isFinite(preco)) continue;
        const q = mk.question ?? "";
        if (/draw|empate/i.test(q)) { pD = preco; continue; }
        if (!/win/i.test(q)) continue;
        const time = timeDaPergunta(q);
        if (time === j.nA) pH = preco; else if (time === j.nB) pA = preco;
      }
      if (pH == null || pD == null || pA == null) continue;
      const s = pH + pD + pA;
      idx[chave(j.nA, j.nB)] = { tipo: "poly", wdl: [pH / s, pD / s, pA / s], pOver: null, lamA: null, lamB: null };
    } catch (_) {}
  }
  return idx;
}
function timeDaPergunta(q) {
  const cands = [...Object.keys(ALIAS), ...Object.keys(ELO)].sort((a, b) => b.length - a.length);
  const qn = norm(q);
  for (const c of cands) if (qn.includes(norm(c))) return nomeBR(c);
  return null;
}
async function buscar365(ini, fim) {
  const url = `https://webws.365scores.com/web/games/?appTypeId=5&langId=1&timezoneName=America/Sao_Paulo&competitions=${COMP_365}&startDate=${fmtBR(ini)}&endDate=${fmtBR(fim)}`;
  const jogos = (await jget(url)).games ?? [];
  const pend = jogos.filter(g => g.statusGroup === 2 || /scheduled|agendado/i.test(g.statusText ?? "")).slice(0, 24);
  const idx = {};
  for (const g of pend) {
    try {
      const d = await jget(`https://webws.365scores.com/web/game/?appTypeId=5&langId=1&gameId=${g.id}`);
      const preds = d.game?.promotedPredictions?.predictions ?? [];
      const www = preds.find(p => p.type === 1 && p.options?.length === 3);
      if (!www) continue;
      const v = www.options.map(op => op.vote?.percentage ?? 0), s = v[0] + v[1] + v[2];
      if (s <= 0) continue;
      const f = { tipo: "torcida", wdl: [v[0] / s, v[1] / s, v[2] / s], pOver: null, lamA: null, lamB: null };
      const tot = preds.find(p => p.type === 3 && (p.title ?? "").includes("2.5"));
      if (tot) {
        const ov = tot.options.find(o => /over/i.test(o.name)), un = tot.options.find(o => /under/i.test(o.name));
        if (ov && un) { const po = ov.vote?.percentage ?? 0, pu = un.vote?.percentage ?? 0; if (po + pu > 0) f.pOver = po / (po + pu); }
      }
      idx[chave(nomeBR(g.homeCompetitor.name), nomeBR(g.awayCompetitor.name))] = f;
    } catch (_) {}
  }
  return idx;
}
async function buscarOddsApi(jogosPre) {
  const key = process.env.ODDS_API_KEY; if (!key) return {};
  const eventos = await jget("https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/" +
    `?apiKey=${encodeURIComponent(key)}&regions=eu&markets=h2h,totals&oddsFormat=decimal`);
  const idx = {};
  for (const ev of eventos) {
    let sH = 0, sD = 0, sA = 0, n = 0, sOver = 0, nOver = 0;
    for (const bm of ev.bookmakers ?? []) {
      if (bm.key === "pinnacle" || bm.key === "draftkings") continue;
      for (const mk of bm.markets ?? []) {
        if (mk.key === "h2h") {
          const oH = mk.outcomes.find(o => o.name === ev.home_team)?.price;
          const oD = mk.outcomes.find(o => o.name === "Draw")?.price;
          const oA = mk.outcomes.find(o => o.name === ev.away_team)?.price;
          if (oH > 1 && oD > 1 && oA > 1) { const h = 1 / oH, d = 1 / oD, a = 1 / oA, s = h + d + a; sH += h / s; sD += d / s; sA += a / s; n++; }
        } else if (mk.key === "totals") {
          const ov = mk.outcomes.find(o => o.name === "Over" && o.point === 2.5)?.price;
          const un = mk.outcomes.find(o => o.name === "Under" && o.point === 2.5)?.price;
          if (ov > 1 && un > 1) { sOver += (1 / ov) / (1 / ov + 1 / un); nOver++; }
        }
      }
    }
    if (!n) continue;
    const f = { tipo: "multi", wdl: [sH / n, sD / n, sA / n], pOver: nOver ? sOver / nOver : null, lamA: null, lamB: null };
    idx[chave(nomeBR(ev.home_team), nomeBR(ev.away_team))] = f;
  }
  return idx;
}

async function main() {
  const hoje = new Date(), fim = new Date(hoje.getTime() + 14 * 864e5);
  const inicio = new Date("2026-06-11T00:00:00");

  const espn = await buscarESPN(inicio, fim);
  const pre = espn.filter(ev => ev.status?.type?.state === "pre").map(ev => {
    const comp = ev.competitions[0];
    const home = comp.competitors.find(c => c.homeAway === "home");
    const away = comp.competitors.find(c => c.homeAway === "away");
    return { nA: nomeBR(home.team.displayName), nB: nomeBR(away.team.displayName), data: ev.date, comp };
  });
  log(`ESPN: ${espn.length} jogos, ${pre.length} ainda não iniciados`);

  const [pin, multi, poly, torcida] = await Promise.all([
    buscarPinnacle().catch(e => (log("Pinnacle falhou:", e.message), {})),
    buscarOddsApi(pre).catch(e => (log("OddsAPI falhou:", e.message), {})),
    buscarPolymarket(pre).catch(e => (log("Polymarket falhou:", e.message), {})),
    buscar365(hoje, fim).catch(e => (log("365 falhou:", e.message), {}))
  ]);
  log(`fontes: Pinnacle ${Object.keys(pin).length} · multi ${Object.keys(multi).length} · poly ${Object.keys(poly).length} · torcida ${Object.keys(torcida).length}`);

  let hist = {};
  try { hist = JSON.parse(readFileSync(ARQ, "utf8")); } catch (_) { log("snapshots.json novo"); }

  let gravados = 0;
  for (const p of pre) {
    const k = chave(p.nA, p.nB);
    const elo = preverElo(p.nA, p.nB);
    const fontes = [{ tipo: "elo", wdl: [elo.pV, elo.pE, elo.pD], pOver: elo.pO25, lamA: null, lamB: null }];
    for (const src of [pin[k], oddsESPN(p.comp), multi[k], poly[k], torcida[k]]) if (src) fontes.push(src);
    if (fontes.length < 2) continue; // só Elo não vale snapshot
    hist[chaveHist(p.nA, p.nB, p.data)] = { nA: p.nA, nB: p.nB, data: p.data, fontes, atualizado: new Date().toISOString() };
    gravados++;
  }

  mkdirSync(dirname(ARQ), { recursive: true });
  writeFileSync(ARQ, JSON.stringify(hist, null, 0));
  log(`✅ ${gravados} jogos atualizados · ${Object.keys(hist).length} no total → data/snapshots.json`);
}

main().catch(e => { console.error("ERRO:", e); process.exit(1); });

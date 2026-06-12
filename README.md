# ⚽ Bolão da Copa 2026 — Previsor de Placares Multi-Fonte

App web que sugere o placar mais provável de cada jogo da Copa do Mundo 2026, cruzando **5 fontes independentes**:

| Fonte | O que entrega | Peso |
|---|---|---|
| 💹 Pinnacle | Odds da casa de apostas de referência do mercado | 3,0 |
| 🏦 DraftKings (via ESPN) | Odds de moneyline e over/under 2,5 | 2,5 |
| 📊 Polymarket | Mercado de previsões com dinheiro real | 2,0 |
| 👥 365Scores | Enquete de palpites da torcida (dezenas de milhares de votos por jogo) | 1,5 |
| 📈 Modelo Elo | Ratings de seleções (eloratings.net) + Poisson | 1,5 |

A média ponderada das probabilidades de vitória/empate/derrota e de gols esperados alimenta uma
**distribuição de Poisson com correção Dixon-Coles**, que gera a matriz de placares exatos. De lá saem:

- 🏆 **Melhor palpite pro bolão** — maximiza os pontos esperados segundo as regras configuráveis
  do seu bolão (pontos base dinâmicos pela probabilidade, em que zebra vale mais, + bônus por
  cravar o placar, gols do vencedor, diferença de gols e gols do perdedor)
- 🎯 **Placar mais provável** (máximo estatístico da matriz)
- 🔥 **Palpite quente** (gols esperados arredondados — o estilo dos sites de previsão)
- Probabilidades de vitória/empate/derrota, +2,5 gols e "ambos marcam"
- Ranking de palpites por pontos esperados em cada jogo

## Como usar

É um único `index.html` estático — sem build, sem backend, sem chave de API.

- **Online**: hospede em qualquer lugar (GitHub Pages, Vercel, Netlify…)
- **Local**: abra o `index.html` no navegador

Os jogos dos próximos 14 dias carregam automaticamente e a página se atualiza a cada 5 minutos.
Se alguma fonte sair do ar, o app segue com as demais (a barrinha no topo mostra o status de cada uma).
A aba **Simular partida** funciona offline com ~75 seleções, para mata-mata e cenários hipotéticos.

## Calibrando

No topo do `index.html`:

- `ELO` — ratings das seleções (edite se discordar do modelo)
- `PESO_*` — peso de cada fonte no consenso
- `RHO` — intensidade da correção Dixon-Coles para placares baixos

---

*Probabilidades são estimativas estatísticas — o palpite final é seu. Boa sorte no bolão! 🍀*

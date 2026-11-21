# LinkedIn post: draft for Emna to review and publish

**Format:** document post. Upload `ClimaRisk_Tunisie_carousel.pdf` (7 pages, 1080×1350), or the seven `slide_*.png` files as an image post. Put the links in the first comment rather than in the post body.

**Before posting:** check each figure against `outputs/kpis.json`, keep the word "synthetic", and be ready to explain every step in your own words (the method, the PD and EL logic, the NGFS limits). If you mention how the project was built, say so plainly.

---

When the climate shifts, credit risk shifts with it.

I built ClimaRisk Tunisia, an open-source study that links every loan in a bank portfolio to the ground it stands on, and measures how extreme heat, drought, floods and wildfire change its risk.

The idea is simple: turn satellite and climate pixels into indicators a risk committee can read.

How it works
→ 2,000 synthetic loans placed across Tunisia's 24 governorates, where people live, farm and do business
→ four hazards measured at each location, today, in 2030 and in 2050, with five CMIP6 climate models (NASA), WRI Aqueduct flood maps and ESA WorldCover land cover
→ hazard, exposure and sector vulnerability combined into a score that adjusts each loan's probability of default and expected loss
→ results aggregated by sector, governorate and scenario, with the spread across climate models

What the results show (SSP5-8.5, 2050)
• the share of the loan book in a high-hazard zone rises from 1.5 % to 22.4 %
• expected loss rises by TND 4.8 million compared with today's climate
• rain-fed cereals and olives are hit hardest, with El Kef, Siliana and Zaghouan in the lead

Three things I learned
1. The credit assumption (how strongly hazard moves the probability of default) matters far more than the choice of climate model. It is the first thing to calibrate on real data.
2. Two respected drought indicators can point to opposite regions. The right one depends on what is being financed.
3. The GDP-damage function in NGFS Phase V relies on a retracted paper, so I left it out.

The portfolio is 100 % synthetic, with no client data. The figures illustrate the method and describe no real bank.

The website tells the story on a single map, from the question to the method and the results. The working paper and the code are open.

I would value feedback from people working in credit risk and sustainable finance.

#ClimateRisk #CreditRisk #Geoinformatics #SustainableFinance #Tunisia #DataScience

---

## First comment

🌍 Website: https://emna-saada.github.io/climarisk-tunisia/
📄 Working paper (PDF): https://emna-saada.github.io/climarisk-tunisia/downloads/report.pdf
💻 Code (MIT): https://github.com/emna-saada/climarisk-tunisia
🎬 3-minute video: https://emna-saada.github.io/climarisk-tunisia/downloads/climarisk_demo.mp4

## Alt text for the slides

1. Three maps of Tunisia showing 2,000 synthetic loans coloured by composite climate hazard score: current climate, SSP2-4.5 in 2050 and SSP5-8.5 in 2050; scores rise across the north and centre.
2. The four-step method: synthetic portfolio, hazard measurement, sector vulnerability, and credit translation into probability of default and expected loss.
3. Key result: the share of the loan book in a high-hazard zone rises from 1.5 % today to 22.4 % in 2050 under SSP5-8.5; expected loss rises by TND 4.8 million versus today.
4. Two maps of days per year above 35 °C, 2010–2014 versus SSP5-8.5 in 2050; the hot zone spreads from the south into the centre.
5. Extra expected loss by sector, led by cereals (84 bp) and olives (71 bp), with a sector-by-hazard heatmap.
6. Screenshots of the results website: the scroll-driven map story and the interactive results.
7. Lessons learned and limits, with the project's tools: Python, CMIP6, NGFS, geoinformatics, credit risk.

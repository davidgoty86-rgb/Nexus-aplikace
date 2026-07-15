    const APP_VERSION = 'V44SCORING';
    const $ = id => document.getElementById(id);
    function todayKey() { return new Date().toLocaleDateString('cs-CZ'); }
    const histKey = `o2SalesCockpit${APP_VERSION}History`;
    const stateKey = `o2SalesCockpit${APP_VERSION}State`;
    const notesKey = `o2SalesCockpit${APP_VERSION}Notes`;
    const configKey = `o2SalesCockpit${APP_VERSION}Config`;
    const clearGuardKey = `o2SalesCockpit${APP_VERSION}ClearGuard`;
    const voiceSettingsKey = `o2SalesCockpit${APP_VERSION}VoiceSettings`;
    const appPassword = 'Ústí';
    let isUnlocked = false;

    function esc(v) {
      return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function unlockApp() {
      const input = $('lockInput');
      const msg = $('lockMsg');
      if (!input || !msg) return;
      const typed = String(input.value || '').trim();
      if (typed === appPassword) {
        performUnlock('Aplikace odemčena');
      } else {
        msg.textContent = 'Nesprávné heslo.';
        input.select();
      }
    }



    // ── EDUKAČNÍ OVERLAY ─────────────────────────────────────────────────
    let eduChapCur = 1;
    const EDU_TOTAL = 8;
    const EDU_TITLES = [
      'První dojem a otevření hovoru',
      'Naslouchání jako základ prodeje',
      'Jak nabízet bez vnucování',
      'Práce s námitkami',
      'Emoce a naštvaný zákazník',
      'Jak uzavřít hovor',
      'Reklamace a náročné situace',
      'Péče o sebe'
    ];
    function openEduModal() {
      const m = document.getElementById('eduModal');
      if (!m) return;
      m.classList.add('open');
      const dotsEl = document.getElementById('eduDots');
      if (dotsEl && !dotsEl.children.length) {
        for (let i = 1; i <= EDU_TOTAL; i++) {
          const d = document.createElement('div');
          d.className = 'edu-dot';
          d.title = EDU_TITLES[i-1];
          d.onclick = () => goEduChap(i);
          dotsEl.appendChild(d);
        }
      }
      goEduChap(eduChapCur);
    }
    function closeEduModal() {
      const m = document.getElementById('eduModal');
      if (m) m.classList.remove('open');
    }
    function goEduChap(n) {
      eduChapCur = Math.max(1, Math.min(EDU_TOTAL, n));
      document.querySelectorAll('.edu-nav-item').forEach((el, i) => {
        el.classList.remove('active','done');
        if (i+1 === eduChapCur) el.classList.add('active');
        else if (i+1 < eduChapCur) el.classList.add('done');
        const num = el.querySelector('.edu-nav-num');
        if (num) num.textContent = (i+1 < eduChapCur) ? '✓' : String(i+1);
      });
      document.querySelectorAll('.edu-chap').forEach((el,i) => el.classList.toggle('active', i+1 === eduChapCur));
      document.querySelectorAll('.edu-dot').forEach((el,i) => {
        el.classList.remove('active','done');
        if (i+1 === eduChapCur) el.classList.add('active');
        else if (i+1 < eduChapCur) el.classList.add('done');
      });
      const lbl = document.getElementById('eduTopLabel');
      const ttl = document.getElementById('eduTopTitle');
      if (lbl) lbl.textContent = 'Kapitola ' + eduChapCur + ' z ' + EDU_TOTAL;
      if (ttl) ttl.textContent = EDU_TITLES[eduChapCur-1];
      const prev = document.getElementById('eduPrev');
      const next = document.getElementById('eduNext');
      if (prev) prev.disabled = eduChapCur <= 1;
      if (next) { next.disabled = false; next.innerHTML = eduChapCur === EDU_TOTAL ? '&#10003; Dokončeno' : 'Další <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9,18 15,12 9,6"/></svg>'; }
      const body = document.getElementById('eduBody');
      if (body) body.scrollTop = 0;
    }
    document.addEventListener('keydown', e => {
      const m = document.getElementById('eduModal');
      if (!m || !m.classList.contains('open')) return;
      if (e.key === 'Escape') { closeEduModal(); return; }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goEduChap(eduChapCur+1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   goEduChap(eduChapCur-1);
    });
    document.addEventListener('click', e => {
      if (e.target.closest('[data-action="open-edu"]')) openEduModal();
    });
    // ── /EDUKAČNÍ OVERLAY ────────────────────────────────────────────────

    // Skrytý bypass pro administrátora — trojklik na písmeno „C" ve slově Copilot
    // v hlavičce lock screenu. Vizuálně identické okolí, žádný cursor/underline navíc,
    // aby to nezvaný uživatel nedetekoval.
    function performUnlock(msg) {
      isUnlocked = true;
      document.body.classList.remove('locked');
      const inp = $('lockInput'); if (inp) inp.value = '';
      const m = $('lockMsg'); if (m) m.textContent = '';
      const lockScreen = $('lockScreen');
      if (lockScreen) lockScreen.style.display = 'none';
      if (msg && typeof toast === 'function') toast(msg);
    }

    (function wireLockBypass() {
      const c = document.getElementById('lockBypass');
      if (!c) return;
      let clicks = 0, timer = null;
      c.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clicks++;
        clearTimeout(timer);
        timer = setTimeout(() => { clicks = 0; }, 1200);
        if (clicks >= 2) {
          clicks = 0;
          clearTimeout(timer);
          performUnlock('');
        }
      });
    })();

    function downloadText(filename, text, type = 'text/plain') {
      const blob = new Blob([text], { type });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    }

    function block(id, cls, title) {
      return { id, cls, title };
    }

    const defaultCards = {
      situace: { title: '1. Úvod hovoru', small: 'Reakce zákazníka', sentence: '', requiredTitle: '', hint: '' },
      reseni: { title: '2. Ošetření situace', small: 'Ošetření situace', sentence: 'Ošetři situaci zákazníka tak, aby hovor mohl pokračovat správným směrem.', requiredTitle: 'Důvod / stav a most dál', confirmText: 'Situace vyřešena / ošetřena', hint: 'Pro pokračování dál je nutné vybrat levý (důvod/stav) i pravý sloupec (směr řešení).' },
      profilace: { title: '3. Najdi důvod ke koupi', small: 'Profilace', sentence: 'Cíl není odškrtnout otázku. Cíl je vytáhnout důvod ke koupi a pojmenovat potřebu zákazníka.', requiredTitle: 'Otevřené otázky', needsTitle: '', hint: 'Pro přechod na další kartu označ minimálně 3 položené otázky.' },
      nabidka: { title: '4. Nabídka jako řešení', small: 'Nabídka jako řešení', sentence: 'Podle toho, co zákazník řekl, nabídni konkrétní řešení. Neprodávej produkt izolovaně, ale hodnotu a výslednou cenu.', requiredTitle: 'Potvrď nabídku do sluchátka', offerButton: 'Nabídka použita' },
      vyhody: { title: '5. Výhody', small: 'Výhoda není vlastnost', sentence: 'Každou výhodu přelož do toho, co zákazník reálně získá.', requiredTitle: 'Vyber vysvětlenou výhodu', hint: 'Pro přechod dál označ minimálně 3 vysvětlené výhody O2.' },
      uzitky: { title: '6. Užitek / zkušební uzavření', small: 'Zkušební uzavření', sentence: 'Neříkej jen „rozumíte tomu?“. Polož prodejní otázku na míru a otestuj souhlas.', requiredTitle: 'Vyber použité zkušební uzavření', hint: 'Pro přechod dál označ minimálně 3 použité užitky z panelu.' },
      dotazeni: { title: '7. Dotažení', small: 'Dotažení prodeje', sentence: 'Hovor bez konkrétní stopy je ztracený čas. Vyber reálný výstup v systémech O2.', requiredTitle: 'Označ sjednaný další krok' },
      new: { title: '8. Nový hovor', small: 'Uložit a načíst nový hovor', sentence: 'Tady už není potřeba žádné shrnutí. Stačí uložit aktuální hovor a otevřít čistý nový hovor.', backButton: '‹ Zpět', saveButton: 'Uložit a načíst nový hovor' }
    };

    const defaultSos = {
      enabled: false,
      title: 'Okamžitá námitka zákazníka:',
      buttons: ['Je to drahé', 'Nemám zájem (Obecná)', 'Mám to roztříštěné u konkurence']
    };

    const commonObjections = {
      'Je to drahé': 'Rozumím, cena je důležitá. Proto bych se nedíval jen na cenu jedné služby, ale na celou domácnost. Často se dá ušetřit právě tím, že se mobil, internet, televize nebo Unity poskládají dohromady. Co dnes platíte zvlášť?',
      'Nemám zájem': 'Rozumím, nechci Vám nic nutit. Jen si nechci nechat ujít možnost ověřit, jestli dnes neplatíte zbytečně víc, než musíte. Řešíte doma spíš cenu, data, internet, nebo televizi?',
      'Nemám čas': 'Rozumím, vezmu to opravdu krátce. Řešíte teď spíš cenu, mobil, internet, nebo televizi?',
      'Pošlete mi nabídku e-mailem': 'Rád Vám ji pošlu, ale aby nebyla obecná, potřebuji ji nejdřív postavit podle Vaší domácnosti. Jinak Vám pošlu jen čísla bez souvislosti. Co dnes používáte doma — mobil, internet, televizi, případně Air Bank?',
      'Musím se poradit': 'To chápu, u služeb pro domácnost je dobré se poradit. Aby ta porada byla konkrétní, pojďme si jen ujasnit, jestli budete doma řešit hlavně cenu, kvalitu internetu, data v mobilech, nebo televizní obsah.',
      'Jsem spokojený': 'To je dobře, spokojenost je základ. Tady ale nemusíme řešit problém. Můžeme se podívat, jestli nejde stejné nebo lepší nastavení udělat výhodněji. Kdy jste si naposledy porovnával celkovou cenu celé domácnosti?',
      'Nechci nic měnit': 'Rozumím. Změna kvůli změně nedává smysl. Já se ale nechci bavit o změně, pokud nepřinese konkrétní přínos. Pojďme nejdřív ověřit, jestli by Vám přinesla nižší cenu, lepší službu nebo jednodušší správu.',
      'U konkurence to mám levnější': 'Rozumím, cena konkurence je důležitá. Pojďme ale porovnat celou hodnotu, nejen jednu položku. U O2 může hrát roli O2 Spolu, Unity odměna, O2 Connect, Security nebo Oneplay. Co přesně máte v té ceně zahrnuto?',
      'Už to mám vyřešené': 'Rozumím, nechci otevírat něco znovu zbytečně. Jen si ověřím, jestli je výsledek opravdu nejvýhodnější. Co přesně jste řešil — cenu, tarif, internet, televizi, nebo přenos čísla?',
      'Mám pracovní SIM': 'Jasně, pracovní číslo často vyřeší základní volání. Otázka ale je, jestli máte vyřešenou i soukromou část — rodinu, data mimo práci, chytré hodinky, tablet, internet doma nebo televizi. Co z toho používáte mimo pracovní SIM?',
      'Používám jen Wi‑Fi': 'Rozumím. Wi‑Fi doma pomůže, ale mobilní data řeší situace mimo domov — navigaci, cestování, čekání, výlety, děti nebo hotspot. Kdy naposledy jste potřeboval internet mimo domov?',
      'Nepotřebuji neomezená data': 'To chápu. Neomezená data nejsou jen o tom, že každý den stáhnete hodně dat. Jsou hlavně o klidu, že nemusíte hlídat limit, Wi‑Fi ani FUP. Kdy nejčastěji data používáte mimo domov?',
      'Internet mi funguje': 'To je dobře. U internetu ale nejde jen o to, jestli funguje, ale jestli zvládá celou domácnost — práci, televizi, mobily, děti, hry a Wi‑Fi v každém pokoji. Kde doma je signál nejslabší?',
      'Televizi nesleduji': 'Rozumím. Dnes už ale nejde jen o klasickou televizi. Oneplay je spíš zábava na vyžádání — sport, filmy, seriály, zpětné sledování a obsah na více zařízeních. Co doma sledujete nejčastěji?',
      'Oneplay nepotřebuji': 'Chápu. Nechci Vám nabízet televizi jen proto, že existuje. Dává smysl jen tehdy, pokud nahradí jiné předplatné, přidá sport, zpětné sledování nebo zjednoduší zábavu doma. Za jaké streamovací nebo televizní služby dnes platíte?',
      'Air Bank nechci': 'Rozumím, banku člověk nemění jen tak. U Unity ale nezačínáme bankou, začínáme výslednou cenou služeb. Pokud by Vám propojení přineslo pravidelnou měsíční odměnu, stálo by za to si aspoň spočítat rozdíl?',
      'Nechci závazek': 'To chápu, závazek může působit nepříjemně. Proto je důležité rozlišit, jestli řešíme dlouhou smlouvu, nebo jen lepší nastavení služeb. Co je pro Vás důležitější — volnost, cena, nebo jistota služby?',
      'Ještě si to rozmyslím': 'Rozumím. Aby to nebylo jen odložení bez výsledku, pojďme si říct, co konkrétně si potřebujete rozmyslet — cenu, rozsah služeb, přechod, nebo jestli to využijete?',
      'Nevolejte mi s nabídkami': 'Rozumím, nechci Vás obtěžovat. Jen ověřím, jestli nechcete nabídky vůbec, nebo nechcete obecné nabídky bez konkrétního přínosu. Pokud by šlo o úsporu nebo lepší nastavení Vašich služeb, mám Vám to stručně říct?',
      'Je to moc složité': 'Chápu, když je služeb víc, může to působit složitě. Můj cíl je to zjednodušit — jedna správa, jasná výsledná cena a konkrétní přínos. Mám Vám to říct úplně jednoduše ve třech bodech?'
    };

    const defaultProducts = {
      spolu: {
        label: 'O2 Spolu', title: 'O2 Spolu', theme: '#047857',
        principle: 'Sjednocení domácnosti pod jednu správu, jedna přehledná faktura a maximální sleva v kombinaci s Unity.',
        keys: ['domácnost', 'faktury', 'cena', 'internet', 'tv', 'rodina', 'spolu', 'sloučit'],
        questions: [
          'Jaké služby v rodině používáte?', 
          'Kdo všechno u vás doma používá mobilní služby?',
          'Co vše máte u jiného poskytovatele?', 
          'Kolik vás přibližně stojí celá domácnost za služby měsíčně?',
          'Dávalo by smysl mít služby pod jednou správou?', 
          'Je u vás doma ještě někdo na dobíjecí kartě?',
          'Kdo z rodiny je ještě u konkurence?'
        ],
        benefits: [
          'Získáte kompletní správu všech rodinných služeb pod jedním přihlášením v aplikaci Moje O2.',
          'Získáte maximální slevu na balíček a k tomu odměnu Unity 300 Kč, kterou vám pošleme každý měsíc zpět na účet.',
          'Budete mít vše na jedné přehledné faktuře, takže se zbavíte zmatku s více platbami u různých firem.',
          'Všichni členové rodiny dostanou datový bonus a navíc si mezi sebou budete volat úplně zdarma.',
          'Spojíme vám rychlý internet, 5G mobily a televizi Oneplay do jednoho cenově nejvýhodnějšího řešení.'
        ],
        trialCloses: [
          'Když se podíváme na roční úsporu 3 600 Kč díky Unity and přehledné jedné faktuře, co z toho rodina ocení víc?',
          'Kdybychom všechny vaše služby sjednotili bez výpadku a ještě snížili celkovou měsíční platbu, dávalo by smysl to hned nastavit?',
          'Je pro vás cennější ušetřit čas s jednou správou, nebo získat nejsilnější Wi-Fi a TV pro celou rodinu?'
        ],
        objections: commonObjections,
        copilotBenefits: {
          'Nižší cena za služby každý měsíc': 'Díky tomu, že si služby spojíte do jednoho balíčku, budete je mít výhodnější a každý měsíc tak reálně snížíte celkové náklady vaší domácnosti.',
          'Jedna faktura': 'Všechny služby budete mít přehledně na jedné faktuře. Už nebudete muset hlídat několik různých plateb a vyúčtování.',
          'Jedna aplikace': 'V aplikaci Moje O2 uvidíte své služby, platby, spotřebu i nastavení celé domácnosti krásně na jednom místě.',
          'Jeden operátor': 'Mobil, internet, televizi i další služby vyřešíte jednoduše pod jednou střechou u nás.',
          'Jedno místo pro řešení': 'Když budete potřebovat cokoliv změnit nebo vyřešit, stačí se obrátit na nás. Odpadne vám obvolávání různých poskytovatelů.',
          'Unity 150 Kč nebo 300 Kč': 'Pokud splníte jednoduché podmínky, získáte od nás pravidelnou odměnu 150 Kč nebo 300 Kč každý měsíc zpět.',
          'Plus výhody jednotlivých služeb': 'K O2 Spolu navíc získáte všechny výhody vašeho mobilního tarifu, internetu nebo Oneplay přesně podle toho, co reálně využíváte.'
        },
        copilotUtilities: {
          'Nižší výdaje': 'Každý měsíc ušetříte na pravidelných platbách za služby pro celou vaši domácnost.',
          'Méně starostí': 'Díky spojení služeb budete mít o starost méně – už je nebudete muset řešit každou zvlášť.',
          'Větší přehled': 'Získáte naprostý přehled. Všechny služby, platby a nastavení najdete hezky pohromadě.',
          'Větší pohodlí': 'Bude to pro vás mnohem pohodlnější, vše podstatné vyřídíte přes jednu aplikaci a s jedním operátorem.',
          'Jednodušší správu domácnosti': 'Správa vaší domácnosti bude hned jednodušší, když mobil, internet i televizi nastavujete z jednoho místa.',
          'Výhody navíc': 'Získáte přístup k dalším exkluzivním výhodám u každé ze služeb, které máte v balíčku.',
          'Jedenho partnera pro všechno': 'Získáte spolehlivého partnera pro všechno. Stačí jeden telefonát a vyřešíme s vámi cokoliv.'
        },
        closing: [
          'Dává Vám smysl mít služby pohromadě?', 'Pomohla by Vám jedna faktura?',
          'Je pro Vás zajímavá nižší cena domácnosti?', 'Líbí se Vám to?', 'Jdeme do toho?',
          'Můžeme to dát do jednoho balíčku?', 'Mohu objednávku odeslat?', 'Slyším, že se Vám to líbí.'
        ]
      },
      neo: {
        label: 'Postpaid', title: 'Postpaid / NEO+', theme: '#0050ff',
        principle: 'Svoboda neomezených dat v nejrychlejší 5G síti, kybernetická ochrana O2 Security a sdílení dat s dalšími zařízeními.',
        keys: ['data', 'mobil', 'rodina', 'cena', 'zařízení', 'wifi', 'tarif', 'postpaid'],
        questions: [
          'Kolik dnes za tarif platíte?', 
          'Jak dnes mobil nejčastěji používáte?',
          'Máte tarif, dobíjecí kartu, nebo firemní číslo?', 
          'Kolik vás mobil běžně vyjde za měsíc?',
          'Kdy nejvíc poznáte, že vám současný mobil nestačí?', 
          'Používáte k mobilu ještě další zařízení, třeba hodinky, tablet nebo dětské zařízení?',
          'Co je pro vás u tarifu důležitější?'
        ],
        benefits: [
          'Získáte skutečně neomezená data s maximální rychlostí v naší nejlépe hodnocené 5G síti.',
          'Díky službě O2 Connect můžete svá neomezená data snadno sdílet i do tabletu nebo chytrých hodinek.',
          'Zabezpečíme vás službou O2 Security, která přímo v síti zablokuje podvodné stránky a viry, aniž byste musel cokoliv instalovat.',
          'Dostanete od nás výrazný finanční bonus, který můžete hned využít na nákup nového 5G telefonu nebo příslušenství.',
          'Na cestách po Evropě oceníte prémiový roaming s obrovskou porcí dat pro naprosto bezstarostné cestování.'
        ],
        trialCloses: [
          'Mám vám tarif rovnou aktivovat na vaši stávající SIM, abyste už od zítřka nemusel hlídat spotřebu dat?',
          'Zaujala vás více kybernetická ochrana O2 Security proti podvodům, nebo možnost sdílet data na chytré hodinky?',
          'Když využijete bonus na nový telefon and neomezená 5G data, nastavíme přechod ihned?'
        ],
        objections: commonObjections,
        copilotBenefits: {
          'Nejrychlejší data na nejlepší síti': 'Budete mít ta nejrychlejší mobilní data v síti O2, ať už pro běžné surfování, práci, sledování videí nebo na cesty.',
          'Minuty, SMS i data bez omezení': 'Už nikdy nebudete muset hlídat provolané minuty, zprávy ani spotřebu dat – telefon můžete využívat naprosto bez omezení.',
          'O2 Connect': 'Své hodinky nebo tablet si jednoduše připojíte ke stejnému tarifu díky službě O2 Connect.',
          'Data Naplno': 'Když to budete nejvíc potřebovat, můžete si jednoduše zapnout Data Naplno a neřešit žádné limity.',
          'Tisíce na telefony a O2 Connect zařízení': 'Dáme vám slevu v řádech tisíců korun, kterou využijete na nový telefon nebo třeba chytré hodinky.',
          'O2 Security': 'Služba O2 Security vás automaticky ochrání před rizikovými stránkami, podvodnými odkazy a online hrozbami.',
          'O2 Spolu': 'Svůj tarif můžete snadno spojit s dalšími službami v domácnosti a využít všechny slevy z balíčku O2 Spolu.',
          'Unity 150 Kč nebo 300 Kč': 'Pokud splníte podmínky, každý měsíc vám vrátíme 150 Kč nebo 300 Kč zpět na účet.',
          'Bez smlouvy': 'Získáte naprostou volnost. Nemusíte se bát žádné dlouhodobé smlouvy.',
          'Bez závazku': 'Tento tarif je zcela bez závazku, takže se můžete kdykoliv svobodně rozhodnout podle své aktuální situace.'
        },
        copilotUtilities: {
          'Klid': 'Získáte absolutní klid. Už nebudete trnout, kolik jste provolal nebo propsal dat, a telefon využijete bez stresu.',
          'Dostupnost': 'Budete vždy na příjmu a online přesně ve chvílích, kdy to nejvíc potřebujete.',
          'Svobodu používat telefon bez omezení': 'Dopřejete si svobodu. Volejte, pište a datujte naplno, aniž byste se musel omezovat.',
          'Bezpečnost': 'Zajistíme vám bezpečí. O2 Security za vás ohlídá všechny podvodné odkazy a online hrozby.',
          'Pohodlí': 'Vše budete mít maximálně pohodlné – tarif, data, bezpečnost i další zařízení vyřešíte najednou.',
          'Flexibilitu': 'Získáte flexibilitu, omezovat vás nebude žádný zbytečný závazek.',
          'Kvalitní připojení': 'Spolehnete se na naši silnou síť pro práci, zábavu i jakoukoliv jinou každodenní situaci.',
          'Úsporu peněz': 'Díky balíčku O2 Spolu nebo odměně Unity výrazně snížíte své reálné měsíční náklady.'
        },
        closing: [
          'Dává Vám smysl nehlídat data?', 'Pomohl by Vám tarif bez omezení?',
          'Je pro Vás důležitý klid v mobilu?', 'Líbí se Vám to?', 'Jdeme do toho?',
          'Na jaký e-mail chcete poslat eSIM?', 'Mohu objednávku odeslat?', 'Slyším, že se Vám to líbí.'
        ]
      },
      internet: {
        label: 'Internet', title: 'Internet / Smart Box / Mesh Wi‑Fi', theme: '#123e78',
        principle: 'Garance stability domácí Wi‑Fi v každém rohu díky chytrému O2 Smart Boxu a jednotkám O2 Mesh pro práci i zábavu.',
        keys: ['wifi', 'internet', 'router', 'home office', 'stream', 'optika', 'box', 'signál'],
        questions: [
          'Budeme řešit nový nebo stávající internet?', 
          'Jak máte doma internet vyřešený dnes — od koho a za kolik?',
          'Kolik se Vás k internetu připojuje?', 
          'Co na internetu doma nejčastěji děláte?',
          'Kdy vám internet nejvíc nestačí?', 
          'Kde doma máte nejslabší Wi‑Fi?',
          'Co by pro vás byl ideální internet — rychlejší, stabilnější, lepší Wi‑Fi, nebo lepší cena v balíčku?'
        ],
        benefits: [
          'S O2 Smart Boxem 6 a jeho Wi-Fi 6 získáte bleskové a stabilní připojení klidně pro desítky zařízení současně.',
          'Díky chytrému rozšíření O2 Mesh vám perfektně pokryjeme i ty nejvzdálenější pokoje nebo patra bez sebemenšího sekání.',
          'Zajistíme vám profesionální instalaci naším technikem, který vše změří a nastaví síť přesně na míru vaší domácnosti.',
          'Můžete stahovat naprosto neomezeně. Linka je stabilní a pod naším non-stop dohledem proti výpadkům.',
          'Internet si můžete výhodně spojit do balíčku O2 Spolu a získat tak další slevu i odměnu Unity na účet.'
        ],
        trialCloses: [
          'Kdyby O2 Smart Box a Mesh spolehlivě pokryly i ten problematický pokoj, vyřešilo by to vaše starosti se sekáním?',
          'Je pro vás důležitější stabilita pro práci z domova, nebo jistota, že se večer neseká televize a hry?',
          'Domluvíme rovnou termín s naším technikem, který vám Wi-Fi profesionálně zapojí a změří?'
        ],
        objections: commonObjections,
        copilotBenefits: {
          'Rychlé a stabilní připojení': 'Budete mít doma rychlý a stabilní internet pro práci, zábavu i streamování bez jakéhokoliv nepříjemného sekání.',
          'Vždy nejvyšší rychlost Max': 'Vždy od nás dostanete automaticky tu nejvyšší rychlost, jakou vaše adresa momentálně umožňuje.',
          'Silná Wi‑Fi všude': 'Budete mít silnou Wi-Fi úplně všude, a to i v těch pokojích, kam vám předtím signál pořádně nedosáhl.',
          'Oneplay v ceně': 'K internetu od nás můžete mít rovnou i televizi Oneplay v ceně, takže získáte super zábavu bez dalších poplatků.',
          'O2 Security': 'Váš domácí internet bude bezpečně chráněný před online hrozbami a rizikovými stránkami.',
          'Pohodlná instalace': 'Se zapojením si nebudete muset dělat těžkou hlavu, vše pohodlně a bez starostí nainstalujeme za vás.',
          'O2 Spolu': 'Internet si jednoduše spojíte s dalšími službami, čímž si odemknete slevy v balíčku O2 Spolu.',
          'Unity 150 Kč nebo 300 Kč': 'Při splnění podmínek získáte každý měsíc zpět na účet odměnu 150 Kč nebo 300 Kč.',
          'Bez smlouvy': 'Získáte internet bez jakýchkoliv obav z dlouhých smluv a s naprostou volností.',
          'Bez závazku': 'Tento internet vás nebude svazovat žádným dlouhodobým závazkem, můžete se vždy svobodně rozhodnout.'
        },
        copilotUtilities: {
          'Klid doma': 'Zajistíte si doma naprostý klid, protože internet vám poběží spolehlivě pro práci i zábavu.',
          'Internet bez sekání': 'Zapomenete na sekající se obraz. Připojení plynule zvládne videa, práci, hry i více zapojených zařízení najednou.',
          'Pohodu při práci z domova': 'Práce nebo studium z domova pro vás bude pohoda. Videohovory a připojení k firmě budou naprosto stabilní.',
          'Zábavu pro rodinu': 'Dopřejete celé rodině parádní zábavu bez kompromisů – od streamování filmů až po hraní online her.',
          'Bezpečí na internetu': 'S O2 Security budete mít jistotu, že je celá vaše domácnost chráněná před viry a rizikovými stránkami.',
          'Méně starostí': 'Ušetříte si starosti. Odpadne vám zdlouhavé řešení výpadků, slabé Wi-Fi nebo složitého zapojování.',
          'Přehled nad výdaji': 'Získáte perfektní přehled o tom, za co platíte, protože si internet spojíte s dalšími službami do jedné faktury.',
          'Úsporu peněz': 'Díky kombinaci O2 Spolu a odměně Unity reálně ušetříte peníze z vašeho domácího rozpočtu.'
        },
        closing: [
          'Dává Vám smysl stabilnější internet?', 'Pomohla by Vám silnější Wi‑Fi doma?',
          'Vyřešilo by Vám to slabý signál?', 'Líbí se Vám to?', 'Jdeme do toho?',
          'Na kdy máme poslat technika?', 'Mohu objednávku odeslat?', 'Slyším, že se Vám to líbí.'
        ]
      },
      oneplay: {
        label: 'Oneplay', title: 'Oneplay', theme: '#c2410c',
        principle: 'Nejlepší filmový, seriálový a sportovní obsah v jedné aplikaci Oneplay s chytrým zpětným přehráváním a sledováním na více obrazovkách.',
        keys: ['tv', 'stream', 'sport', 'obsah', 'filmy', 'seriály', 'oneplay', 'televize'],
        questions: [
          'Jak dnes sledujete televizi a kolik za ní platíte?', 
          'Co u vás doma běží nejčastěji — sport, filmy, seriály, pohádky, dokumenty?',
          'Který obsah vám dnes chybí nebo ho musíte hledat jinde?', 
          'Jak často nestihnete pořad živě a hodilo by se zpětné sledování?',
          'Na čem sledujete obsah — televize, mobil, tablet, notebook, více zařízení?', 
          'Kolik lidí u vás doma sleduje obsah a má každý trochu jiný vkus?',
          'Za jaké televizní nebo streamovací služby dnes platíte zvlášť?'
        ],
        benefits: [
          'V aplikaci Oneplay získáte televizní vysílání, exkluzivní sport i obrovskou videotéku krásně na jednom místě.',
          'Díky zpětnému zhlédnutí až 7 dní dozadu a nahrávání vám už nikdy neuteče žádný zápas ani váš oblíbený film.',
          'S funkcí Multidimenze můžete sledovat obsah současně na televizi, mobilu, tabletu i počítači, takže se zavděčíte každému členu rodiny.',
          'Budete sledovat ty nejlepší sportovní přenosy jako je Liga mistrů, Chance Liga nebo hokej v té nejvyšší HD a 4K kvalitě.',
          'Vystačíte si s jedním jednoduchým předplatným, místo abyste zbytečně platili několik různých streamovacích služeb zvlášť.'
        ],
        trialCloses: [
          'Kdyby aplikace Oneplay nahradila vaše stávající předplatná a ušetřila vám peníze, dává smysl si ji zapnout?',
          'Oceníte doma více sportovní přenosy na velké televizi, nebo možnost sledovat seriály zpětně na tabletu?',
          'Nastavíme vám přihlašovací údaje ihned, abyste se už večer mohli podívat na exkluzivní zápas?'
        ],
        objections: commonObjections,
        copilotBenefits: {
          'Multimediální centrum pro celou rodinu': 'Získáte domácí multimediální centrum pro celou rodinu, kde najdete obsah pro děti, dospělé i sportovní fanoušky.',
          'Nejširší nabídka sportu na trhu': 'Dostanete k dispozici tu absolutně nejširší nabídku sportu, jakou na trhu můžete najít.',
          'Sport, filmy, seriály i pohádky na jednom místě': 'Vy i celá rodina budete mít sport, filmy, seriály a pohádky hezky na jednom místě. Odpadne vám tak přepínání mezi různými aplikacemi.',
          'Exkluzivní Oneplay Originály': 'Získáte přístup k exkluzivním Oneplay Originálům, které nikde jinde prostě nenajdete.',
          'Jedna aplikace, jedno přihlášení a jednoduché ovládání': 'Vše vyřešíte jednoduše – jedna aplikace, jedno přihlášení. Už si nebudete muset pamatovat x různých účtů a hesel.',
          'Možnost sledovat obsah kdykoliv a na různých zařízeních': 'Své oblíbené pořady si pustíte kdykoliv a kdekoliv, a to jak doma na televizi, tak na cestách přes mobil nebo tablet.',
          'O2 Spolu': 'Televizi si můžete výhodně přidat k dalším službám a ušetřit v rámci balíčku O2 Spolu.',
          'Unity 150 Kč nebo 300 Kč': 'Navíc, pokud splníte podmínky Unity, můžete si zlevnit služby odměnou 150 Kč nebo 300 Kč každý měsíc zpět na účet.',
          'Bez smlouvy': 'Získáte kvalitní zábavu s pocitem svobody, aniž byste se musel dlouhodobě k něčemu vázat.',
          'Bez závazku': 'Televizi si můžete pořídit zcela bez závazku, takže ji kdykoliv flexibilně přizpůsobíte svým potřebám.'
        },
        copilotUtilities: {
          'Pohodlí': 'Užijete si maximální pohodlí. Sport, filmy, seriály i pohádky zapnete rovnou z jedné jediné služby.',
          'Zábavu': 'O zábavu budete mít doma vystaráno, najdete tu obsah úplně pro každého a na každý den.',
          'Více času s rodinou': 'Strávíte více času s rodinou, protože si každý oblíbený obsah snadno pustíte hezky pohromadě.',
          'Sport bez hledání': 'Své oblíbené sportovní zápasy už nebudete muset nikde složitě hledat – vše najdete ihned pod jedním tlačítkem.',
          'Filmy a seriály kdykoliv chce': 'Filmy a seriály si pustíte přesně tehdy, kdy se to hodí vám. Už se nemusíte přizpůsobovat televiznímu programu.',
          'Méně aplikací a předplatných': 'Zbavíte se zbytečných předplatných a aplikací. Jedno řešení vám odteď bohatě postačí na všechno.',
          'Obsah na všech zařízeních': 'Sledovat můžete opravdu kdekoliv, ať už máte po ruce televizi, mobil, tablet nebo počítač.',
          'Lepší využití volného času': 'Svůj volný čas využijete na samotné sledování, místo abyste zdlouhavě hledali, co si zrovna pustíte.'
        },
        closing: [
          'Dává Vám smysl mít zábavu na jednom místě?', 'Využil byste zpětné sledování?',
          'Pomohlo by Vám méně aplikací?', 'Líbí se Vám to?', 'Jdeme do toho?',
          'Můžeme vybrat vhodný balíček?', 'Mohu objednávku odeslat?', 'Slyším, že se Vám to líbí.'
        ]
      },
      unity: {
        label: 'Unity', title: 'Unity / Air Bank', theme: '#c2410c',
        principle: 'Spojení služeb O2 a Air Bank, které mění ceníkovou cenu na bezkonkurenční nabídku s pravidelnou odměnou 300 Kč na účet.',
        keys: ['cena', 'sleva', 'cashback', 'bank', 'výhoda', 'drahé', 'unity', 'airbank', 'odměna'],
        questions: [
          'Používáte už Air Bank, nebo máte hlavní účet jinde?', 
          'Kolik vás dnes stojí služby měsíčně dohromady?',
          'Platíte běžně kartou aspoň několikrát za měsíc?', 
          'Chodí vám na účet pravidelný měsíční příjem?',
          'Znáte výhody Unity kromě samotné odměny zpět na účet?', 
          'Dávalo by vám smysl snížit reálnou cenu služeb přes odměnu zpět na účet?'
        ],
        benefits: [
          'Při splnění jednoduchých podmínek dostanete od Air Bank reálnou odměnu 300 Kč každý měsíc přímo na váš účet.',
          'Získáte tak 3 600 Kč ročně navíc do rodinného rozpočtu za služby, které už stejně dávno používáte.',
          'Účet u Air Bank si můžete propojit nebo zdarma založit klidně hned, je to bez poplatků a zvládnete to na pár kliknutí.',
          'V kombinaci s O2 Spolu tak získáte zdaleka nejvýhodnější cenu za služby na trhu.',
          'Získáte přístup i k dalším exkluzivním partnerským výhodám a slevám v aplikaci díky ekosystému Unity.'
        ],
        trialCloses: [
          'Když vám odměna Unity sníží reálnou cenu služeb o 300 Kč měsíčně, dává smysl tuto výhodu započítat ihned?',
          'Bude pro vás pohodlnější propojit váš stávající účet Air Bank s Moje O2, nebo vám s rychlým založením pomohu teď?',
          'Když se podíváte na výslednou cenu po odečtení 3 600 Kč ročně, souhlasíte, že je to velmi výhodné?'
        ],
        objections: commonObjections,
        copilotBenefits: {
          'Sleva 150 nebo 300 Kč měsíčně zpět': 'Podle jednoduchých podmínek dostanete odměnu 150 Kč nebo dokonce 300 Kč každý měsíc zpět.',
          'Odměna každý měsíc, ne jen jednorázově': 'Tato odměna pro vás není žádná jednorázová akce, peníze vám budou chodit pravidelně úplně každý měsíc.',
          'Odměna chodí přímo na účet': 'Peníze vám pošleme rovnou na váš bankovní účet, takže tu úsporu reálně uvidíte a můžete s ní hned naložit.',
          'Snižuje reálnou cenu služeb O2': 'Díky této odměně si reálně snížíte celkovou částku, kterou za O2 služby měsíčně zaplatíte.',
          '150 nebo 300 Kč měsíčně zpět na účet Air Bank': 'Při splnění podmínek vám na účet Air Bank pravidelně přistane 150 Kč nebo 300 Kč.',
          'Slevy na zařízení v aplikaci': 'V aplikaci na vás čekají i další skvělé výhody a slevy na nová zařízení.'
        },
        copilotUtilities: {
          'Více peněz na účtu': 'Budete mít jednoduše více peněz na svém účtu k vlastní potřebě.',
          'Nižší měsíční výdaje': 'Tímto krokem efektivně snížíte vaše pravidelné měsíční výdaje.',
          'Lepší rodinný rozpočet': 'Díky pravidelné měsíční finanční injekci se vám bude hned lépe hospodařit s rodinným rozpočtem.',
          'Odměnu za běžné používání služeb': 'Dostanete odměnu jen za to, že platíte služby z účtu, což už stejně děláte.',
          'Maximální využití O2 služeb': 'Díky Unity získáte z O2 služeb absolutní maximum a ještě na tom finančně vyděláte.',
          'Pohodlí bez sbírání bodů': 'Nemusíte složitě sbírat žádné body. Odměna vám přijde rovnou v penězích na účet.',
          'Chytré hospodaření': 'Budete se svými penězi hospodařit opravdu chytře a získáte ze služeb tu největší možnou hodnotu.',
          'Dlouhodobou úsporu': 'Zajistíte si stabilní a dlouhodobou úsporu, protože ty peníze vám přijdou zpět každý měsíc znovu.'
        },
        closing: [
          'Dává Vám smysl snížit reálnou cenu?', 'Využil byste peníze zpět každý měsíc?',
          'Chcete vidět cenu po Unity?', 'Líbí se Vám to?', 'Jdeme do toho?',
          'Můžeme ověřit nárok na odměnu?', 'Mohu objednávku odeslat?', 'Slyším, že se Vám to líbí.'
        ]
      }
    };

    const defaultRoutePlaybooks = {
      casok: { title: 'Má čas / co zákazník řeší', say: 'Co pro Vás konkrétně mohu udělat?', goal: 'Zařadit směr hovoru: poptávka, care problém, soft retence, optimalizace nebo běžná profilace.', options: ['Poptávka', 'Péče', 'Soft retence', 'Optimalizace'], rescue: ['Pokračovat do profilace', 'Péče s profilací', 'Zachránit optimalizací', 'Porovnat současné nastavení'] },
      vyreseno: { title: 'Má vyřešeno / řešil jsem s kolegou', say: 'Rozumím, že už jste to řešil. Jen si rychle ověřím, jestli je výsledek opravdu nejvýhodnější a jestli tam nezůstává prostor pro lepší nastavení.', goal: 'Nepřijmout větu „mám vyřešeno“ jako konec. Ověřit, co přesně bylo vyřešeno, najít prostor pro optimalizaci a pokračovat do nabídky.', options: ['Řešil s kolegou', 'Tvrdí, že už má objednáno', 'Nechce znovu poslouchat nabídku', 'Má pocit, že je hotovo', 'Řeší cenu', 'Není jisté, co bylo vyřešeno'], rescue: ['Ověřit, co přesně bylo vyřešeno', 'Zkontrolovat současné nastavení', 'Porovnat výslednou cenu', 'Najít doplnění služby', 'O2 Spolu / Unity jako lepší rámec', 'Zákazník přesvědčen – profilace'] },
      cas: { title: 'Nemá čas', say: 'Rozumím, vezmu to opravdu krátce. Řešíte teď spíš cenu, mobil, internet, nebo televizi?', goal: 'Jedna otázka, jeden směr, nebo přesný termín zpětného hovoru.', options: ['Nastupuje do dopravy / v práci', 'Řídí auto', 'Nechce teď mluvit', 'Požádal o zavolání jindy'], rescue: ['Sjednán přesný čas zpětného volání', 'Zaslána SMS vizitka', 'Mikro otázka na jednu službu', 'Zákazník rozmluven – profilace'] },
      omyl: { title: 'Omyl', say: 'Omlouvám se, nechci vás zdržovat. Jen rychle ověřím, jestli jde opravdu o omyl, nebo jestli se služba netýká někoho z domácnosti.', goal: 'Korektně ukončit, případně mikroověřit, zapsat do CRM.', options: ['Opravdu omyl', 'Špatný kontakt v databázi', 'Není zákazníkem O2', 'Číslo neexistuje / jiná osoba'], rescue: ['Ukončit se zápisem', 'Ověřit správné číslo', 'Vyřazení z kampaně', 'Zákazník rozmluven – profilace'] }
    };

    const defaultRouteTips = { casok: [], vyreseno: [], cas: [], omyl: [] };
    
    const tahakData = {
      cas: {
        title: '💡 Tahák: Nemá čas',
        tips: [
          '„Rozumím, nechci vás zdržet — řeknu jen jednou větou, proč volám, a vy mi řeknete, jestli to má smysl.“',
          '„Jasně, trefil jsem se nevhod — právě proto to vezmu úplně krátce: mám vám to zavřít, nebo stačí jedna rychlá otázka, jestli pro vás vůbec máme smysluplnou úsporu?“',
          '„V pořádku, pokud opravdu nemůžete, nebudu vás brzdit. Jen abych vás nepřipravil o něco, co může dávat smysl — co z toho je pro vás aktuálně největší téma: cena, internet, data, nebo televize?“'
        ]
      },
      omyl: {
        title: '💡 Tahák: Omyl',
        tips: [
          '„Rozumím, takže to vzniklo omylem. Právě proto vám to řeknu úplně krátce — někdy i z takového omylu vyjde lepší nastavení služeb. Máte dnes mobil, internet nebo televizi všechno u O2, nebo něco i jinde?“',
          '„To se vůbec nic neděje, u těchto formulářů nebo displejů se to může stát. Když už jsme ale spolu spojení, zaberu vám jen jednu rychlou otázku — co dnes doma řešíte nejvíc: cenu, internet, mobil, nebo televizi?“',
          '„Jasně, chápu, že jste o hovor nežádal cíleně. Než to zavřeme, můžu vám jen ověřit, jestli pro vaše číslo/domácnost nemáme lepší nastavení? Stačí mi říct — řešíte teď spíš mobil, internet, televizi, nebo celkovou cenu služeb?“'
        ]
      },
      vyreseno: {
        title: '💡 Tahák: Má vyřešeno',
        tips: [
          '„To je super, jsem rád, že už to máte vyřešené. Jen abychom měli jistotu, že jste nepřišel o žádnou výhodu — jak konkrétně jste to nakonec vyřešil?“',
          '„Perfektní, takže hlavní věc už máte za sebou. Já se jen zeptám — vyřešil jste tím celou domácnost, nebo jen konkrétní požadavek, kvůli kterému jste nás kontaktoval?“',
          '„To je dobro, že už to máte dořešené. Než to uzavřeme, ověřím jen jednu věc: dostal jste k tomu i variantu, kde se služba spojí s mobilem / internetem / Oneplay a vyjde výhodněji?“'
        ]
      }
    };

    const defaultConfig = {
      cards: defaultCards,
      sos: defaultSos,
      products: defaultProducts,
      routePlaybooks: defaultRoutePlaybooks,
      routeTips: defaultRouteTips,
      needOptions: [
        'Má málo dat nebo nestíhá FUP.',
        'Jde mu především o cenu a úsporu.',
        'Platí zbytečně moc na více fakturách.',
        'Má špatný nebo vypadávající signál.',
        'Má pomalý internet nebo slabou Wi-Fi.',
        'Nemá spolehlivou televizi nebo archiv.',
        'Chybí mu sportovní nebo filmové programy.',
        'Nevyužívá věrnostní odměny a cashback.',
        'Chce službu sjednotit pod jednu správu.',
        'Chce snížit celkové náklady domácnosti.',
        'Chce rodinný balíček a sdílení dat.'
      ],
      productOrder: ['spolu', 'neo', 'internet', 'oneplay', 'unity'],
      routes: { casok: ['Má čas', ''], vyreseno: ['Má vyřešeno', ''], cas: ['Nemá čas', ''], omyl: ['Omyl', ''] }
    };

    function clone(o) { return JSON.parse(JSON.stringify(o)); }

    function mergeConfig(base, over) {
      const out = clone(base);
      if (!over) return out;
      ['cards', 'sos', 'products', 'routePlaybooks', 'routeTips', 'routes'].forEach(k => { 
        if (over[k]) out[k] = { ...out[k], ...over[k] }; 
      });
      if (over.needOptions) out.needOptions = over.needOptions;
      if (over.productOrder) out.productOrder = over.productOrder;
      return out;
    }

    function loadConfig() {
      let boot = window.__BOOT_CONFIG__ || null, local = null;
      try { 
        local = JSON.parse(localStorage.getItem(configKey) || 'null'); 
      } catch (e) {}
      return sanitizeConfig(mergeConfig(mergeConfig(defaultConfig, boot), local));
    }

    function sanitizeConfig(cfg) {
      const out = clone(cfg || defaultConfig);
      const validProductKeys = Object.keys(defaultProducts);

      if (!Array.isArray(out.productOrder)) out.productOrder = [...defaultConfig.productOrder];
      out.productOrder = out.productOrder.filter(k => validProductKeys.includes(k));
      if (!out.productOrder.length) out.productOrder = [...defaultConfig.productOrder];

      ['cards', 'products', 'routePlaybooks', 'routeTips', 'routes'].forEach(k => {
        if (!out[k] || typeof out[k] !== 'object') out[k] = clone(defaultConfig[k]);
      });

      ['casok', 'cas', 'omyl', 'vyreseno'].forEach(k => {
        if (!Array.isArray(out.routes[k]) || !out.routes[k][0]) out.routes[k] = [...defaultConfig.routes[k]];
      });

      if (!Array.isArray(out.needOptions)) out.needOptions = [...defaultConfig.needOptions];
      return out;
    }

    let config = loadConfig();
    let { cards, sos, products, routePlaybooks, routeTips = defaultRouteTips, needOptions, productOrder, routes } = config;

    function saveConfig() {
      localStorage.setItem(configKey, JSON.stringify({ cards, sos, products, routePlaybooks, routeTips, needOptions, productOrder, routes }));
    }

    function getBlocks() {
      const ordered = ['situace', 'reseni', 'profilace', 'nabidka', 'vyhody', 'uzitky', 'dotazeni', 'new'];
      const colors = ['c1', 'c1', 'c1', 'c2', 'c3', 'c3', 'c6', 'c6'];
      return ordered.map((id, i) => block(id, colors[i], cards[id]?.title || id));
    }

    let blocks = getBlocks();
    const routeOrder = ['casok', 'cas', 'omyl', 'vyreseno'];

    const navigationNames = {
      situace: 'Úvod hovoru',
      reseni: 'Rozcestí',
      profilace: 'Profilace',
      nabidka: 'Nabídka',
      vyhody: 'Výhody',
      uzitky: 'Užitky',
      dotazeni: 'Dotažení',
      new: 'Nový hovor'
    };

    function getNavigationName(b) {
      return navigationNames[b.id] || String(b.title || b.id).replace(/^\d+\.\s*/, '');
    }

    function normalizeProductKey(v) {
      if (products[v]) return v;
      const found = Object.entries(products).find(([k, p]) => p.label === v || p.title === v);
      return found ? found[0] : 'spolu';
    }

    function defaultState() {
      return {
        date: todayKey(),
        callStartedAt: new Date().toISOString(),
        route: null, routeLabel: null, routeHandled: false,
        riskReason: null, rescueWay: null, riskReasons: [], rescueWays: [],
        product: 'spolu', productLocked: false,
        needs: [], voiceSuggestedNeeds: [], questions: [], offerMade: false, benefits: [], utilities: [],
        objection: null, objectionHandled: false, closingDone: false,
        nextStep: null, nextSteps: [], quickFacts: [], clicks: 0,
        finalStatus: null,
        actionLog: [], cardDurations: {}, maxCardReached: 0
      };
    }

    function checkMidnightReset() {
      const storedState = localStorage.getItem(stateKey);
      if (storedState) {
        try {
          const parsed = JSON.parse(storedState);
          if (parsed.date !== todayKey()) {
            localStorage.removeItem(stateKey);
            return true;
          }
        } catch (e) {}
      }
      return false;
    }

    function loadState() {
      try {
        checkMidnightReset();
        let s = JSON.parse(localStorage.getItem(stateKey) || 'null');
        if (!s || s.date !== todayKey()) return defaultState();
        s = Object.assign(defaultState(), s);
        return s;
      } catch (e) { 
        return defaultState(); 
      }
    }

    let currentIndex = 0;
    let lastCardEnterTime = Date.now();
    let callState = loadState();
    let activeProduct = callState.product;
    let isSandbox = false, zenLevel = 0, isMobileView = false;
    let copilotAdviceVisible = false;
    let adminTab = 'cards', adminCard = 'situace', adminProduct = activeProduct, adminRoute = 'casok';
    let statsPeriod = 'today', copilotTab = 'potreby';
    let statsExpandedBox = null;
    let coachTab = 'summary';
    
    const distributeColors = { 
      casok: 'status-green', 
      cas: 'status-blue', 
      omyl: 'status-red', 
      vyreseno: 'status-orange', 
      Prodáno: 'status-green', 
      'Zpětný kontakt': 'status-blue', 
      Neprodáno: 'status-red' 
    };

    function saveState() {
      if (checkMidnightReset()) {
        callState = defaultState();
        activeProduct = 'spolu';
        currentIndex = 0;
        lastCardEnterTime = Date.now();
        copilotTab = 'potreby';
        clearNotes();
      }
      localStorage.setItem(stateKey, JSON.stringify(callState));
    }

    function loadAllHistory() {
      try {
        let h = JSON.parse(localStorage.getItem(histKey) || '[]');
        if (!Array.isArray(h)) return [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        h = h.filter(x => new Date(x.endedAt || x.startedAt || new Date()) >= cutoff);
        localStorage.setItem(histKey, JSON.stringify(h));
        return h;
      } catch (e) { 
        return []; 
      }
    }
    
    let callHistory = loadAllHistory();

    function updateClock() {
      const n = new Date();
      $('clock').textContent = n.toLocaleTimeString('cs-CZ');
      $('date').textContent = n.toLocaleDateString('cs-CZ', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    }
    
    setInterval(updateClock, 1000);
    updateClock();

    function currentBlock() { return blocks[currentIndex]; }
    function maxIndex() { return blocks.length - 1; }
    function isFastTrack(x = callState) { return ['omyl', 'cas', 'vyreseno'].includes(x.route); }
    function asArr(v) { return Array.isArray(v) ? v : (v ? [v] : []); }
    
    function addUnique(arr, v) { 
      if (!arr.includes(v)) arr.push(v); 
    }
    
    function removeFrom(arr, v) { 
      let i = arr.indexOf(v); 
      if (i > -1) arr.splice(i, 1); 
    }

    function action(type = 'click', detail = '') {
      if (isSandbox) return;
      if (checkMidnightReset()) {
        callState = defaultState();
        activeProduct = 'spolu';
        currentIndex = 0;
        lastCardEnterTime = Date.now();
        copilotTab = 'potreby';
        clearNotes();
      }
      callState.clicks = (callState.clicks || 0) + 1;
      if (!callState.actionLog) callState.actionLog = [];
      callState.actionLog.push({ 
        ts: new Date().toISOString(), 
        action: type, 
        detail, 
        step: currentBlock().id, 
        stepTitle: currentBlock().title, 
        product: activeProduct 
      });
      if (callState.actionLog.length > 500) callState.actionLog = callState.actionLog.slice(-500);
    }

    function trackCardTime() {
      const now = Date.now();
      const elapsed = Math.round((now - lastCardEnterTime) / 1000);
      const step = currentBlock().id;
      if (!callState.cardDurations) callState.cardDurations = {};
      callState.cardDurations[step] = (callState.cardDurations[step] || 0) + elapsed;
      lastCardEnterTime = now;
    }

    function toggleArr(prop, v) {
      // Hlasový zámek: pokud je pro tuto kategorii aktivní, mouse-klik se ignoruje.
      const humanLabels = { questions: 'Profilační otázky', benefits: 'Výhody', utilities: 'Užitky / zkušební uzavření' };
      if (humanLabels[prop] && typeof adminConfig !== 'undefined' && voiceOnlyBlock(prop, humanLabels[prop])) return;
      action(prop, v);
      if (!Array.isArray(callState[prop])) callState[prop] = [];
      callState[prop].includes(v) ? removeFrom(callState[prop], v) : addUnique(callState[prop], v);
      if (prop === 'needs') {
        if (!Array.isArray(callState.voiceSuggestedNeeds)) callState.voiceSuggestedNeeds = [];
        removeFrom(callState.voiceSuggestedNeeds, v);
        if (!callState.productLocked) inferProduct();
      }
      saveState();
      renderAll();
    }

    function setProduct(k) {
      k = normalizeProductKey(k);
      if (activeProduct !== k) {
        action('product-switch', `${activeProduct} -> ${k}`);
        activeProduct = k;
        callState.product = k;
        callState.productLocked = true;
        const p = products[k];
        toast(`Produkt přepnut: ${p.label}`);
      } else {
        action('product', k);
        callState.productLocked = true;
      }
      saveState();
      renderAll();
    }

    function setRoute(k) {
      action('route', k);
      callState.route = k;
      callState.routeLabel = routes[k][0];
      callState.routeHandled = false;
      callState.riskReason = null; callState.rescueWay = null;
      callState.riskReasons = []; callState.rescueWays = [];
      saveState();
      renderAll();
    }

    function hasRouteResolution() {
      const hasLeft = asArr(callState.riskReasons).length > 0 || !!callState.riskReason;
      const hasRight = asArr(callState.rescueWays).length > 0 || !!callState.rescueWay;
      return hasLeft && hasRight;
    }

    function syncRouteHandled() { 
      callState.routeHandled = !!hasRouteResolution(); 
    }

    function toggleMulti(prop, mirror, v) {
      if (!Array.isArray(callState[prop])) callState[prop] = asArr(callState[mirror]);
      let i = callState[prop].indexOf(v);
      if (i > -1) callState[prop].splice(i, 1); else callState[prop].push(v);
      callState[mirror] = callState[prop].join(', ');
    }

    function selectedReason(v) { return asArr(callState.riskReasons).includes(v) || callState.riskReason === v; }
    function selectedRescue(v) { return asArr(callState.rescueWays).includes(v) || callState.rescueWay === v; }

    function setRouteReason(v) {
      action('reason', v); toggleMulti('riskReasons', 'riskReason', v);
      syncRouteHandled(); saveState(); renderAll();
    }

    function setRescue(v) {
      action('rescue', v); toggleMulti('rescueWays', 'rescueWay', v);
      syncRouteHandled(); saveState(); renderAll();
    }

    function setOfferMade() {
      action('offer', 'used'); callState.offerMade = true;
      saveState(); renderAll(); toast('Nabídka označena');
    }

    function setTrial() {
      action('trial', 'used'); addUnique(callState.quickFacts, 'trialClose');
      saveState(); renderAll();
    }

    function setObjection(o) {
      action('objection', o); callState.objection = o; callState.objectionHandled = false;
      saveState(); renderAll();
    }

    function borderObjection() {
      action('objectionHandled', 'ok'); callState.objectionHandled = true;
      if (!callState.objection) callState.objection = 'bez námitky';
      saveState(); renderAll();
    }

    function noObjection() {
      action('noObjection', 'ok'); addUnique(callState.quickFacts, 'noObjection');
      callState.objection = 'bez námitky'; callState.objectionHandled = true;
      saveState(); renderAll();
    }

    function selectedNextStep(v) { 
      return asArr(callState.nextSteps).includes(v) || callState.nextStep === v; 
    }

    function toggleNextStep(v) {
      if (!Array.isArray(callState.nextSteps)) callState.nextSteps = asArr(callState.nextStep);
      let i = callState.nextSteps.indexOf(v);
      if (i > -1) callState.nextSteps.splice(i, 1); else callState.nextSteps.push(v);
      callState.nextStep = callState.nextSteps.join(', ') || null;
      callState.closingDone = callState.nextSteps.length > 0;
    }

    function setClosing(step) {
      if (typeof adminConfig !== 'undefined' && voiceOnlyBlock('closing', 'Dotažení / další krok')) return;
      action('nextStep', step); toggleNextStep(step);
      saveState(); renderAll();
    }

    function setFinalStatus(val) {
      action('finalStatus', val);
      callState.finalStatus = val;
      saveState(); renderAll();
    }

    function inferProduct() {
      let text = callState.needs.join(' ').toLowerCase() + ' ' + String(callState.riskReason || '').toLowerCase() + ' ' + String(callState.rescueWay || '').toLowerCase();
      let scores = {};
      productOrder.forEach(k => scores[k] = 0);
      
      Object.entries(products).forEach(([k, p]) => {
        (p.keys || []).forEach(key => { 
          if (text.includes(key.toLowerCase())) scores[k] += 1; 
        });
      });
      
      if (text.includes('wi') || text.includes('router') || text.includes('pomal')) scores.internet = (scores.internet || 0) + 2;
      if (text.includes('stream') || text.includes('tv') || text.includes('sport') || text.includes('archiv')) scores.oneplay = (scores.oneplay || 0) + 2;
      if (text.includes('faktur') || text.includes('domácnost') || text.includes('rodina') || text.includes('spolu') || text.includes('sloučit')) scores.spolu = (scores.spolu || 0) + 3;
      if (text.includes('cena') || text.includes('drah') || text.includes('unity') || text.includes('úspora') || text.includes('odměn')) scores.unity = (scores.unity || 0) + 3;
      if (text.includes('data') || text.includes('zařízení') || text.includes('mobil') || text.includes('fup')) scores.neo = (scores.neo || 0) + 2;
      
      let best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > 0) { 
        activeProduct = best[0]; 
        callState.product = best[0]; 
      }
    }

    function callDurationSec() {
      if (!callState.callStartedAt) return 0;
      return Math.max(0, Math.round((Date.now() - new Date(callState.callStartedAt).getTime()) / 1000));
    }

    function formatDuration(sec) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${String(s).padStart(2, '0')}s`;
    }

    function calculateScore() {
      const qf = callState.quickFacts || [];
      const hasClosing = callState.closingDone || !!callState.nextStep || (callState.nextSteps && callState.nextSteps.length > 0);

      // Fast-track: pouze když je cas/omyl route A zákazník nebyl rozmluvem (nenabídnuto)
      const usedFastTrack = isFastTrack() && !callState.offerMade;

      if (usedFastTrack) {
        let s = 0;
        if (callState.route) s += 10;
        if (callState.routeHandled || hasRouteResolution()) s += 15;
        if (hasClosing) s += 15;
        if (qf.includes('customerEnded')) s += 5;
        const cap = { omyl: 40, cas: 45 }[callState.route] || 45;
        return Math.min(s, cap);
      }

      // Plné skórování: casok, vyreseno, nebo cas/omyl kde zákazník rozmluven
      // Body: 10+12+15+20+15+10+10+8 = 100
      let s = 0;
      if (callState.route) s += 10;
      if (callState.routeHandled || hasRouteResolution()) s += 12;
      if (callState.questions.length >= 3) s += 15;
      if (callState.needs.length >= 5) s += 20;
      if (callState.offerMade || callState.maxCardReached >= 3) s += 15;
      if (callState.benefits.length >= 3) s += 10;
      if ((callState.utilities || []).length >= 3 || qf.includes('trialClose')) s += 10;
      if (hasClosing) s += 8;

      return Math.min(s, 100);
    }

    function canContinue() {
      const step = currentBlock().id;
      if (step === 'situace') return !!callState.route;
      if (step === 'reseni') return hasRouteResolution();
      if (isFastTrack() && ['profilace', 'nabidka', 'vyhody', 'uzitky'].includes(step)) return true;
      if (step === 'profilace') return (callState.questions || []).length >= 3;
      if (step === 'nabidka') return !!callState.product;
      if (step === 'vyhody') return (callState.benefits || []).length >= 3;
      if (step === 'uzitky') return (callState.utilities || []).length >= 3;
      if (step === 'dotazeni') return callState.closingDone || !!callState.nextStep || (callState.nextSteps && callState.nextSteps.length > 0);
      return true;
    }

    function goToCard(i, isFromRoadmap = false) {
      if (i > currentIndex && !canContinue() && !isFromRoadmap) {
        toast('⚠️ Nejprve splň podmínky na této kartě pro pokračování');
        return;
      }
      const prevIndex = currentIndex;
      trackCardTime();
      if (currentBlock().id === 'nabidka' && i > currentIndex) { callState.offerMade = true; }
      syncRouteHandled();
      action('nav', 'card ' + i);
      currentIndex = Math.max(0, Math.min(maxIndex(), i));
      const changed = currentIndex !== prevIndex;
      if (currentIndex > callState.maxCardReached) callState.maxCardReached = currentIndex;                  
      saveState();
      renderAll();
      if (changed) animateCardSwap(currentIndex > prevIndex ? 'next' : 'prev');
    }

    function cardNav() {
      const canNext = canContinue() && currentIndex < maxIndex();
      return `<div class="nav">
        <button class="sec" ${currentIndex === 0 ? 'disabled' : ''} data-action="go-card" data-val="${currentIndex - 1}">‹ Předchozí</button>
        <button class="redbtn" data-action="customer-ended">Zákazník ukončil hovor</button>
        <button ${!canNext ? 'disabled style="opacity:.4;cursor:not-allowed"' : ''} data-action="go-card" data-val="${currentIndex + 1}">Další ›</button>
      </div>`;
    }

    function baseCard(body) {
      let b = currentBlock();
      return `<div class="cardhead ${b.cls}">
        <div class="cardtitle">${esc(b.title)}</div>
        <div class="badge" style="background:${canContinue() ? '#10b981' : '#f59e0b'}">${canContinue() ? 'OK (HOTOVO)' : 'ZATÍM NEVYPLNĚNO'}</div>
      </div>
      <div class="body">${body}${cardNav()}</div>`;
    }

    function pill(label, active, action, prop = '', val = '', cls = '') {
      return `<button class="pill ${active ? 'active' : ''} ${cls}" data-action="${action}" data-prop="${esc(prop)}" data-val="${esc(val)}">${esc(label)}</button>`;
    }

    function actionBtn(title, sub, active, action, prop = '', val = '', extraStyle = '') {
      const subHtml = sub ? '<span>' + esc(sub) + '</span>' : '';
      const checkMark = active ? '✓' : '';
      return '<button class="action-say-btn ' + (active ? 'active' : '') + '" ' + extraStyle + ' data-action="' + action + '" data-prop="' + esc(prop) + '" data-val="' + esc(val) + '">' +
        '<div><strong>' + esc(title) + '</strong>' + subHtml + '</div>' +
        '<div class="chk">' + checkMark + '</div>' +
      '</button>';
    }

    function renderChoice() {
      let html = routeOrder.map(k => {
        let label = routes[k][0], p = routePlaybooks[k] || {};
        let hasTip = ['cas', 'omyl', 'vyreseno'].includes(k);
        let tipBtn = hasTip ? `<button class="tip-btn" title="Otevřít tahák" data-action="open-tahak" data-val="${k}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg></button>` : '';
        let content = `<strong>${esc(label)}</strong><div class="sayline">„${esc(p.say || '')}“</div>`;
        return `<div class="choice ${distributeColors[k]} ${callState.route === k ? 'active' : ''}" data-action="set-route" data-val="${k}">${content}${tipBtn}</div>`;
      }).join('');
      return baseCard(`<div class="req"><div style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;"><div class="choice-grid">${html}</div></div></div>`);
    }

    function openTahak(k) {
      const data = tahakData[k];
      if (!data) return;
      $('tahakTitle').textContent = data.title;
      $('tahakList').innerHTML = data.tips.map(t => `<div class="tahak-item">${esc(t)}</div>`).join('');
      $('tahakModal').classList.add('open');
    }

    function closeTahak() { 
      $('tahakModal').classList.remove('open'); 
    }

    function renderReseni() {
      let c = cards.reseni, p = routePlaybooks[callState.route] || routePlaybooks.casok, isFast = isFastTrack(), can = hasRouteResolution();
      let fast = isFast ? `<div class="box" style="border:2px dashed #f59e0b;background:#fffbeb;margin-top:4px;flex-shrink:0;"><h4> Fast-Track Režim</h4><p>Zákazník nemá prostor nebo jde o nestandardní kontakt. Není nutné procházet nabídku a profilaci.</p><div style="margin-top:6px"><button class="btn" style="background:#0050ff;width:100%;text-align:center;padding:8px;font-size:12px" data-action="go-card" data-val="6">Přejít rovnou na Dotažení </button></div></div>` : '';                  
      
      return baseCard(`
        <div class="say warn" style="flex-shrink:0;">
          <div class="small">${esc(p.title || c.small)}</div>
          <div class="sentence">${esc(p.say || c.sentence)}</div>
        </div>
        <div class="box" style="flex-shrink:0;">
          <h4>Co tím sleduješ</h4>
          <p>${esc(p.goal || '')}</p>
        </div>
        <div class="split-grid" style="flex:1;min-height:0;">
          <div class="req">
            <h4 style="flex-shrink:0;">${callState.route === 'casok' ? 'Co zákazník řeší' : 'Důvod / stav'} (Levá strana)</h4>
            <div class="actions" style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;">
              ${(p.options || []).map(x => pill(x, selectedReason(x), 'set-reason', '', x)).join('')}
            </div>
          </div>
          <div class="req">
            <h4 style="flex-shrink:0;">${callState.route === 'casok' ? 'Jaký směr zvolíš dál' : 'Most dál'} (Pravá strana)</h4>
            <div class="actions" style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;">
              ${(p.rescue || []).map(x => pill(x, selectedRescue(x), 'set-rescue', '', x)).join('')}
            </div>
          </div>
        </div>
        ${fast}
        <div class="hint" style="${can ? 'color:#0050ff' : 'color:#ef4444;font-weight:950'}">
          ${can ? 'Situace je ošetřená výběrem v obou sloupcích. Pokračuj dál.' : '⚠️ Pro pokračování na další kartu je nutné vybrat levý i pravý sloupec!'}
        </div>
      `);
    }

    function voiceLockBadge(kind) {
      if (typeof adminConfig === 'undefined' || !adminConfig.voiceOnly || !adminConfig.voiceOnly[kind]) return '';
      return `<span style="display:inline-flex;align-items:center;gap:4px;background:#fef3c7;color:#78350f;border:1px solid #fcd34d;border-radius:999px;padding:2px 9px;font-size:10px;font-weight:950;margin-left:8px;letter-spacing:.2px;">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        POUZE HLASEM
      </span>`;
    }

    function renderProfilace() {
      let c = cards.profilace, p = products[activeProduct];
      const qCount = callState.questions.length;
      return baseCard(`
        <div class="principle" style="border-left-color:${p.theme};flex-shrink:0;">
          <strong>Princip fáze (${esc(p.label)}):</strong> ${esc(p.principle)}
        </div>
        <div class="req">
          <h4 style="flex-shrink:0;">${esc(c.requiredTitle)} pro ${esc(p.label)} (Označ min. 3 otázky: ${qCount}/3)${voiceLockBadge('questions')}</h4>
          <div class="actions" style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;">
            ${(p.questions || []).map(q => actionBtn(`„${q}“`, '', callState.questions.includes(q), 'toggle-arr', 'questions', q)).join('')}
          </div>
          <div class="hint" style="${qCount >= 3 ? 'color:#0050ff' : 'color:#ef4444;font-weight:950'}">
            ${qCount >= 3 ? 'Splněno. Můžeš přejít na další kartu.' : `⚠️ Pro přechod dál označ minimálně 3 položené otázky (vybráno: ${qCount}/3).`}
          </div>
        </div>
      `);
    }

    const needGroupsDef = {
      rodina: { 
        title: 'Rodina / Spolu', cls: 'need-rodina', product: 'spolu', 
        items: [
          'Má více služeb v domácnosti', 'Má další čísla v rodině', 'Má služby u konkurence',
          'Platí více faktur', 'Chce snížit náklady domácnosti', 'Chce služby sloučit', 'Chce jednodušší správu služeb'
        ]
      },
      postpaid: { 
        title: 'Postpaid / NEO+', cls: 'need-postpaid', product: 'neo', 
        items: [
          'Není spokojený s cenou', 'Dochází mu data nebo FUP', 'Omezuje používání mobilu',
          'Má číslo u konkurence', 'Využívá mobil aktivně v 5G', 'Využije chytré hodinky / tablet', 'Chce slevu na nový telefon'
        ]
      },
      internet: { 
        title: 'Internet / Wi-Fi', cls: 'need-internet', product: 'internet', 
        items: [
          'Platí hodně u konkurence', 'Má pomalý internet', 'Má výpadky připojení',
          'Má slabou Wi‑Fi doma', 'Pracuje / studuje z domova', 'Potřebuje silný router Smart Box', 'Chce internet spojit s dalšími službami'
        ]
      },
      televize: { 
        title: 'Oneplay / Unity', cls: 'need-tv', product: 'oneplay', 
        items: [
          'Sleduje TV nebo streamy', 'Chybí mu sport (Liga mistrů, hokej)', 'Chybí mu filmy a seriály',
          'Chce zpětné sledování až 7 dní', 'Sleduje na více zařízeních současně', 'Chce slevu 300 Kč na účet přes Unity', 'Platí více streamovacích služeb naráz'
        ]
      }
    };

    function getNeedProduct(needText) {
      for (const key in needGroupsDef) {
        const g = needGroupsDef[key];
        if (g.items.includes(needText)) {
          return /unity/i.test(needText) ? 'unity' : g.product;
        }
      }
      return 'spolu';
    }

    function buildDynamicPitch() {
      const p = products[activeProduct];
      if (!callState.needs.length) return p.principle;
      const needsText = callState.needs.map(n => n.replace(/\.$/, '').toLowerCase()).join(' a že ');
      return `„Protože jste zmínil, že řešíte, že ${needsText}, připravil jsem pro vás řešení ${p.label}, které vám dá maximální přínos, špičkovou kvalitu O2 a klid na jedné přehledné faktuře.“`;
    }

    function renderNabidka() {
      let c = cards.nabidka;
      const dynamicPitch = buildDynamicPitch();
      return baseCard(`
        <div class="say ok" style="flex-shrink:0;">
          <div class="small"> Prodejní věta na míru</div>
          <div class="sentence" style="color:#0050ff">${esc(dynamicPitch)}</div>
        </div>
        <div class="req">
          <h4 style="flex-shrink:0;">${esc(c.requiredTitle)}</h4>
          <div class="actions" style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;">
            ${productOrder.map(k => pill(products[k].label, activeProduct === k, 'set-product', '', k)).join('')}
          </div>
          <div class="hint" style="color:#0050ff">
            Nabídka je potvrzená výběrem produktu / pokračováním na další krok. Samostatné tlačítko není potřeba.
          </div>
        </div>
      `);
    }

    function getBenefitHighlight(b, needs) {
      const n = needs.join(' ').toLowerCase(), t = b.toLowerCase();
      return (t.includes('connect') && (n.includes('mobil') || n.includes('data') || n.includes('zařízení') || n.includes('hodinky'))) ||
             (t.includes('smart') && (n.includes('wi') || n.includes('router') || n.includes('zlobí') || n.includes('pomal'))) ||
             (t.includes('mesh') && (n.includes('wi') || n.includes('pokrytí') || n.includes('slab'))) ||
             (t.includes('spolu') && (n.includes('rodina') || n.includes('faktur') || n.includes('domácnost') || n.includes('sloučit'))) ||
             (t.includes('unity') && (n.includes('cena') || n.includes('drah') || n.includes('levněj') || n.includes('300') || n.includes('úspora'))) ||
             (t.includes('sport') && (n.includes('stream') || n.includes('tv') || n.includes('liga') || n.includes('oneplay')));
    }

    function renderVyhody() {
      let c = cards.vyhody, p = products[activeProduct];
      let entries = Object.entries(p.copilotBenefits || {});
      if (!entries.length && p.benefits) entries = p.benefits.map(b => [b, '']);
      const bCount = (callState.benefits || []).length;
      return baseCard(`
        <div class="say" style="flex-shrink:0;">
          <div class="small">${esc(c.small)} pro ${esc(p.label)}</div>
          <div class="sentence">${esc(c.sentence)}</div>
        </div>
        <div class="req">
          <h4 style="flex-shrink:0;">${esc(c.requiredTitle)} (Označ min. 3 výhody: ${bCount}/3)${voiceLockBadge('benefits')}</h4>
          <div class="actions" style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;">
            ${entries.map(([title, desc]) => {
              let h = getBenefitHighlight(title, callState.needs) || getBenefitHighlight(desc, callState.needs);
              return actionBtn(title, desc, (callState.benefits || []).includes(title), 'toggle-arr', 'benefits', title, h ? 'style="border-color:#f59e0b;background:#fffbeb"' : '');
            }).join('')}
          </div>
          <div class="hint" style="${bCount >= 3 ? 'color:#0050ff' : 'color:#ef4444;font-weight:950'}">
            ${bCount >= 3 ? 'Splněno. Můžeš přejít na další kartu.' : `⚠️ Pro přechod dál označ minimálně 3 vysvětlené výhody (vybráno: ${bCount}/3).`}
          </div>
        </div>
      `);
    }

    function renderUzitky() {
      let c = cards.uzitky, p = products[activeProduct];
      let entries = Object.entries(p.copilotUtilities || {});
      if (!entries.length && p.trialCloses) entries = p.trialCloses.map(tc => [tc, '']);
      const uCount = (callState.utilities || []).length;
      return baseCard(`
        <div class="say" style="flex-shrink:0;">
          <div class="small">${esc(c.small)} pro ${esc(p.label)}</div>
          <div class="sentence">${esc(c.sentence)}</div>
        </div>
        <div class="req">
          <h4 style="flex-shrink:0;">${esc(c.requiredTitle)} (Označ min. 3 užitky: ${uCount}/3)${voiceLockBadge('utilities')}</h4>
          <div class="actions" style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;">
            ${entries.map(([title, desc]) => {
              return actionBtn(title, desc, (callState.utilities || []).includes(title), 'toggle-arr', 'utilities', title);
            }).join('')}
          </div>
          <div class="hint" style="${uCount >= 3 ? 'color:#0050ff' : 'color:#ef4444;font-weight:950'}">
            ${uCount >= 3 ? 'Splněno. Můžeš přejít na další kartu.' : `⚠️ Pro přechod dál označ minimálně 3 použité užitky (vybráno: ${uCount}/3).`}
          </div>
        </div>
      `);
    }

    // Karta 7 (Dotažení) – rychlé možnosti podle trasy, když agent NEROZMLUVIL zákazníka
    const fastTrackClosings = {
      cas: [
        'Sjednán přesný termín zpětného volání',
        'Korektně ukončeno – omyl / neplatný kontakt',
        'Odeslána informační SMS / vizitka',
        'Zákazník v silném spěchu – nepřebíhat do nabídky'
      ],
      omyl: [
        'Sjednán přesný termín zpětného volání',
        'Korektně ukončeno – omyl / neplatný kontakt',
        'Odeslána informační SMS / vizitka',
        'Zákazník v silném spěchu – nepřebíhat do nabídky'
      ],
      vyreseno: [
        'Ověřit, co přesně bylo vyřešeno',
        'Zkontrolovat současné nastavení',
        'Porovnat výslednou cenu',
        'Najít doplnění služby',
        'O2 Spolu / Unity jako lepší rámec',
        'Ponecháno stávající řešení – zápis do CRM'
      ]
    };

    function getClosingSteps() {
      const route = callState.route;
      const didntReachOffer = !callState.offerMade;
      if (fastTrackClosings[route] && didntReachOffer) {
        return fastTrackClosings[route];
      }
      const p = products[activeProduct];
      return [...(p.closing || [])];
    }

    function renderDotazeni() {
      let c = cards.dotazeni;
      const steps = getClosingSteps();
      return baseCard(`
        <div class="say ok" style="flex-shrink:0;">
          <div class="small">${esc(c.small)}</div>
          <div class="sentence">${esc(c.sentence)}</div>
        </div>
        <div class="req">
          <h4 style="flex-shrink:0;">${esc(c.requiredTitle)}${voiceLockBadge('closing')}</h4>
          <div class="actions" style="flex:1;overflow-y:auto;min-height:0;padding-right:4px;">
            ${[...new Set(steps)].map(s => pill(s, selectedNextStep(s), 'set-closing', '', s)).join('')}
          </div>
        </div>
      `);
    }

    function renderNew() {
      let c = cards.new;
      let p = products[activeProduct] || products.spolu;
      let status = callState.finalStatus;
      let statuses = ['Prodáno', 'Zpětný kontakt', 'Neprodáno'];
      
      let statusButtons = `
        <div class="choice-grid" style="margin-top: 4px;">
          ${statuses.map(st => {
            let active = status === st;
            return `<div class="choice ${distributeColors[st]} ${active ? 'active' : ''}" data-action="set-final-status" data-val="${st}"><strong>${active ? '🎉 ' : ''}${st}</strong></div>`;
          }).join('')}
        </div>
      `;
      
      let statusDetail = '';
      if (status === 'Prodáno') {
        statusDetail = `
          <div class="box" style="border: 2px solid #047857; background: #ecfdf5; margin-top: 8px; text-align: center; padding: 18px; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 0;">
            <h4 style="color: #047857; font-size: 15px; margin-bottom: 6px;">🎉 Skvěle, jen tak dále!</h4>
            <p style="color: #065f46; font-size: 13px; font-weight: 850;">Výborná prodejní práce. Obchodní stopa je kompletní, nyní stačí hovor uložit.</p>
          </div>
        `;
      } else if (status === 'Neprodáno' || status === 'Zpětný kontakt') {
        let objs = Object.entries(p.objections || {});
        statusDetail = `
          <div class="box" style="border: 2px solid #c2410c; background: #fffbeb; margin-top: 8px; padding: 12px; display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden;">
            <h4 style="color: #c2410c; font-size: 11.5px; margin-bottom: 4px; flex-shrink: 0;">💡 Použil jsi reakci na námitky? (Zkontroluj copilot pro ${esc(p.label)})</h4>
            <p style="color: #78350f; font-size: 11.5px; margin-bottom: 8px; font-weight: 850; flex-shrink: 0;">Než hovor uzavřeš, ověř si, že nezůstala nezpracovaná námitka, která by se dala ještě zachránit:</p>
            <div style="display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; min-height: 0; padding-right: 4px;">
              ${objs.map(([o, a]) => `
                <div class="quote copilot-namitka" style="margin:0; cursor:pointer; flex-shrink:0;" data-action="copilot-objection" data-val="${esc(o)}">
                  <strong>👉 NÁMITKA: ${esc(o)}</strong><br>
                  <span style="font-size:12px; font-weight: 800;">${esc(a)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      return `
        <div class="cardhead c6">
          <div class="cardtitle">${esc(c.title)}</div>
          <div class="badge" style="background:${status ? '#10b981' : '#f59e0b'}">${status ? 'STATUS VYBRÁN' : 'ZVOL VÝSLEDEK'}</div>
        </div>
        <div class="body">
          <div class="box" style="flex-shrink:0; display: block;">
            <h4 style="margin: 0 0 8px 0;">Možné statusy hovoru (Zvol pro pokračování):</h4>
            ${statusButtons}
          </div>
          ${statusDetail}
          <div class="nav">
            <button class="sec" data-action="go-card" data-val="${currentIndex - 1}">${esc(c.backButton)}</button>
            <button class="greenbtn" style="grid-column:span 2; ${!status ? 'opacity:0.45;' : ''}" data-action="new-call" data-save="true">${esc(c.saveButton)}</button>
          </div>
        </div>
      `;
    }

    function renderCard() {
      let id = currentBlock().id;
      return id === 'situace' ? renderChoice() :
             id === 'reseni' ? renderReseni() :
             id === 'profilace' ? renderProfilace() :
             id === 'nabidka' ? renderNabidka() :
             id === 'vyhody' ? renderVyhody() :
             id === 'uzitky' ? renderUzitky() :
             id === 'dotazeni' ? renderDotazeni() :
             renderNew();
    }

    function cardPrefillCount(blockId) {
      if (blockId === 'profilace') return (callState.questions || []).length;
      if (blockId === 'vyhody')    return (callState.benefits   || []).length;
      if (blockId === 'uzitky')   return (callState.utilities  || []).length;
      if (blockId === 'dotazeni') return (callState.nextSteps  || []).length;
      return 0;
    }

    function renderRoadmap() {
      blocks = getBlocks();
      let pct = ((currentIndex + 1) / blocks.length) * 100;
      let isFast = isFastTrack();
      
      $('roadmapHost').innerHTML = `
        <div class="road-head"><span>Navigace</span><b>${currentIndex + 1}/${blocks.length}</b></div>
        <div class="progress"><span style="width:${pct}%"></span></div>
        <div class="road-list">
          ${blocks.map((b, i) => {
             let skipped = isFast && i >= 2 && i <= 5;
             let status = skipped ? 'přeskočeno (fast-track)' : i < currentIndex ? 'hotovo' : i === currentIndex ? 'aktuální krok' : 'volně přístupné';
             let prefill = i > currentIndex ? cardPrefillCount(b.id) : 0;
             let prefillBadge = prefill > 0 ? '<span style="display:inline-flex;align-items:center;justify-content:center;min-width:14px;height:14px;background:#10b981;color:#fff;border-radius:999px;font-size:8px;font-weight:950;padding:0 3px;margin-left:4px;vertical-align:middle;">🎤' + prefill + '</span>' : '';
             return `
              <button class="road-item ${i < currentIndex ? 'done' : i === currentIndex ? 'cur' : ''}" style="${skipped ? 'opacity:.4' : ''}" data-action="go-roadmap-card" data-val="${i}">
                <span class="num">${skipped ? '-' : i < currentIndex ? '✓' : i + 1}</span>
                <span>
                  <div class="rt">${esc(getNavigationName(b))}${prefillBadge}</div>
                  <div class="rs">${esc(status)}</div>
                </span>
              </button>
            `;
          }).join('')}
        </div>
      `;
    }

    function renderProductButtons() {
      $('productButtons').innerHTML = productOrder.map(k =>
          `<button class="${k === activeProduct ? 'active' : ''}" data-action="set-product" data-val="${k}">${esc(products[k].label)}</button>`
      ).join('');
    }

    function generateCopilotAdvice() {
      const step = currentBlock().id;
      const qLen = callState.questions.length;
      const nLen = callState.needs.length;
      const lines = [];
      let recScores = { spolu: 0, neo: 0, internet: 0, oneplay: 0, unity: 0 };
      const allText = (callState.needs.join(' ') + ' ' + callState.questions.join(' ')).toLowerCase();
      
      if (allText.includes('faktur') || allText.includes('domácnost') || allText.includes('rodina') || allText.includes('sloučit') || allText.includes('více služeb')) recScores.spolu += 5;
      if (allText.includes('data') || allText.includes('mobil') || allText.includes('fup') || allText.includes('5g') || allText.includes('tarif')) recScores.neo += 5;
      if (allText.includes('wi') || allText.includes('internet') || allText.includes('pomal') || allText.includes('výpadk') || allText.includes('router')) recScores.internet += 5;
      if (allText.includes('tv') || allText.includes('stream') || allText.includes('sport') || allText.includes('seriál') || allText.includes('televiz')) recScores.oneplay += 5;
      if (allText.includes('cena') || allText.includes('drah') || allText.includes('unity') || allText.includes('sleva') || allText.includes('odměn')) recScores.unity += 4;
      
      let bestProduct = 'spolu';
      let highestScore = 0;
      for (let [k, v] of Object.entries(recScores)) {
        if (v > highestScore) { highestScore = v; bestProduct = k; }
      }

      if (isFastTrack()) {
        lines.push('🔥 **FAST-TRACK STRATEGIE:** Zákazník je pod tlakem nebo jde o nestandardní kontakt.');
        lines.push('💡 **MANAGEMENT ČASU:** Respektujte čas a netlačte složité balíčky. Okamžitě si zjednejte respekt.');
        lines.push('🎯 **AKCE:** Zafixujte pevný termín hovoru, nebo řešte jen absolutní prioritu.');
        return lines.join('<br>');
      }

      if (step === 'situace') {
        lines.push('🎯 **OTEVŘENÍ HOVORU:** Prvních 15 vteřin rozhoduje o autoritě a pozornosti.');
        lines.push('💡 **PSYCHOLOGIE:** Okamžitě převezměte iniciativu jasným důvodem a sebevědomým tónem.');
        lines.push('⚡ **AKCE:** Bezpečně ověřte zákazníka a zjistěte jeho první reakci.');
      } else if (step === 'reseni') {
        lines.push('🎯 **KONTROLA ROZCESTÍ:** Klíčový moment pro udržení hovoru ve správných kolejích.');
        lines.push('💡 **STAVBA MOSTU:** Ukažte klientovi, že ekosystém O2 je o úroveň výš.');
        lines.push('⚡ **AKCE:** Vyberte levý i pravý sloupec. Spojte jeho stávající požadavek s prodejní stopou.');
      } else if (step === 'profilace' || step === 'nabidka') {
        lines.push(`🎯 **HLUBOKÁ DIAGNOSTIKA:** Cílem je vytáhnout potřeby, najít emoce a přínos pro klienta.`);
        if (qLen === 0 && nLen === 0) {
          lines.push('⚠️ **ANALÝZA:** Zatím chybí data. Ptejte se a naslouchejte.');
        } else {
          lines.push(`📊 **STAV PROFILACE:** Zjištěno ${nLen} potřeb z ${qLen} položených otázek.`);
          if (highestScore > 0) {
            lines.push(`🌟 **ŠPIČKOVÉ DOPORUČENÍ:** Analýza dat jednoznačně ukazuje na řešení **${products[bestProduct].label}**.`);
            lines.push(`💡 **STRATEGIE:** Zákazník vykazuje silné signály pro tento produkt. Přizpůsobte tomu prodejní argumentaci.`);
          } else {
            lines.push('⚠️ **UPOZORNĚNÍ:** Data z profilace jsou zatím roztříštěná. Hledejte společného jmenovatele (např. rodinná úspora).');
          }
        }
      } else {
        if (highestScore > 0) {
          lines.push(`🎯 **PRODEJNÍ FÁZE:** Nabízíte ideální řešení **${products[bestProduct].label}** navázané na profilaci.`);
          lines.push('💡 **FINANČNÍ KOTVA:** Zmiňte ceníkovou cenu a okamžitě ukažte masivní pokles díky balíčku a Unity.');
        } else {
          lines.push(`🎯 **PREZENTACE ŘEŠENÍ:** Nabízíte vybraný produkt **${products[activeProduct].label}**.`);
          lines.push('💡 **ARGUMENTACE:** Neprodávejte parametry. Prodejte klid, bezpečí, úsporu a pohodlí.');
        }
        
        if (callState.objection && callState.objection !== 'bez námitky' && !callState.objectionHandled) {
          lines.push(`🔥 **KRITICKÝ BOD:** Blokuje vás námitka „${callState.objection}“. Využijte pravý štít Copilota!`);
        } else if (step === 'dotazeni') {
          lines.push('⚡ **DOTAŽENÍ:** Nepusťte zákazníka ze sluchátka bez jasně zapsaného kroku do CRM systémů O2.');
        } else {
          lines.push('⚡ **AKCELERACE SOUHLASU:** Položte alternativní otázku (např. „Nastavíme od zítřka, nebo od nového zúčtování?“).');
        }
      }
      return lines.slice(0, 7).join('<br>');
    }

    function renderFarewellPanel() {
      const stavajici = [
        '„Moc děkuji za váš dnešní čas. Hlavně si ale vážíme vaší důvěry a toho, že využíváte služby od O2. Přeji vám krásný zbytek dne."',
        '„Bylo mi potěšením s vámi mluvit. Děkujeme, že jste s námi, a ať už vás dnes čeká cokoliv, přeji, ať se vám to vydaří. Na shledanou."',
        '„Díky, že jste si na mě udělal čas. Opravdu si ceníme toho, že jste naším zákazníkem. Kdykoliv byste cokoliv potřeboval, jsme tu pro vás. Mějte se hezky."'
      ];
      const akvi = [
        '„Moc si vážím toho, že jste si mě vyslechl a věnoval mi svůj čas. I když naše služby teď nevyužíváte, třeba se to do budoucna změní. Přeji vám velmi úspěšný den."',
        '„Děkuji vám za fajn rozhovor. Třeba se naše cesty v budoucnu ještě protnou, do té doby vám přeji, ať se vám daří. Na shledanou."',
        '„Děkuji za upřímnost a váš dnešní čas. Necháme to zatím být, a třeba se pro vás u O2 najde něco zajímavého někdy příště. Mějte co nejklidnější zbytek dne."'
      ];
      $('productCard').innerHTML = `
        <div class="prod-title" style="flex-shrink:0;">
          <span>Rozloučení se zákazníkem</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;overflow-y:auto;flex:1;min-height:0;padding-right:2px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-left:5px solid #0050ff;border-radius:12px;padding:10px 12px;flex-shrink:0;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.4px;font-weight:950;color:#0050ff;margin-bottom:6px;">🔵 Stávající zákazníci – poděkování za důvěru</div>
            <p style="font-size:11px;color:#475569;font-weight:750;margin-bottom:8px;line-height:1.4;">Zákazník musí cítit, že si ho O2 váží nejen ve chvíli prodeje, ale dlouhodobě.</p>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${stavajici.map(t => `<div style="background:#fff;border:1px solid #bfdbfe;border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.55;font-weight:600;color:#0f172a;">${esc(t)}</div>`).join('')}
            </div>
          </div>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-left:5px solid #c2410c;border-radius:12px;padding:10px 12px;flex-shrink:0;">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.4px;font-weight:950;color:#c2410c;margin-bottom:6px;">🟠 Akvizice / ne-zákazníci – otevřené dveře</div>
            <p style="font-size:11px;color:#475569;font-weight:750;margin-bottom:8px;line-height:1.4;">Cíl: zanechat dojem – <em>„Tohle byl profík, s těmi by se dalo v budoucnu bavit."</em></p>
            <div style="display:flex;flex-direction:column;gap:6px;">
              ${akvi.map(t => `<div style="background:#fff;border:1px solid #fed7aa;border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.55;font-weight:600;color:#0f172a;">${esc(t)}</div>`).join('')}
            </div>
          </div>
        </div>
      `;
    }

    function renderProductCopilot() {
      // Karta 8 se zvoleným statusem → zobraz panel rozloučení
      if (currentBlock().id === 'new' && callState.finalStatus) {
        renderFarewellPanel();
        return;
      }

      let p = products[activeProduct];
      let content = '';
      if (copilotTab === 'potreby') {
        const nCount = callState.needs.length;
        let groupsHtml = Object.values(needGroupsDef).map(g => `
          <div class="need-section ${g.cls}">
            <h4>${esc(g.title)}</h4>
            <div class="need-inner">
              ${g.items.map(n => {
                const isActive = callState.needs.includes(n);
                const isSuggested = !isActive && (callState.voiceSuggestedNeeds || []).includes(n);
                return pill(n, isActive, 'toggle-arr', 'needs', n, isSuggested ? 'voice-hint' : '');
              }).join('')}
            </div>
          </div>
        `).join('');
        
        content = `
          <h4 style="margin-top:0;">Potřeby zákazníka (Vybráno: ${nCount})</h4>
          <div class="need-section-grid">
            ${groupsHtml}
          </div>
        `;
      } else if (copilotTab === 'namitky') {
        content = `<h4> Rychlý štít námitek (O2 Corporate)</h4>${Object.entries(p.objections || {}).map(([o, a]) => `
          <div class="quote copilot-namitka" style="cursor:pointer" data-action="copilot-objection" data-val="${esc(o)}">
            <strong>👉 NÁMITKA: ${esc(o)}</strong><br>${esc(a)}
          </div>
        `).join('')}`;
      } else if (copilotTab === 'vyhody') {
        content = `<h4> Prodejní argumenty & benefity O2</h4>${Object.entries(p.copilotBenefits || {}).map(([t, d]) => `
          <div class="quote copilot-vyhoda">
            <strong>👉 ARGUMENT: ${esc(t)}</strong><br>${esc(d)}
          </div>
        `).join('')}`;
      } else {
        content = `<h4> Reálné užitky & uzavření</h4>${Object.entries(p.copilotUtilities || {}).map(([t, d]) => `
          <div class="quote copilot-uzitek">
            <strong>👉 PŘÍNOS: ${esc(t)}</strong><br>${esc(d)}
          </div>
        `).join('')}`;
      }
      
      $('productCard').innerHTML = `
        
        <div class="recommend">
          <div style="display:flex; gap:4px; margin-bottom:8px">
            <button class="filter-btn ${copilotTab === 'potreby' ? 'active' : ''}" style="flex:1; padding:6px 2px; font-size:10px" data-action="copilot-tab" data-val="potreby"> Potřeby</button>
            <button class="filter-btn ${copilotTab === 'namitky' ? 'active' : ''}" style="flex:1; padding:6px 2px; font-size:10px" data-action="copilot-tab" data-val="namitky"> Námitky</button>
            <button class="filter-btn ${copilotTab === 'vyhody' ? 'active' : ''}" style="flex:1; padding:6px 2px; font-size:10px" data-action="copilot-tab" data-val="vyhody"> Výhody</button>
            <button class="filter-btn ${copilotTab === 'uzitky' ? 'active' : ''}" style="flex:1; padding:6px 2px; font-size:10px" data-action="copilot-tab" data-val="uzitky"> Užitky</button>
          </div>
          ${content}
        </div>
      `;
    }

    function renderNotesOverview() {
      let rows = [];
      let hasAny = false;
      productOrder.forEach(key => {
        const p = products[key];
        const askedQuestions = (p.questions || []).filter(q => callState.questions.includes(q));
        const productNeeds = (callState.needs || []).filter(n => getNeedProduct(n) === key);
        
        if (askedQuestions.length === 0 && productNeeds.length === 0) return;
        
        hasAny = true;
        rows.push(`<div class="note-section"><h4>${esc(p.label)}</h4>`);
        if (askedQuestions.length) {
          rows.push(`<div class="small" style="margin:0 0 4px">Použité otázky (${askedQuestions.length}):</div><div class="note-list">`);
          askedQuestions.forEach(q => rows.push(`<div class="note-row"><span class="note-dot warn">?</span><span>${esc(q)}</span></div>`));
          rows.push(`</div>`);
        }
        if (productNeeds.length) {
          rows.push(`<div class="small" style="margin:8px 0 4px">Zjištěné potřeby (${productNeeds.length}):</div><div class="note-list">`);
          productNeeds.forEach(n => rows.push(`<div class="note-row"><span class="note-dot done">✓</span><span>${esc(n)}</span></div>`));
          rows.push(`</div>`);
        }
        rows.push(`</div>`);
      });

      if (!hasAny) {
        rows.push(`<div class="note-empty">Zatím nebyly zaznamenány žádné otázky ani zjištěné potřeby. Jakmile začnete klikat v prodejních fázích, zde se vytvoří přehled.</div>`);
      }
      return rows.join('');
    }

    function renderNotesScore() {
      const score = calculateScore();
      let color = '#dc2626';
      let label = 'Rozpracováno / Neúplné';
      if (score >= 80) { color = '#10b981'; label = 'Komplexní špičkový hovor'; }
      else if (score >= 50) { color = '#c2410c'; label = 'Standardní průběh'; }
      else if (isFastTrack()) { color = '#3b82f6'; label = 'Fast-Track / Zkrácený hovor'; }

      $('notesScoreHost').innerHTML = `
        <div style="background: linear-gradient(135deg, var(--o2d) 0%, var(--o2) 52%, #4f46e5 78%, #7c3aed 100%); color: #fff; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; box-shadow: 0 4px 16px rgba(79, 46, 180, .28);">
          <div>
            <div style="font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 950; color: #dbeafe;">% Hodnocení hovoru</div>
            <div style="font-size: 11px; font-weight: 850; color: #fff; margin-top: 2px;">${esc(label)}</div>
          </div>
          <div style="background: rgba(255,255,255,0.18); border: 2px solid rgba(255,255,255,0.4); border-radius: 999px; padding: 6px 12px; font-size: 16px; font-weight: 950; color: #fff;">
            ${score}%
          </div>
        </div>
      `;
    }

    function renderSelected() {
      $('selectedNotes').innerHTML = renderNotesOverview();
    }

    function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
    function avg(arr) { return arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : 0; }

    function filterHistoryByPeriod(p) {
      const todayStr = todayKey();
      let yest = new Date(); yest.setDate(yest.getDate() - 1); const yestStr = yest.toLocaleDateString('cs-CZ');
      if (p === 'today') return callHistory.filter(x => x.date === todayStr);
      if (p === 'yesterday') return callHistory.filter(x => x.date === yestStr);
      if (p === '7days') { const c = new Date(); c.setDate(c.getDate() - 7); return callHistory.filter(x => new Date(x.endedAt || x.startedAt) >= c); }
      return callHistory;
    }

    function getTopItems(data, key, limit = 4) {
      const counts = {};
      data.forEach(item => {
        const arr = item[key] || [];
        arr.forEach(val => {
          counts[val] = (counts[val] || 0) + 1;
        });
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
    }

    function buildCallsChart(data, period) {
      let labels = [];
      let counts = {};
      if (period === 'today' || period === 'yesterday') {
        for (let h = 8; h <= 19; h++) {
          labels.push({ key: h, label: `${String(h).padStart(2, '0')}:00` });
          counts[h] = 0;
        }
        data.forEach(x => {
          const d = new Date(x.endedAt || x.startedAt || new Date());
          const h = d.getHours();
          if (h >= 8 && h <= 19) counts[h] += (x.callsCount || 1);
        });
      } else {
        const daysCount = period === '7days' ? 7 : 14;
        const today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toLocaleDateString('cs-CZ');
          const shortStr = `${d.getDate()}.${d.getMonth() + 1}.`;
          labels.push({ key: dateStr, label: shortStr });
          counts[dateStr] = 0;
        }
        data.forEach(x => {
          if (counts[x.date] !== undefined) {
            counts[x.date] += (x.callsCount || 1);
          }
        });
      }

      const maxVal = Math.max(1, ...Object.values(counts));
      return `
        <div class="chart" style="display:flex;flex-direction:column;flex:1;min-height:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-shrink:0;">
            <h4>Hovory (${period === 'today' || period === 'yesterday' ? 'po hodinách' : 'po dnech'})</h4>
            <div style="font-size:10px;font-weight:950;color:var(--o2)">■ Odbavené hovory O2</div>
          </div>
          <div class="chart-grid" style="display:grid; grid-template-columns: repeat(${labels.length}, minmax(0, 1fr)); gap:3px; align-items:flex-end; flex:1; min-height:80px; height:auto; padding:12px 0 4px 0; border-bottom:2px solid #cbd5e1;">
            ${labels.map(l => {
              const count = counts[l.key] || 0;
              const cPct = Math.round((count / maxVal) * 100);
              return `<div class="chart-col"><div class="bars-wrapper" style="height:100%"><div class="bar-calls" style="height:${Math.max(cPct, count > 0 ? 12 : 0)}%" title="${count} hovorů">${count > 0 ? `<span class="bar-label">${count}</span>` : ''}</div></div><div class="col-label" style="font-size:${labels.length > 12 ? '8.5px' : '10px'}">${l.label}</div></div>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    function buildClicksChart(data, period) {
      let labels = [];
      let counts = {};
      const currentToday = todayKey();

      if (period === 'today' || period === 'yesterday') {
        for (let h = 8; h <= 19; h++) {
          labels.push({ key: h, label: `${String(h).padStart(2, '0')}:00` });
          counts[h] = 0;
        }
        data.forEach(x => {
          if (x.actionLog && Array.isArray(x.actionLog)) {
            x.actionLog.forEach(act => {
              if (act.ts) {
                const d = new Date(act.ts);
                const h = d.getHours();
                if (h >= 8 && h <= 19) counts[h]++;
              }
            });
          }
        });
        if (period === 'today' && callState.date === currentToday && callState.actionLog) {
          callState.actionLog.forEach(act => {
            if (act.ts) {
              const d = new Date(act.ts);
              const h = d.getHours();
              if (h >= 8 && h <= 19) counts[h]++;
            }
          });
        }
      } else {
        const daysCount = period === '7days' ? 7 : 14;
        const today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toLocaleDateString('cs-CZ');
          const shortStr = `${d.getDate()}.${d.getMonth() + 1}.`;
          labels.push({ key: dateStr, label: shortStr });
          counts[dateStr] = 0;
        }
        data.forEach(x => {
          if (counts[x.date] !== undefined) {
            counts[x.date] += (x.clicks || 0);
          }
        });
        if (counts[currentToday] !== undefined && callState.date === currentToday) {
          counts[currentToday] += (callState.clicks || 0);
        }
      }

      const maxVal = Math.max(1, ...Object.values(counts));
      return `
        <div class="chart" style="display:flex;flex-direction:column;flex:1;min-height:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-shrink:0;">
            <h4>Počet kliků (${period === 'today' || period === 'yesterday' ? 'po hodinách' : 'po dnech'})</h4>
            <div style="font-size:10px;font-weight:950;color:#10b981">■ Zaznamenané kliky</div>
          </div>
          <div class="chart-grid" style="display:grid; grid-template-columns: repeat(${labels.length}, minmax(0, 1fr)); gap:3px; align-items:flex-end; flex:1; min-height:80px; height:auto; padding:12px 0 4px 0; border-bottom:2px solid #cbd5e1;">
            ${labels.map(l => {
              const count = counts[l.key] || 0;
              const cPct = Math.round((count / maxVal) * 100);
              return `<div class="chart-col"><div class="bars-wrapper" style="height:100%"><div class="bar-calls" style="height:${Math.max(cPct, count > 0 ? 12 : 0)}%; background:#10b981" title="${count} kliků">${count > 0 ? `<span class="bar-label">${count}</span>` : ''}</div></div><div class="col-label" style="font-size:${labels.length > 12 ? '8.5px' : '10px'}">${l.label}</div></div>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    function buildItemsPerProductChart(data, period, histField, productField, title) {
      var prodDefs = [
        { key: 'spolu',    label: 'O2 Spolu', color: '#0050ff' },
        { key: 'neo',      label: 'Postpaid', color: '#7c3aed' },
        { key: 'internet', label: 'Internet', color: '#0ea5e9' },
        { key: 'oneplay',  label: 'Oneplay',  color: '#f97316' },
        { key: 'unity',    label: 'Unity',    color: '#10b981' }
      ];
      var itemToPk = {};
      Object.entries(products).forEach(function([pk, p]) {
        var src = productField === 'questions' ? (p.questions || []) : Object.keys(p[productField] || {});
        src.forEach(function(item) { itemToPk[item] = pk; });
      });
      var labels = [], buckets = {};
      var isHourly = period === 'today' || period === 'yesterday';
      if (isHourly) {
        for (var h = 8; h <= 19; h++) { labels.push({ key: h, label: String(h).padStart(2,'0')+':00' }); buckets[h] = {}; }
        data.forEach(function(x) {
          var d = new Date(x.endedAt || x.startedAt || new Date()), hh = d.getHours();
          if (hh >= 8 && hh <= 19) {
            var items = x[histField] || [];
            items.forEach(function(item) {
              var pk = itemToPk[item] || x.productKey || 'spolu';
              buckets[hh][pk] = (buckets[hh][pk] || 0) + 1;
            });
            if (!items.length && x[histField+'Count']) { var pk = x.productKey||'spolu'; buckets[hh][pk]=(buckets[hh][pk]||0)+x[histField+'Count']; }
          }
        });
      } else {
        var daysCount = period === '7days' ? 7 : 14, today2 = new Date();
        for (var i = daysCount-1; i >= 0; i--) {
          var dd = new Date(); dd.setDate(today2.getDate()-i);
          var ds = dd.toLocaleDateString('cs-CZ'), ss = dd.getDate()+'.'+(dd.getMonth()+1)+'.';
          labels.push({ key: ds, label: ss }); buckets[ds] = {};
        }
        data.forEach(function(x) {
          if (buckets[x.date] !== undefined) {
            var items = x[histField] || [];
            items.forEach(function(item) {
              var pk = itemToPk[item] || x.productKey || 'spolu';
              buckets[x.date][pk] = (buckets[x.date][pk] || 0) + 1;
            });
          }
        });
      }
      var maxVal = 1;
      labels.forEach(function(l) { prodDefs.forEach(function(p) { var v=(buckets[l.key]||{})[p.key]||0; if(v>maxVal)maxVal=v; }); });
      var legend = prodDefs.map(function(p) {
        return '<span style="display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:950;color:'+p.color+'">'
          +'<span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:'+p.color+'"></span>'+p.label+'</span>';
      }).join('');
      var fs = labels.length > 12 ? '8.5px' : '10px';
      var colsHtml = labels.map(function(l) {
        var bk = buckets[l.key] || {};
        var bars = prodDefs.map(function(p) {
          var v = bk[p.key] || 0;
          if (v === 0) return '<div style="flex:1;"></div>';
          var pct = Math.max(Math.round((v/maxVal)*100), 12);
          return '<div style="flex:1;height:'+pct+'%;background:'+p.color+';border-radius:3px 3px 0 0;position:relative;transition:height .2s;" title="'+p.label+': '+v+'">'
            +'<span style="position:absolute;top:-13px;left:0;right:0;text-align:center;font-size:8px;font-weight:950;color:'+p.color+';line-height:1;">'+v+'</span></div>';
        }).join('');
        return '<div class="chart-col"><div class="bars-wrapper" style="height:100%;display:flex;align-items:flex-end;gap:1px;">'+bars+'</div>'
          +'<div class="col-label" style="font-size:'+fs+'">'+l.label+'</div></div>';
      }).join('');
      return '<div class="chart" style="display:flex;flex-direction:column;flex:1;min-height:0;">'
        +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-shrink:0;flex-wrap:wrap;gap:4px;">'
        +'<h4>'+title+' ('+(isHourly?'po hodinách':'po dnech')+')</h4>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'+legend+'</div></div>'
        +'<div class="chart-grid" style="display:grid;grid-template-columns:repeat('+labels.length+',minmax(0,1fr));gap:3px;align-items:flex-end;flex:1;min-height:80px;height:auto;padding:12px 0 4px 0;border-bottom:2px solid #cbd5e1;">'
        +colsHtml+'</div></div>';
    }

    function buildQuestionsPerProductChart(data, period) {
      return buildItemsPerProductChart(data, period, 'questions', 'questions', 'Profilační otázky dle produktu');
    }

    /* =========================================================================
       AI COACH – analytické jádro
       Porovnává úspěšné vs neúspěšné hovory a hledá vzorce, které rozhodují.
       ========================================================================= */
    function analyzeCoachInsights(data) {
      const sold = data.filter(x => x.finalStatus === 'Prodáno');
      const notSold = data.filter(x => x.finalStatus === 'Neprodáno');
      const callback = data.filter(x => x.finalStatus === 'Zpětný kontakt');
      const total = data.length;
      const conversionRate = total ? Math.round((sold.length / total) * 100) : 0;

      if (total < 3) {
        return { state: 'warmup', total, sold: sold.length, notSold: notSold.length, callback: callback.length, conversionRate };
      }

      // Frekvence a míra výskytu (rate = kolik % hovorů obsahuje danou položku)
      const freq = (calls, field) => {
        const m = new Map();
        calls.forEach(c => (c[field] || []).forEach(v => m.set(v, (m.get(v) || 0) + 1)));
        return m;
      };
      const rate = (m, size) => new Map([...m].map(([k, v]) => [k, v / (size || 1)]));

      // Lift analýza: kolikrát vyšší výskyt v prodaných vs neprodaných
      const lift = (soldMap, notSoldMap, minSoldRate = 0.25) => {
        const results = [];
        soldMap.forEach((sRate, key) => {
          if (sRate < minSoldRate) return;
          const nRate = notSoldMap.get(key) || 0;
          const liftVal = nRate > 0 ? sRate / nRate : sRate * 4;
          results.push({ item: key, soldRate: sRate, notSoldRate: nRate, lift: liftVal });
        });
        return results.sort((a, b) => b.lift - a.lift);
      };

      const soldQ = rate(freq(sold, 'questions'), sold.length);
      const notSoldQ = rate(freq(notSold, 'questions'), notSold.length);
      const soldN = rate(freq(sold, 'needs'), sold.length);
      const notSoldN = rate(freq(notSold, 'needs'), notSold.length);
      const soldB = rate(freq(sold, 'benefits'), sold.length);
      const notSoldB = rate(freq(notSold, 'benefits'), notSold.length);
      const soldU = rate(freq(sold, 'utilities'), sold.length);
      const notSoldU = rate(freq(notSold, 'utilities'), notSold.length);

      const winningQuestions = lift(soldQ, notSoldQ);
      const winningNeeds = lift(soldN, notSoldN);
      const winningBenefits = lift(soldB, notSoldB);
      const winningUtilities = lift(soldU, notSoldU);
      const missed = winningQuestions.filter(x => x.notSoldRate < 0.2 && x.soldRate >= 0.5);

      // Průměry na hovor
      const avgArr = (calls, field) => calls.length ? calls.reduce((s, c) => s + ((c[field] || []).length), 0) / calls.length : 0;
      const stats = {
        avgSoldQ: avgArr(sold, 'questions'),  avgNotSoldQ: avgArr(notSold, 'questions'),
        avgSoldN: avgArr(sold, 'needs'),      avgNotSoldN: avgArr(notSold, 'needs'),
        avgSoldB: avgArr(sold, 'benefits'),   avgNotSoldB: avgArr(notSold, 'benefits'),
        avgSoldU: avgArr(sold, 'utilities'),  avgNotSoldU: avgArr(notSold, 'utilities')
      };

      // Délka hovoru
      const avgDur = c => c.length ? Math.round(c.reduce((s, x) => s + (x.durationSec || 0), 0) / c.length) : 0;
      stats.soldDur = avgDur(sold);
      stats.notSoldDur = avgDur(notSold);

      // Konverze podle trasy
      const routeStats = {};
      data.forEach(c => {
        const r = c.route || 'unknown';
        (routeStats[r] = routeStats[r] || { total: 0, sold: 0 }).total++;
        if (c.finalStatus === 'Prodáno') routeStats[r].sold++;
      });
      const bestRoute = Object.entries(routeStats)
        .filter(([, s]) => s.total >= 2)
        .map(([k, s]) => ({ route: k, rate: (s.sold / s.total) * 100, total: s.total, sold: s.sold }))
        .sort((a, b) => b.rate - a.rate)[0];

      // Konverze podle produktu
      const prodStats = {};
      data.forEach(c => {
        const p = c.productKey || 'unknown';
        (prodStats[p] = prodStats[p] || { total: 0, sold: 0 }).total++;
        if (c.finalStatus === 'Prodáno') prodStats[p].sold++;
      });
      const bestProduct = Object.entries(prodStats)
        .filter(([, s]) => s.total >= 2)
        .map(([k, s]) => ({ key: k, rate: (s.sold / s.total) * 100, total: s.total, sold: s.sold }))
        .sort((a, b) => b.rate - a.rate)[0];

      // Skóre v prodaných vs neprodaných
      const avgScore = c => c.length ? Math.round(c.reduce((s, x) => s + (x.score || 0), 0) / c.length) : 0;
      stats.soldScore = avgScore(sold);
      stats.notSoldScore = avgScore(notSold);

      // ── Generování insightů ────────────────────────────────────────────────
      const insights = [];

      if (winningQuestions[0] && winningQuestions[0].lift >= 1.3) {
        const wq = winningQuestions[0];
        insights.push({
          tone: 'good', icon: 'sparkle',
          title: 'Otázka, která ti prodává',
          text: `„${wq.item}" — použil jsi ji v ${Math.round(wq.soldRate * 100)} % prodaných hovorů vs jen ${Math.round(wq.notSoldRate * 100)} % u neprodaných. Zařaď ji do standardní palety.`
        });
      }

      if (missed[0]) {
        const m = missed[0];
        insights.push({
          tone: 'bad', icon: 'warn',
          title: 'Chybí ti kritická otázka',
          text: `„${m.item}" pokládáš v ${Math.round(m.soldRate * 100)} % prodejů, ale jen ${Math.round(m.notSoldRate * 100)} % u neprodaných. Tady vzniká propast.`
        });
      }

      if (winningNeeds[0] && winningNeeds[0].lift >= 1.3) {
        const wn = winningNeeds[0];
        insights.push({
          tone: 'info', icon: 'compass',
          title: 'Potřeba se signálem prodeje',
          text: `Zákazníci s potřebou „${wn.item}" nakupují ${winningNeeds[0].lift >= 2 ? (Math.round(wn.lift * 10) / 10) + '× častěji' : 'výrazně častěji'} než ostatní. Aktivně na tuto potřebu naváděj.`
        });
      }

      if (sold.length >= 2 && notSold.length >= 2) {
        const qDiff = stats.avgSoldQ - stats.avgNotSoldQ;
        if (qDiff >= 1) {
          insights.push({
            tone: 'info', icon: 'depth',
            title: 'Hloubka profilace rozhoduje',
            text: `Prodejní hovory mají v průměru ${stats.avgSoldQ.toFixed(1)} otázek vs ${stats.avgNotSoldQ.toFixed(1)} u neprodaných. Málo otázek = ztracený prodej.`
          });
        }
        const uDiff = stats.avgSoldU - stats.avgNotSoldU;
        if (uDiff >= 1) {
          insights.push({
            tone: 'info', icon: 'utility',
            title: 'Užitky jsou tvůj most k souhlasu',
            text: `Prodáno vysvětlilo v průměru ${stats.avgSoldU.toFixed(1)} užitků, neprodáno jen ${stats.avgNotSoldU.toFixed(1)}. Každý užitek posiluje tvoji šanci.`
          });
        }
      }

      if (bestRoute && routes[bestRoute.route]) {
        insights.push({
          tone: 'good', icon: 'route',
          title: `Silná trasa: ${routes[bestRoute.route][0] || bestRoute.route}`,
          text: `${bestRoute.sold} prodejů z ${bestRoute.total} hovorů. U této trasy máš prokázaný rukopis — investuj do ní čas na profilaci.`
        });
      }

      if (bestProduct && products[bestProduct.key]) {
        insights.push({
          tone: 'good', icon: 'gem',
          title: `Zlatý produkt: ${products[bestProduct.key].label}`,
          text: `${bestProduct.sold} prodejů z ${bestProduct.total} nabídek. Když ve profilaci vidíš signály pro tento produkt, jdi po něm rozhodně.`
        });
      }

      if (winningUtilities[0] && winningUtilities[0].lift >= 1.5) {
        insights.push({
          tone: 'good', icon: 'lightning',
          title: 'Nejsilnější uzavírací užitek',
          text: `„${winningUtilities[0].item}" se v prodaných hovorech objevuje v ${Math.round(winningUtilities[0].soldRate * 100)} %, u neprodaných jen ${Math.round(winningUtilities[0].notSoldRate * 100)} %. Používej ho k finálnímu souhlasu.`
        });
      }

      if (stats.soldDur && stats.notSoldDur && Math.abs(stats.soldDur - stats.notSoldDur) > 30) {
        const diff = stats.soldDur - stats.notSoldDur;
        insights.push({
          tone: 'info', icon: 'clock',
          title: 'Délka hovoru vs výsledek',
          text: `Prodáno v průměru ${Math.floor(stats.soldDur/60)}m ${stats.soldDur%60}s, neprodáno ${Math.floor(stats.notSoldDur/60)}m ${stats.notSoldDur%60}s. ${diff > 0 ? 'Delší hovory ti přinášejí prodej — nespěchej.' : 'Kratší cílené hovory ti fungují lépe než dlouhá vysvětlování.'}`
        });
      }

      if (stats.soldScore && stats.notSoldScore) {
        const sDiff = stats.soldScore - stats.notSoldScore;
        if (sDiff >= 15) {
          insights.push({
            tone: 'info', icon: 'chart',
            title: 'Skóre hovoru = predikce prodeje',
            text: `Prodané hovory měly průměrné skóre ${stats.soldScore} %, neprodané ${stats.notSoldScore} %. Když v reálném čase vidíš skóre pod ${stats.notSoldScore + 10} %, přidej otázku nebo užitek.`
          });
        }
      }

      return {
        state: 'ready',
        total, sold: sold.length, notSold: notSold.length, callback: callback.length,
        stats, insights,
        winningQuestions: winningQuestions.slice(0, 3),
        winningNeeds: winningNeeds.slice(0, 3),
        winningBenefits: winningBenefits.slice(0, 3),
        winningUtilities: winningUtilities.slice(0, 3),
        bestRoute, bestProduct
      };
    }

    function coachIcon(name) {
      const icons = {
        target:   '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        sparkle:  '<path d="M12 3l1.9 5.8L20 10l-5.8 2 -2 5.8 -2-5.8L4.5 10l5.6-1.2z"/>',
        warn:     '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        compass:  '<circle cx="12" cy="12" r="10"/><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"/>',
        depth:    '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
        utility:  '<polyline points="20,6 9,17 4,12"/>',
        route:    '<path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7"/><path d="M9 7v13"/><path d="M15 4v13"/><path d="M15 4l6 3"/>',
        gem:      '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M11 3L8 9l4 12 4-12-3-6"/><path d="M2 9h20"/>',
        lightning:'<polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>',
        clock:    '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
        chart:    '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>'
      };
      return icons[name] || icons.sparkle;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       AI DIAGNOSTIKA v2 — Executive · Funnel · Radar · Winning Pattern
       ═══════════════════════════════════════════════════════════════════════ */

    function getPreviousPeriodData(period) {
      const now = new Date();
      let from, to;
      if (period === 'today') { from = new Date(now); from.setDate(now.getDate() - 1); to = new Date(from); }
      else if (period === 'yesterday') { from = new Date(now); from.setDate(now.getDate() - 2); to = new Date(from); }
      else if (period === '7days') { from = new Date(now); from.setDate(now.getDate() - 14); to = new Date(now); to.setDate(now.getDate() - 8); }
      else { from = new Date(now); from.setDate(now.getDate() - 60); to = new Date(now); to.setDate(now.getDate() - 31); }
      const inRange = (dateStr) => {
        const parts = String(dateStr || '').split('.');
        if (parts.length !== 3) return false;
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return d >= new Date(from.getFullYear(), from.getMonth(), from.getDate()) &&
               d <= new Date(to.getFullYear(),   to.getMonth(),   to.getDate());
      };
      return callHistory.filter(x => inRange(x.date));
    }

    function analyzeAdvancedMetrics(data, prevData) {
      const total    = data.length;
      const sold     = data.filter(x => x.finalStatus === 'Prodáno');
      const notSold  = data.filter(x => x.finalStatus === 'Neprodáno');
      const conv     = total ? Math.round((sold.length / total) * 100) : 0;
      const avgScore = total ? Math.round(data.reduce((s, x) => s + (x.score || 0), 0) / total) : 0;
      const avgDur   = total ? Math.round(data.reduce((s, x) => s + (x.durationSec || 0), 0) / total) : 0;

      const prevTotal = prevData.length;
      const prevSold  = prevData.filter(x => x.finalStatus === 'Prodáno');
      const prevConv  = prevTotal ? Math.round((prevSold.length / prevTotal) * 100) : 0;
      const prevScore = prevTotal ? Math.round(prevData.reduce((s, x) => s + (x.score || 0), 0) / prevTotal) : 0;
      const prevDur   = prevTotal ? Math.round(prevData.reduce((s, x) => s + (x.durationSec || 0), 0) / prevTotal) : 0;

      const funnel = [
        { key: 'total',    label: 'Všechny hovory',           count: total },
        { key: 'profiled', label: '≥ 3 profilační otázky',    count: data.filter(x => (x.questions || []).length >= 3).length },
        { key: 'offered',  label: 'Nabídka podána',           count: data.filter(x => x.offerMade).length },
        { key: 'benefits', label: '≥ 3 vysvětlené výhody',    count: data.filter(x => (x.benefits || []).length >= 3).length },
        { key: 'closed',   label: 'Prodáno / Zpětný kontakt', count: data.filter(x => x.finalStatus === 'Prodáno' || x.finalStatus === 'Zpětný kontakt').length }
      ];
      let worstDrop = 0, worstIdx = -1;
      for (let i = 1; i < funnel.length; i++) {
        const p = funnel[i - 1].count, c = funnel[i].count;
        if (p > 0) {
          const drop = ((p - c) / p) * 100;
          if (drop > worstDrop) { worstDrop = drop; worstIdx = i; }
        }
      }

      const avgF   = (calls, fn) => calls.length ? calls.reduce((s, c) => s + fn(c), 0) / calls.length : 0;
      const qCount = (c) => (c.questions || []).length;
      const bCount = (c) => (c.benefits  || []).length;
      const uCount = (c) => (c.utilities || []).length;
      const nCount = (c) => (c.needs     || []).length;
      const objOK  = (c) => c.objectionHandled ? 1 : 0;
      const closed = (c) => (c.finalStatus === 'Prodáno' || c.finalStatus === 'Zpětný kontakt') ? 1 : 0;
      const CAP = { q: 6, b: 5, u: 5, n: 5, obj: 1, close: 1 };
      const norm = (v, cap) => Math.min(100, Math.round((v / cap) * 100));

      const radar = {
        axes: [
          { key: 'q',     label: 'Otázky',   me: norm(avgF(data, qCount), CAP.q),     goal: norm(avgF(sold, qCount), CAP.q) },
          { key: 'b',     label: 'Výhody',   me: norm(avgF(data, bCount), CAP.b),     goal: norm(avgF(sold, bCount), CAP.b) },
          { key: 'u',     label: 'Užitky',   me: norm(avgF(data, uCount), CAP.u),     goal: norm(avgF(sold, uCount), CAP.u) },
          { key: 'n',     label: 'Potřeby',  me: norm(avgF(data, nCount), CAP.n),     goal: norm(avgF(sold, nCount), CAP.n) },
          { key: 'obj',   label: 'Námitky',  me: norm(avgF(data, objOK), CAP.obj),    goal: norm(avgF(sold, objOK), CAP.obj) },
          { key: 'close', label: 'Uzavření', me: norm(avgF(data, closed), CAP.close), goal: 100 }
        ]
      };

      const range = (arr) => {
        if (!arr.length) return null;
        const s = [...arr].sort((a, b) => a - b);
        return { min: s[Math.floor(s.length * 0.25)], median: s[Math.floor(s.length * 0.5)], max: s[Math.floor(s.length * 0.75)] };
      };
      const pattern = {
        questions: range(sold.map(qCount)),
        benefits:  range(sold.map(bCount)),
        utilities: range(sold.map(uCount)),
        duration:  range(sold.map(c => c.durationSec || 0)),
        score:     range(sold.map(c => c.score || 0))
      };

      const trend = {
        conv:  { now: conv,     prev: prevConv,  delta: conv - prevConv },
        score: { now: avgScore, prev: prevScore, delta: avgScore - prevScore },
        dur:   { now: avgDur,   prev: prevDur,   delta: avgDur - prevDur }
      };

      return { total, soldCount: sold.length, notSoldCount: notSold.length, conv, avgScore, avgDur, funnel, worstIdx, radar, pattern, trend, hasPrev: prevTotal > 0 };
    }

    function fmtDur(sec) {
      const m = Math.floor((sec || 0) / 60), s = (sec || 0) % 60;
      return m + 'm ' + String(s).padStart(2, '0') + 's';
    }

    function renderCoachTab_Summary(A) {
      const tile = (label, value, unit, tr, invert) => {
        const good   = invert ? tr.delta < 0 : tr.delta > 0;
        const bad    = invert ? tr.delta > 0 : tr.delta < 0;
        const dColor = good ? '#059669' : bad ? '#dc2626' : '#94a3b8';
        const dBg    = good ? '#ecfdf5' : bad ? '#fef2f2' : '#f1f5f9';
        const sign   = tr.delta > 0 ? '+' : '';
        const arrow  = tr.delta === 0 ? '→' : (good ? '▲' : '▼');
        const trendHtml = A.hasPrev
          ? `<div style="display:inline-flex;align-items:center;gap:4px;background:${dBg};border-radius:999px;padding:2px 8px;font-size:10px;font-weight:900;color:${dColor};align-self:flex-start;"><span>${arrow}</span><span>${sign}${tr.delta}${unit === '%' ? ' pp' : (unit || '')}</span><span style="color:var(--mut);font-weight:700;">vs. min.</span></div>`
          : `<div style="font-size:10px;color:var(--mut);font-weight:700;">– bez porovnání –</div>`;
        return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:4px;">
          <div style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:var(--mut);">${esc(label)}</div>
          <div style="display:flex;align-items:baseline;gap:6px;">
            <div style="font-size:22px;font-weight:950;color:var(--o2d);line-height:1;">${value}</div>
            <div style="font-size:11px;font-weight:800;color:var(--mut);">${esc(unit)}</div>
          </div>
          ${trendHtml}
        </div>`;
      };

      let verdict, verdictBg, verdictIcon;
      if (A.total < 3)                              { verdict = 'Sbírám data – čekám na dokončení dalších hovorů.';                     verdictBg = 'linear-gradient(135deg,#f1f5f9,#e2e8f0)'; verdictIcon = '⏳'; }
      else if (A.conv >= 40 && A.avgScore >= 70)    { verdict = 'Vynikající forma. Konverze i kvalita jsou nad standardem.';            verdictBg = 'linear-gradient(135deg,#059669,#10b981)'; verdictIcon = '🏆'; }
      else if (A.conv >= 25 && A.avgScore >= 60)    { verdict = 'Dobrá práce. Držíš solidní laťku – přidej detail v profilaci.';         verdictBg = 'linear-gradient(135deg,#0050ff,#4f46e5)'; verdictIcon = '💪'; }
      else if (A.conv < 15)                         { verdict = 'Pozor – konverze je pod prahem. Zaměř se na hloubku profilace a užitky.'; verdictBg = 'linear-gradient(135deg,#dc2626,#ea580c)'; verdictIcon = '⚠️'; }
      else                                           { verdict = 'Průměrná forma. Podívej se do sekce Radar – kde tě to táhne dolů?';    verdictBg = 'linear-gradient(135deg,#c2410c,#f97316)'; verdictIcon = '📊'; }

      return `<div style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;overflow-y:auto;padding-right:2px;">
        <div style="background:${verdictBg};color:#fff;border-radius:12px;padding:12px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 4px 14px rgba(0,0,0,0.08);">
          <div style="font-size:26px;line-height:1;">${verdictIcon}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;font-weight:900;opacity:.85;">Verdikt AI kouče</div>
            <div style="font-size:12.5px;font-weight:800;line-height:1.35;margin-top:2px;">${esc(verdict)}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${tile('Konverze', A.conv, '%', A.trend.conv, false)}
          ${tile('Průměrné skóre', A.avgScore, '%', A.trend.score, false)}
          ${tile('Prům. délka', fmtDur(A.avgDur), '', A.trend.dur, true)}
          ${tile('Prodáno', A.soldCount, ' hovorů', { delta: 0 }, false)}
        </div>
      </div>`;
    }

    function renderCoachTab_Funnel(A) {
      if (!A.total) return `<div style="padding:20px;text-align:center;color:var(--mut);font-weight:800;">Zatím žádné hovory k analýze.</div>`;
      const max = A.funnel[0].count || 1;
      const rows = A.funnel.map((step, i) => {
        const pct     = Math.round((step.count / max) * 100);
        const prevPct = i === 0 ? 100 : Math.round((step.count / A.funnel[i - 1].count) * 100);
        const drop    = i === 0 ? 0 : (100 - prevPct);
        const isWorst = i === A.worstIdx && A.worstIdx > 0;
        const barColor = isWorst ? 'linear-gradient(90deg,#dc2626,#ea580c)' : 'linear-gradient(90deg,var(--o2d),var(--o2) 50%,#4f46e5 90%)';
        const badgeColor = isWorst ? '#dc2626' : (drop > 25 ? '#c2410c' : 'var(--mut)');
        const badgeBg    = isWorst ? '#fee2e2' : (drop > 25 ? '#fff7ed' : '#f1f5f9');
        const badge = i > 0
          ? `<span style="font-size:9.5px;font-weight:900;color:${badgeColor};background:${badgeBg};border-radius:999px;padding:2px 7px;">−${drop}%</span>`
          : `<span style="font-size:9.5px;font-weight:900;color:var(--o2);background:#eff6ff;border-radius:999px;padding:2px 7px;">start</span>`;
        return `<div style="display:flex;flex-direction:column;gap:3px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="font-size:11px;font-weight:900;color:${isWorst ? '#7f1d1d' : 'var(--o2d)'};">${esc(step.label)}</span>
            <div style="display:flex;align-items:center;gap:6px;">
              ${badge}
              <span style="font-size:12.5px;font-weight:950;color:${isWorst ? '#dc2626' : 'var(--o2d)'};">${step.count}</span>
            </div>
          </div>
          <div style="height:14px;background:#f1f5f9;border-radius:999px;overflow:hidden;position:relative;">
            <div style="height:100%;background:${barColor};width:${Math.max(pct, 2)}%;border-radius:999px;transition:width .4s cubic-bezier(.4,0,.2,1);"></div>
          </div>
        </div>`;
      }).join('');

      const worst = A.worstIdx > 0 ? A.funnel[A.worstIdx] : null;
      const worstMsg = worst
        ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #dc2626;border-radius:10px;padding:9px 12px;">
             <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:#dc2626;margin-bottom:3px;">Nejslabší článek</div>
             <div style="font-size:11.5px;font-weight:850;color:#7f1d1d;line-height:1.4;">Ztráta u kroku „${esc(worst.label)}" — tady konkrétně přicházíš o nejvíc.</div>
           </div>`
        : `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-left:4px solid #10b981;border-radius:10px;padding:9px 12px;">
             <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:#059669;margin-bottom:3px;">Zdravý funnel</div>
             <div style="font-size:11.5px;font-weight:850;color:#065f46;line-height:1.4;">Postup mezi kroky je vyvážený – žádné dramatické propady.</div>
           </div>`;

      return `<div style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;overflow-y:auto;padding-right:2px;">
        <div style="display:flex;flex-direction:column;gap:8px;">${rows}</div>
        ${worstMsg}
      </div>`;
    }

    function renderCoachTab_Radar(A) {
      if (!A.total) return `<div style="padding:20px;text-align:center;color:var(--mut);font-weight:800;">Zatím žádná data pro radar.</div>`;
      const size = 210, cx = size / 2, cy = size / 2, r = 78;
      const axes = A.radar.axes;
      const n = axes.length;
      const point = (i, v) => {
        const a  = (Math.PI * 2 * i / n) - Math.PI / 2;
        const rr = (v / 100) * r;
        return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
      };
      const grid = [25, 50, 75, 100].map(pct => `<polygon points="${axes.map((_, i) => point(i, pct).join(',')).join(' ')}" fill="none" stroke="#e2e8f0" stroke-width="1" />`).join('');
      const spokes = axes.map((_, i) => {
        const p = point(i, 100);
        return `<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#e2e8f0" stroke-width="1" />`;
      }).join('');
      const goalPts = axes.map((ax, i) => point(i, ax.goal).join(',')).join(' ');
      const mePts   = axes.map((ax, i) => point(i, ax.me).join(',')).join(' ');
      const labels = axes.map((ax, i) => {
        const p = point(i, 128);
        const anchor = Math.abs(p[0] - cx) < 10 ? 'middle' : (p[0] > cx ? 'start' : 'end');
        return `<text x="${p[0]}" y="${p[1]}" text-anchor="${anchor}" dominant-baseline="middle" style="font:900 9.5px 'Plus Jakarta Sans',sans-serif;fill:#0f172a;">${esc(ax.label)}</text>`;
      }).join('');
      const weak = [...axes].sort((a, b) => (a.me - a.goal) - (b.me - b.goal))[0];
      const gap  = weak.goal - weak.me;

      const advice = gap > 5
        ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-left:4px solid #c2410c;border-radius:10px;padding:9px 12px;">
             <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:#c2410c;margin-bottom:3px;">Rezerva k vlastnímu maximu</div>
             <div style="font-size:11.5px;font-weight:850;color:#7c2d12;line-height:1.4;">V dimenzi „${esc(weak.label)}" jsi <b>${gap} bodů pod</b> svou vlastní prodejní úrovní. Přidat právě tady = největší návratnost.</div>
           </div>`
        : `<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-left:4px solid #10b981;border-radius:10px;padding:9px 12px;">
             <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:#059669;margin-bottom:3px;">Vyrovnaný profil</div>
             <div style="font-size:11.5px;font-weight:850;color:#065f46;line-height:1.4;">Držíš se blízko svého vítězného vzorce ve všech dimenzích. Pokračuj.</div>
           </div>`;

      return `<div style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;overflow-y:auto;padding-right:2px;align-items:stretch;">
        <div style="display:flex;justify-content:center;">
          <svg viewBox="0 0 ${size} ${size}" style="width:100%;max-width:230px;height:auto;">
            ${grid}${spokes}
            <polygon points="${goalPts}" fill="rgba(148,163,184,0.22)" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3" />
            <polygon points="${mePts}"   fill="rgba(0,80,255,0.28)"    stroke="#0050ff" stroke-width="2" />
            ${labels}
          </svg>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;font-size:10px;font-weight:900;">
          <span style="display:inline-flex;align-items:center;gap:5px;color:var(--o2);"><span style="width:12px;height:12px;background:rgba(0,80,255,0.28);border:2px solid #0050ff;border-radius:3px;"></span>Ty aktuálně</span>
          <span style="display:inline-flex;align-items:center;gap:5px;color:var(--mut);"><span style="width:12px;height:12px;background:rgba(148,163,184,0.22);border:1.5px dashed #94a3b8;border-radius:3px;"></span>Tvůj vítězný vzorec</span>
        </div>
        ${advice}
      </div>`;
    }

    function renderCoachTab_Pattern(A) {
      if (!A.soldCount) return `<div style="padding:20px;text-align:center;color:var(--mut);font-weight:800;line-height:1.5;">Zatím žádný prodej.<br>Vzorec se odemkne po prvním „Prodáno".</div>`;
      const P = A.pattern;
      const row = (label, r, unit, fmt) => {
        if (!r) return '';
        const fv  = fmt || ((v) => v);
        const suf = unit ? ' ' + unit : '';
        return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:9px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div style="font-size:11px;font-weight:900;color:var(--o2d);flex:1;min-width:0;">${esc(label)}</div>
          <div style="display:flex;align-items:baseline;gap:4px;">
            <span style="font-size:10.5px;color:var(--mut);font-weight:800;">${fv(r.min)}${suf}</span>
            <span style="font-size:11px;color:var(--mut);font-weight:700;">–</span>
            <span style="font-size:14px;font-weight:950;color:var(--o2);">${fv(r.median)}${suf}</span>
            <span style="font-size:11px;color:var(--mut);font-weight:700;">–</span>
            <span style="font-size:10.5px;color:var(--mut);font-weight:800;">${fv(r.max)}${suf}</span>
          </div>
        </div>`;
      };
      const fmtSecs = (v) => Math.floor(v / 60) + ':' + String(v % 60).padStart(2, '0');
      return `<div style="display:flex;flex-direction:column;gap:10px;flex:1;min-height:0;overflow-y:auto;padding-right:2px;">
        <div style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:10px 12px;">
          <div style="font-size:9.5px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:var(--o2);margin-bottom:4px;">🏆 Tvůj vítězný recept</div>
          <div style="font-size:11.5px;font-weight:800;color:var(--o2d);line-height:1.4;">Sweet spot z tvých <b>${A.soldCount} prodaných hovorů</b>. Rozsah dolní čtvrtky – <b>medián</b> – horní čtvrtky.</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${row('Profilační otázky', P.questions)}
          ${row('Vysvětlené výhody', P.benefits)}
          ${row('Užitky / zkušební uzavření', P.utilities)}
          ${row('Skóre hovoru', P.score, '%')}
          ${row('Délka hovoru', P.duration, '', fmtSecs)}
        </div>
        <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:9px 12px;">
          <div style="font-size:10.5px;font-weight:850;color:var(--mut);line-height:1.45;">💡 Když se v novém hovoru pohybuješ v tomto rozsahu, statisticky <b>násobíš svou vlastní úspěšnost</b>.</div>
        </div>
      </div>`;
    }

    function renderCoachInsightsBody(R) {
      const toneMap = {
        good: { bg: '#ecfdf5', bd: '#6ee7b7', fg: '#065f46', accent: '#10b981' },
        warn: { bg: '#fffbeb', bd: '#fde68a', fg: '#78350f', accent: '#f59e0b' },
        bad:  { bg: '#fef2f2', bd: '#fecaca', fg: '#7f1d1d', accent: '#dc2626' },
        info: { bg: '#eff6ff', bd: '#bfdbfe', fg: '#1e3a8a', accent: '#0050ff' }
      };
      if (R.state === 'warmup') return `<div style="padding:20px;text-align:center;color:var(--mut);font-weight:800;line-height:1.5;">Kouč sbírá data.<br>Insighty se odemknou po <b>3 hovorech</b>.<br>Nyní: ${R.total}.</div>`;
      if (!R.insights.length) return `<div style="padding:20px;text-align:center;color:var(--mut);font-weight:800;">Zatím žádné výrazné vzorce – potřebuji víc kontrastu mezi prodanými a neprodanými hovory.</div>`;
      const cards = R.insights.map(ins => {
        const t = toneMap[ins.tone] || toneMap.info;
        return `<div style="background:${t.bg};border:1px solid ${t.bd};border-left:4px solid ${t.accent};border-radius:12px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;min-width:0;">
          <div style="width:28px;height:28px;border-radius:8px;background:${t.accent};color:#fff;display:grid;place-items:center;flex-shrink:0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${coachIcon(ins.icon)}</svg>
          </div>
          <div style="min-width:0;flex:1;">
            <div style="font-size:11.5px;font-weight:950;color:${t.fg};line-height:1.3;">${esc(ins.title)}</div>
            <div style="font-size:11px;font-weight:600;color:${t.fg};opacity:.85;line-height:1.45;margin-top:3px;">${esc(ins.text)}</div>
          </div>
        </div>`;
      }).join('');
      return `<div style="display:flex;flex-direction:column;gap:6px;overflow-y:auto;flex:1;min-height:0;padding-right:2px;">${cards}</div>`;
    }

    function renderAdvancedCoach(data) {
      const prev = getPreviousPeriodData(statsPeriod);
      const A    = analyzeAdvancedMetrics(data, prev);
      const R    = analyzeCoachInsights(data);

      const TABS = [
        { key: 'summary', label: 'Přehled',  icon: '📊' },
        { key: 'funnel',  label: 'Funnel',   icon: '🎯' },
        { key: 'radar',   label: 'Radar',    icon: '🕸️' },
        { key: 'pattern', label: 'Vzorec',   icon: '🏆' },
        { key: 'coach',   label: 'Insighty', icon: '✨' }
      ];
      let body;
      if      (coachTab === 'summary') body = renderCoachTab_Summary(A);
      else if (coachTab === 'funnel')  body = renderCoachTab_Funnel(A);
      else if (coachTab === 'radar')   body = renderCoachTab_Radar(A);
      else if (coachTab === 'pattern') body = renderCoachTab_Pattern(A);
      else                             body = renderCoachInsightsBody(R);

      const tabsBar = TABS.map(t => {
        const active = t.key === coachTab;
        return `<button class="coach-tab ${active ? 'active' : ''}" data-action="coach-tab" data-val="${t.key}" title="${esc(t.label)}">
          <span style="font-size:12px;">${t.icon}</span>
          <span style="font-size:10px;font-weight:900;">${esc(t.label)}</span>
        </button>`;
      }).join('');

      return `<div class="ai-live-border" style="border-radius:16px;height:100%;display:flex;flex-direction:column;min-height:0;">
        <div class="ai-live-border-inner" style="border-radius:14px;padding:10px 12px 12px;background:#f8fbff;flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-shrink:0;">
            <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,var(--o2d) 0%,var(--o2) 52%,#4f46e5 78%,#7c3aed 100%);display:grid;place-items:center;flex-shrink:0;box-shadow:0 4px 16px rgba(79,46,180,.30);">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8L20 10l-5.8 2 -2 5.8 -2-5.8L4.5 10l5.6-1.2z"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:12.5px;font-weight:950;color:var(--o2d);line-height:1.15;">AI Diagnostika</div>
              <div style="font-size:9.5px;font-weight:800;color:var(--mut);margin-top:1px;text-transform:uppercase;letter-spacing:.4px;">${A.total} hovor · ${A.soldCount} prodáno · ${A.notSoldCount} neprodáno</div>
            </div>
          </div>
          <div class="coach-tabs" style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-bottom:10px;flex-shrink:0;">${tabsBar}</div>
          <div style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">${body}</div>
        </div>
      </div>`;
    }

    function renderCoachPanel(data) {
      const R = analyzeCoachInsights(data);
      const toneMap = {
        good: { bg: '#ecfdf5', bd: '#6ee7b7', fg: '#065f46', accent: '#10b981' },
        warn: { bg: '#fffbeb', bd: '#fde68a', fg: '#78350f', accent: '#f59e0b' },
        bad:  { bg: '#fef2f2', bd: '#fecaca', fg: '#7f1d1d', accent: '#dc2626' },
        info: { bg: '#eff6ff', bd: '#bfdbfe', fg: '#1e3a8a', accent: '#0050ff' }
      };

      let body;
      if (R.state === 'warmup') {
        body = `
          <div style="display:flex;align-items:center;gap:14px;padding:8px 4px;">
            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--o2d) 0%,var(--o2) 52%,#4f46e5 78%,#7c3aed 100%);display:grid;place-items:center;flex-shrink:0;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8L20 10l-5.8 2 -2 5.8 -2-5.8L4.5 10l5.6-1.2z"/></svg>
            </div>
            <div>
              <div style="font-size:13.5px;font-weight:950;color:var(--o2d);">Kouč sbírá data</div>
              <div style="font-size:11.5px;font-weight:750;color:var(--mut);margin-top:2px;">Pro spolehlivou analýzu potřebuje minimálně 3 uložené hovory. Nyní: ${R.total} hovor${R.total === 1 ? '' : R.total >= 5 ? 'ů' : 'y'}.</div>
            </div>
          </div>`;
      } else {
        const cards = R.insights.map(ins => {
          const t = toneMap[ins.tone] || toneMap.info;
          return `
            <div style="background:${t.bg};border:1px solid ${t.bd};border-left:4px solid ${t.accent};border-radius:12px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;min-width:0;">
              <div style="width:28px;height:28px;border-radius:8px;background:${t.accent};color:#fff;display:grid;place-items:center;flex-shrink:0;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${coachIcon(ins.icon)}</svg>
              </div>
              <div style="min-width:0;flex:1;">
                <div style="font-size:11.5px;font-weight:950;color:${t.fg};line-height:1.3;">${esc(ins.title)}</div>
                <div style="font-size:11px;font-weight:600;color:${t.fg};opacity:.85;line-height:1.45;margin-top:3px;">${esc(ins.text)}</div>
              </div>
            </div>`;
        }).join('');

        body = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--o2d) 0%,var(--o2) 52%,#4f46e5 78%,#7c3aed 100%);display:grid;place-items:center;flex-shrink:0;box-shadow:0 4px 16px rgba(79,46,180,.30);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.8L20 10l-5.8 2 -2 5.8 -2-5.8L4.5 10l5.6-1.2z"/></svg>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:13px;font-weight:950;color:var(--o2d);line-height:1.15;">AI Kouč – analýza vzorců</div>
              <div style="font-size:10px;font-weight:800;color:var(--mut);margin-top:2px;text-transform:uppercase;letter-spacing:.4px;">${R.total} hovor · ${R.sold} prodáno · ${R.notSold} neprodáno${R.callback ? ' · ' + R.callback + ' zpět' : ''}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;overflow-y:auto;max-height:100%;padding-right:2px;">
            ${cards}
          </div>`;
      }

      return `
        <div class="ai-live-border" style="border-radius:16px;height:100%;display:flex;flex-direction:column;min-height:0;">
          <div class="ai-live-border-inner" style="border-radius:14px;padding:12px 14px;background:#f8fbff;flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
            ${body}
          </div>
        </div>`;
    }

    function renderOnePageDiagnostics() {
      const data = filterHistoryByPeriod(statsPeriod);
      const total = data.length;
      const scoreAvg = avg(data.map(x => x.score || 0));
      const topQuestions = getTopItems(data, 'questions', 6);
      const topNeeds = getTopItems(data, 'needs', 6);
      const pd = statsPeriod === 'today' ? 'Dnes' : statsPeriod === 'yesterday' ? 'Včera' : statsPeriod === '7days' ? 'Posledních 7 dní' : 'Všech 30 dní';

      return `
        <div style="display:flex;flex-direction:column;height:100%;min-height:0;gap:12px;">

          <!-- TOP BAR -->
          <div style="display:flex;align-items:center;gap:12px;flex-shrink:0;background:#fff;padding:10px 16px;border-radius:16px;border:1px solid var(--line);flex-wrap:wrap;">
            <h3 style="font-size:15px;font-weight:950;color:var(--o2d);margin:0;flex:0 0 auto;">Statistiky – ${pd}</h3>
            <div class="filter-bar" style="margin:0;flex:1;min-width:180px;">
              <button class="filter-btn ${statsPeriod === 'today' ? 'active' : ''}" data-action="stat-period" data-val="today">Dnes</button>
              <button class="filter-btn ${statsPeriod === 'yesterday' ? 'active' : ''}" data-action="stat-period" data-val="yesterday">Včera</button>
              <button class="filter-btn ${statsPeriod === '7days' ? 'active' : ''}" data-action="stat-period" data-val="7days">7 dní</button>
              <button class="filter-btn ${statsPeriod === '30days' ? 'active' : ''}" data-action="stat-period" data-val="30days">30 dní</button>
            </div>
            <div style="display:flex;gap:10px;align-items:stretch;flex-shrink:0;">
              <div style="background:linear-gradient(135deg,var(--o2d) 0%,var(--o2) 52%,#4f46e5 78%,#7c3aed 100%);color:#fff;border-radius:12px;padding:8px 22px;text-align:center;min-width:90px;">
                <div style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:#bfdbfe;">Počet hovorů</div>
                <div style="font-size:26px;font-weight:950;line-height:1.1;margin-top:2px;">${total}</div>
              </div>
              <div style="background:#fff;border:2px solid var(--o2);border-radius:12px;padding:8px 22px;text-align:center;min-width:110px;">
                <div style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;font-weight:950;color:var(--mut);">Průměrné hodnocení</div>
                <div style="font-size:26px;font-weight:950;line-height:1.1;margin-top:2px;color:var(--o2);">${scoreAvg}%</div>
              </div>
              <button class="btn redbtn" style="padding:8px 14px;font-size:11px;align-self:center;" data-action="clear-stats-history">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/></svg>Smazat
              </button>
              <button class="btn statbtn" style="padding:8px 14px;font-size:11px;align-self:center;color:#fff;" data-action="stats-send-teams" title="Odeslat text summary přes webhook + zkopírovat 5 grafů jako PNG do clipboardu (Ctrl+V do Teams).">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></svg>Odeslat do Teams
              </button>
            </div>
          </div>

          <!-- 3 SLOUPCE -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;flex:1;min-height:0;overflow:hidden;">

            <!-- LEVÝ: AI Diagnostika (tabbed panel) -->
            <div style="display:flex;flex-direction:column;gap:10px;min-height:0;overflow:hidden;">
              <div style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
                ${renderAdvancedCoach(data)}
              </div>
            </div>

            <!-- PROSTŘEDNÍ: 2 grafy -->
            <div style="display:flex;flex-direction:column;gap:10px;min-height:0;overflow:hidden;">
              <div class="box" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
                ${buildCallsChart(data, statsPeriod)}
              </div>
              <div class="box" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
                ${buildClicksChart(data, statsPeriod)}
              </div>
            </div>

            <!-- PRAVÝ: 3 per-produkt grafy -->
            <div style="display:flex;flex-direction:column;gap:10px;min-height:0;overflow:hidden;">
              <div class="box" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
                ${buildItemsPerProductChart(data, statsPeriod, 'questions', 'questions', 'Profilační otázky dle produktu')}
              </div>
              <div class="box" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
                ${buildItemsPerProductChart(data, statsPeriod, 'benefits', 'copilotBenefits', 'Výhody dle produktu')}
              </div>
              <div class="box" style="flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;">
                ${buildItemsPerProductChart(data, statsPeriod, 'utilities', 'copilotUtilities', 'Užitky dle produktu')}
              </div>
            </div>

          </div>
        </div>
      `;
    }

        function renderStatsDrawer() {
      $('drawerTitle').textContent = 'Statistiky';
      $('drawerSub').textContent = 'Analýza výkonnosti · Hovory · Profilace dle produktu';
      $('drawer').classList.add('fullscreen');
      $('drawerBody').innerHTML = renderOnePageDiagnostics();
    }

    function openStatsDrawer() { 
      renderStatsDrawer(); 
      $('drawer').classList.add('open'); 
      $('shade').classList.add('open'); 
    }

    function openStatsPanel() { openStatsDrawer(); }

    function closeDrawer() { 
      $('drawer').classList.remove('open'); 
      $('shade').classList.remove('open'); 
      statsExpandedBox = null;
    }

    function exportStatsImage() {
      if (!window.html2canvas) {
        toast('Načítám nástroj pro snímek...');
        let script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = () => {
          toast('Nástroj načten, vytvářím snímek...');
          captureStats();
        };
        script.onerror = () => toast('Chyba připojení, nelze načíst nástroj pro snímek.');
        document.head.appendChild(script);
      } else {
        toast('Vytvářím snímek obrazovky...');
        captureStats();
      }
    }

    function captureStats() {
      const el = document.getElementById('drawerBody');
      window.html2canvas(el, { backgroundColor: '#eff6ff', scale: 1.5 }).then(canvas => {
        canvas.toBlob(blob => {
          if (!blob) { toast('Chyba při generování obrázku'); return; }
          try {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => {
              toast('📸 Snímek statistik zkopírován! (Vložte Ctrl+V do Teams)');
            }).catch(err => {
              console.error(err);
              toast('Chyba: Prohlížeč blokuje zápis do schránky.');
            });
          } catch(e) {
            toast('Tento prohlížeč nepodporuje přímé vložení obrázku do schránky.');
          }
        }, 'image/png');
      });
    }

    function tinyHash(str) {
      // Local-only hash to avoid storing clear credentials in source code.
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return (h >>> 0).toString(16).padStart(8, '0');
    }

    function randomSalt() {
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    function readClearGuard() {
      try {
        return JSON.parse(localStorage.getItem(clearGuardKey) || 'null');
      } catch (e) {
        return null;
      }
    }

    function writeClearGuard(data) {
      localStorage.setItem(clearGuardKey, JSON.stringify(data));
    }

    function setupClearGuard() {
      const pin1 = prompt('Nastavte admin PIN pro mazání statistik (min. 4 znaky):');
      if (!pin1) return false;
      if (pin1.length < 4) {
        alert('PIN musí mít alespoň 4 znaky.');
        return false;
      }
      const pin2 = prompt('Potvrďte admin PIN:');
      if (pin1 !== pin2) {
        alert('PINy se neshodují.');
        return false;
      }
      const salt = randomSalt();
      writeClearGuard({
        salt,
        hash: tinyHash(pin1 + '|' + salt),
        attempts: 0,
        cooldownUntil: 0,
        createdAt: new Date().toISOString()
      });
      return true;
    }

    function verifyClearGuard(pin) {
      let g = readClearGuard();
      if (!g || !g.salt || !g.hash) return false;

      const now = Date.now();
      if (g.cooldownUntil && now < g.cooldownUntil) {
        const sec = Math.ceil((g.cooldownUntil - now) / 1000);
        alert(`Ochrana je dočasně uzamčena. Zkuste to za ${sec} s.`);
        return false;
      }

      const ok = tinyHash(String(pin) + '|' + g.salt) === g.hash;
      if (ok) {
        g.attempts = 0;
        g.cooldownUntil = 0;
        writeClearGuard(g);
        return true;
      }

      g.attempts = (g.attempts || 0) + 1;
      if (g.attempts >= 3) {
        g.cooldownUntil = now + 60 * 1000;
        g.attempts = 0;
      }
      writeClearGuard(g);
      return false;
    }

    function clearStatsHistoryFlow() {
      let g = readClearGuard();
      if (!g) {
        const created = setupClearGuard();
        if (!created) {
          toast('Mazání zrušeno');
          return;
        }
        toast('Admin PIN byl nastaven');
        g = readClearGuard();
      }

      const p = prompt('Pro vymazání kompletní historie statistik zadejte admin PIN:');
      if (p == null) {
        toast('Mazání zrušeno');
        return;
      }

      if (verifyClearGuard(p)) {
        localStorage.removeItem(histKey);
        callHistory = [];
        renderStatsDrawer();
        toast('Historie statistik vymazána');
      } else {
        alert('Nesprávný PIN! Statistika nebyla smazána.');
      }
    }

    function animateCardSwap(direction = 'next') {
      const host = $('cardHost');
      if (!host) return;
      host.classList.remove('card-swap-cube-next', 'card-swap-cube-prev');
      // Force reflow so repeated step changes can retrigger the animation.
      void host.offsetWidth;
      host.classList.add(direction === 'prev' ? 'card-swap-cube-prev' : 'card-swap-cube-next');
    }

    function renderAll() {
      blocks = getBlocks(); 
      renderProductButtons();
      $('cardHost').innerHTML = renderCard(); 
      renderRoadmap();
      renderProductCopilot(); 
      renderNotesScore(); 
      renderSelected();
      updateHeaderAvatar();
    }

    function buildCleanCrmSummary() {
      const p = products[activeProduct], lines = [];
      lines.push(`=== ZÁPIS Z HOVORU [${p ? p.label.toUpperCase() : 'OBECNÝ'}] ===`);
      
      const qf = callState.quickFacts || [];
      if (qf.includes('wdeReason')) lines.push('Důvod z WDE přečten');
      if (qf.includes('zakaznikOveren')) lines.push('Zákazník ověřen');
      if (qf.includes('zakaznikNeoveren')) lines.push('Zákazník neověřen');
      if (qf.includes('aplikaceMojeO2')) lines.push('[MOJE O2]: Aplikace Moje O2 zmíněna / ověřena');
      if (qf.includes('omniSouhlas')) lines.push('Omni souhlas označen');
      
      if (callState.routeLabel) { 
        const rr = asArr(callState.riskReasons).join(', ') || callState.riskReason || ''; 
        lines.push(`[SITUACE]: ${callState.routeLabel}${rr ? ' | ' + rr : ''}`); 
      }
      
      if (callState.needs.length) lines.push(`[POTŘEBY]: ${callState.needs.join(', ')} (${callState.questions.length} profi otázek)`);
      if (callState.offerMade && p && !isFastTrack()) lines.push(`[NABÍDNUTO]: ${p.title}`);
      if (callState.benefits.length && !isFastTrack()) lines.push(`[ARGUMENTACE]: ${callState.benefits.join(', ')}`);
      if ((callState.utilities || []).length && !isFastTrack()) lines.push(`[UŽITKY]: ${callState.utilities.join(', ')}`);
      
      if (callState.objection && callState.objection !== 'bez námitky') {
        lines.push(`[NÁMITKA]: ${callState.objection} (Zpracováno: ${callState.objectionHandled ? 'ANO' : 'NE'})`);
      } else if ((callState.quickFacts || []).includes('noObjection')) {
        lines.push(`[AKCEPTACE]: Řešení přijato bez přímých námitek`);
      }
      
      let ns = asArr(callState.nextSteps).join(', ') || callState.nextStep;
      if (ns) lines.push(`[DALŠÍ KROK]: ${ns}`);
      
      if (callState.finalStatus) lines.push(`[VÝSLEDEK HOVORU]: ${callState.finalStatus}`);
      if ((callState.quickFacts || []).includes('customerEnded')) lines.push('[UKONČENÍ]: Zákazník ukončil hovor v průběhu procesu');
      
      if (lines.length === 1) lines.push('Zatím nejsou zaznamenány konkrétní parametry hovoru.');
      lines.push('========================================');
      
      return lines.join('\n');
    }

    function buildCrmSummary() {
      let txt = buildCleanCrmSummary(), userNote = ($('callNotes')?.value || '').trim();
      if (userNote) txt += '\nRuční poznámka: ' + userNote;
      return txt;
    }

    function copyCrmSummary() {
      let txt = buildCrmSummary();
      navigator.clipboard && navigator.clipboard.writeText(txt).then(() => toast(' CRM zápis zkopírován do schránky')).catch(() => toast('Zkopíruj ručně z karty'));
    }

    function callSnapshot(score) {
      trackCardTime();
      let notes = ($('callNotes')?.value || '');
      return {
        date: todayKey(),
        time: new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
        startedAt: callState.callStartedAt,
        endedAt: new Date().toISOString(),
        durationSec: callDurationSec(),
        actionLog: [...(callState.actionLog || [])],
        score,
        route: callState.route, routeLabel: callState.routeLabel, routeHandled: callState.routeHandled,
        riskReason: callState.riskReason, rescueWay: callState.rescueWay,
        riskReasons: [...(callState.riskReasons || [])], rescueWays: [...(callState.rescueWays || [])],
        product: products[activeProduct].label, productKey: activeProduct,
        needs: [...callState.needs], needsCount: callState.needs.length,
        questions: [...callState.questions], questionsCount: callState.questions.length,
        offerMade: callState.offerMade, benefits: [...callState.benefits], benefitsCount: callState.benefits.length,
        utilities: [...(callState.utilities || [])], utilitiesCount: (callState.utilities || []).length,
        objectionHandled: callState.objectionHandled, nextStep: !!callState.nextStep || (callState.nextSteps && callState.nextSteps.length > 0),
        nextStepLabel: callState.nextStep, nextSteps: [...(callState.nextSteps || [])],
        quickFacts: [...(callState.quickFacts || [])], wdeReason: callState.quickFacts.includes('wdeReason'),
        introVerified: callState.quickFacts.includes('zakaznikOveren'), introNotVerified: callState.quickFacts.includes('zakaznikNeoveren'),
        mojeO2: callState.quickFacts.includes('aplikaceMojeO2'), omniSouhlas: callState.quickFacts.includes('omniSouhlas'),
        trialClose: callState.quickFacts.includes('trialClose'), noObjection: callState.quickFacts.includes('noObjection'),
        customerEnded: callState.quickFacts.includes('customerEnded'), clicks: callState.clicks || 0,
        finalStatus: callState.finalStatus,
        notesLength: notes.trim().length, unityUsed: (callState.product === 'unity' || (callState.quickFacts || []).includes('Unity')),
        maxCardReached: callState.maxCardReached || 0, cardDurations: { ...(callState.cardDurations || {}) }
      };
    }

    function showPremiumSave(title = 'Hovor uložen', sub = 'Obchodní stopa byla zapsána a cockpit je připraven na další hovor.') {
      let m = document.getElementById('premiumSave');
      if (!m) { toast(title); return; }
      let t = document.getElementById('premiumSaveTitle'), s = document.getElementById('premiumSaveSub');
      if (t) t.textContent = title; 
      if (s) s.textContent = sub;
      
      m.classList.add('open');
      setTimeout(() => m.classList.remove('open'), 1150);
    }

    function doReset() {
      localStorage.removeItem(stateKey);
      callState = defaultState();
      activeProduct = 'spolu'; 
      currentIndex = 0;
      lastCardEnterTime = Date.now();
      copilotTab = 'potreby';
      clearNotes(); 
      saveState(); 
      renderAll();
      toast('✓ Načten čistý nový hovor');
    }

    function resetCallOnly() { 
      if (confirm('Opravdu zahodit aktuální hovor bez uložení?')) doReset(); 
    }

    function fireConfetti() {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const colors = ['#0050ff','#00c6ff','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#fff'];
      const particles = Array.from({length: 180}, () => ({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 80,
        r: 4 + Math.random() * 5,
        w: 6 + Math.random() * 9, h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 7,
        vy: -(9 + Math.random() * 9),
        gravity: 0.28,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 9,
        shape: Math.random() > 0.45 ? 'rect' : 'circle',
        opacity: 1
      }));
      let frame = 0;
      function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
          p.vy += p.gravity; p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed;
          if (frame > 55) p.opacity = Math.max(0, p.opacity - 0.012);
          if (p.opacity > 0 && p.y < canvas.height + 30) {
            alive = true;
            ctx.save(); ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y); ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color;
            if (p.shape === 'rect') ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI*2); ctx.fill(); }
            ctx.restore();
          }
        });
        frame++;
        if (alive) requestAnimationFrame(draw); else canvas.remove();
      }
      draw();
    }

    function newCall(save) {
      try {
        if (save && !callState.finalStatus && !isSandbox) {
          toast('⚠️ Vyber nejprve status hovoru (Prodáno / Zpětný kontakt / Neprodáno)');
          return;
        }
        trackCardTime();
        let score = calculateScore();
        
        if (save && !isSandbox) {
          const snap = callSnapshot(score);
          callHistory.push(snap);
          try {
            localStorage.setItem(histKey, JSON.stringify(callHistory));
          } catch (e) {
            toast('Paměť byla plná, starší historie byla promazána.');
            callHistory = callHistory.slice(-100); 
            localStorage.setItem(histKey, JSON.stringify(callHistory));
          }
          sendTeamsNotification(snap);
          if (callState.finalStatus === 'Prodáno') fireConfetti();
        }
        
        showPremiumSave(isSandbox ? 'Trénink ukončen' : (save ? 'Hovor uložen' : 'Nový hovor'), isSandbox ? 'Tréninkový hovor se neuložil do statistik.' : (save ? 'Obchodní stopa byla zapsána a cockpit je připraven na další hovor.' : 'Cockpit je připraven na čistý nový hovor.'));
        
        localStorage.removeItem(stateKey);
        callState = defaultState();
        activeProduct = 'spolu'; 
        currentIndex = 0;
        lastCardEnterTime = Date.now();
        copilotTab = 'potreby';
        clearNotes(); 
        saveState(); 
        renderAll();
        toast(isSandbox ? 'Trénink ukončen · neuloženo' : (save ? '✓ Hovor uložen · načten čistý nový hovor' : '✓ Načten čistý nový hovor'));
      } catch (e) {
        console.error(e);
        toast('Chyba při ukládání hovoru – zkus znovu nebo zkontroluj konzoli.');
      }
    }

    function customerEndedCall() {
      if (!confirm('Zákazník opravdu ukončil hovor v průběhu? Tento krok ukončí aktuální sezení.')) return;
      trackCardTime();
      addUnique(callState.quickFacts, 'customerEnded');
      
      if (!isSandbox) {
        const score = calculateScore();
        const snap = callSnapshot(score);
        callHistory.push(snap);
        try {
          localStorage.setItem(histKey, JSON.stringify(callHistory));
        } catch(e) {
          callHistory = callHistory.slice(-100);
          localStorage.setItem(histKey, JSON.stringify(callHistory));
        }
        sendTeamsNotification(snap);
      }
      
      showPremiumSave('Hovor ukončen zákazníkem', isSandbox ? 'Tréninkový hovor se neuložil.' : 'Aktuální stav hovoru byl uložen do statistik.');
      doReset();
      toast(isSandbox ? 'Zákazník ukončil hovor · trénink neuložen' : 'Zákazník ukončil hovor · uloženo');
    }

    function setupNotes() {
      let raw = localStorage.getItem(notesKey) || '', cleaned = raw.split('\n').filter(line => !/^[\[]\d{1,2}:\d{2}[\]]/.test(line.trim())).join('\n').trim();
      $('callNotes').value = cleaned; 
      localStorage.setItem(notesKey, cleaned);
      $('callNotes').addEventListener('input', () => localStorage.setItem(notesKey, $('callNotes').value));
    }

    function clearNotes() { 
      localStorage.removeItem(notesKey); 
      $('callNotes').value = ''; 
    }

    function toast(t, duration) { 
      let x = $('toast'); 
      x.textContent = t; 
      x.classList.add('show'); 
      const ms = (typeof duration === 'number' && duration > 0) ? duration : 1400;
      clearTimeout(toast._t);
      toast._t = setTimeout(() => x.classList.remove('show'), ms); 
    }

    function toggleZen() {
      // Cyklus: 0 = vyp, 1 = Deep Focus (skrýt boční panely)
      zenLevel = (zenLevel + 1) % 2;
      document.body.classList.toggle('zen-mode', zenLevel === 1);
      const btn = $('zenBtn'), badge = $('zenBadge');
      if (btn) {
        btn.classList.remove('zen1', 'zen2', 'zen3');
        if (zenLevel === 1) btn.classList.add('zen1');
        btn.title = zenLevel === 0
          ? 'Zen: klik pro Deep Focus (skrýt boční panely)'
          : 'Deep Focus aktivní · klik pro vypnutí';
      }
      if (badge) badge.textContent = zenLevel === 0 ? '' : '1';
      toast(zenLevel === 0 ? 'Zen vypnut' : '🌙 Zen · Deep Focus');
      renderAll();
    }

    function updateHeaderAvatar() {
      const el = document.getElementById('headerAvatar');
      if (!el) return;
      const name = getAuthorName() || 'Konzultant';
      const parts = name.trim().split(/\s+/).filter(Boolean);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
      const GRADIENTS = [
        'linear-gradient(135deg,#4f46e5,#7c3aed)',
        'linear-gradient(135deg,#0050ff,#4f46e5)',
        'linear-gradient(135deg,#059669,#0d9488)',
        'linear-gradient(135deg,#dc2626,#ea580c)',
        'linear-gradient(135deg,#1e40af,#0ea5e9)',
        'linear-gradient(135deg,#7c3aed,#c084fc)',
        'linear-gradient(135deg,#b45309,#f59e0b)',
        'linear-gradient(135deg,#0e7490,#06b6d4)',
        'linear-gradient(135deg,#be185d,#ec4899)',
        'linear-gradient(135deg,#065f46,#10b981)',
      ];
      const hash = [...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0);
      el.textContent = initials;
      el.style.background = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
      el.setAttribute('data-name', name);
    }

    function toggleSandbox() {
      isSandbox = !isSandbox;
      document.body.classList.toggle('sandbox-mode', isSandbox);
      const btn = $('sandboxBtn');
      if (btn) {
        btn.classList.toggle('on', isSandbox);
        btn.title = isSandbox ? 'Trénink ZAPNUT · hovory se neukládají (klik pro vypnutí)' : 'Trénink: hovory se neukládají do statistik';
      }
      toast(isSandbox ? 'Trénink zapnut – hovory se neukládají' : 'Trénink vypnut');
    }

    function updateFullscreenButton() {
      const btn = $('fullscreenBtn');
      if (!btn) return;
      const inFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      btn.classList.toggle('on', inFullscreen);
      btn.title = inFullscreen ? 'Fullscreen ZAPNUT (klik pro ukončení)' : 'Přepnout celou obrazovku';
    }

    async function toggleFullscreen() {
      const inFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
      try {
        if (!inFullscreen) {
          const el = document.documentElement;
          const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
          if (req) await req.call(el);
        } else {
          const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
          if (exit) await exit.call(document);
        }
      } catch (e) {
        toast('Fullscreen nelze zapnout v tomto prostředí.', 1700);
      } finally {
        updateFullscreenButton();
        scheduleViewportEnforce();
      }
    }

    // Po fullscreen změně Android Chrome resetuje viewport → vynuť desktop layout přes dynamický scale
    function enforceViewport() {
      const vp = document.querySelector('meta[name="viewport"]');
      if (!vp) return;
      // Zjišťuji fyzickou šířku obrazovky (window.screen.width v landscape) a spočítám scale
      // tak, aby se celých 1400px designu vešlo do reflectu zařízení.
      const deviceWidth = Math.max(
        window.screen && window.screen.width ? window.screen.width : 0,
        window.innerWidth || 0,
        document.documentElement.clientWidth || 0
      );
      const targetWidth = 1400;
      const scale = deviceWidth > 0 ? Math.min(1, deviceWidth / targetWidth) : 1;
      vp.content = `width=${targetWidth}, initial-scale=${scale.toFixed(4)}, minimum-scale=${scale.toFixed(4)}, maximum-scale=5, user-scalable=yes, shrink-to-fit=no`;
    }

    function scheduleViewportEnforce() {
      [0, 100, 300, 800, 1500].forEach(ms => setTimeout(enforceViewport, ms));
    }

    /* -------------------------------------------------------------------------
       MOBILNÍ ZOBRAZENÍ
       Toggle: přepne kokpit do režimu „PC layout zmenšený do displeje mobilu".
       - Uvolní `min-width: 1400px` na <html> (mobile-view-root)
       - Nastaví viewport na device-width, initial-scale=1
       - Spočítá poměr innerWidth / 1400 a aplikuje ho jako CSS `zoom` na <body>
         → celý 1400px design se zmenší tak, aby přesně padnul do displeje.
       Když je zapnutý fullscreen + landscape S24 (~890 px) → zoom ≈ 0.635.
       Portrait S24 (~412 px) → zoom ≈ 0.29 (drobné, ale kompletní PC layout).
       ------------------------------------------------------------------------- */
    function applyMobileScale() {
  const vp = document.querySelector('meta[name="viewport"]');
  const root = document.documentElement;
  
  if (!isMobileView) {
    root.classList.remove('mobile-view-root');
    document.body.style.zoom = '';
    document.body.style.removeProperty('-moz-transform');
    document.body.style.removeProperty('-moz-transform-origin');
    root.style.removeProperty('--mob-scale'); // <--- PŘIDAT ÚKLID (když se mobilní zobrazení vypne)
    enforceViewport();
    return;
  }
  
  root.classList.add('mobile-view-root');
  if (vp) vp.content = 'width=device-width, initial-scale=1, minimum-scale=0.25, maximum-scale=3, user-scalable=yes, shrink-to-fit=no';
  
  const w = Math.max(1, window.innerWidth || root.clientWidth || 360);
  const scale = Math.min(1, w / 1400);
  
  // ---> PŘIDAT TENTO ŘÁDEK <---
  // Posíláme vypočtené měřítko do CSS proměnné
  root.style.setProperty('--mob-scale', scale.toFixed(4)); 
  
  document.body.style.zoom = scale.toFixed(4);
  
  if (!('zoom' in document.body.style) || navigator.userAgent.includes('Firefox')) {
    document.body.style['-moz-transform'] = 'scale(' + scale.toFixed(4) + ')';
    document.body.style['-moz-transform-origin'] = '0 0';
  }
}

    function toggleMobileView() {
      isMobileView = !isMobileView;
      document.body.classList.toggle('mobile-view', isMobileView);
      const btn = $('mobileBtn');
      if (btn) {
        btn.classList.toggle('on', isMobileView);
        btn.title = isMobileView
          ? 'Mobilní zobrazení ZAPNUTO · pro maximální komfort přepni také Fullscreen a otoč telefon na šířku (klik pro vypnutí)'
          : 'Mobilní zobrazení: zmenší celý PC layout tak, aby se vešel na displej mobilu (ideálně použij spolu s fullscreenem a na šířku)';
      }
      applyMobileScale();
      toast(isMobileView ? 'Mobilní zobrazení: ZAP · doporučuji zapnout Fullscreen a otočit na šířku' : 'Mobilní zobrazení: VYP', 2200);
    }

    // Inicialižuj hned při načtení skriptu
    enforceViewport();

    document.addEventListener('fullscreenchange', () => { updateFullscreenButton(); scheduleViewportEnforce(); if (isMobileView) setTimeout(applyMobileScale, 120); });
    document.addEventListener('webkitfullscreenchange', () => { updateFullscreenButton(); scheduleViewportEnforce(); if (isMobileView) setTimeout(applyMobileScale, 120); });
    document.addEventListener('MSFullscreenChange', () => { updateFullscreenButton(); scheduleViewportEnforce(); if (isMobileView) setTimeout(applyMobileScale, 120); });
    window.addEventListener('resize', () => {
      if (isMobileView) applyMobileScale();
      else if (document.fullscreenElement || document.webkitFullscreenElement) enforceViewport();
    });
    window.addEventListener('orientationchange', () => {
      scheduleViewportEnforce();
      if (isMobileView) [80, 250, 600].forEach(ms => setTimeout(applyMobileScale, ms));
    });

    function splitLines(v) { return String(v || '').split('\n').map(x => x.trim()).filter(Boolean); }
    function lines(v) { return (v || []).join('\n'); }

    /* =========================================================================
       VOICE RECOGNITION (COPILOT ULTRA-STABLE ENGINE v2 — TOTAL UPGRADE)
       -------------------------------------------------------------------------
       - Web Speech API + adaptive keep-alive with exponential backoff
       - Silent-hang watchdog (recognizing but no results → auto-restart)
       - Page-visibility aware pause/resume (no phantom prompts in bg tab)
       - Multi-alternative decoding (uses best-scoring alt across recognizer hyp.)
       - Live interim processing (debounced) — matches appear WITHOUT pausing
       - Precomputed dictionary + phrase index (built once, then O(1) per token)
       - Czech-aware suffix stripper (proper stemming, not blunt 6-char cut)
       - Levenshtein-1 tolerance for STT mishearings (5+ char words)
       - Bigram + stem-set overlap scoring with adaptive threshold per mode
       - Negation guard ("nechci to", "nemám...", "ne-*") — kills false positives
       - Rolling dedupe window with Jaccard similarity
       - Rolling transcript history (last 8 finals + matched categories)
       - Optional live audio-level meter (AnalyserNode) in voicePanel
       ========================================================================= */
    let recognition = null;
    let isListening = false;
    let isRecognizing = false;
    let voiceRestartTimer = null;
    let voiceWatchdogTimer = null;
    let voiceInterimTimer = null;
    let voiceSessionStartedAt = 0;
    let lastVoiceResultAt = 0;
    let voiceRapidEndCount = 0;
    let voiceRapidErrorCount = 0;
    let voiceNetworkErrorCount = 0;        // consecutive `network` errors; reset on any result
    let lastVoiceNetworkErrorAt = 0;
    let voiceBackoffMs = 400;              // grows on repeated onend, decays on success
    let voiceAutoRestartEnabled = true;
    let voicePermissionNoticeShown = false;
    let voiceNetworkNoticeShown = false;
    let lastVoiceFinalNorm = '';
    let lastVoiceFinalAt = 0;
    let lastVoiceToastAt = 0;
    let lastVoiceStats = { needs: [], questions: [], benefits: [], utilities: [], nextSteps: [] };
    let voiceDebugOpen = false;
    let voiceMode = 'balanced';
    let voiceRecentFinals = [];            // rolling dedupe window (last N normalized finals)
    let voiceHistory = [];                 // rolling display history: [{ text, matched, at }]
    let voiceLastInterim = '';             // last processed interim (for change-detection)
    let voiceInterimBaseline = new Set();  // set of matches derived from THIS interim run
    let voiceIndex = null;                 // precomputed phrase index (built lazily)

    // Audio meter (optional visual feedback)
    let voiceAudioCtx = null;
    let voiceAnalyser = null;
    let voiceMeterStream = null;
    let voiceMeterRaf = 0;

    const voiceModeDefs = {
      // fuzzyRatio  : min ratio of target-stem hits vs. target tokens
      // dedupeMs    : suppress identical final within N ms
      // minTextLen  : reject too-short finals
      // scoreMin    : min composite score (0..1) to accept a phrase match
      // interimMs   : debounce for live interim processing (0 = disabled)
      // jaccardDup  : Jaccard similarity above which finals are treated as duplicates
      // stemLev1    : max Levenshtein-1 tolerance active? (per mode)
      strict:   { label: 'Strict',   fuzzyRatio: 0.72, dedupeMs: 3200, minTextLen: 9, scoreMin: 0.78, interimMs: 0,    jaccardDup: 0.90, stemLev1: false },
      balanced: { label: 'Balanced', fuzzyRatio: 0.65, dedupeMs: 2500, minTextLen: 6, scoreMin: 0.72, interimMs: 0,  jaccardDup: 0.85, stemLev1: true  },
      fast:     { label: 'Fast',     fuzzyRatio: 0.46, dedupeMs: 1700, minTextLen: 4, scoreMin: 0.48, interimMs: 500,  jaccardDup: 0.80, stemLev1: true  }
    };
    const VOICE_MIN_TEXT_LEN = 6;
    const VOICE_DEDUPE_MS = 2500;
    const VOICE_TOAST_COOLDOWN_MS = 1000;
    const VOICE_DEDUPE_WINDOW = 6;
    const VOICE_HISTORY_MAX = 8;
    const VOICE_WATCHDOG_MS = 8500;       // no result for this long while recognizing → restart
    const VOICE_MAX_ALTERNATIVES = 3;
    const VOICE_BACKOFF_MIN = 350;
    const VOICE_BACKOFF_MAX = 5000;
    const VOICE_NETWORK_MAX_ERRORS = 6;   // hard-stop only after this many `network` errors in a row
    const VOICE_NETWORK_ERROR_WINDOW_MS = 20000; // outside window → counter resets

    function isLocalhostHost() {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }

    function isInsecureSpeechContext() {
      // file:// and plain http (except localhost) are the most common causes of repeated mic permission prompts.
      if (window.location.protocol === 'file:') return true;
      if (window.location.protocol === 'http:' && !isLocalhostHost()) return true;
      return false;
    }

    function voiceContextLabel() {
      if (window.location.protocol === 'file:') return 'file://';
      if (window.location.protocol === 'http:' && !isLocalhostHost()) return 'http';
      return 'secure';
    }

    function showVoicePermissionNoticeOnce(reason = '') {
      if (voicePermissionNoticeShown) return;
      voicePermissionNoticeShown = true;
      const ctx = voiceContextLabel();
      const why = reason ? `\nDůvod: ${reason}` : '';
      const message =
        `⚠️ Mikrofon je blokovaný (${ctx}).${why} ` +
        'Pro stabilní hlas spusťte stránku přes localhost nebo HTTPS.';
      setVoiceDebugStatus(message);
    }

    function showVoiceNetworkNoticeOnce() {
      if (voiceNetworkNoticeShown) return;
      voiceNetworkNoticeShown = true;
      const message = '⚠️ Hlas narazil na síťovou chybu a byl zastaven. Zkuste znovu zapnout Naslouchání nebo obnovit stránku.';
      setVoiceDebugStatus(message);
    }

    function getVoiceCfg() {
      return voiceModeDefs[voiceMode] || voiceModeDefs.balanced;
    }

    function saveVoiceSettings() {
      localStorage.setItem(voiceSettingsKey, JSON.stringify({ voiceMode, voiceDebugOpen }));
    }

    function loadVoiceSettings() {
      try {
        const s = JSON.parse(localStorage.getItem(voiceSettingsKey) || 'null');
        if (s && voiceModeDefs[s.voiceMode]) voiceMode = s.voiceMode;
        if (s && typeof s.voiceDebugOpen === 'boolean') voiceDebugOpen = s.voiceDebugOpen;
      } catch (e) {}
    }

    function modeOrder() {
      return ['strict', 'balanced', 'fast'];
    }

    function cycleVoiceMode() {
      const order = modeOrder();
      const i = order.indexOf(voiceMode);
      voiceMode = order[(i + 1) % order.length];
      saveVoiceSettings();
      renderVoiceDebug();
      updateVoiceModeButton();
      toast(`Hlas režim: ${getVoiceCfg().label}`);
    }

    function updateVoiceModeButton() {
      if ($('voiceModeBtn')) $('voiceModeBtn').textContent = `🎯 Hlas: ${getVoiceCfg().label}`;
      if ($('voiceDebugModeLabel')) $('voiceDebugModeLabel').textContent = getVoiceCfg().label;
    }

    function setVoiceDebugStatus(text) {
      if ($('voiceDebugStatus')) $('voiceDebugStatus').textContent = text;
    }

    function toChips(values, label) {
      if (!values || !values.length) return '';
      return values.map(v => `<span class="voice-chip">${esc(label)}: ${esc(v)}</span>`).join('');
    }

    function renderVoiceDebug() {
      const panel = $('voiceDebugPanel');
      if (!panel) return;
      panel.classList.toggle('open', !!voiceDebugOpen);
      updateVoiceModeButton();
      if ($('voiceDebugInterim')) {
        const v = $('voiceDebugInterim').dataset.value || '-';
        $('voiceDebugInterim').textContent = v;
      }
      if ($('voiceDebugFinal')) {
        const v = $('voiceDebugFinal').dataset.value || '-';
        $('voiceDebugFinal').textContent = v;
      }
      if ($('voiceDebugMatches')) {
        const html = [
          toChips(lastVoiceStats.needs, 'Need'),
          toChips(lastVoiceStats.questions, 'Q'),
          toChips(lastVoiceStats.benefits, 'B'),
          toChips(lastVoiceStats.utilities, 'U'),
          toChips(lastVoiceStats.nextSteps, 'Close')
        ].join('');
        $('voiceDebugMatches').innerHTML = html || '<span class="voice-chip">Bez shody</span>';
      }
      if ($('voiceDebugHistory')) {
        if (!voiceHistory.length) {
          $('voiceDebugHistory').innerHTML = '<div class="voice-history-item empty">Historie je prázdná – jakmile Copilot cokoli zachytí, uvidíš to tady.</div>';
        } else {
          $('voiceDebugHistory').innerHTML = voiceHistory.map(h => {
            const tags = (h.matched && h.matched.length)
              ? `<span class="vh-tags">→ ${esc(h.matched.join(' · '))}</span>`
              : '<span class="vh-tags" style="color:#94a3b8">→ bez shody</span>';
            return `<div class="voice-history-item">${esc(h.text)}${tags}</div>`;
          }).join('');
        }
      }
      if (!$('voiceDebugStatus') || !$('voiceDebugStatus').textContent) setVoiceDebugStatus('Vypnuto');
      if ($('micBtn')) $('micBtn').style.borderColor = voiceDebugOpen ? '#f59e0b' : '#10b981';
      if ($('voiceDebugBtn')) $('voiceDebugBtn').style.background = voiceDebugOpen ? 'rgba(245, 158, 11, 0.35)' : '';
    }

    function setVoiceDebugInterim(text) {
      if ($('voiceDebugInterim')) {
        $('voiceDebugInterim').dataset.value = text || '-';
        if (voiceDebugOpen) $('voiceDebugInterim').textContent = text || '-';
      }
    }

    function setVoiceDebugFinal(text) {
      if ($('voiceDebugFinal')) {
        $('voiceDebugFinal').dataset.value = text || '-';
        if (voiceDebugOpen) $('voiceDebugFinal').textContent = text || '-';
      }
    }

    function setVoiceDebugMatches(matches) {
      lastVoiceStats = {
        needs: [...(matches.needs || [])],
        questions: [...(matches.questions || [])],
        benefits: [...(matches.benefits || [])],
        utilities: [...(matches.utilities || [])],
        nextSteps: [...(matches.nextSteps || [])]
      };
      if (voiceDebugOpen) renderVoiceDebug();
    }

    function toggleVoiceDebug() {
      voiceDebugOpen = !voiceDebugOpen;
      saveVoiceSettings();
      renderVoiceDebug();
    }

    // Překladový konverzační slovník – přirozené varianty + vlastní slova agenta
    const voiceDictionary = {
      // ── Rodina / Spolu ────────────────────────────────────────────────────────
      'Má více služeb v domácnosti': [
        'více služeb','vícero služeb','všechno u o2','všechny služby','máte od nás víc','množství služeb',
        'mobil i internet','celá rodina u nás','víc věcí u nás','přesunout vše','víc produktů',
        'máte u nás mobil','máte u nás internet','máte více věcí','služby dohromady','vše pod jednou'
      ],
      'Má další čísla v rodině': [
        'další čísla','čísla v rodině','manželka má','děti mají','syn má','dcera má','rodinní příslušníci',
        'partner má','přítelkyně má','rodiče mají','celá rodina','číslo pro děti','číslo manžela',
        'víc čísel','ostatní v rodině','všichni doma','číslo manželky','číslo přítelkyně'
      ],
      'Má služby u konkurence': [
        'u konkurence','jiného operátora','jiné společnosti','máte jinde','máte u jiného','od jiné firmy',
        't-mobile','vodafone','tmobile','jiná firma','u jiného poskytovatele','nemáte u nás',
        'od t-mobilu','od vodafonu','kabel tv','o2 nemáte','platíte jinde','máte jinde smlouvu'
      ],
      'Platí více faktur': [
        'více faktur','dvě faktury','tři faktury','víc faktur','chodí vám faktury','více plateb',
        'faktury od více','rozdělené faktury','různé faktury','různé platby','různé společnosti',
        'platíte několika','hodně faktur','dvě tři faktury','chodí víc faktur'
      ],
      'Chce snížit náklady domácnosti': [
        'snížit náklady','chcete snížit','ušetřit měsíčně','platíte moc','zlevnit domácnost','snížit platby','chcete ušetřit',
        'hodně platím','hodně platíte','je to drahé','přijde mi to drahé','platit méně','snížit výdaje',
        'levněji','chtěl bych ušetřit','snížit cenu','celkové náklady','drahé služby',
        'ušetřit na službách','ušetřit celkově','optimalizovat náklady','přeplatit','přeplácíte'
      ],
      'Chce služby sloučit': [
        'sloučit','spojit do','dát dohromady','pod jeden balíček','chcete spojit','dáme to k sobě',
        'dát pod jednu smlouvu','mít vše u jednoho','jeden operátor','jedna firma',
        'přesunout vše k nám','mít všechno u nás','vše pod jedním','konsolidovat','dát k sobě'
      ],
      'Chce jednodušší správu služeb': [
        'jednodušší správu','jednu aplikaci','jeden účet','všechno na jednom místě','jednoduše spravovat',
        'jednodušší','méně starostí','přehledněji','na jednom místě','jednou aplikací',
        'neřešit více věcí','zjednodušit','jeden přístup','přehledné','snadněji spravovat','jedna aplikace'
      ],
      // ── Postpaid ──────────────────────────────────────────────────────────────
      'Není spokojený s cenou': [
        'nejste spokojený s cenou','nespokojen','je to drahé','moc platíte','zdá se vám to drahé','vysoká cena','chcete ušetřit na tarifu',
        'tarif je drahý','platím moc za mobil','cena tarifu','příliš drahý tarif','nevýhodný tarif',
        'přeplatit','přeplácíte','levnější tarif','levnější paušál','snížit tarif','drahy pausal'
      ],
      'Dochází mu data nebo FUP': [
        'docházejí vám data','dochází vám data','málo dat','vyčerpáte data','zastaví se internet','limit dat','data vám nestačí',
        'nestačí mi data','rychle vyčerpám','omezení rychlosti','throttling',
        'data docházejí','spotřebuji vše','internet se zastaví','data nestačí',
        'málo gb','dochází gb','fup','snížení rychlosti','zpomalený internet v mobilu',
        'data brzo dojdou','nestačí data','brzo nemám data'
      ],
      'Omezuje používání mobilu': [
        'omezujete se','musíte se omezovat','hlídáte si data','hlídat data','abyste se neomezoval',
        'nepoužívám naplno','omezuji se','hlídám data','musím šetřit data',
        'nedívám se kvůli datům','šetřím data','bojím se přečerpat','opatrně s daty',
        'omezuji youtube','nesleduji videa','musím šetřit'
      ],
      'Má číslo u konkurence': [
        'číslo u konkurence','číslo jinde','máte t-mobile','máte vodafone','jiného operátora',
        'číslo je jinde','paušál u jiných','tarif u konkurence','smlouva jinde','číslo mimo o2',
        'u tele2','u o2 nejsem','nejsem u o2'
      ],
      'Využívá mobil aktivně v 5G': [
        '5g','rychlý internet v mobilu','aktivně využíváte mobil',
        'moderní telefon','5g telefon','hodně surfuji','hodně používám mobil','mobilní data hodně','streamuji v mobilu',
        'rychlá síť','nejrychlejší síť','5g síť'
      ],
      'Využije chytré hodinky / tablet': [
        'hodinky','tablet','apple watch','využijete chytré','nosíte hodinky',
        'chytré hodinky','samsung watch','ipad','android tablet',
        'nosím hodinky','mám tablet','hodinky s esim','esim hodinky','přidat hodinky'
      ],
      'Chce slevu na nový telefon': [
        'chcete slevu na telefon','slevu na mobil','nový telefon','nový mobil','koupit telefon','slevu na nový telefon',
        'pořídím telefon','chci nový telefon','koupit nový mobil','zvýhodněný telefon',
        'iphone','samsung','se slevou','příspěvek na telefon','telefon za dobrou cenu','upgrade telefonu'
      ],
      // ── Internet ──────────────────────────────────────────────────────────────
      'Platí hodně u konkurence': [
        'platíte hodně u konkurence','drahé u konkurence','u jiného poskytovatele platíte',
        'internet od jiných','internet od upc','mám internet jinde','drahý internet','platím moc za internet',
        'drahé připojení','jiný poskytovatel internetu'
      ],
      'Má pomalý internet': [
        'pomalý internet','dlouho to načítá','seká se to','pomalé připojení','internet je pomalý',
        'nestíhá to','buffering','načítá se pomalu','internet nestačí','pomalé stahování',
        'nízká rychlost','pomalá wifi','internet táhne','trvá to věčnost','stahuje pomalu',
        'internet je pomalý','slow internet'
      ],
      'Má výpadky připojení': [
        'výpadky','vypadává','padá to','internet vypadává','přerušuje se',
        'nefunguje internet','internet nefunguje','nestabilní','přestane fungovat',
        'odpojuje se','ztrácí se připojení','padá připojení','výpadek internetu',
        'internet se odpojuje','znovu a znovu vypadne'
      ],
      'Má slabou Wi‑Fi doma': [
        'máte slabou wifi','slabou wifi','slabá wifi','nedosáhne signál','špatný signál wifi',
        'wifi nedosáhne','v pokoji nefunguje wifi','daleko od routeru','slabé pokrytí',
        'mrtvé zóny','žádný signál','wifi v patře','wifi ve sklepě','signál nedosahuje',
        'špatná wifi','špatný wifi signál'
      ],
      'Pracuje / studuje z domova': [
        'z domova','home office','pracujete doma','studujete doma',
        'videokonference','teams hovory','zoom hovory',
        'pracuji z domova','studuji doma','online výuka','online práce','vzdálená práce',
        'pracuji doma','home office internet'
      ],
      'Potřebuje silný router Smart Box': [
        'silný router','lepší router','smart box','nový modem','potřebujete silnější wifi',
        'router nestačí','starý router','vyměnit router','nový router','lepší modem',
        'wifi 6','moderní router','silnější signál','pokrýt celý byt','pokrýt celý dům',
        'o2 smart box','mesh'
      ],
      'Chce internet spojit s dalšími službami': [
        'spojit internet','dát k paušálu','přidat k mobilu','internet do balíčku',
        'internet i mobil','balíček s internetem','přidat internet','kombinovat internet',
        'internet k paušálu','internet spolu s mobilem'
      ],
      // ── Oneplay / Unity ───────────────────────────────────────────────────────
      'Sleduje TV nebo streamy': [
        'sledujete tv','koukáte na televizi','streamy','netflix','voyo',
        'dívám se na tv','sleduju televizi','youtube','prima plus',
        'disney plus','streaming','online televizí','sledujete filmy',
        'sledujete seriály','pořady','televize doma'
      ],
      'Chybí mu sport (Liga mistrů, hokej)': [
        'chybí vám sport','sportovní programy','liga mistrů','hokej','fotbal','sledujete sport',
        'sportovní zápasy','sport živě','hokejové zápasy','fotbalové zápasy','champions league',
        'czech hockey','sparta','slavia','formula 1','tenis','sport online','živé přenosy'
      ],
      'Chybí mu filmy a seriály': [
        'chybí vám filmy','filmy a seriály','díváte se na filmy','sledujete seriály',
        'filmy online','nové filmy','zahraniční seriály','české seriály',
        'dokumenty','sledovat filmy','oblíbené seriály','filmová databáze'
      ],
      'Chce zpětné sledování až 7 dní': [
        'zpětné zhlédnutí','přetáčet','zpětné sledování','nestíháte včas',
        'promeškal pořad','nestihl jsem','zpětně pustit','dívat se zpětně',
        'archiv pořadů','záznam pořadu','catch up','přehrát zpět','nestihnout pořad'
      ],
      'Sleduje na více zařízeních současně': [
        'více zařízeních','na mobilu i','na tabletu i','víc lidí najednou','na více televizích',
        'víc televizí doma','každý chce dívat','různá zařízení','na cestách i doma',
        'telefon i televize','tablet i televize','více obrazovek','multiscreen'
      ],
      'Chce slevu 300 Kč na účet přes Unity': [
        'tři sta korun','air bank','odměna','slevu na účet','unity',
        'třísta měsíčně','300 měsíčně','odměna na účet','cashback','zpět na účet',
        'air banka','airbank','peníze zpět','odměna unity','sleva unity','300 korun zpět'
      ],
      'Platí více streamovacích služeb naráz': [
        'více stream','platíte netflix','platíte jinde','víc předplatných',
        'několik předplatných','drahá předplatná','netflix a disney','spotify i netflix',
        'víc streamingů','různé streamovací','předplatné za předplatným','spoustu předplatných'
      ],
      // ── Dotažení ──────────────────────────────────────────────────────────────
      'Sjednán přesný termín zpětného volání': [
        'přesný termín','zavoláme si v','zavolám vám v','domluvíme se na',
        'zavolám vám zítra','zavolám ve','domluvit termín','kdy vám zavolat',
        'váš čas','vhodný čas','navrhuji čas','domluvit na čas','kdy se ozvat'
      ],
      'Korektně ukončeno – omyl / neplatný kontakt': [
        'je to omyl','neplatný','vyřadím vás','nezdržuji','mějte se hezky',
        'omyl promiňte','promiňte za volání','omlouvám se za rušení','špatné číslo',
        'voláme omylem','byl to omyl','zavoláme špatně'
      ],
      'Odeslána informační SMS / vizitka': [
        'pošlu vám vizitku','informační sms','posílám sms','máte to v telefonu','poslal jsem vizitku',
        'posílám kontakt','odeslal jsem sms','dostanete sms','pošlu vám sms',
        'kontakt přijde','vizitka jde','zpráva odeslána'
      ],
      'Zákazník v silném spěchu – nepřebíhat do nabídky': [
        've spěchu','spěcháte','nebudu zdržovat','rychle se loučím',
        'musíte jít','nemám čas','nemáte čas','zavolejte jindy',
        'teď nemohu','vás nezdržuji','loučím se','nestihnu'
      ]
    };

    function stripDia(s) {
      return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
    }

    function normalizeVoiceText(s) {
      return stripDia(s).replace(/\s+/g, ' ').trim();
    }

    /* -------------------------------------------------------------------------
       CZECH-AWARE STEMMER
       Strips common suffixes so "faktury/faktuře/fakturami" → "faktur".
       Cheap, deterministic, no dictionary — good enough for STT matching.
       ------------------------------------------------------------------------- */
    const VOICE_STOP = new Set([
      'a','se','si','na','v','do','k','z','ze','to','mu','je','pro','o','s','so','ku','od','pri','za','po','u','ve','vy',
      'my','vas','vam','nam','jim','jsem','jsi','jsme','jste','jsou','byl','byla','bylo','byli','bych','bys','byste',
      'ten','ta','ty','ti','tu','to','ke','ku','me','mne','mi','tvuj','svuj','moje','jeho','jeji','jich',
      'nebo','ale','i','uz','taky','take','jen','jenom','snad','asi','tak','pak','tady','tam','uz','vic','moc','nekdy','vzdy',
      'kdy','kdo','co','kam','proc','jak','jaky','jaka','jake','jaci','ktery','ktera','ktere','ale','protoze',
      'no','jo','ano','ne','no','fajn','dobre','samozrejme','urcite','vlastne','vpodstate','opravdu','tedy','proste'
    ]);

    const CS_SUFFIXES = [
      // longest first
      'ovanou','ovaneho','ovanemu','ovanym','ovanymi','ovanych','ovanymi',
      'ovana','ovane','ovani','ovany','ovava','ovava',
      'atelnych','atelnymi','atelnemu','atelneho','atelnym','atelnou','atelna','atelne','atelni','atelny',
      'nejsi','nejsim','nejsimu','nejsiho','nejsim','nejsich','nejsimi',
      'ovat','ovava','ovala','ovali','ovali','ovaly','ovano','ovana','ovane',
      'ejsi','ejsim','ejsimu','ejsiho','ejsich','ejsimi',
      'iste','ete','eme','ejte','ejme','ali','aly','ala','ale','ame','ate','aji','ajte',
      'ovi','ovy','ove','ova','ovem','ovymi','ovych','ovem',
      'ami','ach','emu','eho','ich','imi','ymi','ych','ymi',
      'ova','ove','ovy','ovi',
      'ost','ostem','osti','ostem','ostmi',
      'ovat','uje','uji','ujete','ujeme','ujou','ujiciho',
      'ivsi','avsi','yvsi',
      'ka','ku','ky','ce','cim','cimu','ciho','cimi',
      'em','im','um','ym','am','me','se','te','le',
      'ky','ka','ce','ci','ku','kou','ke','kem','kama',
      'ou','ic','ec','ce','ich','em','os','us','is','as','en',
      'ich','imi','emi','ymi',
      'mi','im','em','am','um','om','ym','ou',
      'ho','mu','ni','na','ne','no','ny','ky','ce','ke',
      'i','y','e','a','o','u'
    ];

    function stemCs(word) {
      let w = String(word || '');
      if (w.length < 4) return w;
      // Try longest suffix that leaves at least a 3-char root
      for (let i = 0; i < CS_SUFFIXES.length; i++) {
        const suf = CS_SUFFIXES[i];
        if (w.length - suf.length >= 3 && w.endsWith(suf)) {
          w = w.slice(0, w.length - suf.length);
          break;
        }
      }
      // Collapse double letters + normalize palatals (ch→h, sh→s tail is rare in cs)
      return w.replace(/(.)\1+/g, '$1');
    }

    function tokenizeCs(spokenNormalized) {
      return String(spokenNormalized || '')
        .split(' ')
        .filter(w => w && !VOICE_STOP.has(w));
    }

    function stemsOf(tokens) {
      return tokens.map(stemCs).filter(s => s && s.length >= 2);
    }

    // Levenshtein ≤ 1 (fast early-exit). Only used for words with len ≥ 5.
    function levLe1(a, b) {
      if (a === b) return true;
      const la = a.length, lb = b.length;
      if (Math.abs(la - lb) > 1) return false;
      let i = 0, j = 0, diff = 0;
      while (i < la && j < lb) {
        if (a[i] === b[j]) { i++; j++; continue; }
        if (++diff > 1) return false;
        if (la === lb)      { i++; j++; }
        else if (la > lb)   { i++; }
        else                { j++; }
      }
      if (i < la || j < lb) diff++;
      return diff <= 1;
    }

    function bigrams(tokens) {
      const out = [];
      for (let i = 0; i < tokens.length - 1; i++) out.push(tokens[i] + ' ' + tokens[i + 1]);
      return out;
    }

    /* -------------------------------------------------------------------------
       PRECOMPUTED VOICE INDEX
       Built once from voiceDictionary + all products' Q/B/U + closings + needs.
       For each phrase title, we cache normalized target + stems + variants.
       ------------------------------------------------------------------------- */
    function buildPhraseEntry(title, extraVariants) {
      const normTitle = normalizeVoiceText(title);
      const titleTokens = tokenizeCs(normTitle);
      const titleStems = new Set(stemsOf(titleTokens));

      const variants = [];
      const variantStems = new Set();
      const variantBigrams = new Set();

      const addVariant = (v) => {
        const n = normalizeVoiceText(v);
        if (!n) return;
        variants.push(n);
        const toks = tokenizeCs(n);
        stemsOf(toks).forEach(s => variantStems.add(s));
        bigrams(toks).forEach(b => variantBigrams.add(b));
      };

      addVariant(title);
      (extraVariants || []).forEach(addVariant);
      (voiceDictionary[title] || []).forEach(addVariant);

      titleStems.forEach(s => variantStems.add(s));
      bigrams(titleTokens).forEach(b => variantBigrams.add(b));

      return { title, normTitle, titleTokens, titleStems, variants, variantStems, variantBigrams };
    }

    function ensureVoiceIndex() {
      if (voiceIndex) return voiceIndex;
      const idx = { needs: [], byProduct: {}, closings: [] };

      if (typeof needGroupsDef !== 'undefined') {
        Object.values(needGroupsDef).forEach(g => {
          (g.items || []).forEach(need => idx.needs.push(buildPhraseEntry(need)));
        });
      }

      if (typeof products !== 'undefined') {
        Object.entries(products).forEach(([key, p]) => {
          const pack = { questions: [], benefits: [], utilities: [] };
          (p.questions || []).forEach(q => pack.questions.push(buildPhraseEntry(q)));

          let bEntries = Object.entries(p.copilotBenefits || {});
          if (!bEntries.length) bEntries = (p.benefits || []).map(b => [b, '']);
          bEntries.forEach(([title, desc]) => pack.benefits.push(buildPhraseEntry(title, desc ? [desc] : [])));

          let uEntries = Object.entries(p.copilotUtilities || {});
          if (!uEntries.length) uEntries = (p.trialCloses || []).map(tc => [tc, '']);
          uEntries.forEach(([title, desc]) => pack.utilities.push(buildPhraseEntry(title, desc ? [desc] : [])));

          idx.byProduct[key] = pack;
        });
      }

      if (typeof getClosingSteps === 'function') {
        (getClosingSteps() || []).forEach(c => idx.closings.push(buildPhraseEntry(c)));
      }

      voiceIndex = idx;
      return idx;
    }

    // Rebuild the closing steps portion of the index (they can depend on state).
    function refreshClosingsIndex() {
      if (!voiceIndex) return;
      voiceIndex.closings = [];
      if (typeof getClosingSteps === 'function') {
        (getClosingSteps() || []).forEach(c => voiceIndex.closings.push(buildPhraseEntry(c)));
      }
    }

    /* -------------------------------------------------------------------------
       NEGATION GUARD
       Kills matches whose target stem is directly preceded (within 2 tokens)
       by a hard negator. Uses ONLY the whitelist — prefix "ne*" is intentionally
       avoided because most Czech negatives are also legitimate feature keywords
       ("nemám čas", "nechci se omezovat" ≠ automatic disqualifier for the
       "customer is limited" need).
       ------------------------------------------------------------------------- */
    const NEGATORS = new Set([
      'nechci','nechtel','nechtela','nechteli','nechtelo','nechtejte',
      'nemam','nemame','nemate','nema','nemaji','nemely','nemel','nemela',
      'nikdy','vubec','vylouceno','nezajem','nezajima','nezajimava',
      'neni','nebylo','nebyl','nebyla','nebudou','nebude','nebudu','nebudeme',
      'nemuzu','nemuzeme','nemuzete','nesmim','nesmi','nechteji'
    ]);
    function isNegatedContext(spokenTokens, targetStems) {
      if (!spokenTokens.length || !targetStems.size) return false;
      for (let i = 0; i < spokenTokens.length; i++) {
        const wStem = stemCs(spokenTokens[i]);
        if (!targetStems.has(wStem)) continue;
        // Look back up to 2 tokens for a hard negator only.
        for (let j = Math.max(0, i - 2); j < i; j++) {
          if (NEGATORS.has(spokenTokens[j])) return true;
        }
      }
      return false;
    }

    /* -------------------------------------------------------------------------
       SCORE A SINGLE PHRASE ENTRY AGAINST SPOKEN TEXT
       Returns 0..1. 0 = no match, ≥ scoreMin = accepted.
       ------------------------------------------------------------------------- */
    function scorePhrase(spokenNormalized, spokenTokens, spokenStems, spokenBigramsSet, entry) {
      if (!entry) return 0;
      const cfg = getVoiceCfg();

      // Layer 1: direct substring on title or any variant → huge boost
      if (entry.normTitle.length > 4 && spokenNormalized.includes(entry.normTitle)) return 1.0;
      for (let i = 0; i < entry.variants.length; i++) {
        const v = entry.variants[i];
        if (v.length > 4 && spokenNormalized.includes(v)) return 0.98;
      }

      // Layer 2: bigram overlap between spoken and any variant bigram
      let bigramHit = 0;
      spokenBigramsSet.forEach(b => { if (entry.variantBigrams.has(b)) bigramHit++; });
      const bigramScore = entry.variantBigrams.size ? bigramHit / Math.min(spokenBigramsSet.size, entry.variantBigrams.size) : 0;

      // Layer 3: stem-set overlap (bag of words, order-independent)
      if (!entry.titleTokens.length) return 0;
      const titleStemArr = [...entry.titleStems];
      let stemHits = 0;
      for (let i = 0; i < titleStemArr.length; i++) {
        const ts = titleStemArr[i];
        if (spokenStems.has(ts)) { stemHits++; continue; }
        if (cfg.stemLev1 && ts.length >= 5) {
          for (const ss of spokenStems) {
            if (Math.abs(ss.length - ts.length) <= 1 && levLe1(ss, ts)) { stemHits++; break; }
          }
        }
      }
      const stemRatio = titleStemArr.length ? stemHits / titleStemArr.length : 0;

      // Layer 4: reverse — spoken stems present in the variant stem set (broader)
      let reverseHits = 0;
      spokenStems.forEach(ss => { if (entry.variantStems.has(ss)) reverseHits++; });
      const reverseRatio = spokenStems.size ? reverseHits / Math.max(2, spokenStems.size) : 0;

      // Combine (weighted)
      const composite = Math.max(
        stemRatio * 0.75 + bigramScore * 0.25,
        stemRatio >= cfg.fuzzyRatio ? stemRatio : 0,
        reverseRatio >= 0.5 ? Math.min(0.9, 0.55 + reverseRatio * 0.3) : 0
      );

      // Require at least 1 real bigram OR ≥ 2 stem hits — protects against 1-word coincidences
      if (composite < 1 && stemHits < 2 && bigramHit < 1) return 0;

      return Math.min(1, composite);
    }

    // Backwards-compatible boolean wrapper — some legacy call sites still use it.
    function checkPhrases(spokenNormalized, targetStr) {
      if (!targetStr) return false;
      const s = String(spokenNormalized || '');
      if (!s) return false;
      const spokenTokens = tokenizeCs(s);
      const spokenStems = new Set(stemsOf(spokenTokens));
      const spokenBigrams = new Set(bigrams(spokenTokens));
      const entry = buildPhraseEntry(targetStr);
      const score = scorePhrase(s, spokenTokens, spokenStems, spokenBigrams, entry);
      if (score < getVoiceCfg().scoreMin) return false;
      if (isNegatedContext(spokenTokens, entry.titleStems)) return false;
      return true;
    }

    // Reflection trigger gate — potřeba se zaznamená jen pokud konzultant použil aktivní naslouchání
    function hasReflectionTrigger(s) {
      return s.includes('rozumim') || s.includes('chapu') || s.includes('takze') ||
             s.includes('rikal')   || s.includes('rikala') || s.includes('rikes') ||
             s.includes('pochopil') || s.includes('pochopila') || s.includes('shrnul') ||
             s.includes('shrnula')  || s.includes('opakuji') || s.includes('rekapituluji') ||
             s.includes('abych')    || s.includes('zopakuji') || s.includes('jen abych') ||
             s.includes('spravne chapu') || s.includes('jestli rozumim');
    }

    function collectVoiceMatches(spokenNormalized) {
      const idx = ensureVoiceIndex();
      const cfg = getVoiceCfg();
      const spokenTokens = tokenizeCs(spokenNormalized);
      const spokenStems = new Set(stemsOf(spokenTokens));
      const spokenBigrams = new Set(bigrams(spokenTokens));

      const matches = {
        needs: new Set(),
        questions: new Set(),
        benefits: new Set(),
        utilities: new Set(),
        nextSteps: new Set()
      };

      const sc = (entry) => scorePhrase(spokenNormalized, spokenTokens, spokenStems, spokenBigrams, entry);
      const neg = (entry) => isNegatedContext(spokenTokens, entry.titleStems);

      const tryAdd = (entry, set) => {
        if (sc(entry) < cfg.scoreMin) return;
        if (neg(entry)) return;
        set.add(entry.title);
      };

      // 1) Needs â€” ZAMERNÄš VYPNUTO
      // 1) Potřeby — vyžaduje reflektivní frázi konzultanta (max 1 na větu, práh 0.85)
      if (hasReflectionTrigger(spokenNormalized)) {
        const N_THRESHOLD = Math.max(cfg.scoreMin, 0.85);
        const nCandidates = [];
        idx.needs.forEach(e => {
          const score = sc(e);
          if (score >= N_THRESHOLD && !neg(e)) nCandidates.push({ title: e.title, score });
        });
        if (nCandidates.length > 0) {
          nCandidates.sort((a, b) => b.score - a.score);
          matches.needs.add(nCandidates[0].title); // max 1 potřeba na větu
        }
      }

      const activeKey = normalizeProductKey(activeProduct);
      const activePack = idx.byProduct[activeKey] || idx.byProduct.spolu || null;

      // 2) OTAZKY: vyssi prah (0.85) + MAX 1 otazka na vetu (nejlepe skorujici ze VSECH produktu).
      //    Cross-product funguje: aktivni produkt dostane maly bonus (tie-break).
      const Q_THRESHOLD = Math.max(cfg.scoreMin, 0.85);
      const qCandidates = [];
      Object.entries(idx.byProduct).forEach(([k, pack]) => {
        const boost = k === activeKey ? 0.002 : 0;
        pack.questions.forEach(e => {
          const score = sc(e);
          if (score + boost >= Q_THRESHOLD && !neg(e)) {
            qCandidates.push({ title: e.title, score: score + boost });
          }
        });
      });
      if (qCandidates.length > 0) {
        qCandidates.sort((a, b) => b.score - a.score);
        matches.questions.add(qCandidates[0].title); // pouze 1 nejlepsi shoda
      }

      // 3) Vyhody / uzitky – vyssi prah (0.85) + MAX 1 na vetu, cross-product, aktivni s boostem
      const HIGH_THRESHOLD = Math.max(cfg.scoreMin, 0.85);
      const buCandidatesBenefits = [];
      const buCandidatesUtilities = [];
      Object.entries(idx.byProduct).forEach(([k, pack]) => {
        const boost = k === activeKey ? 0.002 : 0;
        pack.benefits.forEach(e => {
          const score = sc(e);
          if (score + boost >= HIGH_THRESHOLD && !neg(e)) {
            buCandidatesBenefits.push({ title: e.title, score: score + boost });
          }
        });
        pack.utilities.forEach(e => {
          const score = sc(e);
          if (score + boost >= HIGH_THRESHOLD && !neg(e)) {
            buCandidatesUtilities.push({ title: e.title, score: score + boost });
          }
        });
      });
      if (buCandidatesBenefits.length > 0) {
        buCandidatesBenefits.sort((a, b) => b.score - a.score);
        matches.benefits.add(buCandidatesBenefits[0].title);
      }
      if (buCandidatesUtilities.length > 0) {
        buCandidatesUtilities.sort((a, b) => b.score - a.score);
        matches.utilities.add(buCandidatesUtilities[0].title);
      }

      // 4) Closings – vyssi prah (0.85) + MAX 1 na vetu
      const closingCandidates = [];
      idx.closings.forEach(e => {
        const score = sc(e);
        if (score >= HIGH_THRESHOLD && !neg(e)) {
          closingCandidates.push({ title: e.title, score });
        }
      });
      if (closingCandidates.length > 0) {
        closingCandidates.sort((a, b) => b.score - a.score);
        matches.nextSteps.add(closingCandidates[0].title);
      }
      return matches;
    }

    function applyVoiceMatches(matches) {
      const added = { needs: 0, questions: 0, benefits: 0, utilities: 0, nextSteps: 0 };

      const addToArrayProp = (prop, value, actionName) => {
        if (!Array.isArray(callState[prop])) callState[prop] = [];
        if (!callState[prop].includes(value)) {
          callState[prop].push(value);
          added[prop]++;
          action(actionName, value);
        }
      };

      matches.needs.forEach(v => {
        if (!Array.isArray(callState.voiceSuggestedNeeds)) callState.voiceSuggestedNeeds = [];
        if (!callState.voiceSuggestedNeeds.includes(v) && !callState.needs.includes(v)) {
          callState.voiceSuggestedNeeds.push(v);
          added.needs++;
          action('voice-need-suggest', v);
        }
      });
      if (added.needs > 0) copilotTab = 'potreby';
      matches.questions.forEach(v => addToArrayProp('questions', v, 'voice-questions'));
      matches.benefits.forEach(v => addToArrayProp('benefits', v, 'voice-benefits'));
      matches.utilities.forEach(v => addToArrayProp('utilities', v, 'voice-utilities'));

      if (!Array.isArray(callState.nextSteps)) callState.nextSteps = asArr(callState.nextStep);
      matches.nextSteps.forEach(v => {
        if (!callState.nextSteps.includes(v)) {
          callState.nextSteps.push(v);
          added.nextSteps++;
          action('voice-nextStep', v);
        }
      });

      if (added.nextSteps > 0) {
        callState.nextStep = callState.nextSteps.join(', ') || null;
        callState.closingDone = callState.nextSteps.length > 0;
      }

      const changedTotal = Object.values(added).reduce((a, b) => a + b, 0);
      // inferProduct se spustí jen při ručním potvrzení potřeby (toggleArr)

      return { added, changedTotal };
    }

    function voiceSummaryToast(added) {
      const curCard = currentBlock().id;
      const catToCard = { questions: 'profilace', benefits: 'vyhody', utilities: 'uzitky', nextSteps: 'dotazeni' };
      const cardLabel = { profilace: 'Profilace', vyhody: 'Výhody', uzitky: 'Užitky', dotazeni: 'Dotažení' };
      const parts = [];
      if (added.needs) parts.push(`💡 doporučení ${added.needs}`);
      if (added.questions) { const ctx = catToCard.questions !== curCard ? ` (→ ${cardLabel.profilace})` : ''; parts.push(`otázky ${added.questions}${ctx}`); }
      if (added.benefits)  { const ctx = catToCard.benefits  !== curCard ? ` (→ ${cardLabel.vyhody})`   : ''; parts.push(`výhody ${added.benefits}${ctx}`); }
      if (added.utilities) { const ctx = catToCard.utilities !== curCard ? ` (→ ${cardLabel.uzitky})`   : ''; parts.push(`užitky ${added.utilities}${ctx}`); }
      if (added.nextSteps) { const ctx = catToCard.nextSteps !== curCard ? ` (→ ${cardLabel.dotazeni})` : ''; parts.push(`dotažení ${added.nextSteps}${ctx}`); }
      if (!parts.length) return;

      const now = Date.now();
      if (now - lastVoiceToastAt < VOICE_TOAST_COOLDOWN_MS) return;
      lastVoiceToastAt = now;
      toast(`🎤 Zapsáno: ${parts.join(' · ')}`);
    }

    // Jaccard similarity on stem sets — used for rolling dedupe of near-duplicate finals.
    function stemJaccard(aNorm, bNorm) {
      if (!aNorm || !bNorm) return 0;
      const A = new Set(stemsOf(tokenizeCs(aNorm)));
      const B = new Set(stemsOf(tokenizeCs(bNorm)));
      if (!A.size || !B.size) return 0;
      let inter = 0;
      A.forEach(x => { if (B.has(x)) inter++; });
      return inter / (A.size + B.size - inter);
    }

    function pushVoiceHistory(text, matchedTitles) {
      voiceHistory.unshift({ text, matched: matchedTitles, at: Date.now() });
      if (voiceHistory.length > VOICE_HISTORY_MAX) voiceHistory.length = VOICE_HISTORY_MAX;
      if (voiceDebugOpen) renderVoiceDebug();
    }

    /* -------------------------------------------------------------------------
       PROCESS TRANSCRIPT
       Called for both FINAL and (optionally) INTERIM chunks.
       - final=true → full dedupe + toast + save + render
       - final=false → soft-apply only new matches, no toast, no history push
       ------------------------------------------------------------------------- */
    function processTranscript(text, final) {
      const cfg = getVoiceCfg();
      const normalized = normalizeVoiceText(text);
      if (!normalized || normalized.length < cfg.minTextLen) return;

      const now = Date.now();

      // --- FINAL path: full dedupe (exact + Jaccard window)
      if (final) {
        if (normalized === lastVoiceFinalNorm && now - lastVoiceFinalAt < cfg.dedupeMs) return;
        for (let i = 0; i < voiceRecentFinals.length; i++) {
          const prev = voiceRecentFinals[i];
          if (now - prev.at < cfg.dedupeMs && stemJaccard(prev.norm, normalized) >= cfg.jaccardDup) return;
        }
        lastVoiceFinalNorm = normalized;
        lastVoiceFinalAt = now;
        voiceRecentFinals.unshift({ norm: normalized, at: now });
        if (voiceRecentFinals.length > VOICE_DEDUPE_WINDOW) voiceRecentFinals.length = VOICE_DEDUPE_WINDOW;
      }

      const matches = collectVoiceMatches(normalized);

      if (final) setVoiceDebugFinal(normalized);
      setVoiceDebugMatches({
        needs: [...matches.needs],
        questions: [...matches.questions],
        benefits: [...matches.benefits],
        utilities: [...matches.utilities],
        nextSteps: [...matches.nextSteps]
      });

      const { added, changedTotal } = applyVoiceMatches(matches);

      if (final) {
        const matchedTitles = [
          ...matches.needs, ...matches.questions, ...matches.benefits,
          ...matches.utilities, ...matches.nextSteps
        ];
        pushVoiceHistory(normalized, matchedTitles);
        if (changedTotal) {
          saveState();
          renderAll();
          voiceSummaryToast(added);
        }
      } else if (changedTotal) {
        // Interim path: persist quietly so the UI reflects live scoring without spam.
        saveState();
        renderAll();
      }
    }

    // Interim processing — debounced so we don't run on every keystroke-like update.
    function scheduleInterimProcess(interimText) {
      const cfg = getVoiceCfg();
      if (!cfg.interimMs) return;
      if (voiceInterimTimer) clearTimeout(voiceInterimTimer);
      voiceInterimTimer = setTimeout(() => {
        voiceInterimTimer = null;
        // Only process if the interim has grown (avoids re-scoring identical chunk).
        if (!interimText || interimText === voiceLastInterim) return;
        voiceLastInterim = interimText;
        processTranscript(interimText, false);
      }, cfg.interimMs);
    }

    function setMicUi(active) {
      const micSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';
      const btn = $('micBtn');
      if (btn) {
        btn.innerHTML = micSvg;
        btn.classList.toggle('greenbtn', active);
        btn.classList.toggle('on', active);
        btn.title = active
          ? 'Naslouchání ZAPNUTO · Copilot poslouchá a odškrtává (klik pro vypnutí · Ctrl+klik = Debug)'
          : 'Hlasové ovládání: Copilot sám odškrtává to, co říkáš | Ctrl+klik = Debug hlasu';
      }
      $('voicePanel').style.display = active ? 'flex' : 'none';
      if (!active) $('voiceText').textContent = 'Naslouchám...';
      setVoiceDebugStatus(active ? 'Naslouchání aktivní' : 'Naslouchání vypnuto');
      if (!active) setVoiceLevel(0);
    }

    /* -------------------------------------------------------------------------
       WATCHDOG — if recognizer is "alive" but silent for too long, kick it.
       ------------------------------------------------------------------------- */
    function armVoiceWatchdog() {
      if (voiceWatchdogTimer) clearTimeout(voiceWatchdogTimer);
      if (!isListening) return;
      voiceWatchdogTimer = setTimeout(() => {
        if (!isListening) return;
        const silentFor = Date.now() - (lastVoiceResultAt || voiceSessionStartedAt || 0);
        if (isRecognizing && silentFor >= VOICE_WATCHDOG_MS - 250) {
          setVoiceDebugStatus('Watchdog: ticho příliš dlouho, restartuji rozpoznávač…');
          try { recognition && recognition.stop(); } catch (e) {}
        } else {
          armVoiceWatchdog();
        }
      }, VOICE_WATCHDOG_MS);
    }

    function disarmVoiceWatchdog() {
      if (voiceWatchdogTimer) { clearTimeout(voiceWatchdogTimer); voiceWatchdogTimer = null; }
    }

    /* -------------------------------------------------------------------------
       AUDIO LEVEL METER (visual feedback only — no data leaves the browser)
       ------------------------------------------------------------------------- */
    function setVoiceLevel(level01) {
      const wrap = $('voiceLevel');
      if (!wrap) return;
      const bars = wrap.querySelectorAll('i');
      if (!bars.length) return;
      const active = Math.round(Math.min(1, Math.max(0, level01)) * bars.length);
      for (let i = 0; i < bars.length; i++) {
        bars[i].classList.toggle('on', i < active);
        bars[i].classList.toggle('hot', i < active && i >= bars.length - 1 && level01 > 0.85);
        bars[i].style.height = (3 + (i < active ? 3 + i * 2 : 0)) + 'px';
      }
    }

    async function startAudioMeter() {
      if (voiceAudioCtx) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        voiceMeterStream = stream;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        voiceAudioCtx = new AC();
        const src = voiceAudioCtx.createMediaStreamSource(stream);
        voiceAnalyser = voiceAudioCtx.createAnalyser();
        voiceAnalyser.fftSize = 512;
        voiceAnalyser.smoothingTimeConstant = 0.6;
        src.connect(voiceAnalyser);
        const buf = new Uint8Array(voiceAnalyser.frequencyBinCount);
        const tick = () => {
          if (!voiceAnalyser) return;
          voiceAnalyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          const rms = Math.sqrt(sum / buf.length);
          setVoiceLevel(Math.min(1, rms * 2.4));
          voiceMeterRaf = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        console.warn('Audio meter unavailable:', e && e.message);
      }
    }

    function stopAudioMeter() {
      if (voiceMeterRaf) { cancelAnimationFrame(voiceMeterRaf); voiceMeterRaf = 0; }
      if (voiceAnalyser) { try { voiceAnalyser.disconnect(); } catch (e) {} voiceAnalyser = null; }
      if (voiceMeterStream) { try { voiceMeterStream.getTracks().forEach(t => t.stop()); } catch (e) {} voiceMeterStream = null; }
      if (voiceAudioCtx) { try { voiceAudioCtx.close(); } catch (e) {} voiceAudioCtx = null; }
      setVoiceLevel(0);
    }

    function stopListeningHard(msg = '') {
      isListening = false;
      voicePermissionNoticeShown = false;
      voiceNetworkNoticeShown = false;
      isRecognizing = false;
      voiceSessionStartedAt = 0;
      lastVoiceResultAt = 0;
      voiceRapidEndCount = 0;
      voiceRapidErrorCount = 0;
      voiceBackoffMs = VOICE_BACKOFF_MIN;
      voiceRecentFinals.length = 0;
      voiceLastInterim = '';
      if (voiceRestartTimer) { clearTimeout(voiceRestartTimer); voiceRestartTimer = null; }
      if (voiceInterimTimer) { clearTimeout(voiceInterimTimer); voiceInterimTimer = null; }
      disarmVoiceWatchdog();
      if (recognition) {
        try { recognition.stop(); } catch (e) {}
      }
      stopAudioMeter();
      setMicUi(false);
      if (msg) toast(msg);
      setVoiceDebugStatus(msg || 'Vypnuto');
    }

    function initSpeech() {
      const Sr = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Sr) {
        toast('Tento prohlížeč nepodporuje hlasové rozpoznávání (zkus Google Chrome).');
        return;
      }

      recognition = new Sr();
      recognition.lang = 'cs-CZ';
      recognition.continuous = true;
      recognition.interimResults = true;
      try { recognition.maxAlternatives = VOICE_MAX_ALTERNATIVES; } catch (e) {}

      recognition.onstart = () => {
        isRecognizing = true;
        voiceSessionStartedAt = Date.now();
        if (!lastVoiceResultAt) lastVoiceResultAt = Date.now();
        voiceRapidEndCount = 0;
        voiceRapidErrorCount = 0;
        voiceBackoffMs = VOICE_BACKOFF_MIN;
        voiceLastInterim = '';
        setMicUi(true);
        setVoiceDebugStatus('Mikrofon spuštěn');
        armVoiceWatchdog();
      };

      recognition.onend = () => {
        isRecognizing = false;
        disarmVoiceWatchdog();
        if (!isListening) { setMicUi(false); return; }

        const now = Date.now();
        const lifeMs = voiceSessionStartedAt ? (now - voiceSessionStartedAt) : 0;
        const silentMs = lastVoiceResultAt ? (now - lastVoiceResultAt) : lifeMs;
        const likelyLoop = lifeMs > 0 && lifeMs < 2200 && silentMs > 1800;
        voiceRapidEndCount = likelyLoop ? voiceRapidEndCount + 1 : Math.max(0, voiceRapidEndCount - 1);

        if (voiceRapidEndCount >= 3) {
          stopListeningHard('Mikrofon padá příliš často. Automatický restart byl vypnut.');
          showVoicePermissionNoticeOnce('opakované ukončení relace mikrofonu');
          return;
        }

        if (voiceRestartTimer) clearTimeout(voiceRestartTimer);
        if (!voiceAutoRestartEnabled) {
          stopListeningHard('Naslouchání skončilo (jednorázový režim).');
          return;
        }

        // Exponential backoff — decays back to floor on successful results.
        const delay = Math.min(VOICE_BACKOFF_MAX, Math.max(VOICE_BACKOFF_MIN, voiceBackoffMs));
        voiceBackoffMs = Math.min(VOICE_BACKOFF_MAX, Math.round(voiceBackoffMs * 1.6));

        voiceRestartTimer = setTimeout(() => {
          if (isListening && !isRecognizing && !document.hidden) {
            setVoiceDebugStatus(`Obnovuji naslouchání (${delay} ms)…`);
            try { recognition.start(); } catch (e) {}
          }
        }, delay);
      };

      recognition.onerror = (e) => {
        console.error('Voice Error:', e && e.error);
        setVoiceDebugStatus(`Chyba: ${e && e.error}`);
        if (e.error === 'aborted' || e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          voiceRapidErrorCount++;
        } else {
          voiceRapidErrorCount = Math.max(0, voiceRapidErrorCount - 1);
        }

        if (voiceRapidErrorCount >= 2 && isInsecureSpeechContext()) {
          stopListeningHard('Blokace mikrofonu v tomto režimu stránky.');
          showVoicePermissionNoticeOnce('opakovaná blokace oprávnění mikrofonu');
          return;
        }

        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          stopListeningHard('Mikrofon je zablokován oprávněním.');
          showVoicePermissionNoticeOnce('not-allowed/service-not-allowed');
          return;
        }

        if (e.error === 'audio-capture') {
          stopListeningHard('Mikrofon není dostupný (audio-capture).');
          return;
        }

        if (e.error === 'network') {
          // Web Speech API network errors are extremely common (Chrome routes audio to Google
          // speech servers — any hiccup, proxy, or file:// context triggers this). Silent-retry
          // with exponential backoff instead of hard-stopping; only give up after repeated failures.
          const now = Date.now();
          if (now - lastVoiceNetworkErrorAt > VOICE_NETWORK_ERROR_WINDOW_MS) voiceNetworkErrorCount = 0;
          voiceNetworkErrorCount++;
          lastVoiceNetworkErrorAt = now;

          if (voiceNetworkErrorCount >= VOICE_NETWORK_MAX_ERRORS) {
            stopListeningHard('Síťové rozpoznávání hlasu není dostupné (opakovaně selhává). Zkus obnovit stránku nebo připojení.');
            showVoiceNetworkNoticeOnce();
            return;
          }

          // Push backoff towards the max so we don't hammer failing servers.
          voiceBackoffMs = Math.min(VOICE_BACKOFF_MAX, Math.max(voiceBackoffMs, 1200) * 1.8);
          setVoiceDebugStatus(`Síťový výpadek hlasu (${voiceNetworkErrorCount}/${VOICE_NETWORK_MAX_ERRORS}) — obnovuji…`);
          // Let onend restart the recognizer with the increased backoff.
          return;
        }

        // no-speech / aborted: handled by onend restart when isListening=true.
      };

      recognition.onresult = (event) => {
        let interim = '', final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const r = event.results[i];
          if (r.isFinal) {
            // Pick highest-confidence alternative.
            let best = r[0], bestC = (best && best.confidence) || 0;
            for (let a = 1; a < r.length; a++) {
              const alt = r[a];
              const c = (alt && alt.confidence) || 0;
              if (c > bestC) { best = alt; bestC = c; }
            }
            final += (best && best.transcript) || '';
          } else {
            interim += r[0] ? r[0].transcript : '';
          }
        }

        lastVoiceResultAt = Date.now();
        voiceBackoffMs = Math.max(VOICE_BACKOFF_MIN, Math.round(voiceBackoffMs * 0.55));
        voiceNetworkErrorCount = 0; // any successful audio → network is fine again
        armVoiceWatchdog();

        if (interim) {
  $('voiceText').textContent = '🗣️ ' + interim;
  setVoiceDebugInterim(interim);
  // scheduleInterimProcess(normalizeVoiceText(interim));
}

        if (final) {
          $('voiceText').textContent = '🗣️ Zpracovávám…';
          if (voiceInterimTimer) { clearTimeout(voiceInterimTimer); voiceInterimTimer = null; }
          voiceLastInterim = '';
          refreshClosingsIndex();
          processTranscript(final, true);
          setTimeout(() => {
            if ($('voiceText').textContent === '🗣️ Zpracovávám…') $('voiceText').textContent = 'Naslouchám...';
          }, 1200);
        }
      };
    }

    // Pause/resume on tab visibility — Chrome throttles hidden tabs and
    // often kills the recognizer, which then triggers permission re-prompts.
    document.addEventListener('visibilitychange', () => {
      if (!recognition || !isListening) return;
      if (document.hidden) {
        setVoiceDebugStatus('Karta skryta — pauzuji hlas.');
        try { recognition.stop(); } catch (e) {}
      } else {
        setVoiceDebugStatus('Karta znovu aktivní — obnovuji hlas.');
        try { recognition.start(); } catch (e) {}
      }
    });

    function toggleMic() {
      // Soft notice for insecure contexts but still allow attempt.
      if (window.location.protocol === 'http:' && !isLocalhostHost()) {
        showVoicePermissionNoticeOnce('nezabezpečené HTTP');
      }

      if (!recognition) initSpeech();
      if (!recognition) return;

      if (!isListening) {
        voiceAutoRestartEnabled = !isInsecureSpeechContext();
        isListening = true;
        voiceBackoffMs = VOICE_BACKOFF_MIN;
        voiceRecentFinals.length = 0;
        voiceLastInterim = '';
        voiceNetworkErrorCount = 0;
        lastVoiceNetworkErrorAt = 0;
        ensureVoiceIndex();
        try {
        recognition.start();
setMicUi(true);
setVoiceDebugStatus(voiceAutoRestartEnabled ? 'Naslouchání kontinuálně' : 'Naslouchání jednorázově (bez auto-restartu)');
// startAudioMeter();  
        } catch (e) {
          console.error(e);
          stopListeningHard('Hlasový Copilot se nepodařilo spustit.');
        }
      } else {
        stopListeningHard('Hlasový Copilot deaktivován');
      }
    }

    /* =========================================================================
       EVENT LISTENERS
       ========================================================================= */
    document.addEventListener('click', e => {
      const target = e.target.closest('[data-action]'); 
      if (!target) return;

      if (!isUnlocked && target.dataset.action !== 'unlock-app') return;
                  
      e.preventDefault(); 
      e.stopPropagation();
                  
      const act = target.dataset.action;
      const prop = target.dataset.prop;
      const val = target.dataset.val;
      const save = target.dataset.save === 'true';

      if (act === 'unlock-app') {
        unlockApp();
        return;
      }
                  
      if (act === 'toggle-arr') toggleArr(prop, val);
      if (act === 'set-route') setRoute(val);
      if (act === 'open-tahak') openTahak(val);
      if (act === 'close-tahak') closeTahak();
      if (act === 'set-reason') setRouteReason(val);
      if (act === 'set-rescue') setRescue(val);
      if (act === 'set-product') setProduct(val);
      if (act === 'set-offer') setOfferMade();
      if (act === 'set-trial') setTrial();
      if (act === 'set-final-status') setFinalStatus(val);
      if (act === 'instant-objection') { 
         copilotTab = 'namitky'; 
         setObjection(val); 
         renderProductCopilot(); 
         toast(`Okamžitá námitka "${val}" zachycena vpravo`); 
      }
      if (act === 'copilot-objection') { 
         setObjection(val); 
         toast(`Námitka "${val}" uložena`); 
      }
      if (act === 'copilot-tab') { 
         copilotTab = val; 
         renderProductCopilot(); 
      }
      if (act === 'set-closing') setClosing(val);
      if (act === 'go-card') goToCard(Number(val), false);
      if (act === 'go-roadmap-card') goToCard(Number(val), true);
      if (act === 'new-call') newCall(save);
      if (act === 'customer-ended') customerEndedCall();
      if (act === 'open-stats') openStatsPanel();
      if (act === 'stat-period') { 
          statsPeriod = val; 
          statsExpandedBox = null;
          renderStatsDrawer(); 
      }
      if (act === 'toggle-stats-box') {
          statsExpandedBox = (statsExpandedBox === val) ? null : val;
          renderStatsDrawer();
      }
      if (act === 'coach-tab') {
          coachTab = val;
          renderStatsDrawer();
      }
      if (act === 'open-teams-settings') openTeamsSettings();
      if (act === 'close-teams-settings') closeTeamsSettings();
      if (act === 'save-teams-settings') saveTeamsConfigData();
      if (act === 'test-teams') testTeamsNotification();
      if (act === 'teams-add-target') addTeamsTarget();
      if (act === 'teams-remove-target') removeTeamsTarget(target.dataset.tid);
      if (act === 'teams-set-default') setDefaultTeamsTarget(target.dataset.tid);
      if (act === 'teams-test-target') testTeamsNotification(target.dataset.tid);
      if (act === 'teams-send-composer') sendTeamsComposer(false);
      if (act === 'teams-send-broadcast') sendTeamsComposer(true);
      if (act === 'open-sos') openSOSModal();
      if (act === 'close-sos') closeSOSModal();
      if (act === 'send-sos') sendSOS();
      if (act === 'open-feedback') openFeedbackModal();
      if (act === 'close-feedback') closeFeedbackModal();
      if (act === 'send-feedback') sendFeedback();
      if (act === 'stats-send-teams') sendStatsToTeams();
      if (act === 'sched-time-add') schedTimeAdd();
      if (act === 'sched-time-remove') schedTimeRemove(+target.dataset.idx);
      if (act === 'open-admin') openAdmin();
      if (act === 'close-admin') closeAdmin();
      if (act === 'unlock-admin') unlockAdmin();
      if (act === 'save-admin-locks') saveAdminLocks();
      if (act === 'admin-export') adminExportConfig();
      if (act === 'admin-import') adminImportConfig();
      if (act === 'admin-share-link') adminShareLink();
      if (act === 'admin-reset-defaults') adminResetDefaults();
      if (act === 'admin-preview-refresh') { renderAll(); flashAdminSaved(); toast('🔄 Preview obnoveno'); }
      if (act === 'admin-editor-tab') setAdminEditorTab(val);
      if (act === 'admin-product-pick') { adminEditorProduct = val; renderAdminEditor(); }
      if (act === 'admin-arr-add') adminArrAdd(target.dataset.pkey, target.dataset.prop);
      if (act === 'admin-arr-remove') adminArrRemove(target.dataset.pkey, target.dataset.prop, +target.dataset.idx);
      if (act === 'admin-arr-up') adminArrMove(target.dataset.pkey, target.dataset.prop, +target.dataset.idx, -1);
      if (act === 'admin-arr-down') adminArrMove(target.dataset.pkey, target.dataset.prop, +target.dataset.idx, +1);
      if (act === 'admin-kv-add') adminKvAdd(target.dataset.pkey, target.dataset.prop);
      if (act === 'admin-kv-remove') adminKvRemove(target.dataset.pkey, target.dataset.prop, target.dataset.key);
      if (act === 'admin-need-add') adminNeedAdd();
      if (act === 'admin-need-remove') adminNeedRemove(+target.dataset.idx);
      if (act === 'admin-need-up') adminNeedMove(+target.dataset.idx, -1);
      if (act === 'admin-need-down') adminNeedMove(+target.dataset.idx, +1);
      if (act === 'admin-sos-add') adminSosAdd();
      if (act === 'admin-sos-remove') adminSosRemove(+target.dataset.idx);
      if (act === 'admin-objection-add') adminObjectionAdd(target.dataset.pkey);
      if (act === 'admin-objection-remove') adminObjectionRemove(target.dataset.pkey, target.dataset.key);
      if (act === 'close-drawer') closeDrawer();
      if (act === 'printscreen-stats') exportStatsImage();
      if (act === 'copy-crm-summary') copyCrmSummary();
      if (act === 'reset-call') resetCallOnly();
      if (act === 'toggle-zen') toggleZen();
      if (act === 'toggle-sandbox') toggleSandbox();
      if (act === 'toggle-fullscreen') toggleFullscreen();
      if (act === 'toggle-mobile-view') toggleMobileView();
      if (act === 'toggle-mic') {
        if (e.ctrlKey) toggleVoiceDebug();
        else toggleMic();
      }
      if (act === 'cycle-voice-mode') cycleVoiceMode();
      if (act === 'toggle-voice-debug') toggleVoiceDebug();
                  
      if (act === 'export-stats-json') {
          downloadText(`O2_Sales_Copilot_Stats_${todayKey()}.json`, JSON.stringify(callHistory, null, 2), 'application/json');
      }
                  
      if (act === 'clear-stats-history') clearStatsHistoryFlow();
    });

    document.addEventListener('keydown', e => {
      if (!isUnlocked) {
        if (e.key === 'Enter' && e.target && e.target.id === 'lockInput') {
          e.preventDefault();
          unlockApp();
        }
        return;
      }

      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
          if (e.key === 'Escape') e.target.blur();
          if (e.key === 'Enter' && e.target.id === 'adminPasswordInput') {
            e.preventDefault();
            unlockAdmin();
          }
         return;
      }
      if (e.key === 'ArrowRight') goToCard(currentIndex + 1, false);
      if (e.key === 'ArrowLeft') goToCard(currentIndex - 1, false);
      if (e.key === 'Escape') { closeDrawer(); closeTahak(); closeAdmin(); }
                  
      if (e.ctrlKey && e.code === 'Space') {
          e.preventDefault();
         if (currentIndex < maxIndex()) goToCard(currentIndex + 1, false);
      }
                  
      if (e.key >= '1' && e.key <= '9') {
         const idx = parseInt(e.key, 10) - 1;
         const items = document.querySelectorAll('#cardHost .action-say-btn,#cardHost .actions .pill,#cardHost .choice-grid .choice');
         if (items[idx]) items[idx].click();
      }
    });

    /* =========================================================================
       SLACK NOTIFICATIONS
       ========================================================================= */
    /* =========================================================================
       TEAMS NOTIFICATIONS — multi-target (channels, group chats via Graph)
       ========================================================================= */
    const teamsConfigKey = 'o2SalesCockpit' + APP_VERSION + 'TeamsConfig';

    function _uid() {
      return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    function loadTeamsConfig() {
      const _defSched = () => ({ enabled: false, times: ['10:30', '12:30', '14:30', '19:15'], period: 'today' });
      try {
        const raw = JSON.parse(localStorage.getItem(teamsConfigKey) || 'null');
        if (!raw) return { targets: [], defaultTargetId: null, authorName: 'David Gottfried', sosWebhookUrl: '', feedbackWebhookUrl: '', callNotificationsEnabled: true, scheduledStats: _defSched() };

        // Migration: old shape { webhookUrl, enabled } → single target
        if (raw && typeof raw === 'object' && ('webhookUrl' in raw) && !Array.isArray(raw.targets)) {
          if (raw.webhookUrl) {
            const t = { id: _uid(), name: 'Hlavní kanál', webhookUrl: raw.webhookUrl, enabled: !!raw.enabled };
            return { targets: [t], defaultTargetId: t.id, authorName: 'David Gottfried', sosWebhookUrl: '', feedbackWebhookUrl: '', callNotificationsEnabled: true, scheduledStats: _defSched() };
          }
          return { targets: [], defaultTargetId: null, authorName: 'David Gottfried', sosWebhookUrl: '', feedbackWebhookUrl: '', callNotificationsEnabled: true, scheduledStats: _defSched() };
        }
        const rawSched = raw.scheduledStats || {};
        return {
          targets: Array.isArray(raw.targets) ? raw.targets.map(t => ({
            id: t.id || _uid(),
            name: String(t.name || 'Cíl'),
            webhookUrl: String(t.webhookUrl || ''),
            enabled: !!t.enabled,
            notifyCall:  t.notifyCall  !== false,
            notifyStats: t.notifyStats !== false
          })) : [],
          defaultTargetId: raw.defaultTargetId || null,
          authorName: String(raw.authorName || 'David Gottfried').trim() || 'David Gottfried',
          sosWebhookUrl: String(raw.sosWebhookUrl || '').trim(),
          feedbackWebhookUrl: String(raw.feedbackWebhookUrl || '').trim(),
          callNotificationsEnabled: raw.callNotificationsEnabled !== false,
          scheduledStats: {
            enabled: !!rawSched.enabled,
            times: Array.isArray(rawSched.times) && rawSched.times.length
              ? rawSched.times.filter(t => /^\d{2}:\d{2}$/.test(t))
              : _defSched().times,
            period: rawSched.period || 'today'
          }
        };
      } catch(e) { return { targets: [], defaultTargetId: null, authorName: 'David Gottfried', sosWebhookUrl: '', feedbackWebhookUrl: '', callNotificationsEnabled: true, scheduledStats: _defSched() }; }
    }
    let teamsConfig = loadTeamsConfig();
    function saveTeamsConfig() {
      localStorage.setItem(teamsConfigKey, JSON.stringify(teamsConfig));
      const btn = $('adminBtn');
      const anyEnabled = teamsConfig.targets.some(t => t.enabled && t.webhookUrl);
      if (btn) btn.style.borderColor = anyEnabled ? '#10b981' : '';
    }

    function getAuthorName() {
      return (teamsConfig && teamsConfig.authorName && String(teamsConfig.authorName).trim())
        ? String(teamsConfig.authorName).trim()
        : 'David Gottfried';
    }

    /* =========================================================================
       ADMIN – heslem chráněné nastavení (Voice locks + Teams + Live editor)
       ========================================================================= */
    const adminConfigKey = 'o2SalesCockpit' + APP_VERSION + 'AdminConfig';
    const adminPassword = 'Futurecc';
    let adminUnlocked = false;
    let adminEditorTab = 'cards';
    let adminEditorProduct = null; // set on first render
    let adminSaveTimer = null;

    function loadAdminConfig() {
      try {
        const s = JSON.parse(localStorage.getItem(adminConfigKey) || 'null');
        return {
          voiceOnly: {
            questions: !!(s && s.voiceOnly && s.voiceOnly.questions),
            benefits:  !!(s && s.voiceOnly && s.voiceOnly.benefits),
            utilities: !!(s && s.voiceOnly && s.voiceOnly.utilities),
            closing:   !!(s && s.voiceOnly && s.voiceOnly.closing)
          }
        };
      } catch(e) { return { voiceOnly: { questions:false, benefits:false, utilities:false, closing:false } }; }
    }
    let adminConfig = loadAdminConfig();
    function saveAdminConfigData() {
      localStorage.setItem(adminConfigKey, JSON.stringify(adminConfig));
    }

    function openAdmin() {
      const inp = $('adminPasswordInput'), msg = $('adminAuthMsg');
      if (inp) inp.value = '';
      if (msg) msg.textContent = '';
      $('adminAuth').style.display = adminUnlocked ? 'none' : 'block';
      $('adminSettings').style.display = adminUnlocked ? 'grid' : 'none';
      if (adminUnlocked) populateAdminForm();
      $('adminModal').classList.add('open');
      setTimeout(() => { if (!adminUnlocked && inp) inp.focus(); }, 60);
    }

    function closeAdmin() {
      $('adminModal')?.classList.remove('open');
    }

    function unlockAdmin() {
      const inp = $('adminPasswordInput'), msg = $('adminAuthMsg');
      const typed = String(inp?.value || '').trim();
      if (typed === adminPassword) {
        adminUnlocked = true;
        $('adminAuth').style.display = 'none';
        $('adminSettings').style.display = 'grid';
        populateAdminForm();
        toast('✓ Administrace odemčena');
      } else {
        if (msg) msg.textContent = 'Nesprávné heslo.';
        if (inp) inp.select();
      }
    }

    function populateAdminForm() {
      // Locks
      if ($('adminLockQuestions')) $('adminLockQuestions').checked = !!adminConfig.voiceOnly.questions;
      if ($('adminLockBenefits'))  $('adminLockBenefits').checked  = !!adminConfig.voiceOnly.benefits;
      if ($('adminLockUtilities')) $('adminLockUtilities').checked = !!adminConfig.voiceOnly.utilities;
      if ($('adminLockClosing'))   $('adminLockClosing').checked   = !!adminConfig.voiceOnly.closing;
      const st1 = $('adminLocksStatus'); if (st1) { st1.textContent = ''; st1.style.color = ''; }
      // Teams
      renderAdminTargets();
      const st2 = $('teamsStatus'); if (st2) { st2.textContent = ''; st2.style.color = ''; }
      // Editor
      if (!adminEditorProduct) adminEditorProduct = productOrder[0] || Object.keys(products)[0];
      renderAdminEditor();
    }

    function saveAdminLocks() {
      adminConfig.voiceOnly = {
        questions: !!$('adminLockQuestions')?.checked,
        benefits:  !!$('adminLockBenefits')?.checked,
        utilities: !!$('adminLockUtilities')?.checked,
        closing:   !!$('adminLockClosing')?.checked
      };
      saveAdminConfigData();
      const st = $('adminLocksStatus');
      if (st) { st.textContent = '✓ Zámky uloženy'; st.style.color = '#10b981'; }
      toast('✓ Hlasové zámky aktualizovány');
      renderAll();
    }

    function voiceOnlyBlock(kind, humanLabel) {
      if (adminConfig.voiceOnly[kind]) {
        const now = Date.now();
        if (now - (window.__voiceLockToastAt || 0) > 900) {
          window.__voiceLockToastAt = now;
          toast(`🎙️ „${humanLabel}" — kliknutí zakázáno, použij hlas`);
        }
        return true;
      }
      return false;
    }

    function openTeamsSettings() { openAdmin(); }
    function closeTeamsSettings() { closeAdmin(); }

    /* -------------------------------------------------------------------------
       TEAMS TARGETS UI + composer
       ------------------------------------------------------------------------- */
    function renderAdminTargets() {
      const host = $('adminTeamsBody');
      if (!host) return;
      const cfg = teamsConfig;
      const targets = cfg.targets;

      let html = `
        <div class="admin-section" style="background:#eff6ff;border-color:#bfdbfe;">
          <h4>👤 Jméno autora zpráv</h4>
          <p class="hint" style="margin-bottom:6px;">Toto jméno se objeví v každé Teams zprávě (auto-notifikace hovoru, vlastní zpráva, statistiky).</p>
          <input class="admin-input" id="teamsAuthorName" data-teams-field="authorName" value="${esc(cfg.authorName || 'David Gottfried')}" placeholder="Např. David Gottfried" style="font-weight:900;">
          <div class="slack-toggle-row" style="border-bottom:none;padding:8px 0 0;margin-top:4px;border-top:1px solid #e0eaff;">
            <span class="slack-toggle-label" style="font-weight:950;">📞 Posílat zprávu po každém hovoru</span>
            <label class="slack-toggle"><input type="checkbox" id="teamsCallNotifEnabled" ${cfg.callNotificationsEnabled !== false ? 'checked' : ''}><span class="slack-slider"></span></label>
          </div>
          <p class="hint" style="margin:4px 0 0;">Vypni pokud nechceš, aby se každý ukončený hovor automaticky odesílal do Teams.</p>
        </div>
        <div class="admin-section" style="background:#eef4ff;border-color:#bfdbfe;">
          <h4>💬 Jak přidat cíl</h4>
          <p class="hint" style="margin-bottom:0;">
            <b>Kanál v týmu:</b> Teams → tři tečky u kanálu → <b>Manage channel → Connectors → Incoming Webhook</b> → zkopíruj URL.<br>
            <b>Skupinový chat / DM:</b> potřebuje <a href="https://learn.microsoft.com/graph/api/chat-post-message" target="_blank" rel="noopener" style="color:var(--o2);font-weight:900;">Graph API endpoint</a> (např. Power Automate flow „When message is added" nebo custom bot). URL vlož jako běžný webhook.
          </p>
        </div>
      `;

      if (!targets.length) {
        html += `<div class="admin-empty">Zatím žádné cíle. Klikni na <b>➕ Přidat cíl</b> níže.</div>`;
      } else {
        html += targets.map(t => {
          const isDefault = cfg.defaultTargetId === t.id;
          const badge = t.enabled && t.webhookUrl
            ? '<span class="admin-badge ok">Zapnuto</span>'
            : '<span class="admin-badge off">Vypnuto</span>';
          const defBadge = isDefault ? '<span class="admin-badge">Výchozí</span>' : '';
          return `
            <div class="admin-target ${isDefault ? 'default' : ''}" data-tid="${esc(t.id)}">
              <div class="admin-target-body">
                <div class="admin-target-row">
                  <input class="admin-input" data-teams-field="name" data-tid="${esc(t.id)}" value="${esc(t.name)}" placeholder="Název (např. Tým Prodej Ostrava)" style="flex:1;font-weight:950;">
                  ${badge} ${defBadge}
                </div>
                <input class="admin-input" data-teams-field="webhookUrl" data-tid="${esc(t.id)}" value="${esc(t.webhookUrl)}" placeholder="https://…webhook.office.com/webhookb2/…" style="font-family:ui-monospace,Consolas,monospace;font-size:11px;">
                <div class="admin-target-row" style="gap:8px;">
                  <label class="slack-toggle-row" style="border:none;padding:0;flex:1;">
                    <span class="slack-toggle-label" style="font-size:11.5px;">Zapnout auto-notifikaci</span>
                    <label class="slack-toggle"><input type="checkbox" data-teams-field="enabled" data-tid="${esc(t.id)}" ${t.enabled ? 'checked' : ''}><span class="slack-slider"></span></label>
                  </label>
                </div>
                <div class="admin-target-row" style="gap:12px;padding-top:4px;border-top:1px solid #f1f5f9;">
                  <label style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:850;color:var(--mut);cursor:pointer;">
                    <input type="checkbox" data-teams-field="notifyCall" data-tid="${esc(t.id)}" ${t.notifyCall !== false ? 'checked' : ''}>
                    📞 Hovory
                  </label>
                  <label style="display:flex;align-items:center;gap:5px;font-size:11px;font-weight:850;color:var(--mut);cursor:pointer;">
                    <input type="checkbox" data-teams-field="notifyStats" data-tid="${esc(t.id)}" ${t.notifyStats !== false ? 'checked' : ''}>
                    📊 Statistiky
                  </label>
                </div>
              </div>
              <div class="admin-target-actions">
                <button class="admin-btn tiny" data-action="teams-set-default" data-tid="${esc(t.id)}" title="Nastavit jako výchozí">${isDefault ? '★' : '☆'} Výchozí</button>
                <button class="admin-btn tiny" data-action="teams-test-target" data-tid="${esc(t.id)}" title="Odeslat testovací notifikaci">🧪 Test</button>
                <button class="admin-btn tiny danger" data-action="teams-remove-target" data-tid="${esc(t.id)}" title="Smazat cíl">✕</button>
              </div>
            </div>
          `;
        }).join('');
      }

      // SOS + Feedback webhook config
      html += `
        <div class="admin-section" style="background:#fff1f2;border-color:#fecdd3;margin-top:4px;">
          <h4 style="color:#dc2626;">🆘 SOS – Webhook Team Leadera</h4>
          <p class="hint" style="margin-bottom:6px;">Webhook URL, na který se odesílá SOS notifikace, když konzultant potřebuje pomoc. Zadej URL přímo na webhook Team Leadera nebo jejich Teams kanálu.</p>
          <input class="admin-input" id="teamsSosWebhook" placeholder="https://…webhook.office.com/webhookb2/…" value="${esc(cfg.sosWebhookUrl || '')}" style="font-family:ui-monospace,Consolas,monospace;font-size:11px;">
        </div>
        <div class="admin-section" style="background:#f0fdf4;border-color:#bbf7d0;margin-top:4px;">
          <h4 style="color:#047857;">✉️ Zpětná vazba – Webhook</h4>
          <p class="hint" style="margin-bottom:6px;">Webhook URL, na který se odesílají nápady a zpětná vazba od konzultantů.</p>
          <input class="admin-input" id="teamsFeedbackWebhook" placeholder="https://…webhook.office.com/webhookb2/…" value="${esc(cfg.feedbackWebhookUrl || '')}" style="font-family:ui-monospace,Consolas,monospace;font-size:11px;">
        </div>
      `;

      // Scheduled stats config
      const sched = cfg.scheduledStats || {};
      const schedTimes = Array.isArray(sched.times) && sched.times.length ? sched.times : ['10:30', '12:30', '14:30', '19:15'];
      html += `
        <div class="admin-section" style="background:#faf5ff;border-color:#e9d5ff;margin-top:4px;">
          <h4 style="color:#7c3aed;">⏰ Plánované odesílání statistik</h4>
          <p class="hint" style="margin-bottom:8px;">Statistiky se automaticky odešlou ve zvolené časy do cílů se zapnutými <b>Statistikami</b>. Stránka musí být otevřená.<br>
          <b>⚠️ Multi-user:</b> Plnánovač nechte zapnutý jen u <b>jedné osoby</b> (např. Team Leader), jinak dorazí duplicity do Teams.</p>
          <div class="slack-toggle-row" style="border-bottom:none;padding-bottom:6px;">
            <span class="slack-toggle-label" style="font-weight:950;">Zapnout plánovač</span>
            <label class="slack-toggle"><input type="checkbox" id="teamsSchedEnabled" ${sched.enabled ? 'checked' : ''}><span class="slack-slider"></span></label>
          </div>
          <label class="admin-label">Období statistik</label>
          <select class="admin-select" id="teamsSchedPeriod">
            <option value="today" ${(sched.period||'today')==='today'?'selected':''}>Dnešek</option>
            <option value="week" ${sched.period==='week'?'selected':''}>Posledních 7 dnů</option>
            <option value="month" ${sched.period==='month'?'selected':''}>Posledních 30 dnů</option>
          </select>
          <label class="admin-label" style="margin-top:8px;">Naplnované časy</label>
          <div id="teamsSchedTimesList" style="display:flex;flex-direction:column;gap:5px;margin-bottom:6px;">
            ${schedTimes.map((t, i) => `
              <div style="display:flex;gap:6px;align-items:center;">
                <input type="time" class="admin-input" data-sched-time="${i}" value="${esc(t)}" style="flex:1;font-family:ui-monospace,Consolas,monospace;font-size:12px;font-weight:900;">
                <button class="admin-btn tiny danger" data-action="sched-time-remove" data-idx="${i}" title="Odebrat">✕</button>
              </div>
            `).join('')}
          </div>
          <button class="admin-btn tiny" data-action="sched-time-add" style="width:100%;justify-content:center;">➕ Přidat čas</button>
        </div>
      `;


      // Composer — send free text
      html += `
        <div class="admin-composer">
          <h4 style="margin:0 0 6px;font-size:12px;font-weight:950;color:var(--o2d);text-transform:uppercase;letter-spacing:.3px;">✉️ Odeslat vlastní zprávu</h4>
          <label class="admin-label">Cíl</label>
          <select class="admin-select" id="teamsComposerTarget">
            ${targets.length
              ? targets.map(t => `<option value="${esc(t.id)}" ${cfg.defaultTargetId === t.id ? 'selected' : ''}>${esc(t.name)}${t.enabled ? '' : ' · (vypnuto)'}</option>`).join('')
              : '<option value="">(nejsou žádné cíle)</option>'}
          </select>
          <label class="admin-label">Nadpis</label>
          <input class="admin-input" id="teamsComposerTitle" placeholder="Např. Ranní check-in týmu" value="📢 Zpráva od Copilota">
          <label class="admin-label">Text zprávy (Markdown)</label>
          <textarea class="admin-textarea" id="teamsComposerText" placeholder="Text zprávy…" style="min-height:80px;"></textarea>
          <div style="display:flex;gap:6px;margin-top:8px;justify-content:flex-end;">
            <button class="admin-btn" data-action="teams-send-composer">📤 Odeslat</button>
            <button class="admin-btn ghost tiny" data-action="teams-send-broadcast" title="Odeslat do všech zapnutých cílů">📡 Broadcast do všech</button>
          </div>
        </div>
      `;

      host.innerHTML = html;
    }

    function saveTeamsConfigData() {
      // Synchronize inputs → teamsConfig, then persist
      const rows = document.querySelectorAll('#adminTeamsBody [data-tid]');
      rows.forEach(el => {
        const tid = el.dataset.tid;
        const field = el.dataset.teamsField;
        if (!field) return;
        const t = teamsConfig.targets.find(x => x.id === tid);
        if (!t) return;
        if (field === 'enabled') t.enabled = el.checked;
        else if (field === 'notifyCall')  t.notifyCall  = el.checked;
        else if (field === 'notifyStats') t.notifyStats = el.checked;
        else t[field] = String(el.value || '').trim();
      });
      // Author name (bez data-tid — jedno globální pole)
      const authorEl = $('teamsAuthorName');
      if (authorEl) {
        const v = String(authorEl.value || '').trim();
        teamsConfig.authorName = v || 'David Gottfried';
      }
      const callNotifEl = $('teamsCallNotifEnabled');
      if (callNotifEl) teamsConfig.callNotificationsEnabled = callNotifEl.checked;
      const sosEl = $('teamsSosWebhook');
      if (sosEl) teamsConfig.sosWebhookUrl = String(sosEl.value || '').trim();
      const fbEl = $('teamsFeedbackWebhook');
      if (fbEl) teamsConfig.feedbackWebhookUrl = String(fbEl.value || '').trim();
      // Scheduled stats
      const schedEnabled = $('teamsSchedEnabled');
      const schedPeriod  = $('teamsSchedPeriod');
      if (!teamsConfig.scheduledStats) teamsConfig.scheduledStats = {};
      if (schedEnabled) teamsConfig.scheduledStats.enabled = schedEnabled.checked;
      if (schedPeriod)  teamsConfig.scheduledStats.period  = schedPeriod.value || 'today';
      // Times — collect all inputs
      const timeInputs = document.querySelectorAll('#teamsSchedTimesList input[data-sched-time]');
      const times = [];
      timeInputs.forEach(inp => {
        const v = (inp.value || '').trim();
        if (/^\d{2}:\d{2}$/.test(v)) times.push(v);
      });
      teamsConfig.scheduledStats.times = times.length ? times : ['10:30', '12:30', '14:30', '19:15'];
      saveTeamsConfig();
      const st = $('teamsStatus');
      if (st) { st.textContent = '✓ Teams konfigurace uložena'; st.style.color = '#10b981'; }
      toast('✓ Teams cíle uloženy');
      renderAdminTargets();
    }

    function addTeamsTarget() {
      teamsConfig.targets.push({ id: _uid(), name: 'Nový cíl', webhookUrl: '', enabled: false, notifyCall: true, notifyStats: true });
      if (!teamsConfig.defaultTargetId) teamsConfig.defaultTargetId = teamsConfig.targets[teamsConfig.targets.length - 1].id;
      saveTeamsConfig();
      renderAdminTargets();
    }

    function removeTeamsTarget(tid) {
      teamsConfig.targets = teamsConfig.targets.filter(t => t.id !== tid);
      if (teamsConfig.defaultTargetId === tid) {
        teamsConfig.defaultTargetId = teamsConfig.targets[0]?.id || null;
      }
      saveTeamsConfig();
      renderAdminTargets();
    }

    function setDefaultTeamsTarget(tid) {
      teamsConfig.defaultTargetId = tid;
      saveTeamsConfig();
      renderAdminTargets();
      toast('Výchozí Teams cíl nastaven');
    }

    // Post an Adaptive Card to a Teams Workflows webhook.
    // - 10 s AbortController timeout (prevents hanging fetches)
    // - 1 automatic retry after 1.5 s on network error
    async function _teamsPostCard(url, card, _attempt) {
      _attempt = _attempt || 0;
      const ctrl = new AbortController();
      const tId  = setTimeout(() => ctrl.abort(), 10000);
      try {
        const res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(card),
          signal:  ctrl.signal
        });
        clearTimeout(tId);
        return res;
      } catch (err) {
        clearTimeout(tId);
        if (_attempt === 0 && err.name !== 'AbortError') {
          await new Promise(r => setTimeout(r, 1500));
          return _teamsPostCard(url, card, 1);
        }
        throw err;
      }
    }

    function _buildSnapCard(snap) {
      const STATUS     = { 'Prodáno': '✅', 'Zpětný kontakt': '🔄', 'Neprodáno': '❌' };
      const status     = snap.finalStatus || (snap.customerEnded ? 'Ukončeno zákazníkem' : '—');
      const em         = STATUS[status] || '📋';
      const dur        = snap.durationSec || 0;
      const durStr     = Math.floor(dur / 60) + 'm ' + (dur % 60) + 's';
      const needs      = (snap.needs || []).slice(0, 4).join(', ') || '—';
      const score      = snap.score || 0;
      const scoreStyle = score >= 80 ? 'good' : score >= 60 ? 'warning' : 'attention';
      const author     = getAuthorName();
      const qCount     = snap.questionsCount || (snap.questions || []).length || 0;
      const bCount     = snap.benefitsCount  || (snap.benefits  || []).length || 0;
      const uCount     = snap.utilitiesCount || (snap.utilities || []).length || 0;
      return {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.5',
            body: [
              // ── Header ──────────────────────────────────────────────────
              {
                type: 'Container', style: 'accent', bleed: true,
                items: [{ type: 'ColumnSet', columns: [{ type: 'Column', width: 'stretch', items: [
                  { type: 'TextBlock', text: '📞 Nexus · O2 Sales Copilot', weight: 'Bolder', size: 'Medium', spacing: 'None' },
                  { type: 'TextBlock', text: author + ' · ' + (snap.date || '') + ' · ' + (snap.time || ''), size: 'Small', isSubtle: true, spacing: 'None' }
                ]}]}]
              },
              // ── Skóre + Fakta ────────────────────────────────────────────
              {
                type: 'ColumnSet', spacing: 'Medium',
                columns: [
                  {
                    type: 'Column', width: '100px',
                    verticalContentAlignment: 'Center',
                    items: [{
                      type: 'Container', style: scoreStyle,
                      items: [
                        { type: 'TextBlock', text: score + '%', weight: 'Bolder', size: 'ExtraLarge', horizontalAlignment: 'Center', spacing: 'None' },
                        { type: 'TextBlock', text: em + ' ' + status, size: 'Small', horizontalAlignment: 'Center', spacing: 'None', weight: 'Bolder', wrap: true }
                      ]
                    }]
                  },
                  {
                    type: 'Column', width: 'stretch',
                    items: [{ type: 'FactSet', facts: [
                      { title: 'Produkt:', value: snap.product || '—' },
                      { title: 'Délka:', value: durStr },
                      { title: 'Potřeby:', value: needs }
                    ]}]
                  }
                ]
              },
              // ── Aktivita konzultanta ──────────────────────────────────────
              {
                type: 'ColumnSet', spacing: 'Small', separator: true,
                columns: [
                  { type: 'Column', width: 'stretch', style: 'emphasis', items: [
                    { type: 'TextBlock', text: String(qCount), weight: 'Bolder', size: 'Large', horizontalAlignment: 'Center', spacing: 'None' },
                    { type: 'TextBlock', text: '❓ Otázky', size: 'Small', horizontalAlignment: 'Center', spacing: 'None', isSubtle: true }
                  ]},
                  { type: 'Column', width: 'stretch', style: 'emphasis', items: [
                    { type: 'TextBlock', text: String(bCount), weight: 'Bolder', size: 'Large', horizontalAlignment: 'Center', spacing: 'None' },
                    { type: 'TextBlock', text: '✨ Výhody', size: 'Small', horizontalAlignment: 'Center', spacing: 'None', isSubtle: true }
                  ]},
                  { type: 'Column', width: 'stretch', style: 'emphasis', items: [
                    { type: 'TextBlock', text: String(uCount), weight: 'Bolder', size: 'Large', horizontalAlignment: 'Center', spacing: 'None' },
                    { type: 'TextBlock', text: '💡 Užitky', size: 'Small', horizontalAlignment: 'Center', spacing: 'None', isSubtle: true }
                  ]}
                ]
              }
            ]
          }
        }]
      };
    }

    function _buildTextCard(title, text) {
      const author = getAuthorName();
      const now    = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      return {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.5',
            body: [
              {
                type: 'Container', style: 'accent', bleed: true,
                items: [
                  { type: 'TextBlock', text: '📢 ' + title, weight: 'Bolder', size: 'Medium', spacing: 'None', wrap: true },
                  { type: 'TextBlock', text: 'Nexus · O2 Sales Copilot · ' + author + ' · ' + now, size: 'Small', isSubtle: true, spacing: 'None' }
                ]
              },
              { type: 'TextBlock', text: text, wrap: true, spacing: 'Medium', size: 'Medium' }
            ]
          }
        }]
      };
    }

    function sendTeamsNotification(snap) {
      if (teamsConfig.callNotificationsEnabled === false) return;
      const targets = teamsConfig.targets.filter(t => t.enabled && t.webhookUrl && t.notifyCall !== false);
      if (!targets.length) return;
      const card = _buildSnapCard(snap);
      let ok = 0, fail = 0;
      Promise.all(
        targets.map(t => _teamsPostCard(t.webhookUrl, card)
          .then(() => ok++)
          .catch(() => fail++)
        )
      ).then(() => {
        if (fail === 0) toast(`📢 Teams: hovor odeslán (${ok}× cíl)`);
        else toast(`⚠️ Teams: ${ok} ok, ${fail} selhává – ověř webhook URL`);
      });
    }

    function testTeamsNotification(tid) {
      const target = tid
        ? teamsConfig.targets.find(t => t.id === tid)
        : teamsConfig.targets.find(t => t.id === teamsConfig.defaultTargetId) || teamsConfig.targets[0];
      if (!target || !target.webhookUrl) {
        const st = $('teamsStatus');
        if (st) { st.textContent = '⚠️ Nejprve vlož webhook URL do cíle.'; st.style.color = '#f97316'; }
        return;
      }
      const card = _buildSnapCard({
        finalStatus:'Prodáno', score:92, product:'O2 Spolu', durationSec:272,
        needs:['cena','rodina','data'], date:todayKey(),
        time: new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'})
      });
      _teamsPostCard(target.webhookUrl, card).catch(() => null);
      const st = $('teamsStatus');
      if (st) { st.textContent = `⏳ Test → „${target.name}"`; st.style.color = '#0050ff'; }
      setTimeout(() => { if (st) { st.textContent = '✓ Odesláno (ověř v Teams)'; st.style.color = '#10b981'; } }, 1500);
    }

    /* -----------------------------------------------------------------------
       SOS + ZPĚTNÁ VAZBA
       ----------------------------------------------------------------------- */
    function _buildSOSCard(stepName, stepNum, totalSteps, product, comment) {
      const now       = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      const author    = getAuthorName();
      const questions = callState.questions || [];
      const needs     = callState.needs     || [];
      const benefits  = callState.benefits  || [];
      const utilities = callState.utilities || [];

      // Expandovatelný detail hovoru (Action.ShowCard)
      const detailItems = [];
      if (questions.length) {
        detailItems.push({ type: 'TextBlock', text: '❓ Otázky (' + questions.length + ')', weight: 'Bolder', size: 'Small', color: 'Accent', spacing: 'Small' });
        detailItems.push({ type: 'TextBlock', text: questions.join(' · '), wrap: true, size: 'Small', isSubtle: true, spacing: 'None' });
      }
      if (needs.length) {
        detailItems.push({ type: 'TextBlock', text: '🎯 Potřeby (' + needs.length + ')', weight: 'Bolder', size: 'Small', color: 'Accent', spacing: 'Small' });
        detailItems.push({ type: 'TextBlock', text: needs.join(' · '), wrap: true, size: 'Small', isSubtle: true, spacing: 'None' });
      }
      if (benefits.length) {
        detailItems.push({ type: 'TextBlock', text: '✨ Výhody (' + benefits.length + ')', weight: 'Bolder', size: 'Small', color: 'Accent', spacing: 'Small' });
        detailItems.push({ type: 'TextBlock', text: benefits.join(' · '), wrap: true, size: 'Small', isSubtle: true, spacing: 'None' });
      }
      if (utilities.length) {
        detailItems.push({ type: 'TextBlock', text: '💡 Užitky (' + utilities.length + ')', weight: 'Bolder', size: 'Small', color: 'Accent', spacing: 'Small' });
        detailItems.push({ type: 'TextBlock', text: utilities.join(' · '), wrap: true, size: 'Small', isSubtle: true, spacing: 'None' });
      }

      const body = [
        // ── Urgentní header ────────────────────────────────────────────
        {
          type: 'Container', style: 'attention', bleed: true,
          items: [
            { type: 'TextBlock', text: '🆘  SOS – Konzultant potřebuje pomoc', weight: 'Bolder', size: 'Large', spacing: 'None', wrap: true },
            { type: 'TextBlock', text: author + ' · ' + now, size: 'Small', isSubtle: true, spacing: 'None' }
          ]
        },
        // ── Fakta ──────────────────────────────────────────────────────
        {
          type: 'FactSet', spacing: 'Medium',
          facts: [
            { title: 'Produkt:', value: product || '—' },
            { title: 'Krok:', value: stepName + ' (' + stepNum + '/' + totalSteps + ')' },
            { title: 'Čas:', value: now }
          ]
        }
      ];

      if (comment) {
        body.push({
          type: 'Container', style: 'emphasis', spacing: 'Small',
          items: [{ type: 'TextBlock', text: '💬  ' + comment, wrap: true, size: 'Medium', spacing: 'None' }]
        });
      }

      if (detailItems.length) {
        body.push({
          type: 'ActionSet', spacing: 'Medium',
          actions: [{
            type: 'Action.ShowCard',
            title: '🔍 Zobrazit detail hovoru',
            card: { type: 'AdaptiveCard', body: detailItems }
          }]
        });
      }

      return {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.5',
            body
          }
        }]
      };
    }

    function _buildFeedbackCard(text) {
      const now     = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
      const dateStr = new Date().toLocaleDateString('cs-CZ');
      const author  = getAuthorName();
      return {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.5',
            body: [
              {
                type: 'Container', style: 'accent', bleed: true,
                items: [
                  { type: 'TextBlock', text: '💡 Zpětná vazba', weight: 'Bolder', size: 'Large', spacing: 'None' },
                  { type: 'TextBlock', text: author + ' · ' + dateStr + ' · ' + now, size: 'Small', isSubtle: true, spacing: 'None' }
                ]
              },
              {
                type: 'Container', style: 'emphasis', spacing: 'Medium',
                items: [{ type: 'TextBlock', text: '\u201e ' + text + ' \u201c', wrap: true, size: 'Medium', spacing: 'None' }]
              }
            ]
          }
        }]
      };
    }

    function openSOSModal() {
      const bl = currentBlock();
      const stepName = getNavigationName(bl);
      const badge = $('sosStepBadge');
      if (badge) badge.textContent = 'Aktuální krok: ' + (currentIndex + 1) + '/' + blocks.length + ' – ' + stepName;
      const inp = $('sosCommentInput');
      if (inp) inp.value = '';
      $('sosOverlay')?.classList.add('open');
      setTimeout(() => { $('sosCommentInput')?.focus(); }, 60);
    }

    function closeSOSModal() {
      $('sosOverlay')?.classList.remove('open');
    }

    function sendSOS() {
      const url = (teamsConfig.sosWebhookUrl || '').trim();
      if (!url) {
        toast('⚠️ SOS webhook URL není nastaven v administraci');
        closeSOSModal();
        return;
      }
      const bl = currentBlock();
      const stepName = getNavigationName(bl);
      const comment = ($('sosCommentInput')?.value || '').trim();
      const productLabel = (products[activeProduct]?.label) || activeProduct;
      const card = _buildSOSCard(stepName, currentIndex + 1, blocks.length, productLabel, comment);
      _teamsPostCard(url, card).catch(() => null).then(() => {
        toast('🆘 SOS odesláno Team Leaderovi');
      });
      closeSOSModal();
    }

    function openFeedbackModal() {
      const inp = $('feedbackTextInput');
      if (inp) inp.value = '';
      $('feedbackOverlay')?.classList.add('open');
      setTimeout(() => { $('feedbackTextInput')?.focus(); }, 60);
    }

    function closeFeedbackModal() {
      $('feedbackOverlay')?.classList.remove('open');
    }

    function sendFeedback() {
      const text = ($('feedbackTextInput')?.value || '').trim();
      if (!text) { toast('⚠️ Zadej text zpětné vazby'); return; }
      const url = (teamsConfig.feedbackWebhookUrl || '').trim();
      if (!url) {
        toast('⚠️ Feedback webhook URL není nastaven v administraci');
        closeFeedbackModal();
        return;
      }
      const card = _buildFeedbackCard(text);
      _teamsPostCard(url, card).catch(() => null).then(() => {
        toast('✉️ Zpětná vazba odeslána');
      });
      closeFeedbackModal();
    }

    function sendTeamsComposer(broadcast) {
      const title = ($('teamsComposerTitle')?.value || '').trim() || '📢 Zpráva od Copilota';
      const text  = ($('teamsComposerText')?.value  || '').trim();
      const st = $('teamsStatus');
      if (!text) {
        if (st) { st.textContent = '⚠️ Zadej text zprávy.'; st.style.color = '#f97316'; }
        return;
      }
      const card = _buildTextCard(title, text);
      const list = broadcast
        ? teamsConfig.targets.filter(t => t.enabled && t.webhookUrl)
        : (() => {
            const tid = $('teamsComposerTarget')?.value;
            const t = teamsConfig.targets.find(x => x.id === tid && x.webhookUrl);
            return t ? [t] : [];
          })();
      if (!list.length) {
        if (st) { st.textContent = '⚠️ Není žádný platný cíl.'; st.style.color = '#f97316'; }
        return;
      }
      Promise.all(list.map(t => _teamsPostCard(t.webhookUrl, card).catch(() => null))).then(() => {
        if (st) { st.textContent = `✓ Odesláno do ${list.length} cílů`; st.style.color = '#10b981'; }
        toast(`📤 Zpráva odeslána (${list.length}× cíl)`);
      });
    }

    /* -------------------------------------------------------------------------
       STATS → TEAMS  (A) text card via webhook  (B) PNG všech 5 grafů → clipboard
       ------------------------------------------------------------------------- */

    // Definice produktů pro per-produkt grafy (musí sedět s buildItemsPerProductChart).
    const STATS_PROD_DEFS = [
      { key: 'spolu',    label: 'O2 Spolu', color: '#0050ff' },
      { key: 'neo',      label: 'Postpaid', color: '#7c3aed' },
      { key: 'internet', label: 'Internet', color: '#0ea5e9' },
      { key: 'oneplay',  label: 'Oneplay',  color: '#f97316' },
      { key: 'unity',    label: 'Unity',    color: '#10b981' }
    ];

    function _statsPeriodLabel(period) {
      return period === 'today' ? 'Dnes'
        : period === 'yesterday' ? 'Včera'
        : period === '7days' ? 'Posledních 7 dní'
        : 'Všech 30 dní';
    }

    // Vrátí { labels:[{key,label}], values:{key:count}, isHourly:boolean }
    function _statsCallsSeries(data, period) {
      const isHourly = period === 'today' || period === 'yesterday';
      const labels = [], counts = {};
      if (isHourly) {
        for (let h = 8; h <= 19; h++) { labels.push({ key: h, label: String(h).padStart(2,'0')+':00' }); counts[h] = 0; }
        data.forEach(x => {
          const d = new Date(x.endedAt || x.startedAt || new Date()); const h = d.getHours();
          if (h >= 8 && h <= 19) counts[h] += (x.callsCount || 1);
        });
      } else {
        const daysCount = period === '7days' ? 7 : 14, today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date(); d.setDate(today.getDate() - i);
          const ds = d.toLocaleDateString('cs-CZ'), ss = d.getDate()+'.'+(d.getMonth()+1)+'.';
          labels.push({ key: ds, label: ss }); counts[ds] = 0;
        }
        data.forEach(x => { if (counts[x.date] !== undefined) counts[x.date] += (x.callsCount || 1); });
      }
      return { labels, values: counts, isHourly };
    }

    function _statsClicksSeries(data, period) {
      const isHourly = period === 'today' || period === 'yesterday';
      const labels = [], counts = {}, currentToday = todayKey();
      if (isHourly) {
        for (let h = 8; h <= 19; h++) { labels.push({ key: h, label: String(h).padStart(2,'0')+':00' }); counts[h] = 0; }
        data.forEach(x => {
          if (Array.isArray(x.actionLog)) x.actionLog.forEach(a => {
            if (a.ts) { const h = new Date(a.ts).getHours(); if (h >= 8 && h <= 19) counts[h]++; }
          });
        });
        if (period === 'today' && callState.date === currentToday && Array.isArray(callState.actionLog)) {
          callState.actionLog.forEach(a => {
            if (a.ts) { const h = new Date(a.ts).getHours(); if (h >= 8 && h <= 19) counts[h]++; }
          });
        }
      } else {
        const daysCount = period === '7days' ? 7 : 14, today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date(); d.setDate(today.getDate() - i);
          const ds = d.toLocaleDateString('cs-CZ'), ss = d.getDate()+'.'+(d.getMonth()+1)+'.';
          labels.push({ key: ds, label: ss }); counts[ds] = 0;
        }
        data.forEach(x => { if (counts[x.date] !== undefined) counts[x.date] += (x.clicks || 0); });
        if (counts[currentToday] !== undefined && callState.date === currentToday) counts[currentToday] += (callState.clicks || 0);
      }
      return { labels, values: counts, isHourly };
    }

    function _statsItemsPerProductSeries(data, period, histField, productField) {
      const isHourly = period === 'today' || period === 'yesterday';
      const itemToPk = {};
      Object.entries(products).forEach(([pk, p]) => {
        const src = productField === 'questions' ? (p.questions || []) : Object.keys(p[productField] || {});
        src.forEach(item => { itemToPk[item] = pk; });
      });
      const labels = [], buckets = {};
      if (isHourly) {
        for (let h = 8; h <= 19; h++) { labels.push({ key: h, label: String(h).padStart(2,'0')+':00' }); buckets[h] = {}; }
        data.forEach(x => {
          const d = new Date(x.endedAt || x.startedAt || new Date()), hh = d.getHours();
          if (hh >= 8 && hh <= 19) {
            const items = x[histField] || [];
            items.forEach(item => {
              const pk = itemToPk[item] || x.productKey || 'spolu';
              buckets[hh][pk] = (buckets[hh][pk] || 0) + 1;
            });
            if (!items.length && x[histField+'Count']) {
              const pk = x.productKey || 'spolu';
              buckets[hh][pk] = (buckets[hh][pk] || 0) + x[histField+'Count'];
            }
          }
        });
      } else {
        const daysCount = period === '7days' ? 7 : 14, today = new Date();
        for (let i = daysCount - 1; i >= 0; i--) {
          const d = new Date(); d.setDate(today.getDate() - i);
          const ds = d.toLocaleDateString('cs-CZ'), ss = d.getDate()+'.'+(d.getMonth()+1)+'.';
          labels.push({ key: ds, label: ss }); buckets[ds] = {};
        }
        data.forEach(x => {
          if (buckets[x.date] !== undefined) {
            const items = x[histField] || [];
            items.forEach(item => {
              const pk = itemToPk[item] || x.productKey || 'spolu';
              buckets[x.date][pk] = (buckets[x.date][pk] || 0) + 1;
            });
          }
        });
      }
      return { labels, buckets, isHourly };
    }

    // -------- (A) TEXT SUMMARY CARD PRO WEBHOOK --------
    function _buildStatsCard(data, period, authorName, scheduledTime) {
      const periodLabel = _statsPeriodLabel(period);
      const calls = _statsCallsSeries(data, period);
      const clicks = _statsClicksSeries(data, period);
      const callsTotal = Object.values(calls.values).reduce((s, n) => s + n, 0);
      const clicksTotal = Object.values(clicks.values).reduce((s, n) => s + n, 0);

      const topN = (series, n = 3) => Object.entries(series.values)
        .sort((a,b) => b[1] - a[1]).filter(([,v]) => v > 0).slice(0, n)
        .map(([k,v]) => {
          const lab = (series.labels.find(l => String(l.key) === String(k)) || {}).label || k;
          return `${lab} — ${v}`;
        }).join(' · ') || '—';

      const perProductTotals = (histField, productField) => {
        const s = _statsItemsPerProductSeries(data, period, histField, productField);
        const totals = {};
        Object.values(s.buckets).forEach(b => {
          Object.entries(b).forEach(([pk, v]) => { totals[pk] = (totals[pk] || 0) + v; });
        });
        return totals;
      };

      const qTotals = perProductTotals('questions', 'questions');
      const bTotals = perProductTotals('benefits', 'copilotBenefits');
      const uTotals = perProductTotals('utilities', 'copilotUtilities');

      const now = new Date();
      const timeStr = scheduledTime || now.toLocaleTimeString('cs-CZ', {hour:'2-digit', minute:'2-digit'});
      const dateStr = now.toLocaleDateString('cs-CZ');
      const schedLabel = scheduledTime ? ' · ⏰ Plánované odeslání' : '';

      const perProductCols = (totals) => ({
        type: 'ColumnSet', spacing: 'Small',
        columns: STATS_PROD_DEFS.map(p => ({
          type: 'Column', width: 'stretch',
          items: [
            { type: 'TextBlock', text: String(totals[p.key] || 0), weight: 'Bolder', size: 'Large', horizontalAlignment: 'Center', spacing: 'None' },
            { type: 'TextBlock', text: p.label, size: 'Small', horizontalAlignment: 'Center', spacing: 'None', isSubtle: true, wrap: true }
          ]
        }))
      });

      return {
        type: 'message',
        attachments: [{
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            type: 'AdaptiveCard',
            version: '1.5',
            body: [
              // ── Header ──────────────────────────────────────────────
              {
                type: 'Container', style: 'accent', bleed: true,
                items: [{ type: 'ColumnSet', columns: [{ type: 'Column', width: 'stretch', items: [
                  { type: 'TextBlock', text: '📊 Statistiky – ' + periodLabel + schedLabel, weight: 'Bolder', size: 'Large', spacing: 'None', wrap: true },
                  { type: 'TextBlock', text: authorName + ' · ' + dateStr + ' · ' + timeStr, size: 'Small', isSubtle: true, spacing: 'None' }
                ]}]}]
              },
              // ── Velká čísla: Hovory + Kliky ─────────────────────────
              {
                type: 'ColumnSet', spacing: 'Medium',
                columns: [
                  {
                    type: 'Column', width: 'stretch', style: 'good',
                    items: [
                      { type: 'TextBlock', text: String(callsTotal), weight: 'Bolder', size: 'ExtraLarge', horizontalAlignment: 'Center', spacing: 'None' },
                      { type: 'TextBlock', text: '📞 HOVORY', size: 'Small', weight: 'Bolder', horizontalAlignment: 'Center', spacing: 'None' },
                      { type: 'TextBlock', text: 'Top: ' + topN(calls, 1), size: 'Small', horizontalAlignment: 'Center', spacing: 'None', isSubtle: true, wrap: true }
                    ]
                  },
                  {
                    type: 'Column', width: 'stretch', style: 'accent',
                    items: [
                      { type: 'TextBlock', text: String(clicksTotal), weight: 'Bolder', size: 'ExtraLarge', horizontalAlignment: 'Center', spacing: 'None' },
                      { type: 'TextBlock', text: '🖥️ KLIKY', size: 'Small', weight: 'Bolder', horizontalAlignment: 'Center', spacing: 'None' },
                      { type: 'TextBlock', text: 'Top: ' + topN(clicks, 1), size: 'Small', horizontalAlignment: 'Center', spacing: 'None', isSubtle: true, wrap: true }
                    ]
                  }
                ]
              },
              // ── Profilace ────────────────────────────────────────────
              { type: 'TextBlock', text: '🎯  PROFILACE DLE PRODUKTU', weight: 'Bolder', size: 'Small', color: 'Accent', spacing: 'Medium', separator: true },
              perProductCols(qTotals),
              // ── Výhody ───────────────────────────────────────────────
              { type: 'TextBlock', text: '✨  VÝHODY DLE PRODUKTU', weight: 'Bolder', size: 'Small', color: 'Accent', spacing: 'Medium', separator: true },
              perProductCols(bTotals),
              // ── Užitky ───────────────────────────────────────────────
              { type: 'TextBlock', text: '💡  UŽITKY DLE PRODUKTU', weight: 'Bolder', size: 'Small', color: 'Accent', spacing: 'Medium', separator: true },
              perProductCols(uTotals)
            ]
          }
        }]
      };
    }

    // -------- (B) CANVAS RENDERING 5 GRAFŮ POD SEBOU DO PNG --------
    function _cvsRoundRect(ctx, x, y, w, h, r) {
      if (w <= 0 || h <= 0) return;
      const rad = Math.min(r, w/2, h/2);
      ctx.beginPath();
      ctx.moveTo(x+rad, y);
      ctx.lineTo(x+w-rad, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+rad);
      ctx.lineTo(x+w, y+h);
      ctx.lineTo(x, y+h);
      ctx.lineTo(x, y+rad);
      ctx.quadraticCurveTo(x, y, x+rad, y);
      ctx.closePath();
      ctx.fill();
    }

    function _drawSingleBarChart(ctx, x, y, w, h, title, subtitle, series, color) {
      // Karta pozadí
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#dbe5f2';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      // Titulek
      ctx.fillStyle = '#0050ff';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(title, x + 16, y + 12);

      if (subtitle) {
        ctx.fillStyle = '#64748b';
        ctx.font = '600 10.5px "Segoe UI", Arial, sans-serif';
        const tw = ctx.measureText(title).width;
        ctx.fillText(subtitle, x + 16 + tw + 10, y + 15);
      }

      // Plotting area
      const padTop = 46, padBottom = 34, padLeft = 40, padRight = 20;
      const plotX = x + padLeft, plotY = y + padTop;
      const plotW = w - padLeft - padRight, plotH = h - padTop - padBottom;

      // Baseline
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plotX, plotY + plotH);
      ctx.lineTo(plotX + plotW, plotY + plotH);
      ctx.stroke();

      // Y grid (3 čáry)
      const maxVal = Math.max(1, ...series.labels.map(l => series.values[l.key] || 0));
      const yTicks = 3;
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9.5px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 1; i <= yTicks; i++) {
        const val = Math.round((maxVal * i) / yTicks);
        const yy = plotY + plotH - (plotH * i / yTicks);
        ctx.beginPath(); ctx.moveTo(plotX, yy); ctx.lineTo(plotX + plotW, yy); ctx.stroke();
        ctx.fillText(String(val), plotX - 6, yy);
      }
      ctx.fillText('0', plotX - 6, plotY + plotH);

      // Bary
      const n = series.labels.length;
      const gap = Math.max(2, Math.min(6, Math.floor(plotW / n * 0.15)));
      const barW = Math.max(4, (plotW - gap * (n - 1)) / n);
      ctx.fillStyle = color;
      series.labels.forEach((l, i) => {
        const v = series.values[l.key] || 0;
        if (v <= 0) return;
        const bh = Math.max(2, (v / maxVal) * plotH);
        const bx = plotX + i * (barW + gap);
        const by = plotY + plotH - bh;
        _cvsRoundRect(ctx, bx, by, barW, bh, 3);
        // Hodnota nad barem
        if (bh > 14 && barW > 12) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9.5px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(String(v), bx + barW/2, by + 2);
          ctx.fillStyle = color;
        } else if (v > 0) {
          ctx.fillStyle = '#334155';
          ctx.font = 'bold 9px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(String(v), bx + barW/2, by - 2);
          ctx.fillStyle = color;
        }
      });

      // Labels na ose X
      ctx.fillStyle = '#475569';
      ctx.font = '700 10px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const skip = n > 14 ? 2 : 1;
      series.labels.forEach((l, i) => {
        if (i % skip !== 0) return;
        const bx = plotX + i * (barW + gap) + barW/2;
        ctx.fillText(l.label, bx, plotY + plotH + 6);
      });
    }

    function _drawGroupedBarChart(ctx, x, y, w, h, title, subtitle, series, prodDefs) {
      // Karta pozadí
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#dbe5f2';
      ctx.lineWidth = 1;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      // Titulek
      ctx.fillStyle = '#0050ff';
      ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(title, x + 16, y + 12);

      if (subtitle) {
        ctx.fillStyle = '#64748b';
        ctx.font = '600 10.5px "Segoe UI", Arial, sans-serif';
        const tw = ctx.measureText(title).width;
        ctx.fillText(subtitle, x + 16 + tw + 10, y + 15);
      }

      // Legenda vpravo nahoře
      let lx = x + w - 12;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 10px "Segoe UI", Arial, sans-serif';
      [...prodDefs].reverse().forEach(p => {
        const tw = ctx.measureText(p.label).width;
        ctx.fillStyle = p.color;
        ctx.fillText(p.label, lx, y + 20);
        // Barevný čtvereček
        ctx.fillStyle = p.color;
        ctx.fillRect(lx - tw - 12, y + 15, 8, 8);
        lx -= tw + 22;
      });

      // Plotting area
      const padTop = 46, padBottom = 34, padLeft = 40, padRight = 20;
      const plotX = x + padLeft, plotY = y + padTop;
      const plotW = w - padLeft - padRight, plotH = h - padTop - padBottom;

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plotX, plotY + plotH);
      ctx.lineTo(plotX + plotW, plotY + plotH);
      ctx.stroke();

      // Max
      let maxVal = 1;
      series.labels.forEach(l => {
        prodDefs.forEach(p => {
          const v = (series.buckets[l.key] || {})[p.key] || 0;
          if (v > maxVal) maxVal = v;
        });
      });

      // Y grid
      const yTicks = 3;
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9.5px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 1; i <= yTicks; i++) {
        const val = Math.round((maxVal * i) / yTicks);
        const yy = plotY + plotH - (plotH * i / yTicks);
        ctx.beginPath(); ctx.moveTo(plotX, yy); ctx.lineTo(plotX + plotW, yy); ctx.stroke();
        ctx.fillText(String(val), plotX - 6, yy);
      }
      ctx.fillText('0', plotX - 6, plotY + plotH);

      // Grouped bars
      const n = series.labels.length;
      const groupGap = Math.max(3, Math.min(8, Math.floor(plotW / n * 0.18)));
      const groupW = Math.max(prodDefs.length * 2 + 2, (plotW - groupGap * (n - 1)) / n);
      const barGap = 1;
      const barW = Math.max(2, (groupW - barGap * (prodDefs.length - 1)) / prodDefs.length);

      series.labels.forEach((l, i) => {
        const gx = plotX + i * (groupW + groupGap);
        prodDefs.forEach((p, pi) => {
          const v = (series.buckets[l.key] || {})[p.key] || 0;
          if (v <= 0) return;
          const bh = Math.max(2, (v / maxVal) * plotH);
          const bx = gx + pi * (barW + barGap);
          const by = plotY + plotH - bh;
          ctx.fillStyle = p.color;
          _cvsRoundRect(ctx, bx, by, barW, bh, 2);
        });
      });

      // Labels na ose X
      ctx.fillStyle = '#475569';
      ctx.font = '700 10px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const skip = n > 14 ? 2 : 1;
      series.labels.forEach((l, i) => {
        if (i % skip !== 0) return;
        const gx = plotX + i * (groupW + groupGap) + groupW/2;
        ctx.fillText(l.label, gx, plotY + plotH + 6);
      });
    }

    function renderStatsChartsBlob(data, period, authorName) {
      return new Promise((resolve, reject) => {
        try {
          const W = 900;
          const chartH = 220;
          const headerH = 90;
          const gap = 14;
          const padSide = 20;
          const totalH = headerH + 5 * chartH + 4 * gap + padSide * 2;

          const canvas = document.createElement('canvas');
          const dpr = 2; // 2× pro ostrost
          canvas.width = W * dpr;
          canvas.height = totalH * dpr;
          const ctx = canvas.getContext('2d');
          ctx.scale(dpr, dpr);

          // Pozadí — jemný gradient
          const bg = ctx.createLinearGradient(0, 0, 0, totalH);
          bg.addColorStop(0, '#f7fbff');
          bg.addColorStop(1, '#eff6ff');
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, totalH);

          // Hlavička
          const now = new Date();
          const periodLabel = _statsPeriodLabel(period);
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          // "Nexus:" tučnější & modré, zbytek tmavý — jako v UI
          ctx.fillStyle = '#0050ff';
          ctx.font = '900 22px "Segoe UI", Arial, sans-serif';
          ctx.fillText('Nexus:', padSide, 18);
          const nexusW = ctx.measureText('Nexus:').width;
          ctx.fillStyle = '#061b3a';
          ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
          ctx.fillText(' O2 Sales Copilot — Statistiky', padSide + nexusW, 18);

          ctx.fillStyle = '#0050ff';
          ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
          ctx.fillText(periodLabel, padSide, 48);

          ctx.fillStyle = '#334155';
          ctx.font = '700 12.5px "Segoe UI", Arial, sans-serif';
          ctx.textAlign = 'right';
          const stampLine1 = 'Odesláno od: ' + authorName;
          const stampLine2 = now.toLocaleDateString('cs-CZ') + ' · ' + now.toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});
          ctx.fillText(stampLine1, W - padSide, 20);
          ctx.fillStyle = '#64748b';
          ctx.font = '600 11px "Segoe UI", Arial, sans-serif';
          ctx.fillText(stampLine2, W - padSide, 40);

          // Podtržení hlavičky
          ctx.strokeStyle = '#bfdbfe';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(padSide, headerH - 8); ctx.lineTo(W - padSide, headerH - 8); ctx.stroke();

          // 1) Hovory
          const calls = _statsCallsSeries(data, period);
          let cy = headerH + padSide;
          _drawSingleBarChart(ctx, padSide, cy, W - 2*padSide, chartH,
            'Hovory', '(' + (calls.isHourly ? 'po hodinách' : 'po dnech') + ')',
            calls, '#0050ff');
          cy += chartH + gap;

          // 2) Kliky
          const clicks = _statsClicksSeries(data, period);
          _drawSingleBarChart(ctx, padSide, cy, W - 2*padSide, chartH,
            'Počet kliků', '(' + (clicks.isHourly ? 'po hodinách' : 'po dnech') + ')',
            clicks, '#10b981');
          cy += chartH + gap;

          // 3-5) per-produkt
          const perProd = [
            ['Profilační otázky dle produktu', 'questions', 'questions'],
            ['Výhody dle produktu',            'benefits',  'copilotBenefits'],
            ['Užitky dle produktu',            'utilities', 'copilotUtilities']
          ];
          perProd.forEach(([title, histField, productField]) => {
            const s = _statsItemsPerProductSeries(data, period, histField, productField);
            _drawGroupedBarChart(ctx, padSide, cy, W - 2*padSide, chartH,
              title, '(' + (s.isHourly ? 'po hodinách' : 'po dnech') + ')',
              s, STATS_PROD_DEFS);
            cy += chartH + gap;
          });

          canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Canvas toBlob selhal.'));
            resolve(blob);
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      });
    }

    async function _copyBlobToClipboard(blob) {
      if (!navigator.clipboard || !window.ClipboardItem) {
        throw new Error('Prohlížeč neumí clipboard image (potřebuje HTTPS/localhost + moderní Chrome/Edge).');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }

    function _downloadBlob(blob, filename) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    }

    // Hlavní entry point — volá se z tlačítka v hlavičce statistik.
    async function sendStatsToTeams() {
      const authorName = getAuthorName();
      const data = filterHistoryByPeriod(statsPeriod);
      const enabled = teamsConfig.targets.filter(t => t.enabled && t.webhookUrl && t.notifyStats !== false);

      // (A) TEXT SUMMARY přes webhook
      let webhookMsg = '';
      if (enabled.length) {
        const card = _buildStatsCard(data, statsPeriod, authorName);
        try {
          await Promise.all(enabled.map(t => _teamsPostCard(t.webhookUrl, card).catch(() => null)));
          webhookMsg = `✓ Text odeslán do ${enabled.length} kanálů`;
        } catch (e) {
          webhookMsg = '⚠️ Text do Teams se nepodařilo odeslat';
        }
      } else {
        webhookMsg = 'ℹ️ Žádný aktivní Teams cíl (přeskočil jsem text summary)';
      }

      // (B) PNG všech 5 grafů → clipboard (fallback: download)
      let imgMsg = '';
      try {
        const blob = await renderStatsChartsBlob(data, statsPeriod, authorName);
        try {
          await _copyBlobToClipboard(blob);
          imgMsg = '📋 Obrázek v clipboardu — v Teamsu Ctrl+V';
        } catch (clipErr) {
          _downloadBlob(blob, 'Nexus_O2SalesCopilot_Statistiky_' + todayKey().replace(/\./g,'-') + '.png');
          imgMsg = '⬇️ Obrázek stažen (clipboard nedostupný) — přetáhni do Teams';
        }
      } catch (renderErr) {
        console.error('Chart render error:', renderErr);
        imgMsg = '⚠️ Grafy se nepodařilo vygenerovat: ' + (renderErr.message || renderErr);
      }

      toast('📊 ' + webhookMsg + ' · ' + imgMsg, 6000);
    }

    /* -------------------------------------------------------------------------
       SCHEDULER – plánované odesílání statistik
       ------------------------------------------------------------------------- */
    let _schedTimer = null;

    async function _sendScheduledStats(hhmm) {
      const authorName = getAuthorName();
      const period = teamsConfig.scheduledStats?.period || 'today';
      const data = filterHistoryByPeriod(period);
      const enabled = teamsConfig.targets.filter(t => t.enabled && t.webhookUrl && t.notifyStats !== false);
      if (!enabled.length) return;
      const card = _buildStatsCard(data, period, authorName, hhmm);
      try {
        await Promise.all(enabled.map(t => _teamsPostCard(t.webhookUrl, card).catch(() => null)));
        toast('⏰ Plánované statistiky (' + hhmm + ') odeslány do ' + enabled.length + ' kanálů', 5000);
      } catch(e) {}
    }

    function _initStatsScheduler() {
      function _scheduleNext() {
        const cfg = teamsConfig.scheduledStats;
        const times = (cfg?.times || []).filter(t => /^\d{2}:\d{2}$/.test(t));
        if (!times.length) return;

        const now = new Date();
        const nowMs = now.getTime();

        const candidates = [];
        [0, 1].forEach(dayOffset => {
          times.forEach(hhmm => {
            const [h, m] = hhmm.split(':').map(Number);
            const d = new Date(now);
            d.setDate(d.getDate() + dayOffset);
            d.setHours(h, m, 0, 0);
            const ms = d.getTime();
            if (ms > nowMs) candidates.push({ ms, hhmm });
          });
        });

        if (!candidates.length) return;
        candidates.sort((a, b) => a.ms - b.ms);
        const next = candidates[0];
        const delay = next.ms - nowMs;

        clearTimeout(_schedTimer);
        _schedTimer = setTimeout(() => {
          if (teamsConfig.scheduledStats?.enabled) {
            _sendScheduledStats(next.hhmm);
          }
          _scheduleNext();
        }, delay);
      }

      _scheduleNext();
    }
    _initStatsScheduler();

    function schedTimeAdd() {
      const sched = teamsConfig.scheduledStats || {};
      const times = Array.isArray(sched.times) ? [...sched.times] : ['10:30', '12:30', '14:30', '19:15'];
      times.push('09:00');
      teamsConfig.scheduledStats = { ...sched, times };
      saveTeamsConfig();
      renderAdminTargets();
    }

    function schedTimeRemove(idx) {
      const sched = teamsConfig.scheduledStats || {};
      const times = (Array.isArray(sched.times) ? [...sched.times] : []).filter((_, i) => i !== idx);
      teamsConfig.scheduledStats = { ...sched, times };
      saveTeamsConfig();
      renderAdminTargets();
    }

    /* -------------------------------------------------------------------------
       LIVE CARD & COPILOT EDITOR — 1:1 s reálnými kartami
       ------------------------------------------------------------------------- */
    function flashAdminSaved() {
      const el = $('adminSaveIndicator');
      if (!el) return;
      el.classList.add('visible');
      clearTimeout(flashAdminSaved._t);
      flashAdminSaved._t = setTimeout(() => el.classList.remove('visible'), 1200);
    }

    function commitConfigChange(reason) {
      // Persist to localStorage and re-render live cockpit + rebuild voice index.
      try { saveConfig(); } catch (e) { console.error(e); }
      blocks = getBlocks();
      voiceIndex = null; // force rebuild of voice matching index
      try { renderAll(); } catch (e) { console.error(e); }
      flashAdminSaved();
      const st = $('adminEditorStatus');
      if (st) st.textContent = reason ? `✓ ${reason} · promítnuto do kokpitu` : '✓ Uloženo · promítnuto do kokpitu';
    }

    function setAdminEditorTab(tab) {
      adminEditorTab = tab;
      renderAdminEditor();
    }

    function renderAdminEditor() {
      const body = $('adminEditorBody');
      if (!body) return;
      // Update tab visual
      document.querySelectorAll('#adminEditorTabs .admin-tab').forEach(el => {
        el.classList.toggle('active', el.dataset.val === adminEditorTab);
      });

      if (adminEditorTab === 'cards')      body.innerHTML = renderEditorCards();
      else if (adminEditorTab === 'products')   body.innerHTML = renderEditorProducts();
      else if (adminEditorTab === 'needs')      body.innerHTML = renderEditorNeeds();
      else if (adminEditorTab === 'objections') body.innerHTML = renderEditorObjections();
    }

    // -------- Karty (1–8) --------
    function renderEditorCards() {
      const cardOrder = ['situace','reseni','profilace','nabidka','vyhody','uzitky','dotazeni','new'];
      const fields = [
        ['title', 'Titulek karty', 'input'],
        ['small', 'Popisek nahoře', 'input'],
        ['sentence', 'Věta / instrukce (zobrazí se v „say" boxu)', 'textarea'],
        ['requiredTitle', 'Nadpis požadované sekce', 'input'],
        ['hint', 'Nápověda pod seznamem', 'textarea'],
        ['confirmText', 'Text potvrzovacího tlačítka', 'input'],
        ['offerButton', 'Text tlačítka „Nabídka použita"', 'input'],
        ['needsTitle', 'Nadpis potřeb (jen profilace)', 'input'],
        ['backButton', 'Text tlačítka Zpět', 'input'],
        ['saveButton', 'Text tlačítka Uložit', 'input']
      ];

      return `
        <div class="admin-section">
          <h4>📋 Editor 8 karet kokpitu</h4>
          <p class="hint">Změny se okamžitě promítnou do horní části každé karty (věta, nadpisy, tlačítka).</p>
        </div>
        ${cardOrder.map((cid, idx) => {
          const c = cards[cid] || {};
          return `
            <div class="admin-section" style="background:#fff;border-color:#bfdbfe;">
              <h4 style="display:flex;align-items:center;gap:6px;">
                <span style="background:var(--o2);color:#fff;border-radius:6px;padding:2px 8px;font-size:11px;">${idx+1}</span>
                ${esc(c.title || cid)}
                <span style="font-size:10px;color:var(--mut);text-transform:none;letter-spacing:0;font-weight:800;">· id: ${cid}</span>
              </h4>
              ${fields.map(([f, label, kind]) => {
                if (!(f in c)) return ''; // skip fields not defined on this card
                if (kind === 'textarea') {
                  return `<label class="admin-label">${esc(label)}</label>
                    <textarea class="admin-textarea" data-admin-edit="card" data-cid="${cid}" data-field="${f}">${esc(c[f] || '')}</textarea>`;
                }
                return `<label class="admin-label">${esc(label)}</label>
                  <input class="admin-input" data-admin-edit="card" data-cid="${cid}" data-field="${f}" value="${esc(c[f] || '')}">`;
              }).join('')}
            </div>
          `;
        }).join('')}
      `;
    }

    // -------- Produkty --------
    function renderEditorProducts() {
      const pk = adminEditorProduct || productOrder[0];
      const p = products[pk];
      if (!p) return '<div class="admin-empty">Produkt nenalezen.</div>';

      const chips = productOrder.map(k => {
        const pr = products[k];
        return `<button class="admin-chip ${k === pk ? 'active' : ''}" data-action="admin-product-pick" data-val="${k}">${esc(pr.label)}</button>`;
      }).join('');

      const renderArray = (arr, prop, itemLabel, placeholder) => {
        const list = (arr || []).map((val, i) => `
          <div class="admin-list-row">
            <div class="row-num">${i+1}</div>
            <textarea class="admin-textarea" data-admin-edit="product-arr" data-pkey="${pk}" data-prop="${prop}" data-idx="${i}" placeholder="${esc(placeholder)}">${esc(val)}</textarea>
            <div class="row-actions">
              <button class="admin-btn tiny" data-action="admin-arr-up" data-pkey="${pk}" data-prop="${prop}" data-idx="${i}" title="Nahoru">↑</button>
              <button class="admin-btn tiny" data-action="admin-arr-down" data-pkey="${pk}" data-prop="${prop}" data-idx="${i}" title="Dolů">↓</button>
              <button class="admin-btn tiny danger" data-action="admin-arr-remove" data-pkey="${pk}" data-prop="${prop}" data-idx="${i}" title="Smazat">✕</button>
            </div>
          </div>
        `).join('');
        return `
          <div class="admin-section">
            <h4>${esc(itemLabel)} <span style="text-transform:none;letter-spacing:0;color:var(--mut);font-weight:800;">(${(arr||[]).length})</span></h4>
            ${list || '<div class="admin-empty">Zatím žádné položky.</div>'}
            <button class="admin-btn full" data-action="admin-arr-add" data-pkey="${pk}" data-prop="${prop}" style="margin-top:6px;">➕ Přidat položku</button>
          </div>
        `;
      };

      const renderDict = (dict, prop, itemLabel, placeholderKey, placeholderVal) => {
        const entries = Object.entries(dict || {});
        const list = entries.map(([k, v], i) => `
          <div class="admin-kv-row" data-kv-idx="${i}">
            <div class="admin-kv-body">
              <input class="admin-input" data-admin-edit="product-kv-key" data-pkey="${pk}" data-prop="${prop}" data-orig="${esc(k)}" value="${esc(k)}" placeholder="${esc(placeholderKey)}" style="font-weight:950;color:var(--o2d);">
              <textarea class="admin-textarea" data-admin-edit="product-kv-val" data-pkey="${pk}" data-prop="${prop}" data-key="${esc(k)}" placeholder="${esc(placeholderVal)}">${esc(v)}</textarea>
            </div>
            <div class="admin-kv-actions">
              <button class="admin-btn tiny danger" data-action="admin-kv-remove" data-pkey="${pk}" data-prop="${prop}" data-key="${esc(k)}" title="Smazat">✕</button>
            </div>
          </div>
        `).join('');
        return `
          <div class="admin-section">
            <h4>${esc(itemLabel)} <span style="text-transform:none;letter-spacing:0;color:var(--mut);font-weight:800;">(${entries.length})</span></h4>
            ${list || '<div class="admin-empty">Zatím žádné položky.</div>'}
            <button class="admin-btn full" data-action="admin-kv-add" data-pkey="${pk}" data-prop="${prop}" style="margin-top:6px;">➕ Přidat záznam</button>
          </div>
        `;
      };

      return `
        <div class="admin-section" style="background:#eef4ff;border-color:#bfdbfe;">
          <h4>📦 Produkt</h4>
          <div class="admin-product-chips">${chips}</div>
          <label class="admin-label">Zkratka / název</label>
          <input class="admin-input" data-admin-edit="product-meta" data-pkey="${pk}" data-field="label" value="${esc(p.label || '')}">
          <label class="admin-label">Plný název</label>
          <input class="admin-input" data-admin-edit="product-meta" data-pkey="${pk}" data-field="title" value="${esc(p.title || '')}">
          <label class="admin-label">Princip / hlavní myšlenka</label>
          <textarea class="admin-textarea" data-admin-edit="product-meta" data-pkey="${pk}" data-field="principle" style="min-height:64px;">${esc(p.principle || '')}</textarea>
          <label class="admin-label">Barva (theme, hex)</label>
          <input class="admin-input" data-admin-edit="product-meta" data-pkey="${pk}" data-field="theme" value="${esc(p.theme || '')}" placeholder="#0050ff">
        </div>

        ${renderArray(p.questions, 'questions', '❓ Profilační otázky (Karta 3)', 'Otázka…')}
        ${renderDict(p.copilotBenefits, 'copilotBenefits', '✅ Výhody Copilota (Karta 5 – 1:1)', 'Krátký název výhody', 'Delší vysvětlení pro zákazníka…')}
        ${renderDict(p.copilotUtilities, 'copilotUtilities', '💎 Užitky Copilota (Karta 6 – 1:1)', 'Krátký název užitku', 'Vysvětlení užitku pro zákazníka…')}
        ${renderArray(p.trialCloses, 'trialCloses', '🎯 Trial closes (backup pro Užitky)', 'Věta pro zkušební uzavření…')}
        ${renderArray(p.closing, 'closing', '🏁 Dotažení / uzavírací otázky (Karta 7)', 'Zavírací otázka…')}
        ${renderArray(p.benefits, 'benefits', '📖 Benefits (fallback pokud copilotBenefits chybí)', 'Krátká věta o výhodě…')}
      `;
    }

    // -------- Potřeby & SOS --------
    function renderEditorNeeds() {
      const list = (needOptions || []).map((n, i) => `
        <div class="admin-list-row">
          <div class="row-num">${i+1}</div>
          <input class="admin-input" data-admin-edit="need" data-idx="${i}" value="${esc(n)}" placeholder="Potřeba…">
          <div class="row-actions">
            <button class="admin-btn tiny" data-action="admin-need-up" data-idx="${i}">↑</button>
            <button class="admin-btn tiny" data-action="admin-need-down" data-idx="${i}">↓</button>
            <button class="admin-btn tiny danger" data-action="admin-need-remove" data-idx="${i}">✕</button>
          </div>
        </div>
      `).join('');

      const sosList = (sos.buttons || []).map((b, i) => `
        <div class="admin-list-row">
          <div class="row-num">${i+1}</div>
          <input class="admin-input" data-admin-edit="sos-btn" data-idx="${i}" value="${esc(b)}" placeholder="Text tlačítka námitky…">
          <div class="row-actions">
            <button class="admin-btn tiny danger" data-action="admin-sos-remove" data-idx="${i}">✕</button>
          </div>
        </div>
      `).join('');

      return `
        <div class="admin-section">
          <h4>💡 Katalog potřeb (Karta 3 – pravá strana)</h4>
          <p class="hint">Seznam, který si konzultant zaškrtává během profilace zákazníka.</p>
          ${list || '<div class="admin-empty">Žádné potřeby.</div>'}
          <button class="admin-btn full" data-action="admin-need-add" style="margin-top:6px;">➕ Přidat potřebu</button>
        </div>

        <div class="admin-section">
          <h4>🆘 SOS panel – rychlé námitky</h4>
          <p class="hint">Tlačítka, která agent klikne na okamžitou námitku zákazníka.</p>
          <label class="admin-label">Titulek SOS</label>
          <input class="admin-input" data-admin-edit="sos-title" value="${esc(sos.title || '')}">
          <div class="slack-toggle-row" style="margin:8px 0 4px;">
            <span class="slack-toggle-label" style="font-size:11.5px;">Zobrazit SOS panel</span>
            <label class="slack-toggle"><input type="checkbox" data-admin-edit="sos-enabled" ${sos.enabled ? 'checked' : ''}><span class="slack-slider"></span></label>
          </div>
          <label class="admin-label">Tlačítka</label>
          ${sosList || '<div class="admin-empty">Žádná tlačítka.</div>'}
          <button class="admin-btn full" data-action="admin-sos-add" style="margin-top:6px;">➕ Přidat tlačítko</button>
        </div>
      `;
    }

    // -------- Námitky (společné) --------
    function renderEditorObjections() {
      const pk = adminEditorProduct || productOrder[0];
      const p = products[pk];
      const chips = productOrder.map(k => {
        const pr = products[k];
        return `<button class="admin-chip ${k === pk ? 'active' : ''}" data-action="admin-product-pick" data-val="${k}">${esc(pr.label)}</button>`;
      }).join('');

      const entries = Object.entries(p.objections || {});
      const list = entries.map(([k, v]) => `
        <div class="admin-kv-row">
          <div class="admin-kv-body">
            <input class="admin-input" data-admin-edit="objection-key" data-pkey="${pk}" data-orig="${esc(k)}" value="${esc(k)}" style="font-weight:950;color:var(--o2d);">
            <textarea class="admin-textarea" data-admin-edit="objection-val" data-pkey="${pk}" data-key="${esc(k)}" style="min-height:70px;">${esc(v)}</textarea>
          </div>
          <div class="admin-kv-actions">
            <button class="admin-btn tiny danger" data-action="admin-objection-remove" data-pkey="${pk}" data-key="${esc(k)}">✕</button>
          </div>
        </div>
      `).join('');

      return `
        <div class="admin-section" style="background:#eef4ff;border-color:#bfdbfe;">
          <h4>🛡️ Námitky pro produkt</h4>
          <div class="admin-product-chips">${chips}</div>
          <p class="hint">Odpovědi Copilota na běžné námitky. Přesně to, co konzultant čte ve fialovém panelu vpravo.</p>
        </div>
        <div class="admin-section">
          ${list || '<div class="admin-empty">Zatím žádné námitky.</div>'}
          <button class="admin-btn full" data-action="admin-objection-add" data-pkey="${pk}" style="margin-top:6px;">➕ Přidat námitku</button>
        </div>
      `;
    }

    /* -------------------------------------------------------------------------
       EDITOR EVENT HANDLERS — input/change delegation
       ------------------------------------------------------------------------- */
    function _debounceCommit(reason) {
      clearTimeout(adminSaveTimer);
      adminSaveTimer = setTimeout(() => commitConfigChange(reason), 220);
    }

    document.addEventListener('input', e => {
      const el = e.target;
      if (!el || !el.dataset || !el.dataset.adminEdit) return;
      const kind = el.dataset.adminEdit;

      if (kind === 'card') {
        const cid = el.dataset.cid, field = el.dataset.field;
        if (!cards[cid]) cards[cid] = {};
        cards[cid][field] = el.value;
        _debounceCommit('Karta upravena');
      }
      else if (kind === 'product-meta') {
        const p = products[el.dataset.pkey];
        if (!p) return;
        p[el.dataset.field] = el.value;
        _debounceCommit('Produkt upraven');
      }
      else if (kind === 'product-arr') {
        const p = products[el.dataset.pkey];
        if (!p) return;
        const prop = el.dataset.prop;
        if (!Array.isArray(p[prop])) p[prop] = [];
        p[prop][+el.dataset.idx] = el.value;
        _debounceCommit('Položka upravena');
      }
      else if (kind === 'product-kv-val') {
        const p = products[el.dataset.pkey];
        if (!p) return;
        const prop = el.dataset.prop, key = el.dataset.key;
        if (!p[prop]) p[prop] = {};
        p[prop][key] = el.value;
        _debounceCommit('Text upraven');
      }
      else if (kind === 'need') {
        needOptions[+el.dataset.idx] = el.value;
        _debounceCommit('Potřeba upravena');
      }
      else if (kind === 'sos-title') { sos.title = el.value; _debounceCommit('SOS titulek upraven'); }
      else if (kind === 'sos-btn')   { sos.buttons[+el.dataset.idx] = el.value; _debounceCommit('SOS tlačítko upraveno'); }
      else if (kind === 'objection-val') {
        const p = products[el.dataset.pkey];
        if (!p || !p.objections) return;
        p.objections[el.dataset.key] = el.value;
        _debounceCommit('Námitka upravena');
      }
      // Teams inline field changes
      else if (el.dataset.teamsField === 'name' || el.dataset.teamsField === 'webhookUrl') {
        const t = teamsConfig.targets.find(x => x.id === el.dataset.tid);
        if (t) {
          t[el.dataset.teamsField] = String(el.value || '').trim();
          clearTimeout(_debounceCommit._teams);
          _debounceCommit._teams = setTimeout(() => saveTeamsConfig(), 220);
        }
      }
    });

    // change handler for renaming dict keys + toggles
    document.addEventListener('change', e => {
      const el = e.target;
      if (!el || !el.dataset) return;

      // Teams enabled toggle
      if (el.dataset.teamsField === 'enabled') {
        const t = teamsConfig.targets.find(x => x.id === el.dataset.tid);
        if (t) { t.enabled = el.checked; saveTeamsConfig(); renderAdminTargets(); }
        return;
      }
      // SOS enabled toggle
      if (el.dataset.adminEdit === 'sos-enabled') {
        sos.enabled = el.checked;
        _debounceCommit('SOS zobrazení upraveno');
        return;
      }
      // KV key rename (product benefit/utility/objection)
      if (el.dataset.adminEdit === 'product-kv-key') {
        const p = products[el.dataset.pkey]; if (!p) return;
        const prop = el.dataset.prop;
        const orig = el.dataset.orig, next = String(el.value || '').trim();
        if (!next || next === orig) return;
        if (!p[prop]) p[prop] = {};
        // Rename preserving order
        const newObj = {};
        Object.entries(p[prop]).forEach(([k, v]) => {
          newObj[k === orig ? next : k] = v;
        });
        p[prop] = newObj;
        commitConfigChange('Klíč přejmenován');
        renderAdminEditor();
        return;
      }
      if (el.dataset.adminEdit === 'objection-key') {
        const p = products[el.dataset.pkey]; if (!p || !p.objections) return;
        const orig = el.dataset.orig, next = String(el.value || '').trim();
        if (!next || next === orig) return;
        const newObj = {};
        Object.entries(p.objections).forEach(([k, v]) => { newObj[k === orig ? next : k] = v; });
        p.objections = newObj;
        commitConfigChange('Námitka přejmenována');
        renderAdminEditor();
      }
    });

    /* -------------------------------------------------------------------------
       EDITOR ACTION HANDLERS — for click delegate below
       ------------------------------------------------------------------------- */
    function adminArrAdd(pkey, prop) {
      const p = products[pkey]; if (!p) return;
      if (!Array.isArray(p[prop])) p[prop] = [];
      p[prop].push('');
      commitConfigChange('Položka přidána');
      renderAdminEditor();
    }
    function adminArrRemove(pkey, prop, idx) {
      const p = products[pkey]; if (!p || !Array.isArray(p[prop])) return;
      p[prop].splice(idx, 1);
      commitConfigChange('Položka smazána');
      renderAdminEditor();
    }
    function adminArrMove(pkey, prop, idx, delta) {
      const p = products[pkey]; if (!p || !Array.isArray(p[prop])) return;
      const j = idx + delta;
      if (j < 0 || j >= p[prop].length) return;
      const tmp = p[prop][idx]; p[prop][idx] = p[prop][j]; p[prop][j] = tmp;
      commitConfigChange('Pořadí změněno');
      renderAdminEditor();
    }
    function adminKvAdd(pkey, prop) {
      const p = products[pkey]; if (!p) return;
      if (!p[prop]) p[prop] = {};
      let base = 'Nový záznam', name = base, n = 1;
      while (p[prop][name] != null) { name = `${base} ${++n}`; }
      p[prop][name] = '';
      commitConfigChange('Záznam přidán');
      renderAdminEditor();
    }
    function adminKvRemove(pkey, prop, key) {
      const p = products[pkey]; if (!p || !p[prop]) return;
      delete p[prop][key];
      commitConfigChange('Záznam smazán');
      renderAdminEditor();
    }
    function adminNeedAdd() { needOptions.push(''); commitConfigChange('Potřeba přidána'); renderAdminEditor(); }
    function adminNeedRemove(idx) { needOptions.splice(idx, 1); commitConfigChange('Potřeba smazána'); renderAdminEditor(); }
    function adminNeedMove(idx, delta) {
      const j = idx + delta; if (j < 0 || j >= needOptions.length) return;
      const t = needOptions[idx]; needOptions[idx] = needOptions[j]; needOptions[j] = t;
      commitConfigChange('Pořadí potřeb změněno'); renderAdminEditor();
    }
    function adminSosAdd() { if (!sos.buttons) sos.buttons = []; sos.buttons.push(''); commitConfigChange('SOS tlačítko přidáno'); renderAdminEditor(); }
    function adminSosRemove(idx) { sos.buttons.splice(idx, 1); commitConfigChange('SOS tlačítko smazáno'); renderAdminEditor(); }
    function adminObjectionAdd(pkey) {
      const p = products[pkey]; if (!p) return;
      if (!p.objections) p.objections = {};
      let base = 'Nová námitka', name = base, n = 1;
      while (p.objections[name] != null) { name = `${base} ${++n}`; }
      p.objections[name] = '';
      commitConfigChange('Námitka přidána'); renderAdminEditor();
    }
    function adminObjectionRemove(pkey, key) {
      const p = products[pkey]; if (!p || !p.objections) return;
      delete p.objections[key];
      commitConfigChange('Námitka smazána'); renderAdminEditor();
    }

    /* -------------------------------------------------------------------------
       EXPORT / IMPORT / SHARE LINK — "accessible for everyone"
       ------------------------------------------------------------------------- */
    function _buildSharePayload() {
      // Everything a teammate needs to receive the same cockpit content.
      return {
        _o2copilot: 'config',
        version: APP_VERSION,
        exportedAt: new Date().toISOString(),
        config: { cards, sos, products, routePlaybooks, routeTips, needOptions, productOrder, routes }
      };
    }

    function adminExportConfig() {
      const payload = _buildSharePayload();
      const json = JSON.stringify(payload, null, 2);
      downloadText(`o2_copilot_config_${todayKey().replace(/\./g,'-')}.json`, json, 'application/json');
      toast('📤 Konfigurace exportována');
    }

    function adminImportConfig() {
      const input = $('adminImportFile');
      if (!input) return;
      input.value = '';
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(String(reader.result || ''));
            _applyImportedConfig(data);
          } catch (e) {
            toast('⚠️ Nepodařilo se načíst JSON');
          }
        };
        reader.readAsText(file, 'utf-8');
      };
      input.click();
    }

    function _applyImportedConfig(data) {
      const src = (data && data.config) ? data.config : data;
      if (!src || typeof src !== 'object') { toast('⚠️ Neplatná konfigurace'); return; }
      const clean = sanitizeConfig(mergeConfig(defaultConfig, src));
      cards = clean.cards;
      sos = clean.sos;
      products = clean.products;
      routePlaybooks = clean.routePlaybooks;
      routeTips = clean.routeTips || defaultRouteTips;
      needOptions = clean.needOptions;
      productOrder = clean.productOrder;
      routes = clean.routes;
      commitConfigChange('Konfigurace naimportována');
      renderAdminEditor();
      toast('📥 Konfigurace naimportována a rozeslána do kokpitu');
    }

    function adminShareLink() {
      try {
        const payload = _buildSharePayload();
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        const url = `${location.origin}${location.pathname}#cfg=${b64}`;
        navigator.clipboard.writeText(url).then(
          () => toast('🔗 Odkaz zkopírován do schránky – pošli ho týmu'),
          () => window.prompt('Zkopíruj tento odkaz a pošli ho týmu:', url)
        );
      } catch (e) {
        console.error(e);
        toast('⚠️ Odkaz se nepodařilo vytvořit (příliš velká konfigurace?)');
      }
    }

    function adminResetDefaults() {
      if (!window.confirm('Opravdu vrátit karty, produkty, potřeby a námitky na tovární hodnoty?\n(Teams cíle a hlasové zámky zůstanou.)')) return;
      const c = clone(defaultConfig);
      cards = c.cards; sos = c.sos; products = c.products;
      routePlaybooks = c.routePlaybooks; routeTips = c.routeTips || defaultRouteTips;
      needOptions = c.needOptions; productOrder = c.productOrder; routes = c.routes;
      commitConfigChange('Reset na tovární hodnoty');
      renderAdminEditor();
      toast('↺ Konfigurace vrácena na tovární');
    }

    // Auto-import from URL hash (#cfg=BASE64) — for teammates opening a shared link.
    function _tryHashImport() {
      const m = String(location.hash || '').match(/#cfg=([A-Za-z0-9+/=_-]+)/);
      if (!m) return;
      try {
        const json = decodeURIComponent(escape(atob(m[1])));
        const data = JSON.parse(json);
        if (window.confirm('Detekován sdílený odkaz s konfigurací karet.\nPřevzít jeho obsah? (Přepíše stávající karty a produkty.)')) {
          _applyImportedConfig(data);
        }
      } catch (e) { console.warn('Hash config import failed:', e); }
      // Clean hash so refresh doesn't re-prompt
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    }

    _tryHashImport();

    loadVoiceSettings();
    setupNotes();
    renderAll();
    renderVoiceDebug();
    updateVoiceModeButton();
    if ($('lockInput')) $('lockInput').focus();

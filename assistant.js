(()=>{
const $=id=>document.getElementById(id);
const pools={
draw:["Dekoichi the Battlechanted Locomotive","Magical Merchant","Card Trooper","Reckless Greed","Upstart Goblin","Allure of Darkness","Trade-In","Hand Destruction","Dark World Dealings"],
dark:["Mystic Tomato","Sangan","Spirit Reaper","Dark Armed Dragon","Armageddon Knight","Dark Grepher","Allure of Darkness","D.D. Crow"],
spellcaster:["Apprentice Magician","Old Vindictive Magician","Magician of Faith","Breaker the Magical Warrior","Skilled Dark Magician","Magical Dimension","Dark Magic Attack","Spellbook of Secrets"],
flip:["Magician of Faith","Dekoichi the Battlechanted Locomotive","Night Assailant","Morphing Jar","Cyber Jar","Book of Moon","Tsukuyomi","Nobleman of Crossout"],
dragon:["Masked Dragon","Spear Dragon","Lord of D.","The Flute of Summoning Dragon","Trade-In","Red-Eyes Darkness Metal Dragon","Totem Dragon"],
zombie:["Pyramid Turtle","Spirit Reaper","Zombie Master","Goblin Zombie","Mezuki","Book of Life","Il Blud"],
warrior:["Reinforcement of the Army","Exiled Force","D.D. Warrior Lady","Marauding Captain","Command Knight","The Warrior Returning Alive"],
control:["Book of Moon","Bottomless Trap Hole","Torrential Tribute","Compulsory Evacuation Device","Sakuretsu Armor","Dust Tornado","Enemy Controller"],
generic:["Mystic Tomato","Dekoichi the Battlechanted Locomotive","Book of Moon","Dust Tornado","Compulsory Evacuation Device","Sakuretsu Armor","Enemy Controller","Creature Swap","Scapegoat"]
};
const insights={
dark:"DARK",spellcaster:"Spellcaster",flip:"flip",dragon:"Dragon",zombie:"Zombie",warrior:"Warrior",draw:"draw",control:"control"
};
const strategyWords={
dark:/dark|fiend|graveyard|shadow/i,spellcaster:/spellcaster|magician|spellbook|wizard/i,flip:/flip|cyber jar|morphing jar/i,dragon:/dragon|blue.eyes|red.eyes/i,zombie:/zombie|undead|mezuki/i,warrior:/warrior|hero|soldier/i,draw:/draw|consisten|hand advantage|card advantage/i,control:/control|trap|defen|stall|removal/i
};
function el(tag,cls,content){const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined)n.textContent=content;return n}
function shown(id,s){$(id).replaceChildren(el("p","muted",s))}
function analysis(){const p=parse($("deck").value);return {p}}
function goal(){return ($("builderGoal").value||"").trim()}
function topics(v,entries){const txt=[goal(),...entries.map(e=>e.card?.name||e.name)].join(" ");const found=Object.keys(strategyWords).filter(k=>strategyWords[k].test(txt));return found.length?found:["generic"]}
function candidates(idx,entries,topicsFound){const seen=new Map();for(const e of entries){if(e.card)seen.set(String(e.card.id),(seen.get(String(e.card.id))||0)+e.qty)}
const names=[...new Set([...topicsFound.flatMap(k=>pools[k]||[]),...pools.generic])],out=[];
for(const name of names){const card=idx.byName.get(N(name));if(!card)continue;const old=seen.get(String(card.id))||0;
const mock=[...entries.filter(e=>e.card).map(e=>({name:String(e.card.id),qty:e.qty,part:e.part})),{name:String(card.id),qty:1,part:"main"}];
const v=validate(mock,idx);const proposed=v.entries[v.entries.length-1];
if(proposed.reasons.length||old>=proposed.limit||proposed.era==="Unknown")continue;
if((v.counts.modernAll>10&&v.counts.modernAll>10+(v.counts.main>40?1:0))|| (v.counts.main>40 && v.counts.main!==41))continue;
const fit=topicsFound.filter(k=>(pools[k]||[]).includes(name));
out.push({card,era:proposed.era,fit,old,max:proposed.limit});}
return out.sort((a,b)=> (a.era==="GOAT"?-8:a.era==="Edison"?-3:1)-(b.era==="GOAT"?-8:b.era==="Edison"?-3:1) - (a.fit.length-b.fit.length)*10);}
async function build(){const btn=$("suggest");btn.disabled=true;try{const idx=await db(),{p}=analysis(),v=validate(p.rows,idx),topicsFound=topics(goal(),v.entries),box=$("builderResults");box.replaceChildren();
if(!p.rows.length){shown("builderResults","Enter some cards in the deck input above, or enter a strategy goal, then request suggestions.");if(!goal())return}
const unknown=v.entries.filter(e=>!e.card);if(unknown.length){box.append(el("p","danger","Fix unrecognized card names before applying suggestions: "+unknown.map(e=>e.name).join(", ")));return}
const missing=Math.max(0,40-v.counts.main),needed=Math.max(0,20-v.counts.goat);
box.append(el("p","","Main Deck: "+v.counts.main+"/40 · GOAT: "+v.counts.goat+"/20 minimum · Modern Main + Extra: "+v.counts.modernAll+"/10. "+(missing?missing+" Main Deck slots remain.":"Main Deck is full.")));
if(v.counts.main>40){box.append(el("p","danger","Remove excess cards before adding more."));return}
const list=candidates(idx,v.entries,topicsFound);if(!list.length){box.append(el("p","muted","No verified suggestions found for this strategy with the current database. Try a different goal."));return}
const heading=el("h3","", "Suggested legal additions");box.append(heading);
if(needed)box.append(el("p","muted","Prioritize at least "+needed+" more GOAT cards before filling remaining slots."));
if(!missing){box.append(el("p","muted","Your deck is full. These are possible replacements, not additions. Remove a card before using Add +1."));}
for(const s of list.slice(0,14)){const row=el("div","recommend"),body=el("div"),name=el("strong","",s.card.name),meta=el("small","",s.era+" · max "+s.max+" copies · "+(s.fit.length?"Supports "+s.fit.join(", "):"Flexible utility"));body.append(name,meta);row.append(body);const add=el("button","secondary","Add +1");add.disabled=!missing||(needed>=(missing)&&s.era!=="GOAT");add.onclick=()=>{const val=$("deck").value.trim();$("deck").value=(val?val+"\n":"")+"#main\n1 "+s.card.name;build()};row.append(add);box.append(row)}
box.append(el("p","muted","Suggestions are filtered through the current card database and validator, but are not a guarantee of optimal strategy. Check Konami's official banlist for changes."));
}catch(err){shown("builderResults","Unable to load suggestions: "+err.message)}finally{btn.disabled=false}}
function answer(q){const t=q.toLowerCase(),p=parse($("deck").value),tot=p.rows.filter(r=>r.part==="main").reduce((s,r)=>s+r.qty,0);
if(/how many|minimum|goat|40|ratio|quota/.test(t))return "Chrono Main Decks must have exactly 40 cards and at least 20 GOAT-era cards. You may use more than 20 GOAT cards, even all 40. Your current entered Main Deck contains "+tot+" cards. Era classification uses the date settings in the validator.";
if(/synchro|xyz|pendulum|link|extra deck|fusion/.test(t))return "Synchro, Xyz, Pendulum and Link monsters are prohibited by Chrono rules. Fusion monsters may be included in the Extra Deck if they otherwise meet the card legality and banlist restrictions.";
if(/modern|edison|limit|copy|copies|banlist|forbidden/.test(t))return "Edison-era cards are at most semi-limited (2 copies), and Modern-era cards at most limited (1 copy), subject to stricter current TCG restrictions. The Main and Extra Deck combined may contain at most 10 Modern cards. The modern TCG banlist can further reduce a card's limit.";
if(/draw|dark|spellcaster|zombie|dragon|flip|warrior|control|recommend|suggest|improv|finish|build/.test(t))return "For card-specific suggestions, enter your deck and describe the strategy in the Deck Builder tab. It filters suggested cards against Chrono's era, copy-limit and monster restrictions. You can ask about draw power, DARK, Spellcasters, Flip effects, Dragons, Zombies, Warriors, and control decks.";
if(/date|release|cutoff|era/.test(t))return "This validator uses the editable historical TCG cutoffs shown on the main screen. GOAT cards are those released by the GOAT cutoff, Edison cards are those released afterward but by the Edison cutoff, and later releases are Modern. The current app defaults to 2005-08-17 and 2010-04-28.";
return "I can explain Chrono card quotas, era cutoffs, prohibited monster types, copy limits, and supported deck-building strategies. For individual-card recommendations, use the Deck Builder tab. This is a rules-based assistant, not yet a conversational AI model."}
$("suggest").onclick=build;
$("askChrono").onclick=()=>{const q=$("chronoQuestion").value.trim();if(!q)return shown("chronoAnswer","Type a question first.");shown("chronoAnswer",answer(q))};
$("chronoQuestion").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("askChrono").click()}});
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{const target=b.dataset.tab;document.querySelectorAll("[data-tab]").forEach(t=>t.setAttribute("aria-selected",String(t.dataset.tab===target)));document.querySelectorAll("[data-tab-panel]").forEach(p=>p.hidden=p.dataset.tabPanel!==target)});
})();
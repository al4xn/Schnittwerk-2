/* ==========================================================================
   SCHNITTWERK – game.js  (v1.2.0)
   Loader + game engine + UI layer in one file. Needs index.html + style.css.
   Online features (accounts, friends, duels) need server.js – the game itself
   also runs completely offline.
   ========================================================================== */
"use strict";
function loadMatter(cb){
  var s=document.createElement('script');
  s.src='matter.min.js'; s.onload=cb;
  s.onerror=function(){
    var t=document.createElement('script');
    t.src='https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
    t.onload=cb;
    t.onerror=function(){document.getElementById('ltip').textContent='Error: physics library missing (matter.min.js).';};
    document.head.appendChild(t);
  };
  document.head.appendChild(s);
}

function startGame(){
const {Engine,Composite,Bodies,Body,Constraint,Query,Vertices,Events,Sleeping}=Matter;
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const rnd=(a,b)=>a+Math.random()*(b-a);
const fmt=n=>{n=Math.floor(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(n);};
const VERSION='1.2.0';
let labMode=false,netDirty=false,tScale=1,duelHold=false;
const LOG=[
 {v:'1.2.0',t:'The Online Update',i:['Accounts with player numbers #1-#100, PIN (3 tries) and password change','Friends, player list and coin duels (needs the server + internet)','15 maps in 4 difficulty levels: snow, sand, forest, bridge, lighthouse, pyramid, skyscraper, vault, fortress ...','Hammer cracks and shovel dents stick to the blocks; auras follow the cut line','Titles with unique effects and mini certificates, bio text','New name effects, nicer toasts, progress bar and coin counter','More and more varied sound effects','Owner tools (#1): player list, codes and a free test field']},
 {v:'1.1.0',t:'The Big Update',i:['Game is now in English – plus German, Spanish, French, Portuguese and Arabic','Hand tool fixed: pieces can no longer be glitched out of the map','New UI: Gotham-style type, hover / click animations, highlights','Simpler, clearer upgrade icons','Many new sound effects – per material, size and tool','Tool-specific particles, motion blur and a new Ultra quality mode','Shader settings: Bloom, Cinematic, Retro','Collapsible hotbar','Looks: normal, neon and neon + aura','Accounts, player profile, milestones, frames and name effects','Codes list with instant copy','Camera limits left / right / up']},
 {v:'1.0.0',t:'First release',i:['New cutting system: cuts follow the blade exactly','Tiny pieces turn into crumbs – no more stuck bits','Tools: knife, shovel, hammer, saw, laser, bomb','Coins, shop, upgrades and 5 maps','Codes, effect looks and loading screen','New physics with fixed time step and sleep mode']},
 {v:'0.9.0',t:'Prototype "Physics Playground"',i:['Sandbox with blocks, knife and workshop']}
];

/* ---------- Languages ---------- */
const LANGS=[['en','English'],['de','Deutsch'],['es','Español'],['fr','Français'],['pt','Português'],['ar','العربية']];
/* order in every entry: en, de, es, fr, pt, ar */
const D={
loading_tex:["Creating textures","Texturen werden erstellt","Creando texturas","Création des textures","Criando texturas","جارٍ إنشاء الخامات"],
loading_save:["Loading save","Spielstand wird geladen","Cargando partida","Chargement de la sauvegarde","Carregando progresso","جارٍ تحميل التقدم"],
loading_ui:["Building interface","Oberfläche wird aufgebaut","Creando la interfaz","Construction de l'interface","Montando a interface","جارٍ بناء الواجهة"],
loading_done:["Almost done","Fast fertig","Casi listo","Presque prêt","Quase pronto","اكتمل تقريبًا"],
maps:["Maps","Karten","Mapas","Cartes","Mapas","الخرائط"],
field:["Free Field","Freies Feld","Campo libre","Terrain libre","Campo livre","ساحة حرة"],
shop:["Shop","Shop","Tienda","Boutique","Loja","المتجر"],
settings:["Settings","Einstellungen","Ajustes","Paramètres","Configurações","الإعدادات"],
profile:["Profile","Profil","Perfil","Profil","Perfil","الملف الشخصي"],
version:["Version {0}","Version {0}","Versión {0}","Version {0}","Versão {0}","الإصدار {0}"],
hut_n:["Wooden Hut","Holzhütte","Cabaña de madera","Cabane en bois","Cabana de madeira","كوخ خشبي"],
hut_d:["A wobbly wooden house. Perfect for practice.","Ein wackeliges Holzhaus. Ideal zum Üben.","Una casa de madera inestable. Ideal para practicar.","Une maison en bois branlante. Idéale pour s'entraîner.","Uma casa de madeira instável. Ideal para treinar.","بيت خشبي مهتز. مثالي للتدرّب."],
wall_n:["Brick Wall","Ziegelmauer","Muro de ladrillo","Mur de briques","Muro de tijolos","جدار من الطوب"],
wall_d:["Thick walls and stone pillars.","Dicke Mauern und steinerne Pfeiler.","Muros gruesos y pilares de piedra.","Murs épais et piliers de pierre.","Paredes grossas e pilares de pedra.","جدران سميكة وأعمدة حجرية."],
glass_n:["Glass Tower","Glasturm","Torre de cristal","Tour de verre","Torre de vidro","برج زجاجي"],
glass_d:["Fragile: glass shatters on impact.","Zerbrechlich: Glas zerspringt beim Aufprall.","Frágil: el cristal se rompe al impactar.","Fragile : le verre se brise à l'impact.","Frágil: o vidro se estilhaça no impacto.","هش: الزجاج يتحطم عند الاصطدام."],
ice_n:["Ice Castle","Eisburg","Castillo de hielo","Château de glace","Castelo de gelo","قلعة جليدية"],
ice_d:["Slippery ground and smooth blocks.","Rutschiger Untergrund und glatte Blöcke.","Suelo resbaladizo y bloques lisos.","Sol glissant et blocs lisses.","Chão escorregadio e blocos lisos.","أرض زلقة وكتل ملساء."],
steel_n:["Steel Works","Stahlwerk","Acería","Aciérie","Siderúrgica","مصنع الصلب"],
steel_d:["Heavy beams. A strong tool helps here.","Schwere Träger. Hier hilft ein starkes Werkzeug.","Vigas pesadas. Aquí ayuda una herramienta potente.","Poutres lourdes. Un outil puissant aidera ici.","Vigas pesadas. Uma ferramenta forte ajuda aqui.","عوارض ثقيلة. أداة قوية تفيد هنا."],
done:["Done","Geschafft","Completado","Terminé","Concluído","مكتمل"],
play_r:["Play – reward {0}","Spielen – Belohnung {0}","Jugar – recompensa {0}","Jouer – récompense {0}","Jogar – recompensa {0}","العب – المكافأة {0}"],
locked_prev:["Finish the previous map","Vorherige Karte abschließen","Completa el mapa anterior","Terminez la carte précédente","Conclua o mapa anterior","أنهِ الخريطة السابقة"],
toast_lock:["Finish the previous map first.","Schließe zuerst die vorherige Karte ab.","Primero completa el mapa anterior.","Terminez d'abord la carte précédente.","Conclua primeiro o mapa anterior.","أنهِ الخريطة السابقة أولًا."],
progress:["Destroyed {0}%","Zerstört {0}%","Destruido {0}%","Détruit {0}%","Destruído {0}%","التدمير {0}%"],
collect_n:["Collect crumbs: {0}","Brösel einsammeln: {0}","Recoge los trozos: {0}","Ramassez les miettes : {0}","Colete os farelos: {0}","اجمع الفتات: {0}"],
crumbled:["All crumbled – collect the crumbs!","Alles zerbröselt – sammle die Brösel ein!","¡Todo triturado! ¡Recoge los trozos!","Tout est en miettes – ramassez-les !","Tudo triturado – colete os farelos!","تحطّم كل شيء – اجمع الفتات!"],
collect_all:["Collect all","Alle einsammeln","Recoger todo","Tout ramasser","Coletar tudo","جمع الكل"],
all_collected:["All collected","Alles eingesammelt","Todo recogido","Tout ramassé","Tudo coletado","تم جمع الكل"],
cap:["Too many pieces – break or collect some first.","Zu viele Teile – zerkleinere oder sammle erst einmal.","Demasiadas piezas: rompe o recoge algunas primero.","Trop de pièces : cassez ou ramassez-en d'abord.","Peças demais – quebre ou colete algumas antes.","قطع كثيرة جدًا – حطّم أو اجمع بعضها أولًا."],
bomb_max:["Max 3 bombs at once.","Maximal 3 Bomben gleichzeitig.","Máximo 3 bombas a la vez.","3 bombes maximum en même temps.","Máximo de 3 bombas ao mesmo tempo.","الحد الأقصى 3 قنابل في وقت واحد."],
bomb_coins:["Not enough coins for a bomb.","Nicht genug Münzen für eine Bombe.","No tienes monedas para una bomba.","Pas assez de pièces pour une bombe.","Moedas insuficientes para uma bomba.","لا تكفي العملات لقنبلة."],
no_item:["No {0} left – buy more in the shop.","Keine {0} mehr – kaufe welche im Shop.","No quedan {0}: compra más en la tienda.","Plus de {0} : achetez-en à la boutique.","Sem {0} – compre mais na loja.","لا يوجد {0} – اشترِ المزيد من المتجر."],
tool_shop:["This tool is available in the shop.","Dieses Werkzeug gibt es im Shop.","Esta herramienta está en la tienda.","Cet outil est disponible à la boutique.","Esta ferramenta está na loja.","هذه الأداة متوفرة في المتجر."],
unlocked:["{0} unlocked","{0} freigeschaltet","{0} desbloqueado","{0} débloqué","{0} desbloqueado","تم فتح {0}"],
map_clear:["MAP CLEARED","KARTE GESCHAFFT","MAPA COMPLETADO","CARTE TERMINÉE","MAPA CONCLUÍDO","تم إنهاء الخريطة"],
cleared_txt:["{0} is destroyed.","{0} ist zerlegt.","{0} está destruido.","{0} est détruit.","{0} foi destruído.","تم تدمير {0}."],
reward:["Reward: {0} coins","Belohnung: {0} Münzen","Recompensa: {0} monedas","Récompense : {0} pièces","Recompensa: {0} moedas","المكافأة: {0} عملة"],
already:["Already cleared – you kept the crumb coins.","Bereits geschafft – die Brösel-Münzen hast du behalten.","Ya completado: conservas las monedas de los trozos.","Déjà terminé – vous gardez les pièces des miettes.","Já concluído – você manteve as moedas dos farelos.","مكتمل سابقًا – احتفظت بعملات الفتات."],
newmap:["New map unlocked: {0}","Neue Karte freigeschaltet: {0}","Nuevo mapa desbloqueado: {0}","Nouvelle carte débloquée : {0}","Novo mapa desbloqueado: {0}","تم فتح خريطة جديدة: {0}"],
next:["Next map","Nächste Karte","Siguiente mapa","Carte suivante","Próximo mapa","الخريطة التالية"],
menu_btn:["Menu","Menü","Menú","Menu","Menu","القائمة"],
tab_tools:["Tools","Werkzeuge","Herramientas","Outils","Ferramentas","الأدوات"],
tab_upg:["Upgrades","Upgrades","Mejoras","Améliorations","Melhorias","التحسينات"],
tab_items:["Objects","Objekte","Objetos","Objets","Objetos","الأجسام"],
tab_looks:["Looks","Looks","Estilos","Styles","Estilos","المظاهر"],
owned:["Owned","Besitzt","Adquirido","Possédé","Possui","مملوك"],
max:["Max","Max","Máx","Max","Máx","الأقصى"],
current:["Now: {0}","Aktuell: {0}","Actual: {0}","Actuel : {0}","Atual: {0}","الحالي: {0}"],
in_stock:["{0} · owned: {1}","{0} · im Besitz: {1}","{0} · tienes: {1}","{0} · possédés : {1}","{0} · você tem: {1}","{0} · تملك: {1}"],
no_coins:["Not enough coins.","Nicht genug Münzen.","No tienes suficientes monedas.","Pas assez de pièces.","Moedas insuficientes.","لا تكفي العملات."],
equip:["Equip","Wählen","Equipar","Équiper","Equipar","تجهيز"],
active:["Active","Aktiv","Activo","Actif","Ativo","نشط"],
code_only:["Code only","Nur per Code","Solo con código","Code uniquement","Somente por código","بالرمز فقط"],
look_d:["Look for cuts, laser and saw","Look für Schnitte, Laser und Säge","Estilo para cortes, láser y sierra","Style des coupes, du laser et de la scie","Estilo para cortes, laser e serra","مظهر القطع والليزر والمنشار"],
st_normal:["Normal","Normal","Normal","Normal","Normal","عادي"],
st_neon:["Neon","Neon","Neón","Néon","Neon","نيون"],
st_aura:["Neon + Aura","Neon + Aura","Neón + Aura","Néon + Aura","Neon + Aura","نيون + هالة"],
buy:["Buy","Kaufen","Comprar","Acheter","Comprar","شراء"],
t_hand:["Hand","Hand","Mano","Main","Mão","اليد"],
t_hand_d:["Grab and throw objects. Drag empty ground to move the camera.","Objekte greifen und werfen. Auf leerem Grund verschiebst du die Kamera.","Agarra y lanza objetos. Arrastra el suelo vacío para mover la cámara.","Attrapez et lancez des objets. Faites glisser le sol vide pour déplacer la caméra.","Pegue e arremesse objetos. Arraste o chão vazio para mover a câmera.","أمسك الأجسام وارمِها. اسحب الأرض الفارغة لتحريك الكاميرا."],
t_knife:["Knife","Messer","Cuchillo","Couteau","Faca","السكين"],
t_knife_d:["Swipe through objects to cut them cleanly.","Wische durch Objekte, um sie sauber zu zerschneiden.","Desliza sobre los objetos para cortarlos limpiamente.","Balayez les objets pour les couper net.","Deslize sobre os objetos para cortá-los com precisão.","اسحب عبر الأجسام لقطعها بدقة."],
t_shovel:["Shovel","Schaufel","Pala","Pelle","Pá","المجرفة"],
t_shovel_d:["Push and fling pieces and crumbs around.","Schiebe und schleudere Teile und Brösel durch die Gegend.","Empuja y lanza piezas y trozos.","Poussez et projetez pièces et miettes.","Empurre e arremesse peças e farelos.","ادفع القطع والفتات واقذفها في كل اتجاه."],
t_hammer:["Hammer","Hammer","Martillo","Marteau","Martelo","المطرقة"],
t_hammer_d:["Tap: small pieces crumble, big ones break apart.","Tippen: kleine Teile zerbröseln, große brechen auseinander.","Toca: las piezas pequeñas se desmenuzan, las grandes se parten.","Touchez : les petites pièces s'effritent, les grandes se brisent.","Toque: peças pequenas viram farelo, as grandes se partem.","انقر: القطع الصغيرة تتفتت والكبيرة تنكسر."],
t_saw:["Saw","Säge","Sierra","Scie","Serra","المنشار"],
t_saw_d:["Drive through objects: cuts continuously and very fast.","Fahre durch Objekte: schneidet fortlaufend und sehr schnell.","Atraviesa objetos: corta sin parar y muy rápido.","Traversez les objets : coupe en continu, très vite.","Passe pelos objetos: corta continuamente e muito rápido.","مرّر عبر الأجسام: يقطع باستمرار وبسرعة كبيرة."],
t_laser:["Laser","Laser","Láser","Laser","Laser","الليزر"],
t_laser_d:["Drag a direction: the beam cuts across the whole map.","Ziehe eine Richtung: der Strahl schneidet durch die ganze Karte.","Arrastra una dirección: el rayo corta todo el mapa.","Tracez une direction : le faisceau traverse toute la carte.","Arraste uma direção: o feixe corta o mapa inteiro.","اسحب اتجاهًا: يقطع الشعاع الخريطة كلها."],
t_bomb:["Bomb","Bombe","Bomba","Bombe","Bomba","القنبلة"],
t_bomb_d:["Tap to place. Blasts objects to pieces. Costs {0} coins per use.","Tippen zum Platzieren. Sprengt Objekte in Stücke. Kostet {0} Münzen pro Einsatz.","Toca para colocar. Destroza objetos. Cuesta {0} monedas por uso.","Touchez pour poser. Fait exploser les objets. Coûte {0} pièces par usage.","Toque para colocar. Explode objetos em pedaços. Custa {0} moedas por uso.","انقر للوضع. تفجّر الأجسام إلى قطع. تكلّف {0} عملة للاستخدام."],
u_len:["Blade Length","Klingenlänge","Longitud de hoja","Longueur de lame","Comprimento da lâmina","طول النصل"],
u_speed:["Cut Speed","Schnitt-Tempo","Velocidad de corte","Vitesse de coupe","Velocidade de corte","سرعة القطع"],
u_bonus:["Coin Bonus","Münzbonus","Bono de monedas","Bonus de pièces","Bônus de moedas","مكافأة العملات"],
u_magnet:["Collect Radius","Sammelradius","Radio de recogida","Rayon de collecte","Raio de coleta","نطاق الجمع"],
u_auto:["Auto Collector","Auto-Sammler","Recolector automático","Collecteur auto","Coletor automático","الجامع التلقائي"],
uf_len:["{0} units","{0} Einheiten","{0} unidades","{0} unités","{0} unidades","{0} وحدة"],
uf_speed:["{0} ms cooldown","{0} ms Abklingzeit","{0} ms de enfriamiento","{0} ms de recharge","{0} ms de recarga","{0} مللي ثانية انتظار"],
uf_bonus:["+{0}% coins","+{0}% Münzen","+{0}% monedas","+{0}% de pièces","+{0}% moedas","+{0}% عملات"],
uf_magnet:["Radius {0}","Radius {0}","Radio {0}","Rayon {0}","Raio {0}","النطاق {0}"],
uf_auto:["one crumb every {0} s","alle {0} s ein Brösel","un trozo cada {0} s","une miette toutes les {0} s","um farelo a cada {0} s","قطعة كل {0} ثانية"],
off:["off","aus","apagado","désactivé","desligado","متوقف"],
i_crate:["Wooden Crate","Holzkiste","Caja de madera","Caisse en bois","Caixa de madeira","صندوق خشبي"],
i_plank:["Wooden Plank","Holzplanke","Tabla de madera","Planche en bois","Prancha de madeira","لوح خشبي"],
i_wheel:["Wooden Wheel","Holzrad","Rueda de madera","Roue en bois","Roda de madeira","عجلة خشبية"],
i_brick:["Brick Block","Ziegelblock","Bloque de ladrillo","Bloc de brique","Bloco de tijolo","كتلة طوب"],
i_stone:["Stone Block","Steinblock","Bloque de piedra","Bloc de pierre","Bloco de pedra","كتلة حجر"],
i_ice:["Ice Cube","Eiswürfel","Cubo de hielo","Glaçon","Cubo de gelo","مكعب جليد"],
i_glass:["Glass Pane","Glasscheibe","Panel de cristal","Vitre","Vidraça","لوح زجاجي"],
i_beam:["Metal Beam","Metallträger","Viga metálica","Poutre métallique","Viga de metal","عارضة معدنية"],
m_wood:["Wood","Holz","Madera","Bois","Madeira","خشب"],
m_brick:["Brick","Ziegel","Ladrillo","Brique","Tijolo","طوب"],
m_stone:["Stone","Stein","Piedra","Pierre","Pedra","حجر"],
m_glass:["Glass","Glas","Cristal","Verre","Vidro","زجاج"],
m_ice:["Ice","Eis","Hielo","Glace","Gelo","جليد"],
m_metal:["Metal","Metall","Metal","Métal","Metal","معدن"],
s_steel:["Steel","Stahl","Acero","Acier","Aço","فولاذ"],
s_red:["Ember","Glut","Brasa","Braise","Brasa","جمر"],
s_ice:["Frost","Frost","Escarcha","Givre","Gelo","صقيع"],
s_neon:["Neon Lime","Neon-Limette","Lima neón","Lime néon","Lima neon","ليمون نيون"],
s_pink:["Cyber Pink","Cyber-Pink","Rosa cíber","Rose cyber","Rosa cyber","وردي سيبراني"],
s_gold:["Gold","Gold","Oro","Or","Ouro","ذهبي"],
s_plasma:["Plasma","Plasma","Plasma","Plasma","Plasma","بلازما"],
s_void:["Void","Leere","Vacío","Néant","Vazio","العدم"],
s_vol:["Volume","Lautstärke","Volumen","Volume","Volume","الصوت"],
s_gfx:["Graphics","Grafik","Gráficos","Graphismes","Gráficos","الرسوميات"],
q0:["Simple","Einfach","Simple","Simple","Simples","بسيط"],
q1:["Normal","Normal","Normal","Normal","Normal","عادي"],
q2:["High","Hoch","Alto","Élevé","Alto","عالٍ"],
q3:["Ultra","Ultra","Ultra","Ultra","Ultra","فائق"],
s_shader:["Shader","Shader","Shader","Shader","Shader","الشيدر"],
sh0:["Off","Aus","Desactivado","Désactivé","Desligado","متوقف"],
sh1:["Bloom","Bloom","Bloom","Bloom","Bloom","توهج"],
sh2:["Cinematic","Kino","Cinemático","Cinéma","Cinematográfico","سينمائي"],
sh3:["Retro","Retro","Retro","Rétro","Retrô","كلاسيكي"],
s_blur:["Motion blur","Bewegungsunschärfe","Desenfoque de movimiento","Flou de mouvement","Desfoque de movimento","ضبابية الحركة"],
on:["On","An","Sí","Activé","Ligado","تشغيل"],
offb:["Off","Aus","No","Désactivé","Desligado","إيقاف"],
s_vib:["Vibration","Vibration","Vibración","Vibration","Vibração","الاهتزاز"],
s_lang:["Language","Sprache","Idioma","Langue","Idioma","اللغة"],
s_code:["Redeem code","Code einlösen","Canjear código","Utiliser un code","Resgatar código","استخدام رمز"],
redeem:["Redeem","Einlösen","Canjear","Utiliser","Resgatar","استخدام"],
codes_btn:["All codes","Alle Codes","Todos los códigos","Tous les codes","Todos os códigos","كل الرموز"],
s_log:["Version {0} – Update log","Version {0} – Update-Log","Versión {0} – Registro de cambios","Version {0} – Journal des mises à jour","Versão {0} – Registro de atualizações","الإصدار {0} – سجل التحديثات"],
s_priv:["Privacy","Datenschutz","Privacidad","Confidentialité","Privacidade","الخصوصية"],
s_priv_t:["Schnittwerk collects no personal data, shows no ads and needs no internet connection. Your save and account only live on your device.","Schnittwerk sammelt keine persönlichen Daten, zeigt keine Werbung und benötigt keine Internetverbindung. Dein Spielstand und dein Konto liegen nur auf deinem Gerät.","Schnittwerk no recopila datos personales, no muestra anuncios y no necesita conexión a internet. Tu progreso y tu cuenta solo están en tu dispositivo.","Schnittwerk ne collecte aucune donnée personnelle, n'affiche aucune publicité et ne nécessite pas de connexion internet. Votre sauvegarde et votre compte restent uniquement sur votre appareil.","O Schnittwerk não coleta dados pessoais, não exibe anúncios e não precisa de internet. Seu progresso e sua conta ficam apenas no seu dispositivo.","لا يجمع Schnittwerk أي بيانات شخصية ولا يعرض إعلانات ولا يحتاج إلى اتصال بالإنترنت. تقدّمك وحسابك محفوظان على جهازك فقط."],
reset:["Delete save","Spielstand löschen","Borrar progreso","Supprimer la sauvegarde","Apagar progresso","حذف التقدم"],
reset_t:["Tap again to permanently delete the save.","Nochmal tippen, um den Spielstand endgültig zu löschen.","Toca de nuevo para borrar el progreso definitivamente.","Touchez encore pour supprimer définitivement la sauvegarde.","Toque novamente para apagar o progresso permanentemente.","انقر مرة أخرى لحذف التقدم نهائيًا."],
logout:["Log out","Abmelden","Cerrar sesión","Se déconnecter","Sair","تسجيل الخروج"],
c_enter:["Please enter a code.","Bitte einen Code eingeben.","Introduce un código.","Veuillez saisir un code.","Digite um código.","الرجاء إدخال رمز."],
c_bad:["Invalid code.","Ungültiger Code.","Código no válido.","Code invalide.","Código inválido.","رمز غير صالح."],
c_used:["This code was already redeemed.","Dieser Code wurde schon eingelöst.","Este código ya fue canjeado.","Ce code a déjà été utilisé.","Este código já foi resgatado.","تم استخدام هذا الرمز مسبقًا."],
c_ok:["Redeemed: {0}","Eingelöst: {0}","Canjeado: {0}","Utilisé : {0}","Resgatado: {0}","تم الاستخدام: {0}"],
c_coins:["+{0} coins","+{0} Münzen","+{0} monedas","+{0} pièces","+{0} moedas","+{0} عملة"],
c_look:["Look: {0}","Look: {0}","Estilo: {0}","Style : {0}","Estilo: {0}","مظهر: {0}"],
codes_title:["Codes","Codes","Códigos","Codes","Códigos","الرموز"],
copied:["Copied: {0}","Kopiert: {0}","Copiado: {0}","Copié : {0}","Copiado: {0}","تم النسخ: {0}"],
copy:["Copy","Kopieren","Copiar","Copier","Copiar","نسخ"],
redeemed:["Redeemed","Eingelöst","Canjeado","Utilisé","Resgatado","مستخدم"],
login:["Log in","Anmelden","Iniciar sesión","Connexion","Entrar","تسجيل الدخول"],
register:["Register","Registrieren","Registrarse","S'inscrire","Cadastrar","إنشاء حساب"],
username:["Username","Benutzername","Usuario","Nom d'utilisateur","Usuário","اسم المستخدم"],
password:["Password","Passwort","Contraseña","Mot de passe","Senha","كلمة المرور"],
guest:["Play as guest","Als Gast spielen","Jugar como invitado","Jouer en invité","Jogar como convidado","اللعب كضيف"],
guest_name:["Guest","Gast","Invitado","Invité","Convidado","ضيف"],
welcome:["Welcome, {0}!","Willkommen, {0}!","¡Bienvenido, {0}!","Bienvenue, {0} !","Bem-vindo, {0}!","مرحبًا، {0}!"],
e_empty:["Enter username and password.","Gib Benutzername und Passwort ein.","Introduce usuario y contraseña.","Saisissez identifiant et mot de passe.","Digite usuário e senha.","أدخل اسم المستخدم وكلمة المرور."],
e_user:["Username: 3–14 letters, numbers or _.","Benutzername: 3–14 Buchstaben, Zahlen oder _.","Usuario: 3–14 letras, números o _.","Nom : 3 à 14 lettres, chiffres ou _.","Usuário: 3–14 letras, números ou _.","اسم المستخدم: من 3 إلى 14 حرفًا أو رقمًا أو _."],
e_pass:["Password: at least 4 characters.","Passwort: mindestens 4 Zeichen.","Contraseña: mínimo 4 caracteres.","Mot de passe : 4 caractères minimum.","Senha: no mínimo 4 caracteres.","كلمة المرور: 4 أحرف على الأقل."],
e_taken:["That username is taken.","Dieser Benutzername ist vergeben.","Ese usuario ya existe.","Ce nom est déjà pris.","Este usuário já existe.","اسم المستخدم مستخدم بالفعل."],
e_wrong:["Wrong username or password.","Falscher Benutzername oder falsches Passwort.","Usuario o contraseña incorrectos.","Identifiant ou mot de passe incorrect.","Usuário ou senha incorretos.","اسم المستخدم أو كلمة المرور غير صحيحة."],
login_note:["Local account – stored only on this device.","Lokales Konto – nur auf diesem Gerät gespeichert.","Cuenta local: solo en este dispositivo.","Compte local – stocké uniquement sur cet appareil.","Conta local – salva apenas neste dispositivo.","حساب محلي – محفوظ على هذا الجهاز فقط."],
p_overview:["Overview","Übersicht","Resumen","Aperçu","Resumo","نظرة عامة"],
p_ms:["Milestones","Meilensteine","Hitos","Jalons","Marcos","الإنجازات"],
p_inv:["Inventory","Inventar","Inventario","Inventaire","Inventário","المخزون"],
p_color:["Color (free)","Farbe (gratis)","Color (gratis)","Couleur (gratuit)","Cor (grátis)","اللون (مجاني)"],
p_frame:["Frame effects","Rahmen-Effekte","Efectos de marco","Effets de cadre","Efeitos de moldura","تأثيرات الإطار"],
p_name:["Name effects","Namens-Effekte","Efectos de nombre","Effets de nom","Efeitos de nome","تأثيرات الاسم"],
p_badge:["Accessories","Accessoires","Accesorios","Accessoires","Acessórios","الإكسسوارات"],
p_limited:["Limited founder frames","Limitierte Gründer-Rahmen","Marcos fundadores limitados","Cadres fondateurs limités","Molduras fundadoras limitadas","إطارات المؤسسين المحدودة"],
p_locked:["Unlock it through milestones.","Schalte es über Meilensteine frei.","Desbloquéalo con hitos.","Débloquez-le via les jalons.","Desbloqueie por marcos.","افتحه عبر الإنجازات."],
p_lim_locked:["Reserved for players #1–#10.","Nur für Spieler #1–#10.","Solo para los jugadores #1–#10.","Réservé aux joueurs #1–#10.","Apenas para os jogadores #1–#10.","للاعبين #1–#10 فقط."],
p_none:["None","Keine","Ninguno","Aucun","Nenhum","بدون"],
st_cuts:["Cuts","Schnitte","Cortes","Coupes","Cortes","القطع"],
st_crumbs:["Crumbs","Brösel","Trozos","Miettes","Farelos","الفتات"],
st_earned:["Coins earned","Münzen verdient","Monedas ganadas","Pièces gagnées","Moedas ganhas","العملات المكتسبة"],
st_maps:["Maps cleared","Karten geschafft","Mapas completados","Cartes terminées","Mapas concluídos","خرائط مكتملة"],
st_bombs:["Bombs used","Bomben genutzt","Bombas usadas","Bombes utilisées","Bombas usadas","قنابل مستخدمة"],
st_ms:["Milestones","Meilensteine","Hitos","Jalons","Marcos","الإنجازات"],
ms_reached:["Milestone reached: {0}","Meilenstein erreicht: {0}","Hito logrado: {0}","Jalon atteint : {0}","Marco alcançado: {0}","تم بلوغ إنجاز: {0}"],
eq_frame:["Frame","Rahmen","Marco","Cadre","Moldura","إطار"],
eq_name:["Name","Name","Nombre","Nom","Nome","اسم"],
eq_badge:["Badge","Abzeichen","Insignia","Badge","Distintivo","شارة"],
eq_coins:["Coins","Münzen","Monedas","Pièces","Moedas","عملات"],
d_easy:["Easy","Leicht","Fácil","Facile","Fácil","سهل"],
d_med:["Medium","Mittel","Medio","Moyen","Médio","متوسط"],
d_hard:["Hard","Schwer","Difícil","Difficile","Difícil","صعب"],
d_ext:["Extreme","Extrem","Extremo","Extrême","Extremo","شديد الصعوبة"],
fx_glow:["Glow","Leuchten","Brillo","Lueur","Brilho","توهج"],
fx_neon:["Neon","Neon","Neón","Néon","Neon","نيون"],
fx_pulse:["Pulse","Puls","Pulso","Pulsation","Pulso","نبض"],
fx_fire:["Fire","Feuer","Fuego","Feu","Fogo","نار"],
fx_rainbow:["Rainbow","Regenbogen","Arcoíris","Arc-en-ciel","Arco-íris","قوس قزح"],
fx_aura:["Aura","Aura","Aura","Aura","Aura","هالة"],
fx_shimmer:["Shimmer","Schimmer","Destello","Scintillement","Cintilar","بريق"],
fx_glitch:["Glitch","Glitch","Glitch","Glitch","Glitch","تشويش"],
b_coin:["Coin","Münze","Moneda","Pièce","Moeda","عملة"],
b_star:["Star","Stern","Estrella","Étoile","Estrela","نجمة"],
b_crown:["Crown","Krone","Corona","Couronne","Coroa","تاج"],
mt_cuts:["Slicer","Schnittmeister","Cortador","Trancheur","Fatiador","القطّاع"],
mt_crumbs:["Collector","Sammler","Recolector","Collectionneur","Colecionador","الجامع"],
mt_earned:["Tycoon","Magnat","Magnate","Magnat","Magnata","الثري"],
mt_maps:["Demolisher","Abrissprofi","Demoledor","Démolisseur","Demolidor","الهدّام"],
mt_bombs:["Bomber","Bomber","Bombardero","Bombardier","Bombardeiro","المفجّر"],
mt_hammers:["Smasher","Zertrümmerer","Machacador","Fracasseur","Esmagador","المحطّم"],
mt_lasers:["Laser Expert","Laser-Experte","Experto láser","Expert laser","Especialista em laser","خبير الليزر"],
mt_tools:["Toolmaster","Werkzeugmeister","Maestro de herramientas","Maître des outils","Mestre das ferramentas","سيد الأدوات"],
md_cuts:["Make {0} cuts","Mache {0} Schnitte","Haz {0} cortes","Faites {0} coupes","Faça {0} cortes","نفّذ {0} قطع"],
md_crumbs:["Collect {0} crumbs","Sammle {0} Brösel","Recoge {0} trozos","Ramassez {0} miettes","Colete {0} farelos","اجمع {0} من الفتات"],
md_earned:["Earn {0} coins in total","Verdiene insgesamt {0} Münzen","Gana {0} monedas en total","Gagnez {0} pièces au total","Ganhe {0} moedas no total","اكسب {0} عملة إجمالًا"],
md_maps:["Clear {0} maps","Schaffe {0} Karten","Completa {0} mapas","Terminez {0} cartes","Conclua {0} mapas","أنهِ {0} خرائط"],
md_bombs:["Use {0} bombs","Nutze {0} Bomben","Usa {0} bombas","Utilisez {0} bombes","Use {0} bombas","استخدم {0} قنابل"],
md_hammers:["Smash {0} times with the hammer","Schlage {0}-mal mit dem Hammer zu","Golpea {0} veces con el martillo","Frappez {0} fois avec le marteau","Golpeie {0} vezes com o martelo","اضرب {0} مرات بالمطرقة"],
md_lasers:["Fire the laser {0} times","Feuere den Laser {0}-mal ab","Dispara el láser {0} veces","Tirez {0} fois au laser","Dispare o laser {0} vezes","أطلق الليزر {0} مرات"],
md_tools:["Own every tool","Besitze jedes Werkzeug","Ten todas las herramientas","Possédez tous les outils","Tenha todas as ferramentas","امتلك جميع الأدوات"]
};
let LI=0;
function tr(k){const e=D[k];let s=e?(e[LI]||e[0]):k;for(let i=1;i<arguments.length;i++)s=s.split('{'+(i-1)+'}').join(arguments[i]);return s;}
try{if(localStorage.getItem('sw2_ver')!=='1'){const old=localStorage.getItem('schnittwerk_lang');Object.keys(localStorage).filter(k=>k.indexOf('schnittwerk_')===0).forEach(k=>localStorage.removeItem(k));if(old)localStorage.setItem('sw2_lang',old);localStorage.setItem('sw2_ver','1');}}catch(e){}
const LANG_KEY='sw2_lang';
try{const l=localStorage.getItem(LANG_KEY),i=LANGS.findIndex(x=>x[0]===l);if(i>=0)LI=i;}catch(e){}

/* ---------- Icons ---------- */
const IC={
 knife:'<path d="M5 19 17 4c2 1 3 3 3 5L9 20z"/><path d="m3 21 3-3 2 2-3 3z"/>',
 shovel:'<path d="M10.5 2h3v10h-3z"/><path d="M8 3h8v2H8z"/><path d="M7 12h10l-2 9H9z"/>',
 hammer:'<path d="M3 4h13v7H3z"/><path d="M16 6h4v3h-4z"/><path d="M8.5 11h3v11h-3z"/>',
 saw:'<circle cx="12" cy="12" r="8.7" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="2.3 1.7"/><path fill-rule="evenodd" d="M12 5.8a6.2 6.2 0 100 12.4 6.2 6.2 0 000-12.4zm0 4.2a2 2 0 110 4 2 2 0 010-4z"/>',
 laser:'<path d="M2 12h20" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="6" cy="12" r="4"/><path d="M14 6l2 3M18 5l1 3M14 18l2-3M18 19l1-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
 bomb:'<circle cx="11" cy="14" r="7"/><path d="M15 8l3-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/><circle cx="19" cy="4.5" r="1.8"/>',
 hand:'<path d="M8 21c-2-3-4-6-4-8l2-1 2 2V5h2v6V3.5h2V11V4.5h2V11V6.5h2v8c0 3-2 6-5 6.5z"/>',
 coin:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#0007" stroke-width="2"/>',
 cart:'<path d="M2 4h3l2.5 11h10L20 7H6.3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="19.5" r="1.8"/><circle cx="17" cy="19.5" r="1.8"/>',
 gear:'<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="2.5 2"/><path fill-rule="evenodd" d="M12 6.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zm0 3.5a2 2 0 110 4 2 2 0 010-4z"/>',
 home:'<path d="M3 11l9-8 9 8v10h-6v-6H9v6H3z"/>',
 lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" stroke-width="2.4"/>',
 back:'<path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
 play:'<path d="M7 4l13 8-13 8z"/>',
 check:'<path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
 star:'<path d="M12 2l3 7 7 .6-5.3 4.6L18.2 22 12 18l-6.2 4 1.5-7.8L2 9.6 9 9z"/>',
 /* simple, recognisable upgrade icons */
 ruler:'<rect x="2" y="7.5" width="20" height="9" rx="2"/><path d="M6 7.5v4M10 7.5v3M14 7.5v4M18 7.5v3" stroke="#0009" stroke-width="1.8" stroke-linecap="round" fill="none"/>',
 bolt:'<path d="M13.5 2 4.5 13.5H11L9.8 22l9.7-12H13z"/>',
 coinplus:'<circle cx="12" cy="12" r="10"/><path d="M12 6.5v11M6.5 12h11" stroke="#0009" stroke-width="2.8" stroke-linecap="round" fill="none"/>',
 magnet:'<path d="M4 3h6v9a2 2 0 004 0V3h6v9a8 8 0 01-16 0z"/><path d="M4 3h6v4H4zM14 3h6v4h-6z" fill="#ffffffcc"/>',
 auto:'<path d="M19.5 9A8 8 0 006 6.6M4.5 15A8 8 0 0018 17.4" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M20 3.5V9h-5.5M4 20.5V15h5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.6"/>',
 crown:'<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
 copy:'<rect x="8.5" y="8.5" width="12" height="12.5" rx="2.2"/><path d="M5 16V5.5A2.5 2.5 0 017.5 3H16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
 chev:'<path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'
};
const svg=n=>'<svg class="ic ic-'+n+'" viewBox="0 0 24 24" fill="currentColor">'+IC[n]+'</svg>';

/* ---------- Constants / data ---------- */
const STEP=1000/60,MAX_PIECES=170,MAX_CRUMBS=140,CRUMB_AREA=420,BOMB_COST=20,BOMB_FUSE=1500;
const CAT_BLOCK=1,CAT_CRUMB=2,CAT_WORLD=4;
const MATS={
 wood:{c:'#c98b4c',d:'#6e421d',val:.5,den:.0011,fr:.6,re:.05},
 brick:{c:'#c4573b',d:'#5e2415',val:.7,den:.0018,fr:.7,re:.03},
 stone:{c:'#8f98a3',d:'#414852',val:.9,den:.0025,fr:.8,re:.02},
 glass:{c:'#9fdcf0',d:'#2f7d99',val:1,den:.0012,fr:.3,re:.08,fragile:1},
 ice:{c:'#cfeeff',d:'#5d97b8',val:.8,den:.0009,fr:.03,re:.02,fragile:2},
 metal:{c:'#7f8fa3',d:'#343e4d',val:1.6,den:.0045,fr:.5,re:.1}
};
const TOOLS={hand:{ic:'hand',p:0},knife:{ic:'knife',p:0},shovel:{ic:'shovel',p:120},hammer:{ic:'hammer',p:260},saw:{ic:'saw',p:750},laser:{ic:'laser',p:1900},bomb:{ic:'bomb',p:1300}};
const TOOL_ORDER=['hand','knife','shovel','hammer','saw','laser','bomb'];
const toolName=k=>tr('t_'+k),toolDesc=k=>k==='bomb'?tr('t_bomb_d',BOMB_COST):tr('t_'+k+'_d');
const UPG={
 len:{base:90,ic:'ruler',col:'#4aa6ff',f:l=>tr('uf_len',240+70*l)},
 speed:{base:110,ic:'bolt',col:'#ffd45c',f:l=>tr('uf_speed',200-24*l)},
 bonus:{base:150,ic:'coinplus',col:'#ffb02e',f:l=>tr('uf_bonus',15*l)},
 magnet:{base:70,ic:'magnet',col:'#ff6b6b',f:l=>tr('uf_magnet',26+14*l)},
 auto:{base:220,ic:'auto',col:'#45d08a',f:l=>l?tr('uf_auto',(3.6-.55*l).toFixed(1)):tr('off')}
};
const ITEMS=[
 {id:'crate',mat:'wood',w:60,h:60,cost:14},
 {id:'plank',mat:'wood',w:150,h:24,cost:14},
 {id:'wheel',mat:'wood',r:30,cost:10},
 {id:'brick',mat:'brick',w:60,h:32,cost:10},
 {id:'stone',mat:'stone',w:64,h:64,cost:30},
 {id:'ice',mat:'ice',w:56,h:56,cost:20},
 {id:'glass',mat:'glass',w:80,h:110,cost:60},
 {id:'beam',mat:'metal',w:150,h:24,cost:44}
];
/* st: 0 = normal effects, 1 = neon, 2 = neon + aura particles */
const SKINS={
 steel:{a:'#e7eef7',b:'#8ea3bb',p:0,st:0},
 red:{a:'#ffa07a',b:'#e02f2f',p:300,st:0},
 ice:{a:'#d8f4ff',b:'#4fb3e8',p:500,st:0},
 neon:{a:'#b6ffe0',b:'#12ffa0',p:700,st:1},
 pink:{a:'#ffc2ec',b:'#ff2fb4',p:1200,st:1},
 gold:{a:'#fff0a0',b:'#ffb400',code:1,st:2},
 plasma:{a:'#efc6ff',b:'#9a3df5',code:1,st:2},
 void:{a:'#9ee7ff',b:'#5a2bff',p:2600,st:2}
};
/* redeem codes are only stored as hashes – the plain list is visible to the owner (#1) via the server */
const CODES={"05d78bf06543a6b2b64a": {"coins": 200}, "b5cd265db4b306feca34": {"coins": 500}, "8e0916392ca5567b255c": {"coins": 2500}, "ba899d7b7fa0531a8422": {"coins": 300}, "5e81136c8db9c4df3d9f": {"tool": "hammer"}, "af364a462dccf597931f": {"tool": "saw"}, "c21f39e1653a748e514b": {"tool": "laser"}, "4457f8cc5bc1a639849c": {"skin": "neon"}, "a23dbe67e52f8eb768c5": {"skin": "pink"}, "7b1bca42a3c1b56c6116": {"skin": "gold"}, "d1100f01ec7e3a00e720": {"skin": "plasma"}, "04524cdb9af74189ffdb": {"skin": "void"}, "18edaf0f0656524fac79": {"skin": "inferno"}, "010cd09ffefadc3b17c9": {"skin": "aurora"}};
const COLORS=['#ffb02e','#ff5a5a','#ff7ac8','#b06bff','#4aa6ff','#2fe0d0','#45d08a','#e8f0ff'];
const FRAME_FX=['none','glow','neon','pulse','fire','rainbow','aura'];
const NAME_FX=['none','glow','neon','shimmer','fire','rainbow','glitch'];
const BADGES=['knife','hammer','bomb','laser','coin','star','crown'];
/* milestones: k = stat, n = goal, d = difficulty 0-3, r = rewards {f frame, n name effect, b badge, c coins} */
const MSL=[
 {k:'cuts',n:1,d:0,r:{b:'knife',t:'apprentice'}},
 {k:'cuts',n:100,d:0,r:{f:'glow'}},
 {k:'cuts',n:1000,d:1,r:{f:'neon',t:'slicer'}},
 {k:'cuts',n:5000,d:2,r:{f:'fire'}},
 {k:'saws',n:250,d:1,r:{t:'lumberjack'}},
 {k:'digs',n:400,d:1,r:{t:'digger'}},
 {k:'crumbs',n:200,d:0,r:{n:'glow'}},
 {k:'crumbs',n:2000,d:1,r:{n:'neon',t:'collector'}},
 {k:'crumbs',n:10000,d:2,r:{n:'fire'}},
 {k:'earned',n:1000,d:0,r:{b:'coin'}},
 {k:'earned',n:8000,d:1,r:{f:'pulse'}},
 {k:'earned',n:100000,d:3,r:{f:'rainbow',n:'rainbow',t:'tycoon'}},
 {k:'maps',n:1,d:0,r:{b:'star'}},
 {k:'maps',n:3,d:0,r:{n:'shimmer'}},
 {k:'maps',n:8,d:2,r:{f:'aura'}},
 {k:'maps',n:15,d:3,r:{n:'glitch',b:'crown',t:'legend'}},
 {k:'bombs',n:10,d:0,r:{b:'bomb'}},
 {k:'bombs',n:100,d:2,r:{t:'bomber'}},
 {k:'hammers',n:50,d:0,r:{b:'hammer'}},
 {k:'hammers',n:300,d:2,r:{t:'demolisher'}},
 {k:'lasers',n:25,d:1,r:{b:'laser'}},
 {k:'lasers',n:150,d:2,r:{t:'laserace'}},
 {k:'tools',n:7,d:2,r:{c:1500}},
 {k:'time',n:36000,d:2,r:{t:'veteran',c:1000}},
 {k:'duelsWon',n:1,d:1,r:{c:500}},
 {k:'duelsWon',n:10,d:3,r:{t:'champion'}}
];
const TIERS=[['d_easy','#45d08a'],['d_med','#4aa6ff'],['d_hard','#ff8a1f'],['d_ext','#ff4d8d']];

/* ---------- Save game + accounts ---------- */
const GUEST_KEY='sw2_guest',SES_KEY='sw2_session';
let ACC=null;
function defSave(){return{coins:80,mapsDone:{},toolsOwned:{hand:1,knife:1},upg:{len:0,speed:0,bonus:0,magnet:0,auto:0},inv:{crate:6,plank:3,wheel:3},skins:{steel:1},skin:'steel',codes:{},
 settings:{vol:.8,haptic:1,quality:1,shader:1,blur:1,hotbar:1},
 stats:{cuts:0,crumbs:0,bombs:0,hammers:0,lasers:0,saws:0,digs:0,earned:0,time:0,duelsWon:0,duelsLost:0},
 prof:{color:'#ffb02e',frame:'none',nameFx:'none',badge:'',title:'',bio:'',own:{f:{none:1},n:{none:1},b:{},t:{}},done:{}},
 net:{adjSeen:0},t:0};}
function merge(a,b){for(const k in b){if(b[k]&&typeof b[k]==='object'&&a[k]&&typeof a[k]==='object')merge(a[k],b[k]);else a[k]=b[k];}return a;}
let S=defSave();
const saveKey=()=>ACC?'sw2_acc_'+ACC.id:GUEST_KEY;
function loadSave(){S=defSave();try{const j=JSON.parse(localStorage.getItem(saveKey()));if(j&&typeof j==='object')merge(S,j);}catch(e){}if(!(S.coins>=0))S.coins=0;}
let saveT=0;
function save(){if(labMode)return;S.t=Date.now();try{localStorage.setItem(saveKey(),JSON.stringify(S));}catch(e){}netDirty=true;}
function saveSoon(){clearTimeout(saveT);saveT=setTimeout(save,500);}
const bonusMult=()=>1+.15*S.upg.bonus;
function addCoins(v,earn){S.coins+=v;if(earn!==false)S.stats.earned+=v;updateCoins();saveSoon();}
function updateCoins(){const t=fmt(S.coins),h=svg('coin')+'<span>'+t+'</span>';
  ['hudCoins','menuCoins','mapsCoins','shopCoins'].forEach(i=>{const e=$(i);if(e.dataset.v!==t){const had=e.dataset.v!==undefined;e.dataset.v=t;e.innerHTML=h;
    if(had&&!e.classList.contains('bump')){e.classList.add('bump');setTimeout(()=>e.classList.remove('bump'),320);}}});}

/* ---------- Audio ---------- */
let ac=null,master=null,noiseBuf=null,voices=0;
function audio(){
  if(!ac){try{ac=new(window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=S.settings.vol;
    const comp=ac.createDynamicsCompressor();master.connect(comp);comp.connect(ac.destination);
    const n=ac.sampleRate*2;noiseBuf=ac.createBuffer(1,n,ac.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}catch(e){ac=null;return null;}}
  if(ac.state==='suspended')ac.resume();return ac;
}
const lastSfx={};
function gate(k,ms){const t=performance.now();if(t-(lastSfx[k]||0)<ms)return false;lastSfx[k]=t;return true;}
function outTo(node,pan){if(pan&&ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=clamp(pan,-1,1);node.connect(p);p.connect(master);}else node.connect(master);}
function tone(f,dur,type,vol,f2,delay,pan){
  if(S.settings.vol<=0||voices>42||!audio())return;const t=ac.currentTime+(delay||0);
  const o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  o.connect(g);outTo(g,pan);voices++;o.onended=()=>voices--;o.start(t);o.stop(t+dur+.02);
}
function noise(dur,vol,ft,f1,f2,delay,q,pan){
  if(S.settings.vol<=0||voices>42||!audio())return;const t=ac.currentTime+(delay||0);
  const s=ac.createBufferSource();s.buffer=noiseBuf;const f=ac.createBiquadFilter();f.type=ft;f.Q.value=q||1;
  f.frequency.setValueAtTime(f1,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f2),t+dur);
  const g=ac.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  s.connect(f);f.connect(g);outTo(g,pan);voices++;s.onended=()=>voices--;s.start(t,Math.random()*1.2,dur+.02);
}
function vib(ms){if(S.settings.haptic&&navigator.vibrate)try{navigator.vibrate(ms);}catch(e){}}
const panX=x=>clamp((x-camera.x)*camera.zoom/((W||800)/2),-1,1)*.8;
/* per-material sound profile: f base tone, t wave, n noise sweep, nt filter, r ring tone, d decay scale */
const MSND={
 wood:{f:190,t:'triangle',n:[1700,450],nt:'bandpass',r:0,d:1},
 brick:{f:125,t:'square',n:[1300,320],nt:'lowpass',r:0,d:1},
 stone:{f:80,t:'sine',n:[900,220],nt:'lowpass',r:0,d:1.3},
 glass:{f:2800,t:'triangle',n:[7000,3800],nt:'highpass',r:3900,d:.8},
 ice:{f:1900,t:'triangle',n:[5200,2400],nt:'highpass',r:2500,d:.7},
 metal:{f:780,t:'sine',n:[4200,2600],nt:'highpass',r:1180,d:1.7}
};
const szOf=a=>clamp(Math.pow(Math.max(a,60)/2400,.25),.65,1.45);
function hit(mk,v,pan,sz){
  const m=MSND[mk]||MSND.wood;sz=sz||1;
  tone(m.f*rnd(.92,1.1)/sz,.1*m.d*Math.sqrt(sz),m.t,.12*v,m.f*.5/sz,0,pan);
  noise(.09*m.d*sz,.1*v,m.nt,m.n[0]/sz,m.n[1]/sz,0,1,pan);
  if(m.r)tone(m.r*rnd(.94,1.06)/sz,.28*m.d,'sine',.05*v,m.r*.97/sz,.008,pan);
}
const sfx={
 click(){tone(640,.05,'square',.05);tone(960,.04,'sine',.03,0,.02);},
 hover(){if(!gate('hov',50))return;tone(1500,.025,'sine',.012);},
 back(){tone(520,.06,'square',.045,340);},
 tab(){tone(760,.05,'triangle',.06,980);},
 toggle(on){tone(on?700:480,.06,'square',.05,on?940:340);},
 dock(open){noise(.16,.06,'bandpass',open?600:2400,open?2400:600,0,1);tone(open?420:620,.1,'sine',.04,open?620:420);},
 error(){tone(170,.16,'sawtooth',.07,110);tone(140,.16,'sawtooth',.05,90,.09);},
 buy(){tone(880,.08,'triangle',.08);tone(1320,.14,'triangle',.08,0,.07);noise(.06,.03,'highpass',6000,6000,.06);},
 equip(){tone(600,.06,'square',.05,900);tone(900,.09,'triangle',.06,0,.06);},
 copy(){tone(1100,.05,'triangle',.06);tone(1650,.08,'triangle',.06,0,.06);},
 unlock(){[523,659,784,1047].forEach((f,i)=>tone(f,.24,'triangle',.09,0,i*.1));},
 milestone(){[392,523,659,784,1047,1319].forEach((f,i)=>{tone(f,.3,'triangle',.08,0,i*.08);tone(f*2,.22,'sine',.03,0,i*.08+.02);});noise(.5,.04,'highpass',7000,7000,.4);},
 login(){[660,880,1320].forEach((f,i)=>tone(f,.16,'triangle',.07,0,i*.07));},
 swish(p){if(!gate('swish',60))return;noise(.14,.14,'bandpass',rnd(3600,4600),rnd(700,1100),0,1,p);tone(rnd(900,1100),.1,'triangle',.04,320,0,p);},
 cut(mk,area,p){this.swish(p);if(!gate('cut'+mk,55))return;hit(mk,.55,p,szOf(area||1800));if(mk==='glass'||mk==='ice')tone(rnd(3000,4200),.05,'sine',.03,0,.03,p);},
 saw(mk,p){if(!gate('saw',65))return;const m=mk==='metal'?[1900,1400]:(mk==='glass'||mk==='ice')?[2600,2200]:(mk==='stone'||mk==='brick')?[520,380]:[260,190];
   noise(.09,.1,'bandpass',rnd(2200,3000),1600,0,2,p);tone(m[0]*rnd(.95,1.05),.09,'sawtooth',.035,m[1],0,p);if(mk==='metal')tone(rnd(3200,4500),.05,'sine',.02,0,.01,p);},
 shovel(mk,p){if(!gate('shovel',110))return;noise(.2,.08,'bandpass',rnd(500,800),260,0,.8,p);if(mk&&MSND[mk])tone(MSND[mk].f*.8,.06,'triangle',.03,0,.02,p);},
 hammer(mk,p){tone(210,.14,'square',.12,60,0,p);noise(.08,.14,'lowpass',900,200,0,1,p);tone(60,.22,'sine',.2,35,0,p);if(mk)hit(mk,.7,p,1.2);},
 laser(p){tone(300,.22,'sine',.05,1800,0,p);tone(2400,.36,'sawtooth',.07,120,.2,p);tone(1200,.4,'sine',.05,80,.2,p);noise(.5,.05,'highpass',7000,3000,.22,1,p);},
 crumble(mk,area,p){if(!gate('crumb'+mk,50))return;const m=MSND[mk]||MSND.wood,sz=szOf(area||300);
   for(let i=0;i<3;i++){noise(.07*m.d,.07,m.nt,m.n[0]/sz*rnd(.8,1.2),m.n[1]/sz,i*.045,1,p);tone(m.f*rnd(1.2,2.2)/sz,.04,m.t,.035,0,i*.045+.01,p);}},
 tink(mk,rv,p){if(!gate('tink',35))return;const m=MSND[mk]||MSND.wood,v=clamp(rv/9,.2,1);tone(m.f*rnd(1.6,2.4)*(m.f>1000?.5:1),.05,'triangle',.05*v,0,0,p);},
 coin(chain,p){if(!gate('coin',40))return;const sc=[880,988,1109,1318,1480,1760,1976],f=sc[Math.min(chain,6)];tone(f,.08,'square',.03,0,0,p);tone(f*1.5,.12,'sine',.045,0,.05,p);},
 spawn(){tone(300,.1,'sine',.08,700);noise(.05,.05,'bandpass',2000,3000);},
 grab(){tone(180,.06,'triangle',.08,120);noise(.04,.05,'lowpass',1400,600);},
 drop(){tone(130,.08,'triangle',.06,80);},
 bombPlace(){tone(220,.08,'square',.07,160);tone(330,.1,'square',.05,0,.08);},
 beep(t){tone(1300+t*700,.03,'square',.045);},
 fuse(){if(!gate('fuse',90))return;noise(.08,.05,'highpass',4500,6500);},
 boom(p){noise(1.1,.5,'lowpass',1300,60,0,1,p);tone(95,.7,'sawtooth',.3,26,0,p);tone(55,.9,'sine',.35,22,0,p);noise(.5,.2,'highpass',3500,900,.02,1,p);
   for(let i=0;i<6;i++)noise(.1,.09,'lowpass',rnd(800,2200),300,.35+i*.11+Math.random()*.1,1,p);},
 shatter(mk,p){if(!gate('shatter',80))return;
   if(mk==='ice'){noise(.22,.14,'highpass',4500,2000,0,1,p);for(let i=0;i<5;i++)tone(rnd(1600,3000),.05,'square',.03,0,i*.035,p);tone(220,.12,'triangle',.08,90,0,p);}
   else{noise(.28,.16,'highpass',5500,3000,0,1,p);for(let i=0;i<5;i++)tone(rnd(2200,4600),.12,'triangle',.05,0,i*.03,p);}},
 brk(mk,area,p){if(!gate('brk'+mk,70))return;hit(mk,1,p,szOf(area||2000)*1.15);this.crumble(mk,area,p);},
 impact(mk,rv,p){if(!gate('imp'+mk,55))return;const v=clamp(rv/16,.08,1);hit(mk,v*1.1,p,rnd(.9,1.2));}
};

/* ---------- Textures ---------- */
function rng(seed){return()=>(seed=(seed*16807)%2147483647)/2147483647;}
const TEX={
 wood(g){const r=rng(11);for(let i=0;i<8;i++){const y=6+i*12;g.strokeStyle='rgba(70,35,10,'+(.14+r()*.16)+')';g.lineWidth=1+r()*1.6;g.beginPath();g.moveTo(0,y);for(let x=8;x<=96;x+=8)g.lineTo(x,y+Math.sin(x*.12+i*1.7)*2);g.stroke();}
  g.fillStyle='rgba(70,35,10,.28)';g.beginPath();g.ellipse(60,42,7,4.5,0,0,6.3);g.fill();g.fillStyle='rgba(255,230,190,.10)';g.fillRect(0,0,96,3);},
 brick(g){g.strokeStyle='rgba(255,235,220,.38)';g.lineWidth=2.4;for(let r=0;r<4;r++){const y=r*24;g.beginPath();g.moveTo(0,y);g.lineTo(96,y);g.stroke();const off=(r%2)*24;for(let x=off;x<=96;x+=48){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+24);g.stroke();}}
  const r=rng(5);for(let i=0;i<40;i++){g.fillStyle='rgba(0,0,0,'+(r()*.12)+')';g.fillRect(r()*96,r()*96,2,2);}},
 stone(g){const r=rng(3);for(let i=0;i<70;i++){g.fillStyle=r()>.5?'rgba(255,255,255,.14)':'rgba(0,0,0,.16)';g.beginPath();g.arc(r()*96,r()*96,1+r()*2.6,0,6.3);g.fill();}
  g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=1.4;g.beginPath();g.moveTo(10,20);g.lineTo(30,34);g.lineTo(26,52);g.moveTo(70,60);g.lineTo(84,78);g.stroke();},
 glass(g){g.fillStyle='rgba(255,255,255,.28)';for(let i=-1;i<4;i++){g.beginPath();g.moveTo(i*36,96);g.lineTo(i*36+16,96);g.lineTo(i*36+76,0);g.lineTo(i*36+60,0);g.fill();}g.fillStyle='rgba(255,255,255,.14)';g.fillRect(0,0,96,4);},
 ice(g){const r=rng(9);g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.4;for(let i=0;i<9;i++){const x=r()*96,y=r()*96,a=r()*6.3,l=10+r()*20;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
  g.fillStyle='rgba(120,190,230,.16)';g.beginPath();g.moveTo(0,0);g.lineTo(60,0);g.lineTo(0,50);g.fill();},
 metal(g){const r=rng(21);for(let i=0;i<36;i++){g.fillStyle='rgba(255,255,255,'+(r()*.09)+')';g.fillRect(0,i*2.7,96,1.2);}
  g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=2;g.strokeRect(1,1,94,94);
  [[9,9],[87,9],[9,87],[87,87]].forEach(p=>{g.fillStyle='rgba(20,28,40,.55)';g.beginPath();g.arc(p[0],p[1],3,0,6.3);g.fill();g.fillStyle='rgba(255,255,255,.3)';g.beginPath();g.arc(p[0]-1,p[1]-1,1.1,0,6.3);g.fill();});}
};

/* ---------- Canvas / camera / post-fx buffers ---------- */
const canvas=$('world'),ctx=canvas.getContext('2d');
let W=0,H=0,DPR=1;
const camera={x:0,y:-150,zoom:1};
let skyG=null,vig=null,grade=null,grainPat=null,scanPat=null;
const gl={c:document.createElement('canvas'),c2:document.createElement('canvas')};gl.g=gl.c.getContext('2d');gl.g2=gl.c2.getContext('2d');
function dprFor(){const d=window.devicePixelRatio||1,q=S.settings.quality;if(S.settings.shader===3)return .55;return q===0?Math.min(d,1.25):q===3?Math.min(d,3):Math.min(d,2);}
function buildFx(){
  gl.c.width=Math.max(8,Math.ceil(W/3));gl.c.height=Math.max(8,Math.ceil(H/3));gl.c2.width=Math.max(4,Math.ceil(W/9));gl.c2.height=Math.max(4,Math.ceil(H/9));
  vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.32,W/2,H/2,Math.hypot(W,H)*.56);vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.62)');
  grade=ctx.createLinearGradient(0,0,0,H);grade.addColorStop(0,'#ffb27a');grade.addColorStop(1,'#4c7fd0');
}
function mkPatterns(){
  const n=document.createElement('canvas');n.width=n.height=128;const g=n.getContext('2d'),id=g.createImageData(128,128);
  for(let i=0;i<id.data.length;i+=4){const v=Math.random()*255;id.data[i]=id.data[i+1]=id.data[i+2]=v;id.data[i+3]=255;}
  g.putImageData(id,0,0);grainPat=ctx.createPattern(n,'repeat');
  const s=document.createElement('canvas');s.width=4;s.height=4;const sg=s.getContext('2d');sg.fillStyle='rgba(0,0,0,.3)';sg.fillRect(0,0,4,1.6);scanPat=ctx.createPattern(s,'repeat');
}
function resize(){W=window.innerWidth;H=window.innerHeight;DPR=dprFor();canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);
  canvas.style.imageRendering=S.settings.shader===3?'pixelated':'auto';ctx.setTransform(DPR,0,0,DPR,0,0);buildSky();buildFx();clampCam();}
window.addEventListener('resize',resize);
const s2w=(x,y)=>({x:camera.x+(x-W/2)/camera.zoom,y:camera.y+(y-H/2)/camera.zoom});
const w2s=(x,y)=>({x:(x-camera.x)*camera.zoom+W/2,y:(y-camera.y)*camera.zoom+H/2});
const minZoom=()=>Math.max(.3,W/1500);
/* limits: a little beyond the walls left/right, far up but capped, ground at the bottom */
function clampCam(){
  camera.zoom=clamp(camera.zoom,minZoom(),2.2);
  const hw=W/2/camera.zoom,hh=H/2/camera.zoom;
  const lx=Math.max(40,600-hw);camera.x=clamp(camera.x,-lx,lx);
  const mn=-1500+hh,mx=170-hh;camera.y=mn>mx?(mn+mx)/2:clamp(camera.y,mn,mx);
}
function fitCamera(){camera.zoom=clamp(Math.min(W/880,H/640),minZoom(),1.5);camera.x=0;camera.y=-150;clampCam();}

/* ---------- Physics ---------- */
const engine=Engine.create({enableSleeping:true});engine.gravity.y=1;
const world=engine.world;
function applyQuality(){const q=S.settings.quality;engine.positionIterations=[7,8,10,14][q];engine.velocityIterations=[5,6,8,10][q];engine.constraintIterations=2;}
const partMul=()=>[.35,1,1.6,2.6][S.settings.quality];
const WF={category:CAT_WORLD,mask:0xFFFF};
Composite.add(world,[
 Bodies.rectangle(0,100,4000,200,{isStatic:true,friction:.9,collisionFilter:WF}),
 Bodies.rectangle(-500,-2900,80,6000,{isStatic:true,collisionFilter:WF}),
 Bodies.rectangle(500,-2900,80,6000,{isStatic:true,collisionFilter:WF}),
 Bodies.rectangle(0,-3200,1200,80,{isStatic:true,collisionFilter:WF})
]);
let pieces=[],crumbs=[],bombs=[],fragQ=[];
let warming=false;

function polyArea(v){let a=0;for(let i=0,n=v.length;i<n;i++){const j=(i+1)%n;a+=v[i].x*v[j].y-v[j].x*v[i].y;}return Math.abs(a)/2;}
function perim(v){let p=0;for(let i=0,n=v.length;i<n;i++){const j=(i+1)%n;p+=Math.hypot(v[j].x-v[i].x,v[j].y-v[i].y);}return p;}
function cleanPoly(v){const o=[];for(const p of v){const l=o[o.length-1];if(!l||Math.hypot(p.x-l.x,p.y-l.y)>.6)o.push(p);}
  while(o.length>2&&Math.hypot(o[0].x-o[o.length-1].x,o[0].y-o[o.length-1].y)<=.6)o.pop();return o;}
function addPiece(b){pieces.push(b);Composite.add(world,b);}
function removePiece(b){const i=pieces.indexOf(b);if(i>=0)pieces.splice(i,1);Composite.remove(world,b);if(b.custom)b.custom.dead=true;if(drag&&drag.body===b)endDrag();}
function mkPiece(mk,verts,texO,texA){
  const M=MATS[mk],c=Vertices.centre(verts);
  const b=Bodies.fromVertices(c.x,c.y,[verts],{friction:M.fr,frictionStatic:.7,restitution:M.re,density:M.den,sleepThreshold:45,collisionFilter:{category:CAT_BLOCK,mask:CAT_BLOCK|CAT_WORLD}},false,.01,4);
  if(!b||!b.vertices||b.vertices.length<3)return null;
  b.custom={piece:1,mat:mk,area:polyArea(verts),texO:texO,texA:texA,fl:0};
  addPiece(b);return b;
}
function mkBlock(mk,cx,cy,w,h,ang){
  ang=ang||0;const co=Math.cos(ang),si=Math.sin(ang);
  const v=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(p=>({x:cx+p[0]*co-p[1]*si,y:cy+p[0]*si+p[1]*co}));
  return mkPiece(mk,v,{x:-w/2*co+h/2*si,y:-w/2*si-h/2*co},ang);
}
function mkNgon(mk,cx,cy,r,n){const v=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2-Math.PI/2;v.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r});}return mkPiece(mk,v,{x:-r,y:-r},0);}
function wakeNear(x){for(const b of pieces)if(b.isSleeping&&Math.abs(b.position.x-x)<300)Sleeping.set(b,false);}
function capVel(b,m){const v=b.velocity,s=Math.hypot(v.x,v.y);if(s>m)Body.setVelocity(b,{x:v.x*m/s,y:v.y*m/s});const w=b.angularVelocity;if(Math.abs(w)>.35)Body.setAngularVelocity(b,Math.sign(w)*.35);}
/* safety net: brings pieces that squeezed into walls / ground / out of the map back inside */
function sanitize(){
  for(let i=pieces.length-1;i>=0;i--){
    const b=pieces[i],p=b.position;
    if(!isFinite(p.x)||!isFinite(p.y)){removePiece(b);continue;}
    if(b.isSleeping)continue;
    if(!(drag&&drag.body===b))capVel(b,26);
    const bb=b.bounds;let dx=0,dy=0;
    if(bb.min.x<-458)dx=-458-bb.min.x;else if(bb.max.x>458)dx=458-bb.max.x;
    if(bb.max.y>12)dy=-(bb.max.y-1);
    if(bb.min.y<-3150)dy=-3150-bb.min.y;
    if(dx||dy){Body.translate(b,{x:dx,y:dy});Body.setVelocity(b,{x:dx?0:b.velocity.x,y:dy?Math.min(0,b.velocity.y*.3):b.velocity.y});}
  }
  for(const c of crumbs){const p=c.position;
    if(!isFinite(p.x)||!isFinite(p.y)||Math.abs(p.x)>470||p.y>20||p.y<-3100){Body.setPosition(c,{x:clamp(isFinite(p.x)?p.x:0,-440,440),y:-24});Body.setVelocity(c,{x:0,y:0});}}
}

/* ---------- Particles / effects ---------- */
let particles=[],texts=[],flashes=[],rings=[],fireballs=[],cracks=[],shake=0,flashA=0;
const skinNow=()=>SKINS[S.skin]||SKINS.steel;
const spr={};
function sprite(col){let s=spr[col];if(s)return s;s=document.createElement('canvas');s.width=s.height=32;const g=s.getContext('2d'),gr=g.createRadialGradient(16,16,0,16,16,16);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.5,'rgba(255,255,255,.55)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,32,32);
  g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,32,32);spr[col]=s;return s;}
/* types: 0 dot, 1 chip, 2 spark, 3 smoke, 4 ember, 5 dust, 6 star, 7 grit, 8 shard */
function part(x,y,vx,vy,life,size,col,type,g,f){if(particles.length>300*partMul())return;particles.push({x,y,vx,vy,l:life,m:life,s:size,c:col,t:type||0,g:g===undefined?.12:g,f:f||1,r:Math.random()*6,vr:rnd(-.3,.3)});}
function burst(x,y,col,n,sp,size,type){n=Math.round(n*partMul());for(let i=0;i<n;i++){const a=Math.random()*6.283,s=rnd(.4,1)*sp;part(x,y,Math.cos(a)*s,Math.sin(a)*s-1,rnd(22,46),rnd(.6,1)*size,col,type||0);}}
function ring(x,y,r){rings.push({x,y,r:6,m:r,l:1});}
function flash(a,b,w){const sk=skinNow();flashes.push({x0:a.x,y0:a.y,x1:b.x,y1:b.y,l:1,w,a:sk.a,b:sk.b,st:sk.st});}
function floatText(x,y,t,c){if(texts.length<14)texts.push({x,y,t,c,l:1});}
function addShake(a){shake=Math.min(shake+a,22);}
const along=(p0,p1,t)=>({x:p0.x+(p1.x-p0.x)*t,y:p0.y+(p1.y-p0.y)*t});
function auraAt(x,y,sk){(AURA[sk.au]||AURA.spark)(x,y,sk);}
/* knife: clean chips + skin coloured sparks */
function fxKnife(p0,p1,M){
  const sk=skinNow(),m=partMul(),len=Math.hypot(p1.x-p0.x,p1.y-p0.y),cnt=Math.round(clamp(len/22,2,9)*m),ul=S.settings.quality>=3;
  for(let i=0;i<cnt;i++){const q=along(p0,p1,Math.random());
    part(q.x,q.y,rnd(-2,2),rnd(-3,.5),rnd(20,36),rnd(2,4),M.c,1);
    part(q.x,q.y,rnd(-3,3),rnd(-3.5,.5),rnd(10,20),rnd(1.6,2.6),sk.a,2,.05,.97);
    if(sk.st>0)part(q.x,q.y,rnd(-1.4,1.4),rnd(-2,0),rnd(24,44),rnd(1.5,3),sk.b,4,0,.97);
    if(ul&&Math.random()<.7){part(q.x,q.y,rnd(-.6,.6),rnd(-.8,0),rnd(30,50),rnd(4,8),M.c,5,-.01,.98);part(q.x,q.y,rnd(-2.5,2.5),rnd(-2,0),rnd(14,24),rnd(1,1.6),'#ffffff',7,.06);}
  }
  if(sk.st===2)for(let i=0;i<Math.round(6*m);i++){const q=along(p0,p1,Math.random());auraAt(q.x,q.y,sk);}
}
/* saw: grit / sawdust / hot sparks depending on material */
function fxSaw(p0,p1,M,mat){
  const sk=skinNow(),m=partMul(),cnt=Math.round(4*m),wood=mat==='wood',hard=mat==='metal'||mat==='stone'||mat==='brick',glassy=mat==='glass'||mat==='ice';
  for(let i=0;i<cnt;i++){const q=along(p0,p1,Math.random());
    part(q.x,q.y,rnd(-3,3),rnd(-4,-.5),rnd(24,44),rnd(1.2,2.4),wood?'#e8c48a':glassy?'#ffffff':M.c,7,.14);
    if(hard||Math.random()<.3)part(q.x,q.y,rnd(-5,5),rnd(-5,-1),rnd(10,22),rnd(1.4,2.2),hard?'#ffc857':sk.a,2,.16,.96);
    if(sk.st>0)part(q.x,q.y,rnd(-1.6,1.6),rnd(-2,0),rnd(24,40),rnd(1.4,2.6),sk.b,4,0,.97);
  }
  const q=along(p0,p1,Math.random());part(q.x,q.y,rnd(-.8,.8),rnd(-1.2,-.3),rnd(24,36),rnd(6,11),wood?'#d6b27a':M.c,5,-.01,.98);
  if(sk.st===2)for(let i=0;i<Math.round(4*m);i++){const q2=along(p0,p1,Math.random());auraAt(q2.x,q2.y,sk);}
}
/* laser: glowing embers, smoke, flares */
function fxLaser(p0,p1){
  const sk=skinNow(),m=partMul(),len=Math.hypot(p1.x-p0.x,p1.y-p0.y),cnt=Math.round(clamp(len/16,3,12)*m);
  const hot=sk.st>0?sk.a:'#ff7a3a',hot2=sk.st>0?sk.b:'#ffd08a';
  for(let i=0;i<cnt;i++){const q=along(p0,p1,Math.random());
    part(q.x,q.y,rnd(-1.6,1.6),rnd(-2.4,.4),rnd(26,52),rnd(1.6,3.2),Math.random()<.5?hot:hot2,4,.02,.985);
    if(Math.random()<.5)part(q.x,q.y,rnd(-.5,.5),rnd(-1.6,-.5),rnd(36,60),rnd(7,12),'#4a4f57',3,-.02,.99);
    if(Math.random()<.25)part(q.x,q.y,rnd(-4,4),rnd(-5,-1),rnd(10,20),rnd(1.5,2.2),'#ffffff',2,.14,.97);
  }
  part(p0.x,p0.y,0,0,14,10,hot2,6,0);part(p1.x,p1.y,0,0,14,10,hot2,6,0);
  if(sk.st===2)for(let i=0;i<Math.round(5*m);i++){const q=along(p0,p1,Math.random());auraAt(q.x,q.y,sk);}
}
function fxHammer(cp,mat,n,strong){
  const m=partMul(),M=MATS[mat]||MATS.stone,hard=mat==='stone'||mat==='metal'||mat==='brick'||mat==='gold';
  const base=n?Math.atan2(n.y,n.x):-1.57;
  ring(cp.x,cp.y,strong?62:44);
  for(let i=0;i<Math.round((strong?12:8)*m);i++){const a=base+rnd(-.95,.95),s=rnd(2.5,7);part(cp.x,cp.y,Math.cos(a)*s,Math.sin(a)*s,rnd(24,44),rnd(2.5,5),M.c,1,.22);}
  for(let i=0;i<Math.round(6*m);i++){const a=base+rnd(-1.3,1.3),s=rnd(.8,3);part(cp.x,cp.y,Math.cos(a)*s,Math.sin(a)*s-.4,rnd(26,46),rnd(6,11),M.c,5,.02,.96);}
  if(hard)for(let i=0;i<Math.round(5*m);i++){const a=base+rnd(-1.1,1.1),s=rnd(3,8);part(cp.x,cp.y,Math.cos(a)*s,Math.sin(a)*s,rnd(10,18),rnd(1.4,2.2),'#ffe9a8',2,.15,.95);}
  part(cp.x,cp.y,0,0,10,10,'#ffffff',6,0);
}
function fxShovel(wp,d,mat){
  if(!gate('fxsh',45))return;const m=partMul(),M=MATS[mat]||null;
  for(let i=0;i<Math.round(2*m);i++)part(wp.x+rnd(-14,14),wp.y+rnd(-6,14),d.x*rnd(1,3)+rnd(-.5,.5),d.y*rnd(1,3)-rnd(.2,1),rnd(20,34),rnd(5,9),'#b39a72',5,.02,.97);
  for(let i=0;i<Math.round(2*m);i++)part(wp.x+rnd(-10,10),wp.y+rnd(-4,10),d.x*rnd(1.5,4),d.y*rnd(1.5,4)-rnd(.5,2),rnd(18,32),rnd(2,3.6),M?M.c:'#7b5233',0,.2);
}
function fxBomb(px,py,R){
  const m=partMul();fireballs.push({x:px,y:py,r:20,m:R*.85,l:1});
  for(let i=0;i<Math.round(26*m);i++){const a=Math.random()*6.283,s=rnd(3,11);part(px,py,Math.cos(a)*s,Math.sin(a)*s-1,rnd(20,42),rnd(1.6,3),Math.random()<.5?'#ffd36b':'#ff8a2a',2,.1,.98);}
  for(let i=0;i<Math.round(16*m);i++)part(px+rnd(-20,20),py+rnd(-20,20),rnd(-2,2),rnd(-3,-.5),rnd(50,90),rnd(16,30),'#3b3f46',3,-.02,.98);
  for(let i=0;i<Math.round(14*m);i++){const a=Math.random()*6.283,s=rnd(1,5);part(px,py,Math.cos(a)*s,Math.sin(a)*s-1,rnd(30,60),rnd(2.4,4.4),Math.random()<.5?'#ff7a2a':'#ffcf5a',4,.03,.985);}
  for(let i=0;i<Math.round(12*m);i++){const a=Math.random()*6.283,s=rnd(2,8);part(px,py,Math.cos(a)*s,Math.sin(a)*s-2,rnd(30,60),rnd(3,6),'#5b5148',1,.2);}
  for(let i=0;i<Math.round(8*m);i++){const a=Math.random()*6.283;part(px,py,Math.cos(a)*6,Math.sin(a)*2.2,rnd(26,44),rnd(12,20),'#b8a98a',5,0,.95);}
}
function fxGrab(wp){ring(wp.x,wp.y,26);for(let i=0;i<Math.round(4*partMul());i++)part(wp.x,wp.y,rnd(-1.4,1.4),rnd(-1.6,-.2),rnd(16,26),rnd(3,6),'#e6dcc4',5,0,.96);}
function fxFragile(b,M,mat){
  const m=partMul(),x=b.position.x,y=b.position.y;
  for(let i=0;i<Math.round(10*m);i++)part(x+rnd(-14,14),y+rnd(-14,14),rnd(-3,3),rnd(-4,-.5),rnd(24,44),rnd(3,6),M.c,8,.18);
  for(let i=0;i<Math.round(4*m);i++)part(x+rnd(-12,12),y+rnd(-12,12),0,0,rnd(10,20),rnd(4,7),'#ffffff',6,0);
  if(mat==='ice')for(let i=0;i<Math.round(6*m);i++)part(x+rnd(-14,14),y+rnd(-10,10),rnd(-1.5,1.5),rnd(-2,0),rnd(24,40),rnd(6,11),'#eaf8ff',5,.01,.97);
}

/* ---------- Crumbs ---------- */
let combo=0,comboT=0,comboP=null,chainN=0,chainT=0;
function crumbleArea(pos,area,mk,vel){
  const M=MATS[mk];const n=clamp(Math.round(area/150),1,4);const val=area/100*M.val*bonusMult()/n;
  for(let i=0;i<n;i++){
    if(crumbs.length>=MAX_CRUMBS)collectCrumb(crumbs[0],true);
    const b=Bodies.circle(pos.x+rnd(-8,8),pos.y+rnd(-8,8),5,{restitution:.45,friction:.4,density:.002,frictionAir:.012,sleepThreshold:30,collisionFilter:{category:CAT_CRUMB,mask:CAT_WORLD}});
    b.custom={crumb:1,mat:mk,val};
    Body.setVelocity(b,{x:(vel?vel.x:0)+rnd(-2.5,2.5),y:(vel?vel.y:0)-rnd(1,4)});
    Composite.add(world,b);crumbs.push(b);
  }
  const m=partMul();
  for(let i=0;i<Math.round(3*m);i++){part(pos.x,pos.y,rnd(-1.5,1.5),rnd(-2,-.3),rnd(20,34),rnd(4,8),M.c,5,0,.96);part(pos.x,pos.y,rnd(-2.5,2.5),rnd(-3,-.5),rnd(20,34),rnd(1.6,3),M.c,1);}
  sfx.crumble(mk,area,panX(pos.x));
}
function collectCrumb(b,silent){
  const i=crumbs.indexOf(b);if(i<0)return;crumbs.splice(i,1);Composite.remove(world,b);
  addCoins(b.custom.val);S.stats.crumbs++;
  if(!silent){const now=performance.now();chainN=(now-chainT<300)?chainN+1:0;chainT=now;sfx.coin(chainN,panX(b.position.x));
    combo+=b.custom.val;comboT=now;comboP={x:b.position.x,y:b.position.y-10};
    part(b.position.x,b.position.y,rnd(-1,1),-2,20,3,'#ffd45c',Math.random()<.5?6:4,.05,.97);}
}
function collectAt(wp){const r=Math.max(18,(26+14*S.upg.magnet)/camera.zoom);for(let i=crumbs.length-1;i>=0;i--){const c=crumbs[i];if(Math.hypot(c.position.x-wp.x,c.position.y-wp.y)<r)collectCrumb(c);}}
function collectAll(){let n=0;for(let i=crumbs.length-1;i>=0;i--){collectCrumb(crumbs[i],true);n++;}if(n){sfx.coin(6);sfx.unlock();floatText(camera.x,camera.y-60,tr('all_collected'),'#ffd45c');}}

/* ---------- Cutting ---------- */
let capWarn=0;
function capMsg(){const t=performance.now();if(t-capWarn>2500){capWarn=t;toast(tr('cap'),'warn');}}
function cutBody(b,p,d,L,opts){
  opts=opts||{};const vs=b.vertices,n=vs.length;if(n<3||!b.custom||b.custom.dead)return null;
  const s=[];let pos=0,neg=0;
  for(let i=0;i<n;i++){const v=d.x*(vs[i].y-p.y)-d.y*(vs[i].x-p.x);s.push(v);if(v>.01)pos++;else if(v<-.01)neg++;}
  if(!pos||!neg)return null;
  const A=[],B=[];let tmin=1e9,tmax=-1e9;
  for(let i=0;i<n;i++){
    const j=(i+1)%n,vi=vs[i],vj=vs[j],si=s[i],sj=s[j];
    if(si>=-.01)A.push({x:vi.x,y:vi.y});
    if(si<=.01)B.push({x:vi.x,y:vi.y});
    let ip=null;
    if((si>.01&&sj<-.01)||(si<-.01&&sj>.01)){const t=si/(si-sj);ip={x:vi.x+(vj.x-vi.x)*t,y:vi.y+(vj.y-vi.y)*t};A.push(ip);B.push({x:ip.x,y:ip.y});}
    else if(Math.abs(si)<=.01)ip=vi;
    if(ip){const tt=(ip.x-p.x)*d.x+(ip.y-p.y)*d.y;if(tt<tmin)tmin=tt;if(tt>tmax)tmax=tt;}
  }
  const chord=tmax-tmin;if(chord<4||A.length<3||B.length<3)return null;
  if(Math.min(L,tmax)-Math.max(0,tmin)<chord*.5)return null;
  const c=b.custom,M=MATS[c.mat];
  const info=[[cleanPoly(A),1],[cleanPoly(B),-1]].map(o=>{const v=o[0],ar=v.length>=3?polyArea(v):0;return{v,sg:o[1],ar,tiny:v.length<3||ar<CRUMB_AREA||ar/(perim(v)/2)<5};});
  const keep=info.filter(o=>!o.tiny).length;
  if(pieces.length-1+keep>MAX_PIECES){if(!opts.force){capMsg();return null;}info.forEach(o=>o.tiny=true);}
  const a=b.angle,cs=Math.cos(a),sn=Math.sin(a);
  const tw={x:b.position.x+cs*c.texO.x-sn*c.texO.y,y:b.position.y+sn*c.texO.x+cs*c.texO.y},ta=a+c.texA;
  const bv={x:b.velocity.x,y:b.velocity.y},bw=b.angularVelocity,nx=-d.y,ny=d.x;
  const q0={x:p.x+d.x*tmin,y:p.y+d.y*tmin},q1={x:p.x+d.x*tmax,y:p.y+d.y*tmax};
  const px=b.position.x;removePiece(b);wakeNear(px);
  const kids=[];
  for(const o of info){
    if(o.tiny){if(o.v.length>=3&&o.ar>4)crumbleArea(Vertices.centre(o.v),o.ar,c.mat,bv);continue;}
    const cc=Vertices.centre(o.v);
    const nb=mkPiece(c.mat,o.v,{x:tw.x-cc.x,y:tw.y-cc.y},ta);if(!nb)continue;
    nb.custom.fl=1;if(c.safe)nb.custom.safe=c.safe;
    Body.setVelocity(nb,{x:bv.x+nx*o.sg*1.1,y:bv.y+ny*o.sg*1.1-.6});Body.setAngularVelocity(nb,bw+rnd(-.02,.02));
    kids.push(nb);
  }
  const fx=opts.fx||'knife';
  if(fx!=='none'){
    (fx==='saw'?fxSaw:fx==='laser'?fxLaser:fxKnife)(q0,q1,M,c.mat);
    if(!opts.quiet){const pn=panX((q0.x+q1.x)/2);if(fx==='saw')sfx.saw(c.mat,pn);else sfx.cut(c.mat,c.area,pn);}
    S.stats.cuts++;if(fx==='saw')S.stats.saws++;saveSoon();
  }
  return kids;
}
function cutLine(p,d,L,opts){
  const x1=p.x+d.x*L,y1=p.y+d.y*L;
  const bnd={min:{x:Math.min(p.x,x1)-2,y:Math.min(p.y,y1)-2},max:{x:Math.max(p.x,x1)+2,y:Math.max(p.y,y1)+2}};
  const cand=Query.region(pieces,bnd);let n=0;
  for(const b of cand){if(!b.custom||!b.custom.piece)continue;if(cutBody(b,p,d,L,opts))n++;}
  return n;
}
function shatterBody(b,n,cx,cy){
  let list=[b];
  for(let k=0;k<n;k++){
    const a=Math.random()*Math.PI,d={x:Math.cos(a),y:Math.sin(a)},p={x:cx-d.x*400,y:cy-d.y*400},next=[];
    for(const q of list){if(q.custom.dead)continue;const r=cutBody(q,p,d,800,{force:1,fx:'none',quiet:true});if(r)next.push(...r);else next.push(q);}
    list=next;
  }
  return list;
}

/* ---------- Collision sounds / effects ---------- */
Events.on(engine,'collisionStart',ev=>{
  if(warming)return;const now=performance.now();
  for(const pr of ev.pairs){
    const A=pr.bodyA,B=pr.bodyB;
    const rv=Math.hypot(A.velocity.x-B.velocity.x,A.velocity.y-B.velocity.y);if(rv<2.2)continue;
    const cr=(A.custom&&A.custom.crumb)?A:(B.custom&&B.custom.crumb)?B:null;
    if(cr){sfx.tink(cr.custom.mat,rv,panX(cr.position.x));continue;}
    if(rv<3)continue;
    const ca=A.custom&&A.custom.piece?A:null,cb=B.custom&&B.custom.piece?B:null,pc=ca||cb;if(!pc)continue;
    sfx.impact(pc.custom.mat,rv,panX(pc.position.x));
    if(rv>6){const sp=(pr.collision.supports&&pr.collision.supports[0])||pc.position;
      part(sp.x,sp.y,rnd(-1.2,1.2),rnd(-1.6,-.2),rnd(18,30),rnd(4,8),'#d8c9a8',5,0,.96);
      if(rv>9)for(let i=0;i<Math.min(6,Math.round(rv/3));i++)part(sp.x,sp.y,rnd(-2.5,2.5),rnd(-3,-.5),rnd(16,28),rnd(1.6,3),MATS[pc.custom.mat].c,1);}
    if(rv>15)addShake(Math.min(rv*.25,6));
    for(const q of [ca,cb]){if(!q)continue;const c=q.custom,M=MATS[c.mat];
      if(M.fragile&&!c.dead&&!c.q&&rv>(M.fragile===1?9:13)&&now>(c.safe||0)){c.q=1;fragQ.push(q);}}
  }
});

/* ---------- Tools ---------- */
let tool='knife',gesture=null,drag=null,pinch=null;
const ptrs=new Map(),cdUntil={},cdTotal={},cutStamps=[];
const knifeMax=()=>240+70*S.upg.len,knifeCd=()=>200-24*S.upg.speed;
const ready=t=>performance.now()>=(cdUntil[t]||0);
function setCd(t,ms){cdUntil[t]=performance.now()+ms;cdTotal[t]=ms;}
function rateOk(){const t=performance.now();while(cutStamps.length&&t-cutStamps[0]>1000)cutStamps.shift();if(cutStamps.length>=22)return false;cutStamps.push(t);return true;}
function hitPiece(wp){const f=Query.point(pieces,wp);return f.length?f[f.length-1]:null;}
function clampLen(a,b,m){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy);if(l<=m)return b;return{x:a.x+dx/l*m,y:a.y+dy/l*m};}
/* --- hand tool (glitch-proof) --- */
const clampDrag=wp=>({x:clamp(wp.x,-430,430),y:clamp(wp.y,-1900,-6)});
function startDrag(b,wp){
  Sleeping.set(b,false);
  const off={x:wp.x-b.position.x,y:wp.y-b.position.y},co=Math.cos(-b.angle),si=Math.sin(-b.angle);
  const lo={x:off.x*co-off.y*si,y:off.x*si+off.y*co};
  const con=Constraint.create({pointA:{x:wp.x,y:wp.y},bodyB:b,pointB:off,stiffness:.1,damping:.25,length:0});
  Composite.add(world,con);drag={con,body:b,lo,target:clampDrag(wp)};
}
/* each physics step: limit how far the pull point may be from the piece, so the pull force stays bounded */
function limitDrag(){
  const d=drag,b=d.body,c=Math.cos(b.angle),s=Math.sin(b.angle);
  const ax=b.position.x+d.lo.x*c-d.lo.y*s,ay=b.position.y+d.lo.x*s+d.lo.y*c;
  let dx=d.target.x-ax,dy=d.target.y-ay;const L=Math.hypot(dx,dy);if(L>90){dx*=90/L;dy*=90/L;}
  d.con.pointA={x:ax+dx,y:ay+dy};capVel(b,16);
}
function endDrag(snd){if(drag){const b=drag.body;Composite.remove(world,drag.con);drag=null;capVel(b,20);if(snd===true)sfx.drop();}}
function doKnife(g){
  const dx=g.wc.x-g.w0.x,dy=g.wc.y-g.w0.y,L=Math.hypot(dx,dy);if(L<14)return;
  if(!ready('knife')){sfx.tick();return;}
  if(!rateOk())return;
  const n=cutLine(g.w0,{x:dx/L,y:dy/L},L,{fx:'knife'});
  setCd('knife',n?knifeCd():knifeCd()/2);flash(g.w0,g.wc,n?1:.4);if(n)vib(8);else sfx.swish(panX(g.w0.x));
}
function doLaser(g){
  const dx=g.wc.x-g.w0.x,dy=g.wc.y-g.w0.y,L=Math.hypot(dx,dy);if(L<20)return;
  if(!ready('laser')){sfx.tick();return;}if(!rateOk())return;
  const d={x:dx/L,y:dy/L},p={x:g.w0.x-d.x*3000,y:g.w0.y-d.y*3000};
  setCd('laser',1300-110*S.upg.speed);sfx.laser(panX(g.w0.x));S.stats.lasers++;saveSoon();
  cutLine(p,d,6000,{fx:'laser',quiet:true});flash(p,{x:p.x+d.x*6000,y:p.y+d.y*6000},3);addShake(3);vib(20);
}
function sawMove(g,wp){
  let dx=wp.x-g.ps.x,dy=wp.y-g.ps.y,L=Math.hypot(dx,dy);if(L<30)return;
  if(L>320){g.ps={x:wp.x-dx/L*320,y:wp.y-dy/L*320};dx=wp.x-g.ps.x;dy=wp.y-g.ps.y;L=320;}
  if(!ready('saw')||!rateOk())return;
  const n=cutLine(g.ps,{x:dx/L,y:dy/L},L,{fx:'saw'});
  if(n){setCd('saw',70);flash(g.ps,wp,.7);g.ps=wp;vib(4);}
}
function shovelMove(g,wp){
  const dx=wp.x-g.last.x,dy=wp.y-g.last.y,L=Math.hypot(dx,dy);if(L<.6)return;
  const d={x:dx/L,y:dy/L},k=Math.min(L*.35,3.5),R=36;
  const bnd={min:{x:wp.x-R-60,y:wp.y-R-60},max:{x:wp.x+R+60,y:wp.y+R+60}};
  let hitMat=null,cp0=null;
  for(const b of Query.region(pieces,bnd)){
    if(!b.custom||b.custom.dead)continue;
    const inside=Vertices.contains(b.vertices,wp),cl=inside?null:closestOnPoly(b.vertices,wp);
    if(!inside&&cl.d>R)continue;
    const cp=inside?{x:wp.x,y:wp.y}:{x:cl.x,y:cl.y};
    Sleeping.set(b,false);
    let vx=b.velocity.x+d.x*k,vy=b.velocity.y+d.y*k;const sp=Math.hypot(vx,vy);if(sp>16){vx*=16/sp;vy*=16/sp;}
    Body.setVelocity(b,{x:vx,y:vy});hitMat=b.custom.mat;if(!cp0)cp0=cp;
    digPiece(b,cp,d);
  }
  let cm=null,cc=null;
  for(const c of crumbs)if(Math.hypot(c.position.x-wp.x,c.position.y-wp.y)<R){Sleeping.set(c,false);Body.setVelocity(c,{x:c.velocity.x+d.x*k,y:c.velocity.y+d.y*k-.5});cm=c.custom.mat;cc=c.position;}
  if(hitMat){sfx.shovel(hitMat,panX(cp0.x));fxShovel(cp0,d,hitMat);}else if(cm){sfx.shovel(cm,panX(wp.x));fxShovel(cc,d,cm);}
}
function doHammer(wp){
  if(!ready('hammer')){sfx.tick();return;}
  setCd('hammer',330-25*S.upg.speed);S.stats.hammers++;saveSoon();
  const R=58,bnd={min:{x:wp.x-R,y:wp.y-R},max:{x:wp.x+R,y:wp.y+R}};
  let firstMat=null,cpF=null,nF=null,hits=0,strong=false;
  for(const b of Query.region(pieces,bnd)){
    if(!b.custom||b.custom.dead)continue;
    const inside=Vertices.contains(b.vertices,wp),cl=inside?null:closestOnPoly(b.vertices,wp);
    if(!inside&&cl.d>R)continue;
    const c=b.custom,cp=inside?{x:wp.x,y:wp.y}:{x:cl.x,y:cl.y};
    hits++;if(!firstMat){firstMat=c.mat;cpF=cp;nF=surfNormal(b,cp);}
    if(c.area<2800){const pos={x:b.position.x,y:b.position.y};removePiece(b);wakeNear(pos.x);crumbleArea(pos,c.area,c.mat);strong=true;}
    else{const cx=inside?wp.x:b.position.x,cy=inside?wp.y:b.position.y,mat=c.mat,ar=c.area;
      const kids=shatterBody(b,2,cx,cy);sfx.brk(mat,ar,panX(cx));strong=true;
      for(const k of kids){Sleeping.set(k,false);Body.setVelocity(k,{x:k.velocity.x+rnd(-1,1),y:k.velocity.y+2});
        if(Math.hypot(k.position.x-cp.x,k.position.y-cp.y)<70)crackPiece(k,cp,.9);}}
  }
  if(!hits){
    sfx.hammerMiss(panX(wp.x));addShake(1.2);
    if(wp.y>-18){
      cracks.push({x:wp.x,y:2,l:1,a:Math.random()*6.28,seed:1+Math.floor(Math.random()*1e6)});ring(wp.x,0,44);
      for(let i=0;i<Math.round(8*partMul());i++)part(wp.x,-2,rnd(-3,3),rnd(-3.5,-.8),rnd(24,44),rnd(5,10),'#cdbf9f',5,.03,.96);
      sfx.hammerGround(panX(wp.x));addShake(3);
    }
    return;
  }
  addShake(5);vib(15);sfx.hammer(firstMat,panX(wp.x));fxHammer(cpF,firstMat,nF,strong);
}
function placeBomb(wp){
  if(!ready('bomb')){sfx.tick();return;}
  if(bombs.length>=3){toast(tr('bomb_max'),'warn');return;}
  if(!labMode&&S.coins<BOMB_COST){sfx.error();toast(tr('bomb_coins'),'err');return;}
  if(!labMode)S.coins-=BOMB_COST;S.stats.bombs++;updateCoins();saveSoon();setCd('bomb',1400-100*S.upg.speed);
  const b=Bodies.circle(wp.x,wp.y,15,{restitution:.35,friction:.6,density:.004,collisionFilter:{category:CAT_BLOCK,mask:CAT_BLOCK|CAT_WORLD}});
  b.custom={bomb:1,t0:performance.now(),nb:0};Composite.add(world,b);bombs.push(b);sfx.bombPlace();
}
function explode(b){
  const i=bombs.indexOf(b);if(i>=0)bombs.splice(i,1);Composite.remove(world,b);
  const px=b.position.x,py=b.position.y,R=190;
  sfx.boom(panX(px));addShake(16);flashA=.55;ring(px,py,R);vib(40);fxBomb(px,py,R);
  const targets=pieces.filter(q=>Math.hypot(q.position.x-px,q.position.y-py)<R);
  for(const q of targets){
    if(q.custom.dead)continue;
    const dx=q.position.x-px,dy=q.position.y-py,dist=Math.max(1,Math.hypot(dx,dy)),pw=1-dist/R;
    let list=[q];
    if(dist<R*.75){const mat=q.custom.mat,ar=q.custom.area;list=shatterBody(q,pw>.55?3:2,q.position.x,q.position.y);sfx.brk(mat,ar,panX(px));}
    for(const k of list){Sleeping.set(k,false);Body.setVelocity(k,{x:k.velocity.x+dx/dist*14*pw,y:k.velocity.y+dy/dist*14*pw-4*pw});}
  }
  for(const c of crumbs){const dx=c.position.x-px,dy=c.position.y-py,dist=Math.max(1,Math.hypot(dx,dy));if(dist<R){Sleeping.set(c,false);Body.setVelocity(c,{x:dx/dist*10,y:dy/dist*10-6});}}
  for(const o of bombs)if(Math.hypot(o.position.x-px,o.position.y-py)<R)o.custom.t0=Math.min(o.custom.t0,performance.now()-BOMB_FUSE+120);
}

/* ---------- Input ---------- */
canvas.addEventListener('pointerdown',e=>{
  if(scene!=='game'||paused||duelHold)return;e.preventDefault();audio();
  try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{});}catch(_){}
  try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  const sp={x:e.clientX,y:e.clientY};ptrs.set(e.pointerId,sp);
  if(ptrs.size===2){cancelGesture();const ids=[...ptrs.keys()],a=ptrs.get(ids[0]),b=ptrs.get(ids[1]),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    pinch={a:ids[0],b:ids[1],d0:Math.hypot(a.x-b.x,a.y-b.y),z0:camera.zoom,mw:s2w(mid.x,mid.y)};return;}
  if(ptrs.size>2)return;
  const wp=s2w(sp.x,sp.y);
  gesture={tool,w0:wp,wc:wp,last:wp,ps:wp,sp,lastS:sp,moved:false};
  collectAt(wp);
  if(tool==='hand'){const h=hitPiece(wp);if(h){startDrag(h,wp);sfx.grab();fxGrab(wp);}}
  else if(tool==='hammer')doHammer(wp);
  else if(tool==='bomb')placeBomb(wp);
});
canvas.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;const sp={x:e.clientX,y:e.clientY};ptrs.set(e.pointerId,sp);
  if(pinch&&ptrs.has(pinch.a)&&ptrs.has(pinch.b)){
    const a=ptrs.get(pinch.a),b=ptrs.get(pinch.b),mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
    camera.zoom=clamp(pinch.z0*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(pinch.d0,1),minZoom(),2.2);
    camera.x=pinch.mw.x-(mid.x-W/2)/camera.zoom;camera.y=pinch.mw.y-(mid.y-H/2)/camera.zoom;clampCam();return;}
  if(!gesture||ptrs.size!==1)return;
  const g=gesture,wp=s2w(sp.x,sp.y);
  if(Math.hypot(sp.x-g.sp.x,sp.y-g.sp.y)>6)g.moved=true;
  collectAt(wp);
  if(g.tool==='hand'){if(drag)drag.target=clampDrag(wp);else{camera.x-=(sp.x-g.lastS.x)/camera.zoom;camera.y-=(sp.y-g.lastS.y)/camera.zoom;clampCam();}}
  else if(g.tool==='knife')g.wc=clampLen(g.w0,wp,knifeMax());
  else if(g.tool==='laser')g.wc=wp;
  else if(g.tool==='saw')sawMove(g,wp);
  else if(g.tool==='shovel')shovelMove(g,wp);
  g.last=wp;g.lastS=sp;
});
function cancelGesture(){endDrag();gesture=null;}
function endPtr(e){
  const had=ptrs.has(e.pointerId);ptrs.delete(e.pointerId);
  if(pinch&&(e.pointerId===pinch.a||e.pointerId===pinch.b))pinch=null;
  if(!had)return;
  if(ptrs.size===0&&gesture){const g=gesture;gesture=null;
    if(g.tool==='knife'&&g.moved)doKnife(g);else if(g.tool==='laser'&&g.moved)doLaser(g);endDrag(true);}
}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',e=>{e.preventDefault();const b=s2w(e.clientX,e.clientY);camera.zoom=clamp(camera.zoom*(e.deltaY<0?1.1:.9),minZoom(),2.2);const a=s2w(e.clientX,e.clientY);camera.x+=b.x-a.x;camera.y+=b.y-a.y;clampCam();},{passive:false});

/* ---------- Maps ---------- */
let curMap=null,mapIdx=-1,mode='map',initArea=0,crumbPhase=false,finished=false,groundPat=null;
const bx=(mk,x,yb,w,h)=>mkBlock(mk,x,-yb-h/2,w,h);
function buildHut(){const s=60.8;
  for(let i=0;i<4;i++){bx('wood',-150,.4+i*s,60,60);bx('wood',150,.4+i*s,60,60);}
  bx('wood',0,.4+4*s,400,24);
  for(let i=0;i<3;i++)bx('wood',-60.8+i*60.8,.4+4*s+24.8,60,60);
  for(let i=0;i<2;i++)bx('wood',-30.4+i*60.8,.4+5*s+24.8,60,60);
  bx('wood',0,.4+6*s+24.8,60,60);
  for(let r=0;r<3;r++)for(let i=0;i<3-r;i++)bx('wood',-330+(i-(2-r)/2)*61,.4+r*s,60,60);
  for(let r=0;r<6;r++)bx('wood',330,.4+r*24.8,160,24);
  bx('wood',300,.4+6*24.8,60,60);bx('wood',360,.4+6*24.8,60,60);}
function buildWall(){
  for(let r=0;r<8;r++)for(let c=0;c<6;c++)bx('brick',(c-2.5)*62+(r%2?15:-15),.4+r*30.8,60,30);
  for(const x of [-290,290]){for(let i=0;i<5;i++)bx('stone',x,.4+i*60.8,60,60);bx('brick',x,.4+5*60.8,100,24);}
  for(let r=0;r<3;r++)for(let i=0;i<3-r;i++)bx('brick',(i-(2-r)/2)*62,.4+8*30.8+r*30.8,60,30);}
function buildGlass(){const s=54.8;
  for(let i=0;i<5;i++){bx('glass',-120,.4+i*s,54,54);bx('glass',120,.4+i*s,54,54);}
  bx('glass',0,.4+5*s,300,14);
  for(let i=0;i<3;i++)bx('glass',-60+i*60,.4+5*s+14.8,54,54);
  bx('glass',0,.4+5*s+14.8+s,54,54);
  for(const sx of [-1,1])for(let r=0;r<3;r++)for(let i=0;i<3-r;i++)bx('glass',sx*330+(i-(2-r)/2)*55,.4+r*s,54,54);}
function buildIce(){const s=60.8;
  for(let i=0;i<5;i++){bx('ice',-150,.4+i*s,60,60);bx('ice',150,.4+i*s,60,60);}
  bx('ice',0,.4+5*s,400,36);
  for(let i=0;i<3;i++)mkNgon('ice',-90+i*90,-(.4+5*s+36+38),42,3);
  mkNgon('ice',-40,-34,32,16);mkNgon('ice',40,-34,32,16);
  for(const sx of [-1,1])for(let r=0;r<3;r++)for(let i=0;i<3-r;i++)bx('ice',sx*360+(i-(2-r)/2)*61,.4+r*s,60,60);}
function buildSteel(){
  for(const x of [-200,0,200])bx('metal',x,.4,34,180);
  bx('metal',0,181,480,26);
  for(const x of [-100,100])bx('metal',x,207.6,34,140);
  bx('metal',0,348.4,260,26);
  for(const x of [-60,60])bx('stone',x,375,60,60);
  mkNgon('metal',-350,-32,30,14);mkNgon('metal',350,-32,30,14);
  bx('stone',-350,64,100,30);bx('stone',350,64,100,30);}
const MAPS=[
 {id:'hut',sky:['#8fd0f2','#e2f4fb'],hill:['#86c774','#63ab58'],grass:'#6bbf4a',dirt:['#7b5233','#5f3d25'],reward:150,build:buildHut},
 {id:'wall',sky:['#f2a978','#fbe3c4'],hill:['#a7846a','#8a6a54'],grass:'#8fb650',dirt:['#7a4b3a','#5b382c'],reward:300,build:buildWall},
 {id:'glass',sky:['#7fc7e6','#d5f0fa'],hill:['#7fbf9b','#5fa583'],grass:'#5fbf7a',dirt:['#6a5a4a','#514437'],reward:450,build:buildGlass},
 {id:'ice',sky:['#b5d8f0','#f0f8ff'],hill:['#e8f3fb','#c9def0'],grass:'#f4fbff',dirt:['#7f93a6','#647688'],reward:700,build:buildIce},
 {id:'steel',sky:['#7b8794','#c5ced8'],hill:['#6c7784','#565f6b'],grass:'#8a939c',dirt:['#4a4f57','#383c43'],reward:1000,build:buildSteel}
];
const mapName=m=>tr(m.id+'_n');
const FIELD={id:'field',sky:['#8fd0f2','#e2f4fb'],hill:['#86c774','#63ab58'],grass:'#6bbf4a',dirt:['#7b5233','#5f3d25'],build(){}};
function buildSky(){skyG=ctx.createLinearGradient(0,0,0,H);const m=curMap||FIELD;skyG.addColorStop(0,m.sky[0]);skyG.addColorStop(1,m.sky[1]);}
function buildGroundPat(m){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=rng(4);g.fillStyle=m.dirt[0];g.fillRect(0,0,64,64);
  for(let i=0;i<26;i++){g.fillStyle=m.dirt[1];g.beginPath();g.arc(r()*64,r()*64,1.5+r()*3,0,6.3);g.fill();}groundPat=ctx.createPattern(c,'repeat');}
function clearWorld(){
  endDrag();for(const b of pieces)Composite.remove(world,b);for(const b of crumbs)Composite.remove(world,b);for(const b of bombs)Composite.remove(world,b);
  pieces=[];crumbs=[];bombs=[];fragQ=[];particles=[];texts=[];flashes=[];rings=[];fireballs=[];cracks=[];
}
function loadMap(idx){
  clearWorld();mapIdx=idx;curMap=idx<0?FIELD:MAPS[idx];mode=idx<0?'sandbox':'map';
  warming=true;curMap.build();
  for(let i=0;i<100;i++)Engine.update(engine,STEP);
  for(const b of pieces){Body.setVelocity(b,{x:0,y:0});Body.setAngularVelocity(b,0);Sleeping.set(b,true);}
  warming=false;
  initArea=0;for(const b of pieces)initArea+=b.custom.area;
  crumbPhase=false;finished=false;fitCamera();buildSky();buildGroundPat(curMap);
  $('pg').style.display=mode==='map'?'block':'none';
}
function completeMap(){
  if(mode==='duel'){finished=true;duelFinished();return;}
  finished=true;const m=curMap,first=!S.mapsDone[m.id];S.mapsDone[m.id]=1;
  if(first)addCoins(m.reward);else updateCoins();save();sfx.unlock();vib(60);
  const next=MAPS[mapIdx+1];
  $('cIcon').innerHTML=svg('star');
  $('cTxt').innerHTML=tr('cleared_txt',mapName(m))+'<br>'+(first?'<b style="color:#ffd45c">'+tr('reward',m.reward)+'</b>':tr('already'))+(first&&next?'<br><b>'+tr('newmap',mapName(next))+'</b>':'');
  $('cNext').style.display=next?'flex':'none';
  $('cNext').innerHTML=svg('play')+' '+tr('next');$('cMenu').innerHTML=svg('home')+' '+tr('menu_btn');
  openOverlay('complete');
}
function crumbAll(){for(const b of pieces.slice()){const pos={x:b.position.x,y:b.position.y};const c=b.custom;removePiece(b);crumbleArea(pos,c.area,c.mat);}}

/* ---------- Game loop ---------- */
let scene='menu',overlay=null,paused=true,acc=0,lastT=performance.now(),progT=0,autoT=0,msT=1.5;
function updateProgress(dt){
  progT-=dt;if(progT>0)return;progT=.25;
  let rem=0;for(const b of pieces)rem+=b.custom.area;
  if(mode==='map'||mode==='duel'){
    const pr=initArea>0?clamp(1-rem/initArea,0,1):0;
    $('pgFill').style.width=(pr*100)+'%';
    if(!crumbPhase&&!finished&&pr>=.92){crumbPhase=true;crumbAll();toast(tr('crumbled'),'ok');sfx.unlock();}
    $('pgTxt').textContent=crumbPhase?tr('collect_n',crumbs.length):tr('progress',Math.floor(pr*100));
    if(crumbPhase&&!finished&&crumbs.length===0&&pieces.length===0)completeMap();
  }
  $('btnCollect').style.display=(crumbs.length>0&&(crumbPhase||mode==='sandbox'))?'flex':'none';
}
function gameTick(dt,now){
  acc+=dt*1000*tScale;let n=0;
  while(acc>=STEP&&n<3){if(drag)limitDrag();Engine.update(engine,STEP);acc-=STEP;n++;}
  if(n===3)acc=0;
  sanitize();
  if(fragQ.length){const q=fragQ;fragQ=[];for(const b of q){if(b.custom.dead)continue;const M=MATS[b.custom.mat],mat=b.custom.mat;
    fxFragile(b,M,mat);sfx.shatter(mat,panX(b.position.x));
    const kids=shatterBody(b,b.custom.area>5000?3:2,b.position.x,b.position.y);for(const k of kids)k.custom.safe=now+700;}}
  for(let i=bombs.length-1;i>=0;i--){const b=bombs[i],t=now-b.custom.t0;if(t>=BOMB_FUSE){explode(b);continue;}
    const fr=t/BOMB_FUSE;sfx.fuse();if(now>=b.custom.nb){sfx.beep(fr);b.custom.nb=now+320-250*fr;}
    if(Math.random()<.6)part(b.position.x+2,b.position.y-18,rnd(-.6,.6),rnd(-2,-.6),14,2,'#ffb74d',2,.05);}
  for(let i=pieces.length-1;i>=0;i--){const b=pieces[i];if(b.position.y>1500||Math.abs(b.position.x)>800){const c=b.custom,pos={x:b.position.x,y:-40};removePiece(b);crumbleArea(pos,c.area,c.mat);}}
  if(S.upg.auto>0&&crumbs.length){autoT+=dt;if(autoT>=3.6-.55*S.upg.auto){autoT=0;collectCrumb(crumbs[0]);}}
  if(combo>0&&now-comboT>220){floatText(comboP.x,comboP.y,'+'+Math.max(1,Math.round(combo)),'#ffd45c');combo=0;}
  const k=dt*60;
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.vy+=p.g*k;if(p.f!==1){const ff=Math.pow(p.f,k);p.vx*=ff;p.vy*=ff;}p.x+=p.vx*k;p.y+=p.vy*k;p.r+=p.vr*k;p.l-=k;if(p.l<=0)particles.splice(i,1);}
  for(let i=texts.length-1;i>=0;i--){const t=texts[i];t.y-=.7*k;t.l-=.018*k;if(t.l<=0)texts.splice(i,1);}
  for(let i=flashes.length-1;i>=0;i--){flashes[i].l-=.09*k;if(flashes[i].l<=0)flashes.splice(i,1);}
  for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.r+=(r.m-r.r)*.18*k+2;r.l-=.06*k;if(r.l<=0)rings.splice(i,1);}
  for(let i=fireballs.length-1;i>=0;i--){const f=fireballs[i];f.r+=(f.m-f.r)*.16*k;f.l-=.045*k;if(f.l<=0)fireballs.splice(i,1);}
  for(let i=cracks.length-1;i>=0;i--){cracks[i].l-=.05*k;if(cracks[i].l<=0)cracks.splice(i,1);}
  for(const b of pieces)if(b.custom.fl>0)b.custom.fl=Math.max(0,b.custom.fl-.09*k);
  shake*=.88;if(shake<.3)shake=0;if(flashA>0)flashA-=.03*k;
  msT-=dt;if(msT<=0){msT=1.5;checkMs();}
  updateProgress(dt);
  for(const t of TOOL_ORDER){const el=cdEls[t];if(!el)continue;const cd=(cdUntil[t]||0)-now;el.style.height=cd>0?Math.min(100,cd/(cdTotal[t]||1)*100)+'%':'0';}
}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(now-lastT)/1000);lastT=now;
  if(scene!=='game'||paused)return;
  try{gameTick(dt,now);render(now);}catch(err){console.error(err);}
}

/* ---------- Rendering ---------- */
const clouds=[];for(let i=0;i<6;i++)clouds.push({x:Math.random()*1200,y:30+Math.random()*130,s:.6+Math.random()*.8,v:.08+Math.random()*.12});
const motes=[];for(let i=0;i<34;i++)motes.push({x:Math.random(),y:Math.random(),z:.3+Math.random()*.9,p:Math.random()*6});
function hills(col,base,amp,fq,par){
  ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<=W+30;x+=30)ctx.lineTo(x,base+Math.sin((x+camera.x*par)*fq)*amp+Math.sin((x+camera.x*par)*fq*2.3)*amp*.4);
  ctx.lineTo(W,H);ctx.closePath();ctx.fill();
}
function drawBG(q){
  ctx.fillStyle=skyG;ctx.fillRect(0,0,W,H);
  if(q>=3){const g=ctx.createRadialGradient(W*.82,H*.14,0,W*.82,H*.14,Math.max(W,H)*.55);g.addColorStop(0,'rgba(255,244,205,.55)');g.addColorStop(.4,'rgba(255,230,170,.16)');g.addColorStop(1,'rgba(255,230,170,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
  ctx.fillStyle='rgba(255,255,255,.75)';
  for(const c of clouds){c.x+=c.v;if(c.x>W+120)c.x=-120;const w=90*c.s,h=22*c.s;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(c.x,c.y,w,h,h/2):ctx.rect(c.x,c.y,w,h);ctx.fill();
    ctx.beginPath();ctx.roundRect?ctx.roundRect(c.x+w*.2,c.y-h*.6,w*.5,h,h/2):ctx.rect(c.x+w*.2,c.y-h*.6,w*.5,h);ctx.fill();}
  const gy=H/2+(0-camera.y)*camera.zoom;
  hills(curMap.hill[1],gy-70*camera.zoom,26*camera.zoom,.006,.15);
  hills(curMap.hill[0],gy-32*camera.zoom,20*camera.zoom,.009,.35);
  if(q>=3){ctx.fillStyle='#ffffff';for(const m of motes){m.p+=.01;const sx=((m.x*W-camera.x*m.z*.25+Math.sin(m.p)*14)%W+W)%W,sy=((m.y*H-m.p*6*m.z)%H+H)%H;
    ctx.globalAlpha=.3+.2*Math.sin(m.p*2+m.x*9);ctx.beginPath();ctx.arc(sx,sy,1+m.z*1.6,0,6.3);ctx.fill();}ctx.globalAlpha=1;}
  if(curMap.bg)curMap.bg(q);
}
function drawGround(vb){
  ctx.fillStyle=groundPat;ctx.fillRect(vb.x0-20,0,vb.x1-vb.x0+40,vb.y1+40);
  ctx.fillStyle=curMap.grass;ctx.fillRect(vb.x0-20,0,vb.x1-vb.x0+40,14);
  ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(vb.x0-20,14,vb.x1-vb.x0+40,4);
  ctx.fillStyle=curMap.grass;const st=22;
  for(let x=Math.floor(vb.x0/st)*st;x<vb.x1+st;x+=st){const h=5+Math.abs(Math.sin(x*.7))*5;ctx.beginPath();ctx.moveTo(x,1);ctx.lineTo(x+4,-h);ctx.lineTo(x+8,1);ctx.fill();}
  ctx.fillStyle='#0004';ctx.fillRect(-540,-3000,80,3060);ctx.fillRect(460,-3000,80,3060);
  ctx.fillStyle=curMap.dirt[1];ctx.fillRect(-540,-3000,74,3060);ctx.fillRect(466,-3000,74,3060);
}
function polyPath(vs,ox,oy){ctx.beginPath();ctx.moveTo(vs[0].x+ox,vs[0].y+oy);for(let i=1;i<vs.length;i++)ctx.lineTo(vs[i].x+ox,vs[i].y+oy);ctx.closePath();}
/* motion blur: faint copies trailing behind fast pieces */
function ghosts(b){
  const vx=b.velocity.x,vy=b.velocity.y,sp=Math.hypot(vx,vy);if(sp<4.5)return;
  const n=S.settings.quality>=3?4:2,vs=b.vertices,a0=Math.min(.5,sp/40),M=MATS[b.custom.mat];
  ctx.fillStyle=M.c;
  for(let i=1;i<=n;i++){ctx.globalAlpha=a0*(1-(i-1)/n)*.7;polyPath(vs,-vx*i*1.15,-vy*i*1.15);ctx.fill();}
  ctx.globalAlpha=1;
}
function drawPiece(b,q){
  const c=b.custom,M=MATS[c.mat],vs=b.vertices;
  polyPath(vs,0,0);
  ctx.fillStyle=M.c;ctx.fill();
  ctx.save();ctx.clip();
  if(q>0){ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);ctx.translate(c.texO.x,c.texO.y);ctx.rotate(c.texA);ctx.fillStyle=M.pat;ctx.fillRect(-320,-320,640,640);ctx.restore();}
  if(q>=2){const bb=b.bounds,g=ctx.createLinearGradient(0,bb.min.y,0,bb.max.y);g.addColorStop(0,'rgba(255,255,255,.24)');g.addColorStop(.45,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(0,0,0,.26)');ctx.fillStyle=g;ctx.fillRect(bb.min.x-2,bb.min.y-2,bb.max.x-bb.min.x+4,bb.max.y-bb.min.y+4);}
  if(c.dec&&c.dec.length)drawDecals(b,c,M);
  ctx.lineJoin='round';ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=8;polyPath(vs,0,0);ctx.stroke();
  if(c.fl>0){ctx.fillStyle='rgba(255,255,255,'+c.fl*.65+')';polyPath(vs,0,0);ctx.fill();}
  ctx.restore();
  ctx.lineWidth=2.4;ctx.strokeStyle=M.d;polyPath(vs,0,0);ctx.stroke();
}
function drawBomb(b,now){
  const t=(now-b.custom.t0)/BOMB_FUSE,bl=Math.sin(now/(70-45*t))>0;
  ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
  ctx.fillStyle='#2b313b';ctx.beginPath();ctx.arc(0,0,15,0,6.3);ctx.fill();ctx.strokeStyle='#0d1015';ctx.lineWidth=2.5;ctx.stroke();
  ctx.fillStyle=bl?'#ff4a3a':'#7a1f18';ctx.beginPath();ctx.arc(0,0,5,0,6.3);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(-6,-6,4,0,6.3);ctx.fill();
  ctx.strokeStyle='#caa15a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-15);ctx.quadraticCurveTo(6,-22,3,-27);ctx.stroke();
  ctx.restore();
}
function strokeLine(c,f){c.beginPath();c.moveTo(f.x0,f.y0);c.lineTo(f.x1,f.y1);c.stroke();}
function drawFlashes(c,gs,bloom){
  c.lineCap='round';
  for(const f of flashes){
    if(bloom){c.globalAlpha=Math.max(0,f.l)*(f.st?.95:.5);c.strokeStyle=f.b;c.lineWidth=(8+7*f.w)*f.l*gs*.6;strokeLine(c,f);continue;}
    if(f.st===0){const g=c.createLinearGradient(f.x0,f.y0,f.x1,f.y1);g.addColorStop(0,f.a);g.addColorStop(1,f.b);c.globalAlpha=Math.max(0,f.l);c.strokeStyle=g;c.lineWidth=(3+3*f.w)*f.l;strokeLine(c,f);}
    else{c.globalAlpha=Math.max(0,f.l)*.75;c.strokeStyle=f.b;c.lineWidth=(6+4*f.w)*f.l;strokeLine(c,f);c.globalAlpha=Math.max(0,f.l);c.strokeStyle='#ffffff';c.lineWidth=(2+1.6*f.w)*f.l;strokeLine(c,f);}
  }
  c.globalAlpha=1;
}
function drawFireballs(c,gs,bloom){
  for(const f of fireballs){const r=Math.max(1,f.r*(bloom?gs:1)),l=Math.max(0,f.l);
    const g=c.createRadialGradient(f.x,f.y,0,f.x,f.y,r);g.addColorStop(0,'rgba(255,247,214,'+Math.min(1,l*1.1)+')');g.addColorStop(.35,'rgba(255,176,46,'+l*.9+')');g.addColorStop(.7,'rgba(230,80,30,'+l*.5+')');g.addColorStop(1,'rgba(230,80,30,0)');
    c.fillStyle=g;c.beginPath();c.arc(f.x,f.y,r,0,6.3);c.fill();}
}
function drawRings(c,bloom){for(const r of rings){c.globalAlpha=Math.max(0,r.l);c.strokeStyle='#ffffff';c.lineWidth=5*r.l*(bloom?1.8:1);c.beginPath();c.arc(r.x,r.y,r.r,0,6.3);c.stroke();}c.globalAlpha=1;}
function drawCracks(c){
  for(const k of cracks){c.globalAlpha=Math.max(0,k.l);c.strokeStyle='rgba(20,15,10,.85)';c.lineWidth=2.4;c.lineCap='round';c.beginPath();const r=rng(k.seed);
    for(let i=0;i<7;i++){let a=k.a+i*.9+r()*.5,x=k.x,y=k.y;c.moveTo(x,y);const n=3+Math.floor(r()*3);for(let j=0;j<n;j++){a+=r()*.7-.35;const l=8+r()*14;x+=Math.cos(a)*l;y+=Math.sin(a)*l;c.lineTo(x,y);}}
    c.stroke();}
  c.globalAlpha=1;
}
function drawParticles(c,glow,gs){
  for(const p of particles){const t=p.t,isG=(t===2||t===4||t===6);if(isG!==glow)continue;
    const a=p.l/p.m;c.globalAlpha=Math.max(0,Math.min(1,a*1.4));
    switch(t){
      case 0:c.fillStyle=p.c;c.beginPath();c.arc(p.x,p.y,p.s,0,6.3);c.fill();break;
      case 1:c.fillStyle=p.c;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);c.restore();break;
      case 2:c.strokeStyle=p.c;c.lineWidth=1.6*gs;c.lineCap='round';c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*2.6,p.y-p.vy*2.6);c.stroke();break;
      case 3:{const s=p.s*(1+1.8*(1-a));c.globalAlpha*=.5;c.drawImage(sprite(p.c),p.x-s,p.y-s,s*2,s*2);break;}
      case 4:{const s=p.s*(.5+a*.7)*gs*1.6;c.drawImage(sprite(p.c),p.x-s,p.y-s,s*2,s*2);break;}
      case 5:{const s=p.s*(1+.9*(1-a));c.globalAlpha*=.55;c.drawImage(sprite(p.c),p.x-s,p.y-s,s*2,s*2);break;}
      case 6:{const s=p.s*2.4*gs*Math.sin(Math.min(1,a)*3.14);c.fillStyle=p.c;c.beginPath();c.moveTo(p.x,p.y-s);c.lineTo(p.x+s*.2,p.y-s*.2);c.lineTo(p.x+s,p.y);c.lineTo(p.x+s*.2,p.y+s*.2);c.lineTo(p.x,p.y+s);c.lineTo(p.x-s*.2,p.y+s*.2);c.lineTo(p.x-s,p.y);c.lineTo(p.x-s*.2,p.y-s*.2);c.closePath();c.fill();break;}
      case 7:c.fillStyle=p.c;c.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);break;
      case 8:{c.fillStyle=p.c;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.beginPath();c.moveTo(0,-p.s);c.lineTo(p.s*.8,p.s*.7);c.lineTo(-p.s*.8,p.s*.7);c.closePath();c.fill();c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=1;c.stroke();c.restore();break;}
    }
  }
  c.globalAlpha=1;
}
function render(now){
  const set=S.settings,q=set.quality;
  ctx.save();
  if(shake>.4)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));
  drawBG(q);
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);
  const vb={x0:camera.x-W/2/camera.zoom,x1:camera.x+W/2/camera.zoom,y0:camera.y-H/2/camera.zoom,y1:camera.y+H/2/camera.zoom};
  drawGround(vb);
  const vis=[];for(const b of pieces){const bb=b.bounds;if(bb.max.x<vb.x0-40||bb.min.x>vb.x1+40||bb.max.y<vb.y0-40||bb.min.y>vb.y1+40)continue;vis.push(b);}
  if(q>=2){ctx.fillStyle='rgba(0,0,0,.15)';for(const b of vis){polyPath(b.vertices,5,7);ctx.fill();if(q>=3){polyPath(b.vertices,9,12);ctx.globalAlpha=.5;ctx.fill();ctx.globalAlpha=1;}}}
  for(const b of vis){if(set.blur&&q>=1)ghosts(b);drawPiece(b,q);}
  if(drag){polyPath(drag.body.vertices,0,0);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=3.5;ctx.lineJoin='round';ctx.stroke();}
  for(const b of bombs)drawBomb(b,now);
  for(const c of crumbs){const M=MATS[c.custom.mat];
    if(set.blur&&q>=1){const sp=Math.hypot(c.velocity.x,c.velocity.y);if(sp>5){ctx.strokeStyle=M.c;ctx.globalAlpha=Math.min(.6,sp/16);ctx.lineWidth=7;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(c.position.x,c.position.y);ctx.lineTo(c.position.x-c.velocity.x*2.2,c.position.y-c.velocity.y*2.2);ctx.stroke();ctx.globalAlpha=1;}}
    ctx.fillStyle=M.c;ctx.beginPath();ctx.arc(c.position.x,c.position.y,5,0,6.3);ctx.fill();ctx.strokeStyle=M.d;ctx.lineWidth=1.6;ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(c.position.x-2.5,c.position.y-2.5,2,2);}
  drawCracks(ctx);
  drawFlashes(ctx,1,false);drawFireballs(ctx,1,false);drawRings(ctx,false);
  drawParticles(ctx,false,1);drawParticles(ctx,true,1);
  ctx.font='900 16px system-ui,sans-serif';ctx.textAlign='center';
  for(const t of texts){ctx.globalAlpha=Math.max(0,t.l);ctx.lineWidth=4;ctx.strokeStyle='#000a';ctx.strokeText(t.t,t.x,t.y);ctx.fillStyle=t.c;ctx.fillText(t.t,t.x,t.y);}
  ctx.globalAlpha=1;
  ctx.restore();
  const g=gesture,sk=skinNow();
  if(g&&(g.tool==='knife'||g.tool==='laser')&&g.moved){
    const rd=ready(g.tool);let a=w2s(g.w0.x,g.w0.y),b=w2s(g.wc.x,g.wc.y);
    if(g.tool==='laser'){const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;a={x:a.x-dx/l*3000,y:a.y-dy/l*3000};b={x:b.x+dx/l*3000,y:b.y+dy/l*3000};}
    ctx.save();ctx.globalAlpha=rd?1:.4;ctx.strokeStyle=sk.a;ctx.lineWidth=3;ctx.setLineDash([12,9]);ctx.lineCap='round';
    if(sk.st>0&&q>=2){ctx.shadowColor=sk.b;ctx.shadowBlur=14;}
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle=sk.b;ctx.beginPath();ctx.arc(b.x,b.y,6,0,6.3);ctx.fill();ctx.restore();
  }
  if(flashA>0){ctx.fillStyle='rgba(255,255,255,'+Math.min(flashA,.7)+')';ctx.fillRect(0,0,W,H);}
  ctx.restore();
  postFx();
}
/* ---------- Shaders (post processing) ---------- */
function hasGlow(){if(flashes.length||fireballs.length||rings.length)return true;for(const p of particles)if(p.t===2||p.t===4||p.t===6)return true;return false;}
function postFx(){
  const sh=S.settings.shader;if(!sh)return;
  if((sh===1||sh===2)&&hasGlow()){
    const g=gl.g,w=gl.c.width,h=gl.c.height;
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;g.clearRect(0,0,w,h);
    const k=camera.zoom*w/W;g.setTransform(k,0,0,k,w/2,h/2);g.translate(-camera.x,-camera.y);
    g.globalCompositeOperation='lighter';
    drawFlashes(g,2.2,true);drawFireballs(g,1.6,true);drawRings(g,true);drawParticles(g,true,2.2);
    g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.globalAlpha=1;
    const g2=gl.g2;g2.clearRect(0,0,gl.c2.width,gl.c2.height);g2.drawImage(gl.c,0,0,gl.c2.width,gl.c2.height);
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.85;ctx.drawImage(gl.c,0,0,W,H);ctx.globalAlpha=1;ctx.drawImage(gl.c2,0,0,W,H);ctx.restore();
  }
  if(sh===2){
    ctx.save();ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=.6;ctx.fillStyle=grade;ctx.fillRect(0,0,W,H);ctx.restore();
    ctx.save();ctx.translate(rnd(0,128),rnd(0,128));ctx.globalAlpha=.06;ctx.fillStyle=grainPat;ctx.fillRect(-128,-128,W+256,H+256);ctx.restore();
  }
  if(sh===3){ctx.save();ctx.fillStyle=scanPat;ctx.fillRect(0,0,W,H);ctx.restore();}
  ctx.save();ctx.globalAlpha=sh===1?.5:1;ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);ctx.restore();
}
/* ======================================================================
   PART 1 – new texts (English + German; other languages fall back to English)
   ====================================================================== */
Object.assign(D,{
"accept": [
"Accept",
"Annehmen"
],
"decline": [
"Decline",
"Ablehnen"
],
"cancel": [
"Cancel",
"Abbrechen"
],
"ok": [
"OK",
"OK"
],
"close": [
"Close",
"Schließen"
],
"remove": [
"Remove",
"Entfernen"
],
"retry": [
"Retry",
"Erneut versuchen"
],
"save_btn": [
"Save",
"Speichern"
],
"add": [
"Add",
"Hinzufügen"
],
"loading": [
"Loading …",
"Lädt …"
],
"e_later": [
"Please try again later.",
"Bitte versuche es später erneut."
],
"e_offline": [
"No connection to the server.",
"Keine Verbindung zum Server."
],
"e_poor": [
"You don't have enough coins.",
"Du hast nicht genug Münzen."
],
"e_server": [
"Something went wrong. Please try again.",
"Etwas ist schiefgelaufen. Bitte versuche es erneut."
],
"e_full": [
"All 100 player slots are taken.",
"Alle 100 Spielerplätze sind vergeben."
],
"e_slow": [
"Too many attempts – wait a moment.",
"Zu viele Versuche – warte einen Moment."
],
"e_friend_poor": [
"Your friend doesn't have enough coins.",
"Dein Freund hat nicht genug Münzen."
],
"e_friend_busy": [
"Your friend is in another duel.",
"Dein Freund ist in einem anderen Duell."
],
"e_friend_offline": [
"Your friend is offline.",
"Dein Freund ist offline."
],
"e_busy": [
"You are already in a duel.",
"Du bist schon in einem Duell."
],
"e_notfriends": [
"You can only challenge friends.",
"Du kannst nur Freunde herausfordern."
],
"e_stake": [
"The minimum stake is 10 coins.",
"Der Mindesteinsatz beträgt 10 Münzen."
],
"e_pin_fmt": [
"The PIN must have 4 digits.",
"Die PIN muss 4 Ziffern haben."
],
"show_pw": [
"Show password",
"Passwort anzeigen"
],
"session_over": [
"Session ended – please log in again.",
"Sitzung beendet – bitte melde dich neu an."
],
"need_account": [
"Create an account to use friends and duels.",
"Erstelle ein Konto, um Freunde und Duelle zu nutzen."
],
"login_note": [
"Accounts need internet. As a guest you play offline.",
"Konten brauchen Internet. Als Gast spielst du offline."
],
"s_priv_t": [
"Schnittwerk collects no personal data and shows no ads. As a guest you play fully offline. Accounts, friends and duels use the game server and your save is then stored there too.",
"Schnittwerk sammelt keine persönlichen Daten und zeigt keine Werbung. Als Gast spielst du komplett offline. Konten, Freunde und Duelle nutzen den Spielserver, dein Spielstand wird dann auch dort gespeichert."
],
"welcome_t": [
"Welcome!",
"Willkommen!"
],
"welcome_id": [
"You are player #{0}. This number is yours – there are only 100.",
"Du bist Spieler #{0}. Diese Nummer gehört dir – es gibt nur 100."
],
"lets_go": [
"Let's go",
"Los geht’s"
],
"logout_anyway": [
"Log out without a PIN? Anyone with your password could then log in.",
"Ohne PIN abmelden? Jeder mit deinem Passwort könnte sich dann anmelden."
],
"pin_secure_t": [
"Secure your account?",
"Konto sichern?"
],
"pin_secure_x": [
"Set a 4-digit PIN. It is needed to log in and to change your password.",
"Lege eine 4-stellige PIN fest. Sie wird beim Anmelden und beim Ändern des Passworts benötigt."
],
"pin_later": [
"Not now",
"Später"
],
"pin_set": [
"Set PIN",
"PIN festlegen"
],
"pin_change": [
"Change PIN",
"PIN ändern"
],
"pin_remove": [
"Remove PIN",
"PIN entfernen"
],
"pin_need_pw": [
"Enter your password to set a PIN.",
"Gib dein Passwort ein, um eine PIN festzulegen."
],
"pin_new": [
"New PIN",
"Neue PIN"
],
"pin_new_sub": [
"Choose 4 digits.",
"Wähle 4 Ziffern."
],
"pin_again": [
"Repeat PIN",
"PIN wiederholen"
],
"pin_again_sub": [
"Enter the same 4 digits again.",
"Gib die 4 Ziffern noch einmal ein."
],
"pin_mismatch": [
"The PINs don't match.",
"Die PINs stimmen nicht überein."
],
"pin_saved": [
"PIN saved.",
"PIN gespeichert."
],
"pin_removed": [
"PIN removed.",
"PIN entfernt."
],
"pin_enter": [
"Enter PIN",
"PIN eingeben"
],
"pin_enter_sub": [
"Enter your 4-digit PIN.",
"Gib deine 4-stellige PIN ein."
],
"pin_login_sub": [
"This account is protected by a PIN.",
"Dieses Konto ist mit einer PIN geschützt."
],
"pin_left": [
"Wrong PIN – {0} tries left.",
"Falsche PIN – noch {0} Versuche."
],
"locked_t": [
"Locked",
"Gesperrt"
],
"locked_min": [
"Try again in about {0} min.",
"Versuche es in etwa {0} Min. erneut."
],
"pw_change": [
"Change password",
"Passwort ändern"
],
"pw_old": [
"Current password",
"Aktuelles Passwort"
],
"pw_new": [
"New password",
"Neues Passwort"
],
"pw_new2": [
"Repeat new password",
"Neues Passwort wiederholen"
],
"pw_mismatch": [
"The passwords don't match.",
"Die Passwörter stimmen nicht überein."
],
"pw_changed": [
"Password changed.",
"Passwort geändert."
],
"s_account": [
"Account",
"Konto"
],
"s_server": [
"Server",
"Server"
],
"srv_hint": [
"Address of the game server (needed when you open the game as a file). Leave empty to use the page's own server.",
"Adresse des Spielservers (nötig, wenn du das Spiel als Datei öffnest). Leer lassen, um den Server der Seite zu nutzen."
],
"srv_bad": [
"The address must start with http:// or https://",
"Die Adresse muss mit http:// oder https:// beginnen."
],
"srv_ok": [
"Server reached.",
"Server erreicht."
],
"srv_fail": [
"Server not reachable.",
"Server nicht erreichbar."
],
"net_online": [
"Online",
"Online"
],
"net_offline": [
"Offline – server not reachable",
"Offline – Server nicht erreichbar"
],
"net_off": [
"Offline mode (no server set)",
"Offline-Modus (kein Server eingestellt)"
],
"guest_note": [
"Guest – playing offline on this device",
"Gast – spielt offline auf diesem Gerät"
],
"owner_tag": [
"Owner",
"Owner"
],
"bio_edit": [
"Edit bio",
"Bio bearbeiten"
],
"bio_empty": [
"No bio yet.",
"Noch keine Bio."
],
"bio_ph": [
"Write something about yourself …",
"Schreib etwas über dich …"
],
"bio_saved": [
"Bio saved.",
"Bio gespeichert."
],
"no_title": [
"No title equipped",
"Kein Titel ausgerüstet"
],
"titles_hint": [
"Earn titles through milestones. Tap a title to see its certificate.",
"Verdiene Titel über Meilensteine. Tippe einen Titel an, um sein Zertifikat zu sehen."
],
"p_titles": [
"Titles",
"Titel"
],
"eq_title": [
"Title",
"Titel"
],
"title_new": [
"New title: {0}",
"Neuer Titel: {0}"
],
"unequip": [
"Unequip",
"Ablegen"
],
"ti_locked": [
"Locked – {0}",
"Gesperrt – {0}"
],
"ti_special": [
"Reserved for the team.",
"Dem Team vorbehalten."
],
"st_time": [
"Playtime",
"Spielzeit"
],
"st_hammers": [
"Hammer hits",
"Hammerschläge"
],
"st_lasers": [
"Laser shots",
"Laserschüsse"
],
"st_best": [
"Best world",
"Beste Welt"
],
"st_duels": [
"Duels won / lost",
"Duelle gewonnen / verloren"
],
"cert_kicker": [
"Certificate of Achievement",
"Urkunde der Auszeichnung"
],
"cert_to": [
"awarded to",
"verliehen an"
],
"cert_date": [
"Date",
"Datum"
],
"cert_by": [
"Issued by",
"Ausgestellt von"
],
"cert_no": [
"No.",
"Nr."
],
"cert_special_team": [
"Member of the Schnittwerk team.",
"Mitglied des Schnittwerk-Teams."
],
"cert_special_owner": [
"Owner and founder of Schnittwerk.",
"Besitzer und Gründer von Schnittwerk."
],
"ti_apprentice": [
"Apprentice",
"Lehrling"
],
"ti_slicer": [
"Master Slicer",
"Schnittmeister"
],
"ti_lumberjack": [
"Lumberjack",
"Holzfäller"
],
"ti_digger": [
"Digger",
"Buddler"
],
"ti_collector": [
"Collector",
"Sammler"
],
"ti_tycoon": [
"Tycoon",
"Magnat"
],
"ti_demolisher": [
"Wrecker",
"Zertrümmerer"
],
"ti_bomber": [
"Blast Master",
"Sprengmeister"
],
"ti_laserace": [
"Laser Ace",
"Laser-Ass"
],
"ti_veteran": [
"Veteran",
"Veteran"
],
"ti_champion": [
"Champion",
"Champion"
],
"ti_legend": [
"Legend",
"Legende"
],
"ti_team": [
"Team",
"Team"
],
"ti_owner": [
"Owner",
"Owner"
],
"iss_acad": [
"Schnittwerk Academy",
"Schnittwerk-Akademie"
],
"iss_guild": [
"Craftsmen's Guild",
"Handwerkerzunft"
],
"iss_bank": [
"Chamber of Commerce",
"Handelskammer"
],
"iss_demo": [
"Demolition Authority",
"Abrissbehörde"
],
"iss_lab": [
"Laser Institute",
"Laser-Institut"
],
"iss_vet": [
"Hall of Veterans",
"Halle der Veteranen"
],
"iss_arena": [
"Arena Council",
"Arena-Rat"
],
"iss_hall": [
"Hall of Legends",
"Halle der Legenden"
],
"iss_team": [
"Schnittwerk Team",
"Schnittwerk-Team"
],
"iss_owner": [
"The Owner",
"Der Owner"
],
"mt_saws": [
"Sawyer",
"Säger"
],
"md_saws": [
"Saw {0} times",
"Säge {0} Mal"
],
"mt_digs": [
"Digger",
"Buddler"
],
"md_digs": [
"Dig {0} dents with the shovel",
"Grabe {0} Dellen mit der Schaufel"
],
"mt_time": [
"Veteran",
"Veteran"
],
"md_time": [
"Play for {0}",
"Spiele {0}"
],
"mt_duelsWon": [
"Duelist",
"Duellant"
],
"md_duelsWon": [
"Win {0} duels",
"Gewinne {0} Duelle"
],
"m_snow": [
"Snow",
"Schnee"
],
"m_leaf": [
"Leaves",
"Blätter"
],
"m_sand": [
"Sandstone",
"Sandstein"
],
"m_gold": [
"Gold",
"Gold"
],
"i_snowblock": [
"Snow Block",
"Schneeblock"
],
"i_snowball": [
"Snowball",
"Schneeball"
],
"i_hay": [
"Hay Bale",
"Heuballen"
],
"i_sandblock": [
"Sandstone Block",
"Sandsteinblock"
],
"i_goldbar": [
"Gold Bar",
"Goldbarren"
],
"s_inferno": [
"Inferno",
"Inferno"
],
"s_aurora": [
"Aurora",
"Nordlicht"
],
"snow_n": [
"Snowfield",
"Schneeland"
],
"snow_d": [
"Snowmen and an igloo. The shovel digs dents and crumbs out of snow.",
"Schneemänner und ein Iglu. Die Schaufel gräbt Dellen und Brösel aus dem Schnee."
],
"sand_n": [
"Sand Castle",
"Sandburg"
],
"sand_d": [
"Soft sandstone towers – dig them apart.",
"Weiche Sandsteintürme – grab sie auseinander."
],
"forest_n": [
"Pine Forest",
"Nadelwald"
],
"forest_d": [
"Tall trees. The saw makes short work of trunks.",
"Hohe Bäume. Die Säge macht kurzen Prozess mit Stämmen."
],
"house_n": [
"Greenhouse",
"Gewächshaus"
],
"house_d": [
"Fragile glass walls – cut them cleanly.",
"Zerbrechliche Glaswände – schneide sie sauber."
],
"bridge_n": [
"Stone Bridge",
"Steinbrücke"
],
"bridge_d": [
"Heavy pillars and beams. Hammer time.",
"Schwere Pfeiler und Balken. Hammerzeit."
],
"light_n": [
"Lighthouse",
"Leuchtturm"
],
"light_d": [
"A tall tower with a glass lantern.",
"Ein hoher Turm mit gläserner Laterne."
],
"pyramid_n": [
"Pyramid",
"Pyramide"
],
"pyramid_d": [
"37 heavy blocks and a golden tip.",
"37 schwere Blöcke und eine goldene Spitze."
],
"tower_n": [
"Skyscraper",
"Wolkenkratzer"
],
"tower_d": [
"Metal frames and glass floors – very tall.",
"Metallrahmen und Glasetagen – sehr hoch."
],
"vault_n": [
"Gold Vault",
"Goldtresor"
],
"vault_d": [
"Armored walls guard a pile of gold.",
"Gepanzerte Wände bewachen einen Goldhaufen."
],
"fort_n": [
"Volcano Fortress",
"Vulkanfestung"
],
"fort_d": [
"Stone towers with metal caps. Bring bombs.",
"Steintürme mit Metallkappen. Bring Bomben mit."
],
"friends": [
"Friends",
"Freunde"
],
"friends_tag": [
"Friends",
"Freunde"
],
"so_players": [
"Players",
"Spieler"
],
"so_req": [
"Requests",
"Anfragen"
],
"social_title": [
"Friends & Players",
"Freunde & Spieler"
],
"so_offline": [
"Offline – friends and duels need internet.",
"Offline – Freunde und Duelle brauchen Internet."
],
"no_friends": [
"No friends yet. Add players from the list.",
"Noch keine Freunde. Füge Spieler aus der Liste hinzu."
],
"req_in": [
"Incoming requests",
"Eingehende Anfragen"
],
"req_out": [
"Sent requests",
"Gesendete Anfragen"
],
"none_yet": [
"Nothing here yet.",
"Noch nichts hier."
],
"none_found": [
"No players found.",
"Keine Spieler gefunden."
],
"search_ph": [
"Search name or #ID",
"Name oder #ID suchen"
],
"pending": [
"Pending",
"Ausstehend"
],
"req_new": [
"{0} sent you a friend request.",
"{0} hat dir eine Freundschaftsanfrage geschickt."
],
"req_many": [
"You have {0} friend requests.",
"Du hast {0} Freundschaftsanfragen."
],
"req_sent": [
"Friend request sent.",
"Anfrage gesendet."
],
"friend_new": [
"{0} is now your friend.",
"{0} ist jetzt dein Freund."
],
"friend_now": [
"You are friends now!",
"Ihr seid jetzt Freunde!"
],
"friend_rm": [
"Remove friend",
"Freund entfernen"
],
"friend_rm_q": [
"Remove {0} from your friends?",
"{0} aus deinen Freunden entfernen?"
],
"online": [
"Online",
"Online"
],
"last_seen": [
"last seen {0} ago",
"zuletzt online vor {0}"
],
"t_now": [
"just now",
"gerade eben"
],
"joined": [
"Joined",
"Beigetreten"
],
"coins": [
"Coins",
"Münzen"
],
"owner_view": [
"Owner view",
"Owner-Ansicht"
],
"unlock_acc": [
"Unlock account",
"Konto entsperren"
],
"unlocked_ok": [
"Account unlocked.",
"Konto entsperrt."
],
"duel": [
"Duel",
"Duell"
],
"duel_coins": [
"Coins won / lost",
"Gewonnene / verlorene Münzen"
],
"duel_new": [
"Challenge to a duel",
"Zum Duell herausfordern"
],
"duel_map": [
"Map",
"Karte"
],
"duel_stake": [
"Stake (each)",
"Einsatz (jeder)"
],
"duel_pot": [
"Pot: {0}",
"Topf: {0}"
],
"duel_each": [
"{0} from each player",
"je {0} von jedem Spieler"
],
"duel_send": [
"Challenge",
"Herausfordern"
],
"duel_invites": [
"Duel invitations",
"Duell-Einladungen"
],
"duel_invite_t": [
"Duel challenge!",
"Duell-Herausforderung!"
],
"duel_inv_txt": [
"{0} · stake {1} each · pot {2}",
"{0} · Einsatz je {1} · Topf {2}"
],
"duel_inv_toast": [
"{0} challenges you to a duel!",
"{0} fordert dich zum Duell heraus!"
],
"duel_wait_t": [
"Waiting …",
"Warte …"
],
"duel_wait_x": [
"Waiting for a reply · {0} · stake {1}",
"Warte auf Antwort · {0} · Einsatz {1}"
],
"duel_declined": [
"The duel was declined. Your stake is refunded.",
"Das Duell wurde abgelehnt. Dein Einsatz kommt zurück."
],
"duel_canceled": [
"The duel was canceled. Stake refunded.",
"Das Duell wurde abgebrochen. Einsatz zurück."
],
"duel_expired": [
"No answer – duel expired. Stake refunded.",
"Keine Antwort – Duell abgelaufen. Einsatz zurück."
],
"duel_go": [
"GO!",
"LOS!"
],
"duel_conn": [
"Connection lost – trying to reconnect …",
"Verbindung verloren – versuche neu zu verbinden …"
],
"duel_finished": [
"You finished! Waiting for the result …",
"Fertig! Warte auf das Ergebnis …"
],
"duel_leave": [
"Leave duel",
"Duell verlassen"
],
"duel_leave_q": [
"If you leave, your opponent wins the pot.",
"Wenn du gehst, gewinnt dein Gegner den Topf."
],
"duel_leave_first": [
"Finish or leave the duel first.",
"Beende oder verlasse zuerst das Duell."
],
"duel_won": [
"You won!",
"Gewonnen!"
],
"duel_lost": [
"You lost",
"Verloren"
],
"duel_draw": [
"Draw",
"Unentschieden"
],
"duel_why_finish": [
"cleared the map first",
"hat die Karte zuerst geschafft"
],
"duel_why_forfeit": [
"opponent gave up",
"Gegner hat aufgegeben"
],
"duel_why_time": [
"time ran out – higher progress wins",
"Zeit abgelaufen – mehr Fortschritt gewinnt"
],
"duel_why_left": [
"opponent disconnected",
"Gegner hat die Verbindung verloren"
],
"duel_why_draw": [
"nobody finished – stakes refunded",
"niemand fertig – Einsätze zurück"
],
"rematch": [
"Rematch",
"Revanche"
],
"coins_in": [
"+{0} coins from the server",
"+{0} Münzen vom Server"
],
"owner_title": [
"Owner",
"Owner"
],
"ow_players": [
"Players",
"Spieler"
],
"ow_tools": [
"Tools",
"Werkzeuge"
],
"owner_list_hint": [
"{0} players registered. Tap a player for details.",
"{0} Spieler registriert. Tippe einen Spieler für Details."
],
"owner_server": [
"{0} of 100 player slots used.",
"{0} von 100 Spielerplätzen belegt."
],
"lab_open": [
"Free test field",
"Freies Testfeld"
],
"lab_map": [
"Test any map",
"Beliebige Karte testen"
],
"lab_test": [
"Test",
"Testen"
],
"lab_clear": [
"Clear",
"Leeren"
],
"lab_reset": [
"Reset",
"Zurücksetzen"
],
"offline_owner": [
"Codes need a connection to the server.",
"Für die Codes wird die Verbindung zum Server benötigt."
]
});

/* ======================================================================
   PART 2 – v1.2 data: materials, items, skins, titles, maps
   ====================================================================== */

/* ---------- New materials (snow, leaves, sandstone, gold) ---------- */
Object.assign(MATS,{
 snow:{c:'#eef6ff',d:'#9db8d3',val:.6,den:.0007,fr:.55,re:.02},
 leaf:{c:'#58b85a',d:'#2a6f30',val:.5,den:.0006,fr:.5,re:.03},
 sand:{c:'#e1c583',d:'#8f7642',val:.8,den:.0016,fr:.65,re:.02},
 gold:{c:'#ffd23f',d:'#a8740a',val:3,den:.006,fr:.4,re:.05}
});
/* how well the shovel digs into a material (0 = only scratches) */
const DIG={wood:.5,brick:.4,stone:.25,glass:.2,ice:.35,metal:.08,snow:1,leaf:.9,sand:.95,gold:.12};
Object.assign(MSND,{
 snow:{f:130,t:'sine',n:[1100,300],nt:'lowpass',r:0,d:.8},
 leaf:{f:240,t:'triangle',n:[2600,900],nt:'bandpass',r:0,d:.7},
 sand:{f:150,t:'triangle',n:[2000,600],nt:'bandpass',r:0,d:.9},
 gold:{f:620,t:'sine',n:[3600,2000],nt:'highpass',r:940,d:1.6}
});
Object.assign(TEX,{
 snow(g){const r=rng(31);for(let i=0;i<46;i++){g.fillStyle=r()>.5?'rgba(255,255,255,.9)':'rgba(150,185,220,.22)';g.beginPath();g.arc(r()*96,r()*96,1+r()*3.2,0,6.3);g.fill();}
  g.fillStyle='rgba(255,255,255,.65)';for(let i=0;i<7;i++){const x=r()*90,y=r()*90;g.fillRect(x,y,2,2);g.fillRect(x-1.5,y+.5,5,1);g.fillRect(x+.5,y-1.5,1,5);}
  g.fillStyle='rgba(120,160,205,.14)';g.beginPath();g.ellipse(70,80,34,9,0,0,6.3);g.fill();},
 leaf(g){const r=rng(41);for(let i=0;i<34;i++){const x=r()*96,y=r()*96,a=r()*6.3,l=9+r()*9;g.save();g.translate(x,y);g.rotate(a);g.fillStyle=r()>.5?'rgba(20,90,30,.34)':'rgba(190,255,150,.2)';g.beginPath();g.ellipse(0,0,l,l*.42,0,0,6.3);g.fill();g.strokeStyle='rgba(10,60,20,.32)';g.lineWidth=1;g.beginPath();g.moveTo(-l,0);g.lineTo(l,0);g.stroke();g.restore();}},
 sand(g){const r=rng(51);for(let i=0;i<9;i++){const y=5+i*11;g.strokeStyle='rgba(120,90,40,'+(.1+r()*.12)+')';g.lineWidth=1+r();g.beginPath();g.moveTo(0,y);for(let x=8;x<=96;x+=8)g.lineTo(x,y+Math.sin(x*.09+i*2.1)*2.4);g.stroke();}
  for(let i=0;i<120;i++){g.fillStyle=r()>.5?'rgba(255,240,200,.35)':'rgba(120,90,40,.22)';g.fillRect(r()*96,r()*96,1.3,1.3);}},
 gold(g){const r=rng(61);for(let i=0;i<38;i++){g.fillStyle='rgba(255,255,255,'+(r()*.13)+')';g.fillRect(0,i*2.6,96,1.1);}
  g.fillStyle='rgba(255,255,255,.34)';g.beginPath();g.moveTo(-6,60);g.lineTo(30,-6);g.lineTo(44,-6);g.lineTo(6,66);g.fill();
  g.fillStyle='rgba(120,70,0,.22)';g.fillRect(0,88,96,8);g.strokeStyle='rgba(120,70,0,.35)';g.lineWidth=2;g.strokeRect(3,3,90,90);}
});
for(const k in DIG)if(MATS[k])MATS[k].dig=DIG[k];

/* ---------- More sandbox objects ---------- */
ITEMS.push(
 {id:'snowblock',mat:'snow',w:64,h:64,cost:16},
 {id:'snowball',mat:'snow',r:30,cost:14},
 {id:'hay',mat:'leaf',w:70,h:50,cost:14},
 {id:'sandblock',mat:'sand',w:64,h:50,cost:18},
 {id:'goldbar',mat:'gold',w:84,h:30,cost:120}
);

/* ---------- More looks (auras differ per look) ---------- */
Object.assign(SKINS,{
 inferno:{a:'#ffd08a',b:'#ff4a12',p:4200,st:2},
 aurora:{a:'#9dffe3',b:'#7a5bff',code:1,st:2}
});
SKINS.gold.au='stars';SKINS.plasma.au='bolt';SKINS.void.au='void';SKINS.inferno.au='flame';SKINS.aurora.au='ribbon';

/* ---------- Titles ---------- */
/* cf = certificate family (each looks different), iss = issuer, lv = rarity 0-3 */
const TITLES=[
 {k:'apprentice',ic:'knife',cf:'a',iss:'iss_acad',lv:0},
 {k:'slicer',ic:'knife',cf:'b',iss:'iss_acad',lv:1},
 {k:'lumberjack',ic:'saw',cf:'c',iss:'iss_guild',lv:1},
 {k:'digger',ic:'shovel',cf:'c',iss:'iss_guild',lv:1},
 {k:'collector',ic:'coin',cf:'d',iss:'iss_bank',lv:1},
 {k:'tycoon',ic:'coinplus',cf:'d',iss:'iss_bank',lv:3},
 {k:'demolisher',ic:'hammer',cf:'e',iss:'iss_demo',lv:2},
 {k:'bomber',ic:'bomb',cf:'e',iss:'iss_demo',lv:2},
 {k:'laserace',ic:'laser',cf:'b',iss:'iss_lab',lv:2},
 {k:'veteran',ic:'gear',cf:'a',iss:'iss_vet',lv:2},
 {k:'champion',ic:'crown',cf:'f',iss:'iss_arena',lv:3},
 {k:'legend',ic:'crown',cf:'d',iss:'iss_hall',lv:3},
 {k:'team',ic:'shield',cf:'g',iss:'iss_team',lv:3,special:1},
 {k:'owner',ic:'crown',cf:'g',iss:'iss_owner',lv:3,special:1}
];
const TITLE=k=>TITLES.find(t=>t.k===k);

/* ---------- Map builders ---------- */
const GP=.8;
function stk(mk,x,yb,w,h,n){for(let i=0;i<n;i++)bx(mk,x,yb+i*(h+GP),w,h);return yb+n*(h+GP);}
function buildSnow(){
  for(const s of [-1,1]){const x=s*345;let y=stk('snow',x,.4,76,76,1);y=stk('snow',x,y,56,56,1);stk('snow',x,y,40,40,1);}
  for(let i=0;i<5;i++)bx('snow',(i-2)*60.8,.4,60,50);
  for(let i=0;i<3;i++)bx('snow',(i-1)*60.8,51.2,60,50);
  bx('snow',0,102,60,50);
  for(const s of [-1,1]){const y=stk('snow',s*215,.4,60,60,5);stk('ice',s*215,y,56,56,2);}
}
function buildSand(){
  let y=stk('sand',0,.4,196,56,3);y=stk('sand',0,y,130,56,2);
  bx('sand',-46,y,36,30);bx('sand',46,y,36,30);bx('sand',0,y,30,44);
  for(const s of [-1,1]){const t=stk('sand',s*300,.4,72,60,4);bx('sand',s*300-16,t,28,30);bx('sand',s*300+16,t,28,30);
    stk('sand',s*140,.4,80,50,3);stk('sand',s*220.8,.4,80,50,3);}
}
function buildForest(){
  const xs=[-380,-260,-140,-20,100,220,340],th=[130,170,110,190,140,160,120];
  xs.forEach((x,i)=>{bx('wood',x,.4,34,th[i]);let y=.4+th[i]+GP;bx('leaf',x,y,100,36);y+=36+GP;bx('leaf',x,y,74,34);y+=34+GP;bx('leaf',x,y,48,32);});
  bx('wood',-200,.4,80,28);bx('wood',160,.4,60,28);
}
function buildBridge(){
  const xs=[-360,-180,0,180,360];let top=0;
  for(const x of xs)top=stk('stone',x,.4,60,60,4);
  for(let i=0;i<4;i++){const x=(xs[i]+xs[i+1])/2;bx('stone',x,top,170,26);bx('brick',x-40,top+26.8,60,50);bx('brick',x+40,top+26.8,60,50);}
}
function buildHouse(){
  bx('wood',0,.4,420,20);const y0=21.2;
  for(let r=0;r<3;r++)for(let c=0;c<6;c++)bx('glass',(c-2.5)*62,y0+r*54.8,60,54);
  const y1=y0+3*54.8;bx('wood',0,y1,420,20);
  for(let r=0;r<3;r++)for(let c=0;c<5-2*r;c++)bx('glass',(c-(4-2*r)/2)*62,y1+20.8+r*44.8,60,44);
}
function buildLight(){
  const mats=['stone','stone','brick','stone','brick','stone'],ws=[150,132,116,104,92,80];let y=.4;
  for(let i=0;i<6;i++){bx(mats[i],0,y,ws[i],56);y+=56.8;}
  bx('glass',-20,y,38,46);bx('glass',20,y,38,46);bx('metal',0,y+46.8,90,20);
  stk('stone',-250,.4,90,50,2);stk('stone',-335,.4,70,40,2);
  const h=stk('brick',290,.4,64,40,3);bx('wood',290,h,100,18);bx('brick',290,h+18.8,44,40);
}
function buildPyramid(){
  const rows=8,w=64,h=40;
  for(let r=0;r<rows;r++){const n=rows-r;for(let i=0;i<n;i++)bx(r%2?'stone':'sand',(i-(n-1)/2)*(w+.8),.4+r*(h+.8),w,h);}
  bx('gold',0,.4+rows*(h+.8),44,44);
}
function buildTower(){
  let y=.4;
  for(let f=0;f<6;f++){bx('metal',-64,y,22,70);bx('metal',64,y,22,70);bx('glass',0,y,96,70);y+=70.8;bx('metal',0,y,176,14);y+=14.8;}
  bx('metal',0,y,12,90);
  for(const s of [-1,1])stk('glass',s*250,.4,64,64,5);
}
function buildVault(){
  for(const s of [-1,1]){stk('stone',s*150,.4,60,60,4);bx('metal',s*192,.4,22,242.4);}
  const n=[3,2,1];for(let r=0;r<3;r++)for(let i=0;i<n[r];i++)bx('gold',(i-(n[r]-1)/2)*72,.4+r*30.8,70,30);
  bx('metal',0,243.6,440,26);
  for(let i=0;i<4;i++)bx('stone',(i-1.5)*100,270.4,90,50);
}
function buildFort(){
  for(const s of [-1,1]){const y=stk('stone',s*250,.4,80,60,6);bx('metal',s*250,y,104,24);bx('gold',s*250,y+24.8,36,36);}
  for(let r=0;r<4;r++)for(let i=0;i<5;i++)bx('stone',(i-2)*63,.4+r*62.8,62,62);
  for(let i=0;i<5;i+=2)bx('metal',(i-2)*63,.4+4*62.8,44,30);
}

/* ---------- Background scenery per map (drawn behind the blocks) ---------- */
const BGX={
 snow(q){const t=performance.now()/1000,n=q>=2?80:44;ctx.fillStyle='#fff';
   for(let i=0;i<n;i++){const z=.4+((i*37)%10)/10*.9,x=((((i*97.3)%1000)/1000)*W+Math.sin(t*.6+i)*22-camera.x*z*.15),y=(((i*61.7)%1000)/1000*H+t*(26+38*z))%H;
     ctx.globalAlpha=.3+.5*z/1.3;ctx.beginPath();ctx.arc(((x%W)+W)%W,y,1+z*1.8,0,6.3);ctx.fill();}ctx.globalAlpha=1;},
 sand(q){const g=H/2+(0-camera.y)*camera.zoom;ctx.fillStyle='rgba(255,236,170,.9)';ctx.beginPath();ctx.arc(W*.8,H*.2,34,0,6.3);ctx.fill();
   ctx.fillStyle='rgba(255,236,170,.2)';ctx.beginPath();ctx.arc(W*.8,H*.2,64,0,6.3);ctx.fill();
   ctx.fillStyle='rgba(190,150,80,.55)';for(let i=0;i<3;i++){const x=(W*(.15+i*.34)-camera.x*.08),b=g-96*camera.zoom;ctx.beginPath();ctx.moveTo(x-90*camera.zoom,b);ctx.lineTo(x,b-70*camera.zoom);ctx.lineTo(x+90*camera.zoom,b);ctx.fill();}},
 forest(q){const g=H/2+(0-camera.y)*camera.zoom,z=camera.zoom;ctx.fillStyle='rgba(30,90,50,.55)';
   for(let i=-1;i<14;i++){const x=i*80*z-((camera.x*.12*z)%(80*z)),h=(70+((i*53)%40))*z;ctx.beginPath();ctx.moveTo(x,g-60*z);ctx.lineTo(x+26*z,g-60*z-h);ctx.lineTo(x+52*z,g-60*z);ctx.fill();}},
 house(q){ctx.fillStyle='rgba(255,255,255,.28)';const t=performance.now()/2500;for(let i=0;i<4;i++){const x=((W*(i*.27+.1)+t*20*(i+1))%(W+200))-100;ctx.beginPath();ctx.ellipse(x,H*.16+i*14,70,16,0,0,6.3);ctx.fill();}},
 bridge(q){ctx.fillStyle='rgba(255,214,140,.85)';ctx.beginPath();ctx.arc(W*.22,H*.62,46,0,6.3);ctx.fill();ctx.fillStyle='rgba(255,200,120,.25)';ctx.beginPath();ctx.arc(W*.22,H*.62,90,0,6.3);ctx.fill();},
 light(q){const g=H/2+(0-camera.y)*camera.zoom,z=camera.zoom,t=performance.now()/1000;ctx.fillStyle='rgba(40,90,150,.55)';ctx.fillRect(0,g-52*z,W,52*z);
   ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2;for(let r=0;r<3;r++){ctx.beginPath();for(let x=0;x<=W;x+=24){const y=g-40*z+r*12*z+Math.sin(x*.05+t*1.5+r)*3;x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}},
 pyramid(q){const g=H/2+(0-camera.y)*camera.zoom,z=camera.zoom;ctx.fillStyle='rgba(255,215,140,.9)';ctx.beginPath();ctx.arc(W*.78,H*.22,38,0,6.3);ctx.fill();
   ctx.fillStyle='rgba(170,120,60,.45)';for(const [x,s] of [[.12,.7],[.3,.5],[.9,.6]]){const cx=W*x-camera.x*.06,b=g-88*z,w=110*s*z;ctx.beginPath();ctx.moveTo(cx-w,b);ctx.lineTo(cx,b-w*.9);ctx.lineTo(cx+w,b);ctx.fill();}},
 tower(q){const g=H/2+(0-camera.y)*camera.zoom,z=camera.zoom;for(let i=-1;i<12;i++){const x=i*90*z-((camera.x*.1*z)%(90*z)),h=(90+((i*71)%110))*z;ctx.fillStyle='rgba(20,28,50,.7)';ctx.fillRect(x,g-70*z-h,60*z,h+70*z);
     ctx.fillStyle='rgba(255,220,120,.6)';for(let r=0;r<h/(16*z);r++)for(let c=0;c<3;c++)if(((i*7+r*3+c)%5)>1)ctx.fillRect(x+8*z+c*16*z,g-70*z-h+8*z+r*16*z,7*z,8*z);}},
 vault(q){ctx.fillStyle='#fff';for(let i=0;i<46;i++){const x=((i*131.7)%1000)/1000*W,y=((i*71.3)%1000)/1000*H*.7,t=performance.now()/700+i;ctx.globalAlpha=.25+.5*Math.abs(Math.sin(t));ctx.fillRect(x,y,1.6,1.6);}ctx.globalAlpha=1;
   ctx.fillStyle='rgba(255,250,220,.9)';ctx.beginPath();ctx.arc(W*.85,H*.16,22,0,6.3);ctx.fill();},
 fort(q){const g=H/2+(0-camera.y)*camera.zoom,z=camera.zoom,t=performance.now()/1000;ctx.fillStyle='rgba(30,12,12,.7)';ctx.beginPath();ctx.moveTo(W*.55,g-70*z);ctx.lineTo(W*.72,g-210*z);ctx.lineTo(W*.9,g-70*z);ctx.fill();
   ctx.fillStyle='rgba(255,120,40,.85)';ctx.beginPath();ctx.arc(W*.72,g-214*z,10*z,0,6.3);ctx.fill();
   for(let i=0;i<22;i++){const x=W*.72+Math.sin(t*.8+i*1.7)*70*z,y=((g-210*z)-(((t*40+i*37)%260)*z));ctx.globalAlpha=.6;ctx.fillStyle=i%2?'#ffb347':'#ff6a2a';ctx.fillRect(x,y,2.2,2.2);}ctx.globalAlpha=1;}
};

/* ---------- Register the full map list (ordered by difficulty) ---------- */
const MAPDEF={
 snow:{sky:['#cfe3f5','#f7fbff'],hill:['#f3f9ff','#dbe9f6'],grass:'#ffffff',dirt:['#8b98a8','#6c7888'],build:buildSnow,d:0,reward:220,tool:'shovel'},
 sand:{sky:['#8fd3f5','#fdf1cf'],hill:['#e8cf94','#d9bb7a'],grass:'#e3c47c',dirt:['#b58f52','#98763f'],build:buildSand,d:0,reward:300,tool:'shovel'},
 forest:{sky:['#9ad7d0','#e6f5e0'],hill:['#4f9a5a','#3c7f49'],grass:'#4c9b3c',dirt:['#6a4a2b','#503620'],build:buildForest,d:1,reward:420,tool:'saw'},
 house:{sky:['#8ed6e8','#e4f7f4'],hill:['#8fd095','#6fb87a'],grass:'#5fc06a',dirt:['#6d5b48','#54453a'],build:buildHouse,d:1,reward:650,tool:'laser'},
 bridge:{sky:['#ffb98a','#ffe9c9'],hill:['#7a6f9b','#5f5683'],grass:'#8bb257',dirt:['#6f5544','#553f32'],build:buildBridge,d:1,reward:800,tool:'hammer'},
 light:{sky:['#6d8fc7','#c9d8ee'],hill:['#5f7fa0','#4a6785'],grass:'#7fb37f',dirt:['#5b6b73','#465259'],build:buildLight,d:2,reward:1400,tool:'bomb',camY:-230},
 pyramid:{sky:['#f2b45f','#fde6b5'],hill:['#e0b56a','#c99d55'],grass:'#dcbc72',dirt:['#b58a4a','#8f6c37'],build:buildPyramid,d:2,reward:1700,tool:'bomb',camY:-190},
 tower:{sky:['#3a4b7a','#9db3dd'],hill:['#2f3a58','#252e47'],grass:'#6a7d94',dirt:['#3a414d','#2b313b'],build:buildTower,d:3,reward:2600,tool:'laser',camY:-300,zoomMul:.8},
 vault:{sky:['#241d3a','#4a3a6d'],hill:['#2a2440','#1e1a30'],grass:'#524a6a',dirt:['#332c46','#251f36'],build:buildVault,d:3,reward:3200,tool:'bomb',camY:-190},
 fort:{sky:['#3b1f1f','#c0603a'],hill:['#3a2523','#2a1a19'],grass:'#5a3c33',dirt:['#3a2a28','#2a1d1c'],build:buildFort,d:3,reward:4000,tool:'bomb',camY:-230}
};
const OLDD={hut:[0,'hammer',150],wall:[1,'hammer',520],glass:[2,'knife',950],ice:[2,'saw',1150],steel:[3,'laser',2100]};
(function registerMaps(){
  const by={};for(const m of MAPS)by[m.id]=m;
  for(const k in MAPDEF){by[k]=Object.assign({id:k},MAPDEF[k]);if(BGX[k])by[k].bg=BGX[k];}
  for(const k in OLDD){by[k].d=OLDD[k][0];by[k].tool=OLDD[k][1];by[k].reward=OLDD[k][2];}
  const order=['hut','snow','sand','forest','wall','house','bridge','glass','ice','light','pyramid','steel','tower','vault','fort'];
  MAPS.splice(0,MAPS.length,...order.map(id=>by[id]));
})();
const mapIndex=id=>MAPS.findIndex(m=>m.id===id);

/* ======================================================================
   PART 3 – sound: more detail, and every "no" sounds a bit different
   ====================================================================== */
const pick=a=>a[Math.floor(Math.random()*a.length)];
const vr=(x,p)=>x*(1+(Math.random()*2-1)*(p||.06));
Object.assign(sfx,{
 click(){const f=vr(640,.07);tone(f,.05,'square',.045);tone(f*1.5,.04,'sine',.03,0,.02);if(Math.random()<.5)noise(.02,.02,'highpass',5200,5200);},
 hover(){if(!gate('hov',45))return;tone(pick([1400,1560,1700,1500,1620]),.022,'sine',.011);},
 press(){tone(vr(190,.06),.05,'sine',.05,120);noise(.02,.028,'lowpass',1300,600);},
 release(){tone(vr(760,.05),.03,'square',.028);},
 back(){tone(vr(520,.05),.06,'square',.045,340);noise(.03,.02,'lowpass',1500,500);},
 tab(){const f=vr(760,.05);tone(f,.05,'triangle',.06,f*1.3);tone(f*2,.03,'sine',.02,0,.03);},
 toggle(on){tone(on?700:480,.06,'square',.05,on?940:340);tone(on?1400:960,.03,'sine',.02,0,.03);},
 open(){noise(.24,.05,'bandpass',450,2600,0,1);tone(440,.12,'triangle',.04,660);tone(660,.15,'sine',.03,880,.04);},
 close(){noise(.2,.045,'bandpass',2600,450,0,1);tone(660,.1,'triangle',.035,440);},
 slider(v){tone(360+v*520,.03,'triangle',.03);},
 error(){
   const f=vr(1,.08),v=Math.floor(Math.random()*6);
   if(v===0){tone(170*f,.16,'sawtooth',.07,110*f);tone(140*f,.16,'sawtooth',.05,90*f,.09);}
   else if(v===1){tone(230*f,.08,'square',.06);tone(230*f,.08,'square',.06,0,.11);}
   else if(v===2){tone(300*f,.2,'triangle',.08,150*f);tone(150*f,.2,'sine',.06,90*f,.05);}
   else if(v===3){noise(.12,.1,'lowpass',700,150);tone(95*f,.18,'sine',.12,50);}
   else if(v===4){tone(392*f,.09,'triangle',.06);tone(311*f,.11,'triangle',.06,0,.09);tone(233*f,.16,'triangle',.06,0,.19);}
   else{tone(500*f,.14,'sine',.07,180*f);noise(.05,.03,'bandpass',900,300);}
 },
 deny(){tone(vr(260,.08),.05,'square',.04,200);tone(vr(200,.08),.06,'square',.03,0,.06);},
 warn(){const f=vr(1,.05);tone(660*f,.07,'triangle',.06);tone(520*f,.09,'triangle',.06,0,.09);},
 ok(){const f=vr(1,.05),v=Math.floor(Math.random()*3);
   if(v===0){tone(740*f,.07,'triangle',.06);tone(988*f,.12,'triangle',.06,0,.07);}
   else if(v===1){tone(587*f,.06,'sine',.06);tone(880*f,.06,'sine',.06,0,.06);tone(1175*f,.12,'sine',.05,0,.12);}
   else{tone(660*f,.09,'triangle',.06,880*f);tone(1320*f,.1,'sine',.04,0,.07);}},
 fail(){const f=vr(1,.04);[330,294,262,208].forEach((n,i)=>tone(n*f,.24,'triangle',.07,n*f*.96,i*.16));noise(.4,.03,'lowpass',900,200,.2);},
 key(d){tone(500+(d|0)*46,.05,'triangle',.05);noise(.015,.03,'highpass',5000,5000);},
 keyDel(){tone(vr(330,.05),.05,'square',.04,240);},
 pinOk(){[660,880,1320].forEach((f,i)=>tone(f,.14,'triangle',.06,0,i*.07));tone(2640,.3,'sine',.03,0,.2);},
 pinBad(){const v=Math.floor(Math.random()*3);
   if(v===0){tone(150,.22,'sawtooth',.08,90);tone(120,.22,'sawtooth',.06,70,.1);}
   else if(v===1){for(let i=0;i<3;i++)tone(vr(210,.05),.07,'square',.06,0,i*.1);}
   else{tone(400,.1,'triangle',.07,200);tone(300,.16,'triangle',.07,120,.1);noise(.1,.05,'lowpass',600,150,.05);}},
 lock(){noise(.1,.12,'lowpass',1400,200);tone(140,.16,'sine',.14,70);tone(920,.2,'sine',.05,880,.02);tone(1380,.14,'sine',.03,0,.03);},
 eye(on){noise(.09,.04,'bandpass',on?900:2400,on?2400:900,0,1);tone(on?900:600,.05,'triangle',.04,on?1300:420);},
 cert(){noise(.35,.05,'bandpass',600,3200,0,1);noise(.1,.1,'lowpass',900,160,.3);tone(90,.2,'sine',.16,50,.3);[1046,1318,1568,2093].forEach((f,i)=>tone(f,.4,'sine',.04,0,.36+i*.05));},
 title(){tone(660,.09,'triangle',.06,880);tone(990,.12,'triangle',.06,0,.08);for(let i=0;i<4;i++)tone(rnd(2400,4200),.06,'sine',.02,0,.16+i*.04);},
 ping(){tone(784,.1,'triangle',.07);tone(1047,.16,'triangle',.07,0,.09);tone(1568,.2,'sine',.03,0,.09);},
 invite(){for(let r=0;r<2;r++)[880,1108,1319].forEach((f,i)=>tone(f,.12,'square',.04,0,r*.5+i*.11));},
 countdown(n){const f=[880,740,620][Math.max(0,Math.min(2,n-1))]||620;tone(f,.2,'square',.06);tone(f*2,.12,'sine',.03);},
 go(){noise(.5,.08,'bandpass',400,4200,0,1);[523,659,784,1047].forEach((f,i)=>tone(f,.4,'triangle',.07,0,i*.03));tone(130,.4,'sawtooth',.06,260);},
 win(){[523,659,784,1047,1319].forEach((f,i)=>{tone(f,.34,'triangle',.08,0,i*.1);tone(f*2,.24,'sine',.03,0,i*.1+.02);});this.pot(14);noise(.7,.04,'highpass',7000,7000,.5);},
 lose(){[392,349,311,262].forEach((f,i)=>tone(f,.34,'sawtooth',.045,f*.94,i*.18));noise(.5,.03,'lowpass',700,150,.3);},
 wager(step){const f=520+step*70;tone(f,.06,'square',.04);tone(f*1.5,.09,'sine',.04,0,.04);noise(.03,.03,'highpass',6500,6500,.02);},
 pot(n){for(let i=0;i<(n||10);i++){tone(rnd(1800,3400),.05,'sine',.03,0,i*.045+Math.random()*.02);}noise(.5,.03,'highpass',6000,6000);},
 coinPop(){tone(vr(1320,.06),.06,'square',.028);tone(vr(1980,.06),.09,'sine',.03,0,.04);},
 friend(){tone(660,.08,'triangle',.06);tone(990,.08,'triangle',.06,0,.07);tone(1320,.14,'triangle',.06,0,.14);},
 hammerMiss(p){noise(.13,.08,'bandpass',900,280,0,1,p);tone(vr(160,.1),.1,'sine',.05,90,0,p);},
 hammerGround(p){noise(.12,.12,'lowpass',800,140,0,1,p);tone(vr(70,.1),.2,'sine',.14,38,0,p);noise(.18,.05,'bandpass',1800,600,.03,1,p);},
 crack(mk,p){if(!gate('crack',60))return;const m=MSND[mk]||MSND.wood;for(let i=0;i<3;i++)noise(.018,.08,'highpass',rnd(2600,5200),1500,i*.022,1,p);tone(m.f*rnd(1.4,2),.04,'square',.03,0,0,p);},
 dig(mk,p){if(!gate('dig',70))return;
   if(mk==='snow'){noise(.12,.1,'lowpass',2600,700,0,1,p);noise(.09,.07,'lowpass',2000,600,.07,1,p);tone(vr(1900,.1),.03,'sine',.02,0,.02,p);}
   else if(mk==='sand'||mk==='leaf'){noise(.16,.09,'bandpass',rnd(2400,3400),900,0,.9,p);}
   else if(mk==='wood'){noise(.1,.08,'bandpass',1500,500,0,1.4,p);tone(vr(180,.1),.07,'triangle',.07,120,0,p);}
   else if(mk==='metal'||mk==='gold'){noise(.09,.07,'highpass',5000,3200,0,1,p);tone(vr(1500,.1),.14,'sine',.05,1450,.01,p);}
   else{noise(.12,.09,'bandpass',rnd(1200,1800),500,0,1.6,p);tone(vr(120,.1),.06,'square',.04,80,0,p);}},
});
/* aura sounds: every aura has its own voice */
function auraSfx(kind,p){
  const sk=skinNow();if(!sk||sk.st<2||!sk.au)return;
  const au=sk.au,big=kind==='laser';if(!gate('aura'+au,big?120:90))return;
  if(au==='stars'){[1568,2093,2637,3136].forEach((f,i)=>tone(vr(f,.03),.16,'sine',.03,0,i*.035,p));noise(.12,.03,'highpass',8000,8000,0,1,p);}
  else if(au==='bolt'){noise(.05,.09,'highpass',4200,6000,0,1,p);for(let i=0;i<3;i++)tone(rnd(800,2600),.03,'sawtooth',.035,rnd(300,1200),i*.03,p);tone(90,.14,'sawtooth',.04,60,0,p);}
  else if(au==='void'){noise(.4,.06,'lowpass',1400,90,0,1,p);tone(vr(70,.05),.42,'sine',.12,38,0,p);tone(vr(880,.05),.3,'sine',.02,110,.02,p);}
  else if(au==='flame'){noise(.32,.07,'bandpass',900,2600,0,.8,p);noise(.12,.06,'lowpass',1800,300,.05,1,p);for(let i=0;i<3;i++)noise(.03,.06,'highpass',4000,4000,.06+i*.05,1,p);}
  else if(au==='ribbon'){[392,494,587,740].forEach((f,i)=>tone(vr(f,.02),.5,'triangle',.02,f*1.01,i*.03,p));tone(1568,.5,'sine',.015,1560,.1,p);}
}
{ /* layer the detail on top of the existing tool sounds */
  const _cut=sfx.cut,_saw=sfx.saw,_laser=sfx.laser,_hammer=sfx.hammer,_coin=sfx.coin,_boom=sfx.boom;
  sfx.cut=function(mk,area,p){_cut.call(this,mk,area,p);if(Math.random()<.6)noise(.05,.035,'highpass',rnd(5200,8000),3000,.03,1,p);if(gate('cutz',120))tone(vr(2400,.15),.04,'sine',.015,1800,.05,p);auraSfx('cut',p);};
  sfx.saw=function(mk,p){_saw.call(this,mk,p);if(Math.random()<.35)noise(.04,.04,'highpass',6000,4500,.02,1,p);auraSfx('saw',p);};
  sfx.laser=function(p){_laser.call(this,p);noise(.18,.05,'bandpass',300,2800,0,2,p);tone(vr(55,.05),.5,'sine',.12,40,.2,p);auraSfx('laser',p);};
  sfx.hammer=function(mk,p){_hammer.call(this,mk,p);noise(.1,.05,'highpass',3600,1600,.02,1,p);if(mk&&MSND[mk]&&MSND[mk].r)tone(MSND[mk].r*.6,.3,'sine',.03,0,.05,p);};
  sfx.coin=function(chain,p){_coin.call(this,chain,p);if(chain>3&&gate('coinz',70))tone(vr(3200,.05),.1,'sine',.02,0,.03,p);};
  sfx.boom=function(p){_boom.call(this,p);tone(vr(38,.05),1.1,'sine',.25,20,.02,p);noise(.9,.05,'bandpass',200,60,.05,1,p);};
}

/* ======================================================================
   PART 4 – effects that stick to the blocks: cracks, dents, auras
   ====================================================================== */
function closestOnPoly(vs,p){
  let best=null,bd=1e9;
  for(let i=0,n=vs.length;i<n;i++){
    const a=vs[i],b=vs[(i+1)%n],ex=b.x-a.x,ey=b.y-a.y,l2=ex*ex+ey*ey||1;
    let t=((p.x-a.x)*ex+(p.y-a.y)*ey)/l2;t=t<0?0:t>1?1:t;
    const x=a.x+ex*t,y=a.y+ey*t,d=Math.hypot(p.x-x,p.y-y);
    if(d<bd){bd=d;best={x,y,d};}
  }
  return best;
}
function surfNormal(b,cp){const dx=cp.x-b.position.x,dy=cp.y-b.position.y,l=Math.hypot(dx,dy)||1;return{x:dx/l,y:dy/l};}

/* decals live in the local space of a piece, so they move and rotate with it */
function addDecal(b,cp,o){
  const c=b.custom;if(!c||c.dead)return null;
  const a=-b.angle,cs=Math.cos(a),sn=Math.sin(a),dx=cp.x-b.position.x,dy=cp.y-b.position.y;
  o.x=dx*cs-dy*sn;o.y=dx*sn+dy*cs;
  (c.dec||(c.dec=[])).push(o);if(c.dec.length>8)c.dec.shift();
  return o;
}
function mkCrack(size){
  const paths=[],n=5+Math.floor(Math.random()*3),a0=Math.random()*6.28;
  for(let i=0;i<n;i++){let a=a0+i*(6.28/n)+rnd(-.35,.35),x=0,y=0;const pts=[[0,0]],segs=2+Math.floor(Math.random()*3);
    for(let j=0;j<segs;j++){a+=rnd(-.5,.5);const l=(5+Math.random()*9)*size;x+=Math.cos(a)*l;y+=Math.sin(a)*l;pts.push([x,y]);
      if(j===1&&Math.random()<.6){const b=a+rnd(.6,1.1)*(Math.random()<.5?1:-1),bl=l*.7;pts.push([x+Math.cos(b)*bl,y+Math.sin(b)*bl],[x,y]);}}
    paths.push(pts);}
  return paths;
}
function drawDecals(b,c,M){
  ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);ctx.lineCap='round';ctx.lineJoin='round';
  const snowy=c.mat==='snow'||c.mat==='ice';
  for(const d of c.dec){
    if(d.t==='crack'){
      ctx.save();ctx.translate(d.x,d.y);
      for(const off of [[1,1.4,'rgba(255,255,255,.3)',1.6],[0,0,'rgba(18,10,6,.9)',2.2]]){
        ctx.strokeStyle=off[2];ctx.lineWidth=off[3];ctx.beginPath();
        for(const p of d.p){ctx.moveTo(p[0][0]+off[0],p[0][1]+off[1]);for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0]+off[0],p[i][1]+off[1]);}
        ctx.stroke();}
      ctx.restore();
    }else if(d.t==='dent'){
      const r=d.r,g=ctx.createRadialGradient(d.x-r*.22,d.y-r*.28,r*.08,d.x,d.y,r);
      g.addColorStop(0,snowy?'rgba(40,70,120,.46)':'rgba(0,0,0,.5)');g.addColorStop(.7,snowy?'rgba(70,100,150,.26)':'rgba(0,0,0,.24)');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(d.x,d.y,r,0,6.3);ctx.fill();
      ctx.lineWidth=1.6;ctx.strokeStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.arc(d.x,d.y,r*.9,3.3,4.8);ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(d.x,d.y,r*.9,.15,1.7);ctx.stroke();
    }else{
      ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;ctx.beginPath();
      for(const l of d.l){ctx.moveTo(d.x+l[0],d.y+l[1]);ctx.lineTo(d.x+l[2],d.y+l[3]);}
      ctx.stroke();
    }
  }
  ctx.restore();
}
function crackPiece(b,cp,size){
  const o=addDecal(b,cp,{t:'crack',p:mkCrack(size||1)});if(o&&gate('crk',50))sfx.crack(b.custom.mat,panX(cp.x));
}

/* shovel: digs dents into blocks, crumbs fall out, weak blocks finally give way */
function digPiece(b,cp,d){
  const c=b.custom;if(!c||c.dead)return;const M=MATS[c.mat];
  const dg=M.dig!==undefined?M.dig:.3,t=performance.now();
  if(c.dz&&t-c.dz<95)return;
  if(c.dz&&Math.hypot(c.dzx-cp.x,c.dzy-cp.y)<7&&t-c.dz<300)return;
  c.dz=t;c.dzx=cp.x;c.dzy=cp.y;
  if(c.a0===undefined)c.a0=c.area;
  const pan=panX(cp.x);
  if(dg<.15){
    const l=[];for(let i=0;i<3;i++){const a=Math.atan2(d.y,d.x)+rnd(-.4,.4),s=rnd(3,7),ox=rnd(-4,4),oy=rnd(-4,4);l.push([ox,oy,ox+Math.cos(a)*s,oy+Math.sin(a)*s]);}
    addDecal(b,cp,{t:'scratch',l});
    for(let i=0;i<3;i++)part(cp.x,cp.y,rnd(-3,3)+d.x*2,rnd(-3,-.5),rnd(10,18),rnd(1.3,2),'#ffe9a8',2,.15,.95);
    sfx.dig(c.mat,pan);return;
  }
  const r=(7+Math.random()*6)*(.75+dg*.55);
  addDecal(b,cp,{t:'dent',r});S.stats.digs=(S.stats.digs||0)+1;
  const rem=Math.min(c.area*.4,(55+Math.random()*80)*dg*(dg>.8?1.3:1));
  c.area-=rem;
  crumbleArea(cp,rem,c.mat,{x:d.x*2.2,y:d.y*2.2});
  sfx.dig(c.mat,pan);
  if(c.area<c.a0*(dg>.8?.22:.55)&&pieces.indexOf(b)>=0){
    const pos={x:b.position.x,y:b.position.y},area=Math.max(c.area,60),mat=c.mat;
    removePiece(b);wakeNear(pos.x);crumbleArea(pos,area,mat);burst(pos.x,pos.y,M.c,10,3.5,3.5,5);sfx.brk(mat,area,pan);
  }
}

/* aura styles – one per look, they follow the cut line */
const AURA={
 spark(x,y,sk){part(x+rnd(-9,9),y+rnd(-9,9),rnd(-.5,.5),rnd(-1.4,-.3),rnd(28,50),rnd(1.2,2.6),Math.random()<.5?sk.a:sk.b,Math.random()<.35?6:4,-.012,.985);},
 stars(x,y,sk){
   part(x+rnd(-8,8),y+rnd(-6,6),rnd(-.4,.4),rnd(-1.8,-.6),rnd(34,58),rnd(2.6,5),Math.random()<.5?sk.a:'#fff',6,-.02,.985);
   if(Math.random()<.5)part(x+rnd(-14,14),y+rnd(-14,14),rnd(-.5,.5),rnd(.4,1.6),rnd(30,52),rnd(1.4,2.4),sk.b,2,.04,.98);
   if(Math.random()<.22)part(x,y,0,0,12,rnd(9,15),'#fff',6,0);},
 bolt(x,y,sk){
   for(let i=0;i<2;i++){const a=Math.random()*6.283,s=rnd(4,10);part(x,y,Math.cos(a)*s,Math.sin(a)*s,rnd(7,14),rnd(1.4,2.4),i?sk.a:'#fff',2,0,.9);}
   if(Math.random()<.55)part(x+rnd(-8,8),y+rnd(-8,8),rnd(-1.2,1.2),rnd(-1.6,.2),rnd(22,40),rnd(1.6,3),sk.b,4,0,.97);},
 void(x,y,sk){
   const a=Math.random()*6.283,r=rnd(24,44);part(x+Math.cos(a)*r,y+Math.sin(a)*r,-Math.cos(a)*2.2,-Math.sin(a)*2.2,rnd(12,18),rnd(2.2,4),Math.random()<.5?sk.b:sk.a,4,0,.96);
   if(Math.random()<.35)part(x+rnd(-10,10),y+rnd(-10,10),rnd(-.4,.4),rnd(-.6,.2),rnd(30,46),rnd(10,18),'#1a0f3a',3,-.004,.99);
   if(Math.random()<.16)ring(x,y,34);},
 flame(x,y,sk){
   part(x+rnd(-8,8),y+rnd(-4,6),rnd(-.6,.6),rnd(-2.6,-1),rnd(24,44),rnd(3,6),Math.random()<.5?'#ff7a1a':'#ffd24a',4,-.03,.985);
   if(Math.random()<.4)part(x+rnd(-8,8),y-4,rnd(-.4,.4),rnd(-1.6,-.6),rnd(34,56),rnd(9,16),'#3a2a24',3,-.02,.99);
   if(Math.random()<.3)part(x,y,rnd(-3,3),rnd(-4,-1),rnd(14,24),rnd(1.4,2.2),'#ffe9a8',2,.1,.96);},
 ribbon(x,y,sk){
   const cols=['#7dffc4','#4fb3ff','#b06bff','#ff7ad9'],c=cols[Math.floor(Math.random()*4)];
   part(x+rnd(-6,6),y+rnd(-6,6),rnd(-1.6,1.6),rnd(-1.1,-.2),rnd(46,74),rnd(2.6,4.6),c,4,-.006,.99);
   if(Math.random()<.3)part(x+rnd(-12,12),y+rnd(-12,12),rnd(-.5,.5),rnd(-.5,.5),rnd(40,60),rnd(6,11),c,5,0,.99);}
};

/* ======================================================================
   PART 5 – network: server link, cloud save, polling, code hashing
   The game itself is fully playable offline. Accounts, friends, the
   player list and duels need the server (server.js) and internet.
   ====================================================================== */

/* ---- SHA-256 (sync, tiny) – used to keep redeem codes secret in the source ---- */
function sha256(str){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const b=[];const u=unescape(encodeURIComponent(str));for(let i=0;i<u.length;i++)b.push(u.charCodeAt(i));
  const bl=b.length*8;b.push(0x80);while(b.length%64!==56)b.push(0);
  for(let i=7;i>=0;i--)b.push(i>=4?0:(bl>>>(i*8))&255);
  let h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const rr=(x,n)=>(x>>>n)|(x<<(32-n));
  for(let o=0;o<b.length;o+=64){
    const w=new Array(64);
    for(let i=0;i<16;i++)w[i]=(b[o+i*4]<<24)|(b[o+i*4+1]<<16)|(b[o+i*4+2]<<8)|b[o+i*4+3];
    for(let i=16;i<64;i++){const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3),s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
    let [a,bb,c,d,e,f,g,hh]=h;
    for(let i=0;i<64;i++){const S1=rr(e,6)^rr(e,11)^rr(e,25),ch=(e&f)^(~e&g),t1=(hh+S1+ch+K[i]+w[i])|0,S0=rr(a,2)^rr(a,13)^rr(a,22),mj=(a&bb)^(a&c)^(bb&c),t2=(S0+mj)|0;
      hh=g;g=f;f=e;e=(d+t1)|0;d=c;c=bb;bb=a;a=(t1+t2)|0;}
    h=[(h[0]+a)|0,(h[1]+bb)|0,(h[2]+c)|0,(h[3]+d)|0,(h[4]+e)|0,(h[5]+f)|0,(h[6]+g)|0,(h[7]+hh)|0];
  }
  return h.map(x=>('00000000'+(x>>>0).toString(16)).slice(-8)).join('');
}
const codeHash=c=>sha256('sw|'+c).slice(0,20);

/* ---- server link ---- */
const Net={
  base:'',enabled:false,up:false,tok:'',st:null,offset:0,lastPoll:0,ownerName:'',players:null,playersT:0,
  init(){
    let s='';try{s=localStorage.getItem('sw2_srv')||'';}catch(e){}
    this.base=s.replace(/\/+$/,'');
    this.enabled=!!this.base||location.protocol==='http:'||location.protocol==='https:';
    try{this.ownerName=localStorage.getItem('sw2_ownername')||'';}catch(e){}
  },
  setBase(s){s=String(s||'').trim().replace(/\/+$/,'');try{if(s)localStorage.setItem('sw2_srv',s);else localStorage.removeItem('sw2_srv');}catch(e){}this.init();return this.ping();},
  async req(method,path,body,ms){
    if(!this.enabled)return{ok:false,error:'offline',status:0};
    const c=new AbortController(),to=setTimeout(()=>c.abort(),ms||9000);
    try{
      const r=await fetch(this.base+path,{method,headers:Object.assign({'Content-Type':'application/json'},this.tok?{Authorization:'Bearer '+this.tok}:{}),body:method==='POST'?JSON.stringify(body||{}):undefined,signal:c.signal,cache:'no-store'});
      let j={};try{j=await r.json();}catch(e){}
      this.setUp(true);j.status=r.status;
      if(r.status===401&&j.error==='auth'&&this.tok)authLost();
      return j;
    }catch(e){this.setUp(false);return{ok:false,error:'offline',status:0};}
    finally{clearTimeout(to);}
  },
  get(p,ms){return this.req('GET',p,null,ms);},
  post(p,b,ms){return this.req('POST',p,b,ms);},
  setUp(v){if(v!==this.up){this.up=v;netChanged();}},
  async ping(){
    const r=await this.req('GET','/api/ping',null,4500);
    if(r.ok&&r.game==='schnittwerk'){this.offset=r.time-Date.now();if(r.ownerName){this.ownerName=r.ownerName;try{localStorage.setItem('sw2_ownername',r.ownerName);}catch(e){}}return r;}
    if(!r.ok&&r.error!=='offline')this.setUp(false);
    return r;
  },
  now(){return Date.now()+this.offset;}
};

/* what the server (and other players) may see about me */
function makePub(){
  const P=S.prof;let bestNo=0,best='';
  MAPS.forEach((m,i)=>{if(S.mapsDone[m.id]){bestNo=i+1;best=m.id;}});
  return{coins:Math.floor(S.coins),stats:S.stats,maps:Object.keys(S.mapsDone).length,bestNo,best,ms:Object.keys(P.done).length,time:S.stats.time|0,
    tools:TOOL_ORDER.filter(t=>S.toolsOwned[t]),skins:Object.keys(S.skins),upg:S.upg,frame:P.frame,nameFx:P.nameFx,color:P.color,badge:P.badge,title:P.title,bio:P.bio};
}
let syncBusy=false;
async function cloudPush(withSave){
  if(!ACC||!Net.tok||!Net.up||syncBusy)return false;
  syncBusy=true;
  const body={pub:makePub()};
  if(withSave!==false)body.save={t:S.t||Date.now(),data:S};
  const r=await Net.post('/api/sync',body);
  syncBusy=false;if(r.ok)netDirty=false;return !!r.ok;
}
/* on login: the newer save (device vs. server) wins */
async function cloudPull(){
  const r=await Net.get('/api/save');
  if(!r.ok||!r.save||!r.save.data)return false;
  if((r.save.t||0)>(S.t||0)){
    try{localStorage.setItem(saveKey(),JSON.stringify(r.save.data));}catch(e){}
    loadSave();fixSave();return true;
  }
  return false;
}
/* adjustments = coins the server moved for me (duel payouts and refunds) */
function applyAdj(list){
  let changed=false,net=0,win=false;
  for(const a of list||[]){
    if(a.id<=S.net.adjSeen)continue;
    S.net.adjSeen=a.id;S.coins=Math.max(0,S.coins+a.d);net+=a.d;changed=true;
    if(a.why==='duel_win'){win=true;S.stats.duelsWon=(S.stats.duelsWon||0)+1;}
  }
  if(changed){updateCoins();save();if(net>0&&!Duel.busy())toast(tr('coins_in',fmt(net)),'coin');}
  return {changed,win};
}

/* ======================================================================
   PART 6 – UI core: helpers, toasts, dialogs, PIN pad, language,
   avatars, titles, milestones, save sanity
   ====================================================================== */
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $$=(q,r)=>Array.from((r||document).querySelectorAll(q));
const obj=(o,k)=>(o[k]&&typeof o[k]==='object')?o[k]:(o[k]={});
const canHover=!!(window.matchMedia&&matchMedia('(hover:hover)').matches);
sfx.tick=function(){if(gate('tick',60))tone(vr(300,.1),.04,'square',.04);};
const dateStr=ts=>{try{return new Date(ts).toLocaleDateString(LANGS[LI][0],{day:'2-digit',month:'short',year:'numeric'});}catch(e){return new Date(ts).toDateString();}};
const durStr=s=>{s=Math.floor(s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+'h '+m+'m':m+'m';};
const agoStr=ts=>{const d=Math.max(0,(Date.now()-ts)/1000);return d<90?tr('t_now'):d<3600?Math.floor(d/60)+'m':d<86400?Math.floor(d/3600)+'h':Math.floor(d/86400)+'d';};
const isOwner=()=>!!ACC&&ACC.id===1;
const isTeam=()=>!!ACC&&ACC.id<=4;
const isFounder=()=>!!ACC&&ACC.id>=1&&ACC.id<=10;
const dispName=()=>ACC?ACC.name:tr('guest_name');

/* ---- more icons ---- */
Object.assign(IC,{
 x:'<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
 warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 17.6v.4" stroke="#0009" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
 info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.2v.4" stroke="#0009" stroke-width="2.6" stroke-linecap="round" fill="none"/>',
 bell:'<path d="M12 3a6 6 0 016 6v4l2 3H4l2-3V9a6 6 0 016-6z"/><path d="M10 19a2 2 0 004 0z"/>',
 eye:'<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2"/>',
 eyeoff:'<path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" opacity=".55"/><path d="M3.5 3.5l17 17" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" fill="none"/>',
 user:'<circle cx="12" cy="8" r="4.5"/><path d="M3.5 21c.8-5 4.2-7 8.5-7s7.7 2 8.5 7z"/>',
 users:'<circle cx="9" cy="8" r="3.8"/><path d="M2 20c.6-4.4 3.4-6 7-6s6.4 1.6 7 6z"/><circle cx="17.5" cy="9" r="3"/><path d="M17 14c3 0 4.6 1.4 5 5h-4.6c-.2-2-.8-3.6-2-4.6z"/>',
 trophy:'<path d="M7 3h10v6a5 5 0 01-10 0z"/><path d="M7 5H3.2v2A4 4 0 007 11M17 5h3.8v2A4 4 0 0117 11" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 14h4v4h3.5v3h-11v-3H10z"/>',
 swords:'<path d="M4 4l11 11M20 4L9 15" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M13 16l3 3M11 16l-3 3M15 14l3-.5M9 14l-3-.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>',
 plus:'<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/>',
 send:'<path d="M3 11.5L21 3l-6 18-3.5-7z"/>',
 key:'<circle cx="8" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12.5 12H22M18 12v4M21.5 12v3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>',
 shield:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
 search:'<circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M15.5 15.5L21 21" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" fill="none"/>',
 refresh:'<path d="M20 12a8 8 0 01-14 5.3M4 12A8 8 0 0118 6.7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M19 3v4.5h-4.5M5 21v-4.5h4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
 edit:'<path d="M4 20l1-5L16 4l4 4L9 19z"/>',
 clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6.5V12l3.5 2" stroke="#0009" stroke-width="2.4" stroke-linecap="round" fill="none"/>',
 flask:'<path d="M9 3h6M10 3v6L4 20h16l-6-11V3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M7 15h10l2.4 5H4.6z"/>',
 ribbon:'<path d="M6 2h12v13l-6-3.5L6 15z"/><path d="M7 15l-2 7 7-3 7 3-2-7" opacity=".55"/>',
 globe:'<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19" fill="none" stroke="currentColor" stroke-width="1.8"/>',
 trash:'<path d="M5 7h14l-1.2 14H6.2zM9 7V4h6v3M3 7h18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.5M3.5 12h.5M3.5 18h.5" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" fill="none"/>'
});

/* ---- toasts (stacked, typed, with a timer bar) ---- */
const TOAST_IC={ok:'check',err:'x',warn:'warn',info:'info',ms:'star',coin:'coinplus',ping:'bell',title:'ribbon'};
function toast(t,type,ms){
  type=type||'info';const box=$('toasts');if(!box)return;
  const last=box.lastElementChild;if(last&&last.dataset.t===t&&last.dataset.k===type){last.classList.remove('pulse');void last.offsetWidth;last.classList.add('pulse');return;}
  const e=document.createElement('div');e.className='toast t-'+type;e.dataset.t=t;e.dataset.k=type;
  e.innerHTML='<span class="ti">'+svg(TOAST_IC[type]||'info')+'</span><span class="tx">'+esc(t)+'</span><i class="tb"></i>';
  box.appendChild(e);while(box.children.length>3)box.firstElementChild.remove();
  const life=ms||2900;e.querySelector('.tb').style.animationDuration=life+'ms';
  requestAnimationFrame(()=>e.classList.add('in'));
  setTimeout(()=>{e.classList.remove('in');e.classList.add('out');setTimeout(()=>e.remove(),340);},life);
}

/* ---- press feedback: buttons go down the moment they are touched ---- */
const RIP_SEL='.btn,.ibtn,.tbtn,.trb,.dtog,.tile,.mcard,#shopTabs button,.seg button,.tabs button,.key,.eye';
const PRESS_SEL=RIP_SEL+',.pchip,.cdot,.prow';
let pressEl=null;
function unpress(){if(pressEl){pressEl.classList.remove('pressed');pressEl=null;}}
document.addEventListener('pointerdown',e=>{
  const el=e.target.closest&&e.target.closest(PRESS_SEL);if(!el||el.disabled)return;
  unpress();pressEl=el;el.classList.add('pressed');
  if(el.matches(RIP_SEL)){
    const r=el.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,s=document.createElement('span');
    s.className='rip';s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';
    el.appendChild(s);setTimeout(()=>s.remove(),600);
  }
  if(el.matches('.btn,.ibtn,.tbtn,.key,.tile,.mcard'))sfx.press();
},true);
document.addEventListener('pointermove',e=>{
  if(!pressEl)return;const r=pressEl.getBoundingClientRect(),m=10;
  if(e.clientX<r.left-m||e.clientX>r.right+m||e.clientY<r.top-m||e.clientY>r.bottom+m)unpress();
},true);
for(const ev of ['pointerup','pointercancel','dragend','blur'])window.addEventListener(ev,unpress,true);
if(canHover)document.addEventListener('mouseover',e=>{
  if(navigator.userActivation&&!navigator.userActivation.hasBeenActive)return;
  const el=e.target.closest&&e.target.closest(RIP_SEL+',.cdot,.pchip,.prow');
  if(el&&!el.disabled&&!el.contains(e.relatedTarget))sfx.hover();
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role=button]')){e.preventDefault();e.target.click();}
});
document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

/* ---- modal dialogs ---- */
let dlgRes=null,dlgBtns=[],dlgKey=null;
function closeDialog(v){
  const el=$('dlg');if(!el.classList.contains('show'))return;
  el.classList.remove('show');const r=dlgRes;dlgRes=null;dlgBtns=[];
  if(dlgKey){document.removeEventListener('keydown',dlgKey,true);dlgKey=null;}
  if(v!==undefined&&v!==null&&v!=='__x')sfx.close();
  if(r)r(v===undefined||v==='__x'?null:v);
}
function dialog(o){
  if($('dlg').classList.contains('show'))closeDialog(null);
  return new Promise(res=>{
    dlgRes=res;dlgBtns=o.buttons||[];
    const box=$('dlgBox');box.className='mbox '+(o.cls||'');box.dataset.lock=o.lock?'1':'0';
    box.innerHTML=(o.title?'<h3>'+(o.icon?'<span class="mi">'+svg(o.icon)+'</span>':'')+'<span>'+esc(o.title)+'</span></h3>':'')+'<div class="mb">'+(o.html||'')+'</div>'+
      (dlgBtns.length?'<div class="mbtn">'+dlgBtns.map((b,i)=>'<button class="btn '+(b.cls||'')+'" data-b="'+i+'">'+b.t+'</button>').join('')+'</div>':'');
    $$('#dlgBox [data-b]').forEach(b=>{b.onclick=()=>{const bt=dlgBtns[+b.dataset.b];if(bt.keep){bt.fn&&bt.fn();return;}sfx.click();closeDialog(bt.v===undefined?true:bt.v);};});
    $('dlg').classList.add('show');sfx.open();
    dlgKey=e=>{if(e.key==='Escape'&&o.dismiss!==false){e.preventDefault();e.stopPropagation();sfx.back();closeDialog(null);}};
    document.addEventListener('keydown',dlgKey,true);
    if(o.onOpen)o.onOpen(box);
    const f=box.querySelector('[data-focus]');if(f&&canHover)f.focus();
  });
}
$('dlg').addEventListener('pointerdown',e=>{if(e.target===$('dlg')&&dlgRes&&$('dlgBox').dataset.lock!=='1'){sfx.back();closeDialog(null);}});
const confirmBox=(title,text,yes,no,icon)=>dialog({title,icon,html:'<p class="mp">'+esc(text)+'</p>',buttons:[{t:esc(no||tr('cancel')),cls:'alt',v:false},{t:esc(yes||tr('ok')),v:true}]});

/* ---- PIN pad (also accepts the keyboard) ---- */
function askPin(o){
  return new Promise(res=>{
    let val='',done=false;
    const html='<p class="mp" id="pinSub">'+esc(o.sub||'')+'</p><div class="pinv'+(o.bad?' bad':'')+'" id="pinDots"><i></i><i></i><i></i><i></i></div><div class="pinm" id="pinMsg">'+esc(o.msg||'')+'</div>'+
      '<div class="pad">'+[1,2,3,4,5,6,7,8,9,'x',0,'ok'].map(k=>k==='x'?'<button class="key alt" data-k="del" aria-label="⌫">'+svg('back')+'</button>':k==='ok'?'<button class="key alt" data-k="cancel" aria-label="✕">'+svg('x')+'</button>':'<button class="key" data-k="'+k+'">'+k+'</button>').join('')+'</div>';
    const upd=()=>{$$('#pinDots i').forEach((d,i)=>d.classList.toggle('on',i<val.length));};
    const push=d=>{if(done||val.length>=4)return;val+=d;sfx.key(+d);upd();if(val.length===4){done=true;setTimeout(()=>{closeDialog('__pin');res(val);},140);}};
    const del=()=>{if(done||!val.length)return;val=val.slice(0,-1);sfx.keyDel();upd();};
    const cancel=()=>{if(done)return;done=true;sfx.back();closeDialog('__x');res(null);};
    dialog({title:o.title,icon:'key',html,cls:'pin',buttons:[],dismiss:false,lock:true,onOpen:box=>{
      $$('#dlgBox .key').forEach(b=>{b.onclick=()=>{const k=b.dataset.k;if(k==='del')del();else if(k==='cancel')cancel();else push(k);};});
      const kd=e=>{if(!$('dlg').classList.contains('show'))return;if(/^\d$/.test(e.key)){e.preventDefault();e.stopPropagation();push(e.key);}else if(e.key==='Backspace'){e.preventDefault();e.stopPropagation();del();}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();cancel();}};
      document.addEventListener('keydown',kd,true);
      const chk=setInterval(()=>{if(!$('dlg').classList.contains('show')||done){document.removeEventListener('keydown',kd,true);clearInterval(chk);}},200);
    }}).then(()=>{if(!done){done=true;res(null);}});
  });
}

/* ---- language ---- */
function detectLang(){
  try{if(localStorage.getItem(LANG_KEY))return;}catch(e){}
  const c=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||'en'];
  for(const l of c){const i=LANGS.findIndex(x=>x[0]===String(l).slice(0,2).toLowerCase());if(i>=0){LI=i;return;}}
}
function applyLang(refresh){
  const code=LANGS[LI][0],de=document.documentElement;de.lang=code;de.dir=code==='ar'?'rtl':'ltr';
  $$('[data-i]').forEach(e=>{e.textContent=tr(e.dataset.i);});
  $('lUser').placeholder=tr('username');$('lPass').placeholder=tr('password');
  $('lLogin').textContent=tr('login');$('lReg').textContent=tr('register');$('lGuest').textContent=tr('guest');$('lNote').textContent=tr('login_note');
  $('mPlay').innerHTML=svg('play')+'<span>'+tr('maps')+'</span>';
  $('mField').innerHTML=svg('knife')+'<span>'+tr('field')+'</span>';
  $('mSocial').innerHTML=svg('users')+'<span>'+tr('friends')+'</span><b class="nb" id="socBadge"></b>';
  $('mShop').innerHTML=svg('cart')+'<span>'+tr('shop')+'</span>';
  $('mSet').innerHTML=svg('gear')+'<span>'+tr('settings')+'</span>';
  $('menuVer').textContent=tr('version',VERSION);
  $('btnCollect').innerHTML=svg('magnet')+' '+tr('collect_all');
  $('cMenu').innerHTML=svg('home')+' '+tr('menu_btn');$('cNext').innerHTML=svg('play')+' '+tr('next');
  $('codesBtn').textContent=tr('codes_btn');
  $('mapsBack').setAttribute('aria-label',tr('menu_btn'));$('hHome').setAttribute('aria-label',tr('menu_btn'));
  $('hShop').setAttribute('aria-label',tr('shop'));$('hSet').setAttribute('aria-label',tr('settings'));
  $('lEye').setAttribute('aria-label',tr('show_pw'));
  if(refresh)refreshUI();
}
function setLang(i){LI=i;try{localStorage.setItem(LANG_KEY,LANGS[i][0]);}catch(e){}applyLang(true);}

/* ---- avatars, names, titles ---- */
const FOUNDER=['f1','f2','f3'];
const ownsFrame=f=>f==='none'||isTeam()||!!S.prof.own.f[f]||(FOUNDER.includes(f)&&isFounder());
const ownsName=n=>n==='none'||isTeam()||!!S.prof.own.n[n];
const ownsBadge=b=>!b||isTeam()||!!S.prof.own.b[b];
const ownsTitle=k=>{const T=TITLE(k);if(!T)return false;if(k==='owner')return isOwner();if(k==='team')return !!ACC&&ACC.id>=2&&ACC.id<=4;return !!S.prof.own.t[k]||isTeam();};
const badgeName=b=>TOOLS[b]?toolName(b):tr('b_'+b);
const titleName=k=>tr('ti_'+k);
function avX(p,size,o){
  o=o||{};const fr=p.frame||'none',bd=o.badge===undefined?p.badge:o.badge;
  const num=(o.pill!==false&&FOUNDER.includes(fr)&&p.id)?' data-n="'+p.id+'"':'';
  return '<div class="av'+(fr!=='none'?' fr-'+fr:'')+'" style="--s:'+size+'px;--fc:'+(p.color||'#ffb02e')+'"'+num+'><div class="in">'+esc(String(p.name||'?').charAt(0))+'</div>'+(bd?'<div class="bd">'+svg(bd)+'</div>':'')+'</div>';
}
function nmX(p,fx,text){
  fx=fx===undefined?p.nameFx:fx;const t=text===undefined?p.name:text;
  return '<span class="nm'+(fx&&fx!=='none'?' nm-'+fx:'')+'" data-text="'+esc(t)+'" style="--fc:'+(p.color||'#ffb02e')+'">'+esc(t)+'</span>';
}
const titleHtml=k=>k&&TITLE(k)?'<span class="tt tt-'+k+'" data-text="'+esc(titleName(k))+'">'+esc(titleName(k))+'</span>':'';
const me_=()=>({id:ACC?ACC.id:0,name:dispName(),frame:S.prof.frame,nameFx:S.prof.nameFx,color:S.prof.color,badge:S.prof.badge,title:S.prof.title});
function avatar(size,o){const m=me_();if(o&&o.frame!==undefined)m.frame=o.frame;return avX(m,size,o);}
const nameHtml=(fx,text)=>nmX(me_(),fx,text);

/* ---- save sanity (older / damaged saves, new fields) ---- */
function fixSave(){
  const P=obj(S,'prof');obj(P,'own');obj(P.own,'f');obj(P.own,'n');obj(P.own,'b');obj(P.own,'t');obj(P,'done');obj(S,'net');
  if(!(S.net.adjSeen>=0))S.net.adjSeen=0;
  P.own.f.none=1;P.own.n.none=1;
  obj(S,'stats');for(const k of ['cuts','crumbs','bombs','hammers','lasers','saws','digs','earned','time','duelsWon','duelsLost'])if(!(S.stats[k]>=0))S.stats[k]=0;
  obj(S,'upg');for(const k in UPG)S.upg[k]=clamp(Math.round(+S.upg[k]||0),0,5);
  obj(S,'toolsOwned');S.toolsOwned.hand=1;S.toolsOwned.knife=1;
  obj(S,'inv');obj(S,'skins');obj(S,'codes');obj(S,'mapsDone');S.skins.steel=1;
  const st=obj(S,'settings');
  st.vol=clamp(+st.vol,0,1);if(!isFinite(st.vol))st.vol=.8;
  st.quality=clamp(Math.round(+st.quality),0,3);if(!isFinite(st.quality))st.quality=1;
  st.shader=clamp(Math.round(+st.shader),0,3);if(!isFinite(st.shader))st.shader=1;
  st.blur=st.blur?1:0;st.haptic=st.haptic?1:0;st.hotbar=st.hotbar===0?0:1;
  if(!COLORS.includes(P.color))P.color=COLORS[0];
  if(!(FRAME_FX.includes(P.frame)||FOUNDER.includes(P.frame))||!ownsFrame(P.frame))P.frame='none';
  if(!NAME_FX.includes(P.nameFx)||!ownsName(P.nameFx))P.nameFx='none';
  if(P.badge&&(!BADGES.includes(P.badge)||!ownsBadge(P.badge)))P.badge='';
  if(P.title&&!ownsTitle(P.title))P.title='';
  P.bio=typeof P.bio==='string'?P.bio.slice(0,140):'';
  if(!SKINS[S.skin]||!S.skins[S.skin])S.skin='steel';
}

/* ---- milestones ---- */
const MS_IC={cuts:'knife',saws:'saw',digs:'shovel',crumbs:'coin',earned:'coinplus',maps:'star',bombs:'bomb',hammers:'hammer',lasers:'laser',tools:'gear',time:'clock',duelsWon:'trophy'};
function statVal(k){
  if(k==='maps')return Object.keys(S.mapsDone).length;
  if(k==='tools')return TOOL_ORDER.filter(t=>S.toolsOwned[t]).length;
  return S.stats[k]||0;
}
const goalText=(k,n)=>k==='time'?durStr(n):fmt(n);
function rewardTags(m){
  const r=m.r,t=[];
  if(r.t)t.push(tr('eq_title')+': '+titleName(r.t));
  if(r.f)t.push(tr('eq_frame')+': '+tr('fx_'+r.f));
  if(r.n)t.push(tr('eq_name')+': '+tr('fx_'+r.n));
  if(r.b)t.push(tr('eq_badge')+': '+badgeName(r.b));
  if(r.c)t.push(tr('eq_coins')+': +'+fmt(r.c));
  return t.map(x=>'<span class="tag">'+esc(x)+'</span>').join('');
}
/* milestones start paying out from player #5 on (#1-#4 are the team and own everything) */
function checkMs(){
  if(!S||!S.prof||labMode)return;
  const P=S.prof,got=[],newT=[];
  for(const m of MSL){
    const key=m.k+':'+m.n;if(P.done[key]||statVal(m.k)<m.n)continue;
    P.done[key]=Date.now();got.push(tr('mt_'+m.k));const r=m.r;
    if(r.f){P.own.f[r.f]=1;if(P.frame==='none')P.frame=r.f;}
    if(r.n){P.own.n[r.n]=1;if(P.nameFx==='none')P.nameFx=r.n;}
    if(r.b){P.own.b[r.b]=1;if(!P.badge)P.badge=r.b;}
    if(r.t&&!P.own.t[r.t]){P.own.t[r.t]=Date.now();newT.push(r.t);if(!P.title)P.title=r.t;}
    if(r.c)addCoins(r.c,false);
  }
  if(!got.length)return;
  saveSoon();sfx.milestone();vib([30,40,30]);
  toast(tr('ms_reached',got.join(', ')),'ms',3400);
  if(newT.length)setTimeout(()=>{sfx.title();toast(tr('title_new',titleName(newT[0])),'title',3400);},900);
  renderProfChip();if(ovStack.includes('profile'))renderProfile();
}

/* ======================================================================
   PART 7 – accounts (server), screens, shop, settings, codes, profile
   ====================================================================== */
const getSession=()=>{try{return JSON.parse(localStorage.getItem(SES_KEY));}catch(e){return null;}};
const setSession=()=>{try{localStorage.setItem(SES_KEY,JSON.stringify(ACC?{id:ACC.id,name:ACC.name,owner:!!ACC.owner,joined:ACC.joined||0,pin:!!ACC.pin,tok:Net.tok}:{g:1}));}catch(e){}};
const clearSession=()=>{try{localStorage.removeItem(SES_KEY);}catch(e){}};
function restoreSession(){
  const s=getSession();ACC=null;Net.tok='';
  if(s&&s.tok&&s.id){ACC={id:s.id,name:s.name,owner:!!s.owner,joined:s.joined||0,pin:!!s.pin};Net.tok=s.tok;return true;}
  return !!(s&&s.g);
}
let authBusy=false;
function authLost(){
  if(!ACC||authBusy)return;authBusy=true;
  setTimeout(()=>{
    clearTimeout(saveT);save();ACC=null;Net.tok='';clearSession();loadSave();fixSave();Net.st=null;
    closeDialog(null);closeAllOverlays();show('login');toast(tr('session_over'),'warn',4200);authBusy=false;
  },50);
}

/* ---- login screen ---- */
const errKey=e=>({name_invalid:'e_user',pass_invalid:'e_pass',name_taken:'e_taken',bad_login:'e_wrong',pw_wrong:'e_wrong',locked:'e_later',full:'e_full',slow_down:'e_slow',offline:'e_offline',auth:'e_wrong',poor:'e_poor',friend_poor:'e_friend_poor',friend_busy:'e_friend_busy',friend_offline:'e_friend_offline',busy:'e_busy',not_friends:'e_notfriends',stake_low:'e_stake',pin_exists:'e_server',pin_invalid:'e_pin_fmt'}[e]||'e_server');
function authErr(k,a){
  const m=$('lMsg');m.style.color='var(--bad)';m.textContent=k?tr(k,a):'';
  if(k){sfx.error();const c=$('login').querySelector('.card');c.classList.remove('shake');void c.offsetWidth;c.classList.add('shake');}
}
function setBusy(on){['lLogin','lReg','lGuest'].forEach(i=>{$(i).disabled=on;});$('login').classList.toggle('busy',on);}
async function lockedDialog(retry){
  sfx.lock();
  const mins=Math.max(1,Math.ceil((retry||60)/60));
  await dialog({title:tr('locked_t'),icon:'lock',html:'<p class="mp">'+esc(tr('e_later'))+'</p><p class="mp soft">'+esc(tr('locked_min',mins))+'</p>',buttons:[{t:tr('ok')}]});
}
async function doLogin(){
  const name=$('lUser').value.trim(),pw=$('lPass').value;
  if(!name||!pw){authErr('e_empty');return;}
  if(!Net.enabled||(!Net.up&&!(await Net.ping()).ok)){authErr('e_offline');return;}
  setBusy(true);let pin,bad=false,left=0;
  for(;;){
    const r=await Net.post('/api/login',{name,password:pw,pin});
    if(r.ok){setBusy(false);await finishAuth(r,false);return;}
    if(r.error==='pin_needed'||r.error==='pin_wrong'){
      if(r.error==='pin_wrong'){bad=true;left=r.left;sfx.pinBad();}
      pin=await askPin({title:tr('pin_enter'),sub:bad?tr('pin_left',left):tr('pin_login_sub'),bad});
      if(pin===null){setBusy(false);return;}continue;
    }
    setBusy(false);
    if(r.error==='locked'){await lockedDialog(r.retry);return;}
    authErr(errKey(r.error));return;
  }
}
async function doRegister(){
  const name=$('lUser').value.trim(),pw=$('lPass').value;
  if(!name||!pw){authErr('e_empty');return;}
  if(!/^[A-Za-z0-9_]{3,14}$/.test(name)){authErr('e_user');return;}
  if(pw.length<4){authErr('e_pass');return;}
  if(!Net.enabled||(!Net.up&&!(await Net.ping()).ok)){authErr('e_offline');return;}
  setBusy(true);const r=await Net.post('/api/register',{name,password:pw});setBusy(false);
  if(!r.ok){authErr(errKey(r.error));return;}
  await finishAuth(r,true);
}
async function finishAuth(r,isNew){
  clearTimeout(saveT);save();
  let guestRaw=null;try{guestRaw=localStorage.getItem(GUEST_KEY);}catch(e){}
  ACC={id:r.me.id,name:r.me.name,owner:!!r.me.owner,joined:r.me.joined||Date.now(),pin:!!r.me.pin};Net.tok=r.token;
  if(r.time)Net.offset=r.time-Date.now();
  if(isNew&&guestRaw){try{localStorage.setItem('sw2_acc_'+ACC.id,guestRaw);}catch(e){}}   /* the new account takes over the guest progress */
  loadSave();fixSave();
  if(!isNew)await cloudPull();
  setSession();afterLogin();sfx.login();
  cloudPush();
  if(isNew)showWelcome();else toast(tr('welcome',ACC.name),'ok');
}
function showWelcome(){
  dialog({title:tr('welcome_t'),icon:'star',cls:'welcome',html:'<div class="wid">'+avatar(76)+'<div class="wn">'+nameHtml()+'</div><div class="wnum">#'+ACC.id+'</div></div><p class="mp">'+esc(tr('welcome_id',ACC.id))+'</p>',buttons:[{t:tr('lets_go')}]});
  sfx.milestone();
}
function enterGuest(){
  clearTimeout(saveT);save();ACC=null;Net.tok='';loadSave();fixSave();setSession();afterLogin();sfx.login();
}
function afterLogin(){
  applyQuality();if(master)master.gain.value=S.settings.vol;resize();
  $('lPass').value='';$('lMsg').textContent='';
  Net.st=null;netChanged();show('menu');netKick();
}
function toggleEye(){
  const i=$('lPass'),show=i.type==='password';i.type=show?'text':'password';
  $('lEye').innerHTML=svg(show?'eyeoff':'eye');$('lEye').classList.toggle('on',show);sfx.eye(show);
}
async function logout(){
  if(!ACC){closeAllOverlays();show('login');return;}
  if(Duel.busy()){toast(tr('duel_leave_first'),'warn');return;}
  if(!ACC.pin&&Net.up){
    const v=await dialog({title:tr('pin_secure_t'),icon:'shield',html:'<p class="mp">'+esc(tr('pin_secure_x'))+'</p>',buttons:[{t:tr('pin_later'),cls:'alt',v:'skip'},{t:tr('pin_set'),v:'set'}]});
    if(v===null)return;
    if(v==='set'){const ok=await setPinFlow();if(!ok){const c=await confirmBox(tr('logout'),tr('logout_anyway'),tr('logout'),tr('cancel'),'lock');if(!c)return;}}
  }
  if(Net.up)await cloudPush();
  Net.post('/api/logout');
  clearTimeout(saveT);save();ACC=null;Net.tok='';clearSession();loadSave();fixSave();Net.st=null;
  closeAllOverlays();show('login');netChanged();sfx.close();
}

/* ---- password / PIN dialogs ---- */
function pwField(id,label,focus){return '<label class="fl">'+esc(label)+'</label><div class="pw"><input type="password" id="'+id+'" maxlength="64" autocomplete="off"'+(focus?' data-focus':'')+'><button class="eye" type="button" data-eye="'+id+'" aria-label="'+esc(tr('show_pw'))+'">'+svg('eye')+'</button></div>';}
function wireEyes(box){$$('[data-eye]',box).forEach(b=>{b.onclick=()=>{const i=$(b.dataset.eye),sh=i.type==='password';i.type=sh?'text':'password';b.innerHTML=svg(sh?'eyeoff':'eye');b.classList.toggle('on',sh);sfx.eye(sh);};});}
function askPassword(title,sub){
  return dialog({title,icon:'key',html:(sub?'<p class="mp">'+esc(sub)+'</p>':'')+pwField('dPw',tr('password'),true)+'<small class="derr" id="dErr"></small>',buttons:[{t:tr('cancel'),cls:'alt',v:null},{t:tr('ok'),keep:true,fn:()=>{const v=$('dPw').value;if(!v){$('dErr').textContent=tr('e_empty');sfx.error();return;}closeDialog({pw:v});}}],onOpen:box=>{wireEyes(box);$('dPw').addEventListener('keydown',e=>{if(e.key==='Enter'){const v=$('dPw').value;if(v)closeDialog({pw:v});}});}}).then(r=>r&&r.pw?r.pw:null);
}
async function withPin(title,fn){
  let bad=false,left=0;
  for(;;){
    const pin=await askPin({title,sub:bad?tr('pin_left',left):tr('pin_enter_sub'),bad});
    if(pin===null)return null;
    const r=await fn(pin);
    if(r.error==='pin_wrong'){bad=true;left=r.left;sfx.pinBad();continue;}
    if(r.error==='locked'){await lockedDialog(r.retry);return r;}
    return r;
  }
}
async function newPinPair(){
  const p1=await askPin({title:tr('pin_new'),sub:tr('pin_new_sub')});if(p1===null)return null;
  const p2=await askPin({title:tr('pin_again'),sub:tr('pin_again_sub')});if(p2===null)return null;
  if(p1!==p2){sfx.pinBad();toast(tr('pin_mismatch'),'err');return null;}
  return p1;
}
async function setPinFlow(){
  if(!Net.up){toast(tr('e_offline'),'err');return false;}
  const pw=await askPassword(tr('pin_set'),tr('pin_need_pw'));if(!pw)return false;
  const pin=await newPinPair();if(!pin)return false;
  const r=await Net.post('/api/pin/set',{password:pw,pin});
  if(r.ok){ACC.pin=true;setSession();sfx.pinOk();toast(tr('pin_saved'),'ok');renderSettings();return true;}
  if(r.error==='locked')await lockedDialog(r.retry);else{sfx.error();toast(tr(errKey(r.error)),'err');}
  return false;
}
async function changePinFlow(){
  const first=await withPin(tr('pin_change'),async old=>{const pin=await newPinPair();if(!pin)return{ok:false,error:'cancel'};return Net.post('/api/pin/change',{old,pin});});
  if(first&&first.ok){sfx.pinOk();toast(tr('pin_saved'),'ok');}
}
async function removePinFlow(){
  const r=await withPin(tr('pin_remove'),pin=>Net.post('/api/pin/remove',{pin}));
  if(r&&r.ok){ACC.pin=false;setSession();sfx.pinOk();toast(tr('pin_removed'),'ok');renderSettings();}
}
async function changePwFlow(){
  if(!Net.up){toast(tr('e_offline'),'err');return;}
  const v=await dialog({title:tr('pw_change'),icon:'key',html:pwField('dOld',tr('pw_old'),true)+pwField('dNew',tr('pw_new'))+pwField('dNew2',tr('pw_new2'))+'<small class="derr" id="dErr"></small>',
    buttons:[{t:tr('cancel'),cls:'alt',v:null},{t:tr('ok'),keep:true,fn:()=>{
      const o=$('dOld').value,n=$('dNew').value,n2=$('dNew2').value,err=k=>{$('dErr').textContent=tr(k);sfx.error();};
      if(!o||!n)return err('e_empty');if(n.length<4)return err('e_pass');if(n!==n2)return err('pw_mismatch');closeDialog({o,n});}}],onOpen:wireEyes});
  if(!v)return;
  let r;
  if(ACC.pin)r=await withPin(tr('pin_enter'),pin=>Net.post('/api/password',{old:v.o,new:v.n,pin}));
  else r=await Net.post('/api/password',{old:v.o,new:v.n});
  if(r===null)return;
  if(r.ok){sfx.pinOk();toast(tr('pw_changed'),'ok');}
  else if(r.error!=='locked'){sfx.error();toast(tr(errKey(r.error)),'err');}
}
async function serverDialog(){
  const cur=Net.base||'';
  const v=await dialog({title:tr('s_server'),icon:'globe',html:'<p class="mp">'+esc(tr('srv_hint'))+'</p><label class="fl">URL</label><input type="text" id="dSrv" class="lo" maxlength="120" value="'+esc(cur)+'" placeholder="https://my-server.example.com" autocapitalize="none" spellcheck="false" data-focus><small class="derr" id="dErr"></small>',
    buttons:[{t:tr('cancel'),cls:'alt',v:null},{t:tr('save_btn'),v:'save'}]});
  if(v!=='save')return;
  const val=$('dSrv')?$('dSrv').value.trim():'';
  if(val&&!/^https?:\/\//i.test(val)){toast(tr('srv_bad'),'err');return;}
  const r=await Net.setBase(val);renderSettings();
  toast(r&&r.ok?tr('srv_ok'):tr('srv_fail'),r&&r.ok?'ok':'err');
}

/* ---- screens & overlays ---- */
const ovStack=[];
function closeAllOverlays(){while(ovStack.length)$(ovStack.pop()).classList.remove('show');overlay=null;}
function endLab(){
  if(!labMode)return;labMode=false;tScale=1;
  if(labSnap){S.coins=labSnap.coins;S.stats=labSnap.stats;S.inv=labSnap.inv;labSnap=null;}
  updateCoins();$('lab').classList.remove('show');
}
let labSnap=null;
function show(name){
  closeAllOverlays();ptrs.clear();gesture=null;pinch=null;endDrag();
  if(name!=='game'){endLab();if(Duel.active&&!Duel.ended)Duel.leaveSilently();duelHold=false;$('cdown').classList.remove('show');}
  scene=name;paused=(name!=='game');
  ['login','menu','maps'].forEach(n=>$(n).classList.toggle('show',n===name));
  $('hud').classList.toggle('show',name==='game');
  canvas.style.visibility=name==='game'?'visible':'hidden';
  if(name==='maps')renderMaps();
  if(name==='menu'){renderProfChip();renderMenu();checkMs();}
  if(name==='login'){$('lMsg').textContent='';$('lPass').type='password';$('lEye').innerHTML=svg('eye');$('lEye').classList.remove('on');netChanged();if(canHover)$('lUser').focus();}
  updateCoins();
}
function openOverlay(n){
  if(ovStack.includes(n))return;
  ovStack.push(n);overlay=n;paused=true;$(n).classList.add('show');
  if(n==='shop')renderShop();else if(n==='settings')renderSettings();else if(n==='codes')renderCodes();
  else if(n==='profile'){profTab='ov';renderProfile();}
  else if(n==='complete')checkMs();
  else if(n==='social')openSocial();
  else if(n==='owner')openOwner();
}
function closeOverlay(){
  const n=ovStack.pop();if(!n)return;$(n).classList.remove('show');
  overlay=ovStack.length?ovStack[ovStack.length-1]:null;
  paused=(scene!=='game')||!!overlay;
  if(overlay==='settings')renderSettings();
  if(!overlay&&scene==='game'){renderToolbar();renderTray();updateHud();}
  checkMs();
}
function startMap(i,opt){
  opt=opt||{};
  if(opt.lab){labSnap={coins:S.coins,stats:JSON.parse(JSON.stringify(S.stats)),inv:JSON.parse(JSON.stringify(S.inv))};labMode=true;}else if(labMode){endLab();}
  show('game');
  if(opt.lab&&!labMode){labMode=true;}
  loadMap(i);
  if(opt.lab||i<0)mode='sandbox';
  if(opt.duel)mode='duel';
  if(curMap&&curMap.camY!==undefined){camera.y=curMap.camY;camera.zoom=clamp(camera.zoom*(curMap.zoomMul||1),minZoom(),2.2);clampCam();}
  renderToolbar();renderTray();updateHud();resize();
  $('lab').classList.toggle('show',!!opt.lab);tScale=1;
  $('duelHud').classList.toggle('show',!!opt.duel);
  $('pg').style.display=(mode==='map'||mode==='duel')?'block':'none';
}
function updateHud(){updateCoins();$('btnCollect').style.display='none';progT=0;$('dock').classList.toggle('min',!S.settings.hotbar);}

/* ---- maps ---- */
function mapAvail(i){return isOwner()||i===0||!!S.mapsDone[MAPS[i-1].id];}
function renderMaps(){
  $('mapGrid').innerHTML=MAPS.map((m,i)=>{
    const un=mapAvail(i),dn=S.mapsDone[m.id],T=TIERS[m.d||0];
    return '<div class="mcard'+(un?'':' lock')+'" data-m="'+i+'" role="button" tabindex="0"><div class="mprev" style="background:linear-gradient('+m.sky[0]+','+m.sky[1]+')"><div class="mgr" style="background:'+m.grass+'"></div><span class="tier" style="background:'+T[1]+'">'+esc(tr(T[0]))+'</span></div>'+
      '<div class="mbody"><b>'+(i+1)+'. '+esc(mapName(m))+'</b><small>'+esc(tr(m.id+'_d'))+'</small>'+(m.tool?'<span class="mtool">'+svg(TOOLS[m.tool].ic)+'<i>'+esc(toolName(m.tool))+'</i></span>':'')+
      '<span class="mst">'+(dn?svg('check')+' '+tr('done'):un?svg('play')+' '+esc(tr('play_r',m.reward)):svg('lock')+' '+tr('locked_prev'))+'</span></div></div>';
  }).join('');
}

/* ---- hotbar ---- */
const hasTool=k=>labMode||!!S.toolsOwned[k];
function setTool(t){tool=t;cancelGesture();$$('#toolbar .tbtn').forEach(b=>b.classList.toggle('on',b.dataset.t===t));sfx.click();}
const cdEls={};
function renderToolbar(){
  if(!hasTool(tool))tool='knife';
  let h='';
  for(const k of TOOL_ORDER){const own=hasTool(k),nm=esc(toolName(k));
    h+='<button class="tbtn'+(own?'':' lk')+(tool===k?' on':'')+'" data-t="'+k+'" aria-label="'+nm+'">'+svg(TOOLS[k].ic)+'<span>'+nm+'</span>'+
      (own?'':'<b class="lki">'+svg('lock')+'</b>')+(k==='bomb'&&own&&!labMode?'<b class="badge">'+BOMB_COST+'</b>':'')+'<i class="cd"></i></button>';}
  $('toolbar').innerHTML=h;
  for(const k in cdEls)delete cdEls[k];
  $$('#toolbar .tbtn').forEach(b=>{cdEls[b.dataset.t]=b.querySelector('.cd');});
}
function renderTray(){
  const tray=$('tray');if(mode!=='sandbox'){tray.style.display='none';return;}tray.style.display='flex';
  let h='';
  for(const it of ITEMS){const n=labMode?'∞':(S.inv[it.id]||0);h+='<button class="trb" data-it="'+it.id+'"'+(n===0?' style="opacity:.5"':'')+'><i style="background:'+MATS[it.mat].c+'"></i>'+esc(tr('i_'+it.id))+' <em>'+n+'</em></button>';}
  if(!labMode)h+='<button class="trb" data-it="_shop">'+svg('cart')+esc(tr('buy'))+'</button>';
  tray.innerHTML=h;
}
function spawnItem(it,at){
  if(!labMode&&(S.inv[it.id]||0)<1){sfx.error();toast(tr('no_item',tr('i_'+it.id)),'warn');return;}
  if(pieces.length>=MAX_PIECES){capMsg();sfx.error();return;}
  if(!gate('spawn',250))return;
  const x=at?at.x:clamp(camera.x+rnd(-100,100),-380,380),y=at?at.y:Math.max(-1400,camera.y-H/2/camera.zoom-40);
  const b=it.r?mkNgon(it.mat,x,y,it.r,16):mkBlock(it.mat,x,y,it.w,it.h,rnd(-.2,.2));
  if(!b)return;if(!labMode){S.inv[it.id]--;saveSoon();}renderTray();sfx.spawn();
}

/* ---- shop ---- */
let shopTab='tools';
const row=(ic,t,d,r,ex)=>'<div class="row"><div class="ico"'+(ex?' style="'+ex+'"':'')+'>'+ic+'</div><div class="tx"><b>'+t+'</b><small>'+d+'</small></div>'+(r||'')+'</div>';
const upgPrice=(k,l)=>Math.round(UPG[k].base*Math.pow(1.85,l));
const itemPrice=it=>Math.round(it.cost*5*.9);
const ownTag=t=>'<span class="own">'+svg('check')+t+'</span>';
const buyBtn=(a,k,txt)=>'<button class="btn sm" data-a="'+a+'" data-k="'+k+'">'+svg('coin')+txt+'</button>';
function renderShop(){
  updateCoins();
  $$('#shopTabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===shopTab));
  let h='';
  if(shopTab==='tools'){
    for(const k of ['shovel','hammer','saw','laser','bomb']){const T=TOOLS[k];
      h+=row(svg(T.ic),esc(toolName(k)),esc(toolDesc(k)),S.toolsOwned[k]?ownTag(tr('owned')):buyBtn('tool',k,fmt(T.p)));}
  }else if(shopTab==='upg'){
    for(const k in UPG){const U=UPG[k],l=S.upg[k],max=l>=5;let pips='';for(let i=0;i<5;i++)pips+='<i class="'+(i<l?'on':'')+'"></i>';
      h+='<div class="row"><div class="ico" style="color:'+U.col+'">'+svg(U.ic)+'</div><div class="tx"><b>'+esc(tr('u_'+k))+'</b><small>'+esc(tr('current',U.f(l)))+(max?'':' → '+esc(U.f(l+1)))+'</small><div class="pips">'+pips+'</div></div>'+
        (max?'<span class="own">'+tr('max')+'</span>':buyBtn('upg',k,fmt(upgPrice(k,l))))+'</div>';}
  }else if(shopTab==='items'){
    for(const it of ITEMS){
      h+='<div class="row"><div class="sw" style="background:'+MATS[it.mat].c+'"></div><div class="tx"><b>'+esc(tr('i_'+it.id))+'</b><small>'+esc(tr('in_stock',tr('m_'+it.mat),S.inv[it.id]||0))+'</small></div>'+buyBtn('item',it.id,'5× '+itemPrice(it))+'</div>';}
  }else{
    for(const k in SKINS){const K=SKINS[k],own=S.skins[k];
      h+='<div class="row"><div class="sw" style="background:linear-gradient(135deg,'+K.a+','+K.b+')'+(K.st?';box-shadow:0 0 14px '+K.b+'88':'')+'"></div><div class="tx"><b>'+esc(tr('s_'+k))+'</b><small>'+esc(tr('look_d'))+'</small><span class="tag">'+tr(['st_normal','st_neon','st_aura'][K.st||0])+'</span></div>'+
        (own?(S.skin===k?ownTag(tr('active')):'<button class="btn sm alt" data-a="equip" data-k="'+k+'">'+tr('equip')+'</button>'):K.code?'<small class="hint">'+tr('code_only')+'</small>':buyBtn('skin',k,K.p))+'</div>';}
  }
  const list=$('shopList'),y=list.scrollTop;list.innerHTML=h;list.scrollTop=y;
}
function pay(p){if(S.coins<p){sfx.error();toast(tr('no_coins'),'err');return false;}S.coins-=p;updateCoins();sfx.buy();return true;}
function shopClick(e){
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,k=b.dataset.k;
  if(a==='tool'){if(pay(TOOLS[k].p)){S.toolsOwned[k]=1;toast(tr('unlocked',toolName(k)),'ok');}}
  else if(a==='upg'){const l=S.upg[k];if(l<5&&pay(upgPrice(k,l)))S.upg[k]++;}
  else if(a==='item'){const it=ITEMS.find(x=>x.id===k);if(pay(itemPrice(it)))S.inv[k]=(S.inv[k]||0)+5;}
  else if(a==='skin'){if(pay(SKINS[k].p)){S.skins[k]=1;S.skin=k;toast(tr('unlocked',tr('s_'+k)),'ok');}}
  else if(a==='equip'){S.skin=k;sfx.equip();}
  checkMs();save();renderShop();
}

/* ---- settings ---- */
const segHtml=(items,attr,cur)=>items.map((t,i)=>'<button data-'+attr+'="'+i+'"'+(i===cur?' class="on"':'')+'>'+esc(t)+'</button>').join('');
function renderSettings(){
  const st=S.settings;
  $('segL').innerHTML=segHtml(LANGS.map(l=>l[1]),'l',LI);
  $('volR').value=st.vol;
  $('segQ').innerHTML=segHtml([tr('q0'),tr('q1'),tr('q2'),tr('q3')],'q',st.quality);
  $('segS').innerHTML=segHtml([tr('sh0'),tr('sh1'),tr('sh2'),tr('sh3')],'s',st.shader);
  $('segB').innerHTML=segHtml([tr('offb'),tr('on')],'v',st.blur?1:0);
  $('segH').innerHTML=segHtml([tr('offb'),tr('on')],'v',st.haptic?1:0);
  $('verLbl').textContent=tr('s_log',VERSION);
  $('logBox').innerHTML=LOG.map(l=>'<b>'+esc(l.v)+' · '+esc(l.t)+'</b><ul>'+l.i.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>').join('');
  $('codesBtn').style.display=isOwner()?'':'none';
  /* account block */
  const info=$('accInfo'),btns=$('accBtns');
  if(ACC){
    info.innerHTML='<div class="accrow">'+avatar(46)+'<div class="ai"><div>'+nameHtml()+'</div><small>#'+ACC.id+(ACC.owner?' · '+esc(tr('owner_tag')):'')+(ACC.pin?' · '+svg('shield')+' PIN':'')+'</small></div></div>';
    btns.innerHTML='<button class="btn sm alt" data-ac="pw">'+svg('key')+esc(tr('pw_change'))+'</button><button class="btn sm alt" data-ac="'+(ACC.pin?'pinc':'pin')+'">'+svg('shield')+esc(ACC.pin?tr('pin_change'):tr('pin_set'))+'</button>'+(ACC.pin?'<button class="btn sm alt" data-ac="pinr">'+svg('trash')+esc(tr('pin_remove'))+'</button>':'')+'<button class="btn sm bad" data-ac="out">'+svg('back')+esc(tr('logout'))+'</button>';
  }else{
    info.innerHTML='<div class="accrow">'+avatar(46)+'<div class="ai"><div>'+nameHtml()+'</div><small>'+esc(tr('guest_note'))+'</small></div></div>';
    btns.innerHTML='<button class="btn sm" data-ac="login">'+svg('user')+esc(tr('login'))+' / '+esc(tr('register'))+'</button>';
  }
  $('srvInfo').innerHTML='<span class="dot '+(Net.up?'up':'down')+'"></span><span>'+esc(Net.up?tr('net_online'):Net.enabled?tr('net_offline'):tr('net_off'))+'</span>'+(Net.base?'<small>'+esc(Net.base)+'</small>':'');
}

/* ---- codes (hashed in the game, the owner sees the plain list from the server) ---- */
function codeText(r){
  const t=[];
  if(r.coins)t.push(tr('c_coins',fmt(r.coins)));
  if(r.tool)t.push(tr('unlocked',toolName(r.tool)));
  if(r.skin)t.push(tr('c_look',tr('s_'+r.skin)));
  return t.join(', ');
}
function redeem(){
  const c=$('codeIn').value.trim().toUpperCase().replace(/\s+/g,''),m=$('codeMsg');
  const say=(k,ok,a)=>{m.style.color=ok?'var(--good)':'var(--bad)';m.textContent=tr(k,a);};
  if(!c){say('c_enter',false);sfx.deny();return;}
  const h=codeHash(c),r=CODES[h];
  if(!r){say('c_bad',false);sfx.error();return;}
  if(S.codes[h]){say('c_used',false);sfx.error();return;}
  S.codes[h]=1;const t=[];
  if(r.coins){addCoins(r.coins,false);t.push(tr('c_coins',fmt(r.coins)));}
  if(r.tool){S.toolsOwned[r.tool]=1;t.push(tr('unlocked',toolName(r.tool)));}
  if(r.skin){S.skins[r.skin]=1;t.push(tr('c_look',tr('s_'+r.skin)));}
  checkMs();save();updateCoins();sfx.unlock();sfx.pot(8);say('c_ok',true,t.join(', '));$('codeIn').value='';
}
async function renderCodes(){
  const box=$('codeList');
  if(!isOwner()){box.innerHTML='';return;}
  box.innerHTML='<div class="empty">'+esc(tr('loading'))+'</div>';
  let codes=null;
  if(Net.up){const r=await Net.get('/api/admin/codes');if(r.ok){codes=r.codes;try{localStorage.setItem('sw2_ownercodes',JSON.stringify(codes));}catch(e){}}}
  if(!codes){try{codes=JSON.parse(localStorage.getItem('sw2_ownercodes'));}catch(e){}}
  if(!codes){box.innerHTML='<div class="empty">'+esc(tr('offline_owner'))+'</div>';return;}
  box.innerHTML=Object.keys(codes).map(c=>{
    const r=codes[c],used=S.codes[codeHash(c)],ic=r.coins?'coinplus':r.tool?TOOLS[r.tool].ic:'star';
    return '<div class="row'+(used?' used':'')+'"><div class="ico">'+svg(ic)+'</div><div class="tx"><b class="code">'+esc(c)+'</b><small>'+esc(codeText(r))+'</small></div>'+
      (used?ownTag(tr('redeemed')):'<button class="btn sm alt" data-code="'+esc(c)+'">'+svg('copy')+tr('copy')+'</button>')+'</div>';
  }).join('');
}
function copyText(t){
  const done=()=>{sfx.copy();toast(tr('copied',t),'ok');};
  const fallback=()=>{const a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;left:-999px;top:0;opacity:0';document.body.appendChild(a);a.select();try{document.execCommand('copy');}catch(e){}a.remove();done();};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,fallback);else fallback();
}

/* ---- profile ---- */
let profTab='ov';
const statBox=(v,l)=>'<div class="stat"><b>'+v+'</b><small>'+esc(l)+'</small></div>';
const tile=(kind,key,inner,label,own,sel)=>'<button class="tile'+(sel?' sel':'')+(own?'':' lk')+'" data-eq="'+kind+':'+key+'"><div class="big2">'+inner+'</div><small>'+esc(label)+'</small>'+(own?'':'<span class="lkb">'+svg('lock')+'</span>')+'</button>';
function bestMapName(){let b=null;MAPS.forEach(m=>{if(S.mapsDone[m.id])b=m;});return b?mapName(b):'–';}
function renderProfile(){
  const P=S.prof,done=MSL.filter(m=>P.done[m.k+':'+m.n]).length;
  $('profHead').innerHTML=avatar(64)+'<div class="pi"><div class="pn">'+nameHtml()+'</div>'+(P.title?'<div class="pt">'+titleHtml(P.title)+'</div>':'')+'<small>'+(ACC?'#'+ACC.id:esc(tr('guest_name')))+'</small></div>';
  $$('#profTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===profTab));
  const body=$('profBody'),y=body.scrollTop;
  body.innerHTML=profTab==='ov'?profOverview():profTab==='ti'?profTitles():profTab==='ms'?profMilestones():profInventory();
  body.scrollTop=y;
}
function profOverview(){
  const P=S.prof,st=S.stats,done=MSL.filter(m=>P.done[m.k+':'+m.n]).length;
  let h='<div class="sec"><div class="bio"><div class="bio-t">'+(P.title?titleHtml(P.title):'<em>'+esc(tr('no_title'))+'</em>')+'</div><p class="bio-x">'+(P.bio?esc(P.bio):'<em>'+esc(tr('bio_empty'))+'</em>')+'</p><button class="btn sm alt" data-pa="bio">'+svg('edit')+esc(tr('bio_edit'))+'</button></div></div>';
  h+='<div class="sec"><div class="grid2">'+statBox(fmt(st.cuts),tr('st_cuts'))+statBox(fmt(st.crumbs),tr('st_crumbs'))+statBox(fmt(st.earned),tr('st_earned'))+
    statBox(statVal('maps')+' / '+MAPS.length,tr('st_maps'))+statBox(fmt(st.bombs),tr('st_bombs'))+statBox(done+' / '+MSL.length,tr('st_ms'))+
    statBox(durStr(st.time),tr('st_time'))+statBox(esc(bestMapName()),tr('st_best'))+statBox((st.duelsWon||0)+' / '+(st.duelsLost||0),tr('st_duels'))+'</div></div>';
  h+='<div class="sec"><b>'+esc(tr('p_color'))+'</b><div class="sw-row">'+COLORS.map(c=>'<button class="cdot'+(P.color===c?' sel':'')+'" data-eq="color:'+c+'" style="background:'+c+';color:'+c+'" aria-label="'+c+'"></button>').join('')+'</div></div>';
  h+='<div class="sec"><b>'+esc(tr('p_frame'))+'</b><div class="grid">'+FRAME_FX.map(f=>tile('frame',f,avatar(46,{frame:f,badge:'',pill:false}),f==='none'?tr('p_none'):tr('fx_'+f),ownsFrame(f),P.frame===f)).join('')+'</div></div>';
  h+='<div class="sec"><b>'+esc(tr('p_limited'))+'</b><div class="grid">'+FOUNDER.map((f,i)=>tile('frame',f,avatar(46,{frame:f,badge:'',pill:false}),['I','II','III'][i],ownsFrame(f),P.frame===f)).join('')+'</div>'+(isFounder()?'':'<small class="hint">'+esc(tr('p_lim_locked'))+'</small>')+'</div>';
  h+='<div class="sec"><b>'+esc(tr('p_name'))+'</b><div class="grid">'+NAME_FX.map(n=>tile('name',n,nameHtml(n,dispName().slice(0,6)),n==='none'?tr('p_none'):tr('fx_'+n),ownsName(n),P.nameFx===n)).join('')+'</div></div>';
  h+='<div class="sec"><b>'+esc(tr('p_badge'))+'</b><div class="grid">'+tile('badge','','–',tr('p_none'),true,!P.badge)+BADGES.map(b=>tile('badge',b,svg(b),badgeName(b),ownsBadge(b),P.badge===b)).join('')+'</div></div>';
  return h;
}
const msOf=k=>MSL.find(m=>m.r.t===k);
function profTitles(){
  const P=S.prof;
  return '<div class="sec"><small class="hint">'+esc(tr('titles_hint'))+'</small><div class="grid tgrid">'+TITLES.map(T=>{
    const own=ownsTitle(T.k),sel=P.title===T.k,m=msOf(T.k);
    const sub=own?dateStr(P.own.t[T.k]||(ACC&&ACC.joined)||Date.now()):T.special?tr('ti_special'):m?tr('md_'+m.k,goalText(m.k,m.n)):'';
    return '<button class="tile ttl lv'+T.lv+(sel?' sel':'')+(own?'':' lk')+'" data-tt="'+T.k+'"><div class="big2">'+(own?titleHtml(T.k):'<span class="tt-lock">'+svg('lock')+'</span>')+'</div><small>'+esc(sub)+'</small>'+(own?'':'<span class="lkb">'+svg('lock')+'</span>')+'</button>';
  }).join('')+'</div></div>';
}
function profMilestones(){
  const P=S.prof;
  return '<div class="sec">'+MSL.map(m=>{
    const done=!!P.done[m.k+':'+m.n],v=statVal(m.k),pr=clamp(v/m.n,0,1),T=TIERS[m.d];
    return '<div class="row"><div class="ico">'+svg(MS_IC[m.k]||'star')+'</div><div class="tx"><b>'+esc(tr('mt_'+m.k))+'<span class="tier" style="background:'+T[1]+'">'+esc(tr(T[0]))+'</span></b>'+
      '<small>'+esc(tr('md_'+m.k,goalText(m.k,m.n)))+'</small><div class="pbar"><i style="width:'+(done?100:pr*100)+'%"></i></div><div class="tags">'+rewardTags(m)+'</div></div>'+
      (done?ownTag(tr('done')):'<span class="prog">'+goalText(m.k,Math.min(v,m.n))+' / '+goalText(m.k,m.n)+'</span>')+'</div>';
  }).join('')+'</div>';
}
function profInventory(){
  let h='<div class="sec"><b>'+esc(tr('tab_tools'))+'</b><div class="grid">'+TOOL_ORDER.map(k=>tile('tool',k,svg(TOOLS[k].ic),toolName(k),!!S.toolsOwned[k],false)).join('')+'</div></div>';
  h+='<div class="sec"><b>'+esc(tr('tab_items'))+'</b><div class="grid2">'+ITEMS.map(it=>statBox(S.inv[it.id]||0,tr('i_'+it.id))).join('')+'</div></div>';
  h+='<div class="sec"><b>'+esc(tr('tab_upg'))+'</b>'+Object.keys(UPG).map(k=>{const U=UPG[k],l=S.upg[k];let pips='';for(let i=0;i<5;i++)pips+='<i class="'+(i<l?'on':'')+'"></i>';
    return '<div class="row"><div class="ico" style="color:'+U.col+'">'+svg(U.ic)+'</div><div class="tx"><b>'+esc(tr('u_'+k))+'</b><small>'+esc(U.f(l))+'</small><div class="pips">'+pips+'</div></div></div>';}).join('')+'</div>';
  h+='<div class="sec"><b>'+esc(tr('tab_looks'))+'</b><div class="grid">'+Object.keys(SKINS).map(k=>{const K=SKINS[k];
    return tile('skin',k,'<div class="sw" style="background:linear-gradient(135deg,'+K.a+','+K.b+')'+(K.st?';box-shadow:0 0 12px '+K.b+'88':'')+'"></div>',tr('s_'+k),!!S.skins[k],S.skin===k);}).join('')+'</div></div>';
  return h;
}
function profClick(e){
  const pa=e.target.closest('[data-pa]');
  if(pa){if(pa.dataset.pa==='bio')editBio();return;}
  const tt=e.target.closest('[data-tt]');
  if(tt){const k=tt.dataset.tt;if(ownsTitle(k))openCert(k);else{sfx.deny();const m=msOf(k);toast(TITLE(k).special?tr('ti_special'):m?tr('ti_locked',tr('md_'+m.k,goalText(m.k,m.n))):tr('p_locked'),'warn');}return;}
  const el=e.target.closest('[data-eq]');if(!el)return;
  const i=el.dataset.eq.indexOf(':'),kind=el.dataset.eq.slice(0,i),key=el.dataset.eq.slice(i+1),P=S.prof;
  const deny=m=>{sfx.deny();toast(m,'warn');};
  if(kind==='color'){P.color=key;sfx.equip();}
  else if(kind==='frame'){if(!ownsFrame(key))return deny(FOUNDER.includes(key)?tr('p_lim_locked'):tr('p_locked'));P.frame=key;sfx.equip();}
  else if(kind==='name'){if(!ownsName(key))return deny(tr('p_locked'));P.nameFx=key;sfx.equip();}
  else if(kind==='badge'){if(!ownsBadge(key))return deny(tr('p_locked'));P.badge=key;sfx.equip();}
  else if(kind==='skin'){if(!S.skins[key])return deny(tr('code_only'));S.skin=key;sfx.equip();}
  else if(kind==='tool'){if(!S.toolsOwned[key])return deny(tr('tool_shop'));sfx.click();return;}
  save();renderProfile();renderProfChip();pubDirty();
}
function pubDirty(){netDirty=true;}
async function editBio(){
  const v=await dialog({title:tr('bio_edit'),icon:'edit',html:'<textarea id="dBio" maxlength="140" rows="4" data-focus placeholder="'+esc(tr('bio_ph'))+'">'+esc(S.prof.bio||'')+'</textarea><small class="cnt" id="dCnt">'+(S.prof.bio||'').length+' / 140</small>',
    buttons:[{t:tr('cancel'),cls:'alt',v:null},{t:tr('save_btn'),v:'save'}],onOpen:()=>{const t=$('dBio');t.addEventListener('input',()=>{$('dCnt').textContent=t.value.length+' / 140';sfx.key(t.value.length%10);});}});
  if(v!=='save')return;
  S.prof.bio=$('dBio')?$('dBio').value.replace(/[\u0000-\u001f<>]/g,' ').trim().slice(0,140):S.prof.bio;
  save();renderProfile();pubDirty();sfx.equip();toast(tr('bio_saved'),'ok');
}
/* mini certificate with a pop-up: date, issuer and number differ per title */
function certHtml(k){
  const T=TITLE(k),P=S.prof,ts=P.own.t[k]||(ACC&&ACC.joined)||Date.now(),id=ACC?ACC.id:0;
  const num='SW-'+String(id).padStart(3,'0')+'-'+String(TITLES.indexOf(T)+1).padStart(2,'0')+'-'+String(new Date(ts).getFullYear()).slice(2)+String(Math.floor(ts/1000)%997).padStart(3,'0');
  const m=msOf(k),desc=T.special?tr('cert_special_'+k):m?tr('md_'+m.k,goalText(m.k,m.n)):'';
  return '<div class="cert cf-'+T.cf+' lv'+T.lv+'"><i class="cs c1"></i><i class="cs c2"></i><i class="cs c3"></i><i class="cs c4"></i>'+
    '<div class="c-top"><span class="c-logo">SCHNITTWERK</span><span class="c-no">'+esc(tr('cert_no'))+' '+num+'</span></div>'+
    '<div class="c-kicker">'+esc(tr('cert_kicker'))+'</div><div class="c-title">'+titleHtml(k)+'</div>'+
    '<div class="c-line">'+esc(tr('cert_to'))+'</div><div class="c-holder">'+nameHtml()+(id?' <em>#'+id+'</em>':'')+'</div>'+
    '<div class="c-desc">'+esc(desc)+'</div>'+
    '<div class="c-foot"><div><small>'+esc(tr('cert_date'))+'</small><b>'+esc(dateStr(ts))+'</b></div><div class="c-seal">'+svg(T.ic)+'</div><div><small>'+esc(tr('cert_by'))+'</small><b>'+esc(tr(T.iss))+'</b><em class="sig">'+esc(Net.ownerName||'Schnittwerk')+' #1</em></div></div></div>';
}
function openCert(k){
  const eq=S.prof.title===k;
  sfx.cert();
  dialog({cls:'certd',html:certHtml(k),buttons:[{t:tr('close'),cls:'alt',v:null},{t:eq?tr('unequip'):tr('equip'),v:'eq'}]}).then(v=>{
    if(v==='eq'){S.prof.title=eq?'':k;save();sfx.title();renderProfile();renderProfChip();pubDirty();}
  });
}
function renderProfChip(){
  const c=$('profChip');c.setAttribute('role','button');c.tabIndex=0;
  c.innerHTML=avatar(38)+'<div class="pc">'+nameHtml()+'<small>'+(ACC?'#'+ACC.id+(S.prof.title?' · '+esc(titleName(S.prof.title)):''):esc(tr('profile')))+'</small></div>';
}

/* ======================================================================
   PART 8 – online: polling, friends, player list, duels, owner tools, lab
   ====================================================================== */
const mapNameById=id=>{const m=MAPS.find(x=>x.id===id);return m?mapName(m):'–';};
const socialCount=()=>{const s=Net.st;return s?s.reqIn.length+((s.match&&s.match.state==='invited'&&!s.match.host)?1:0):0;};
function renderMenu(){
  $('mOwner').style.display=isOwner()?'':'none';
  const n=socialCount(),b=$('socBadge');if(b){b.textContent=n||'';b.style.display=n?'':'none';}
}
function netChanged(){
  const up=Net.up;
  $$('.netdot').forEach(d=>{d.classList.toggle('up',up);d.classList.toggle('down',!up);});
  const l=$('lNet');if(l){l.className='net '+(up?'up':'down');l.querySelector('span').textContent=up?tr('net_online'):Net.enabled?tr('net_offline'):tr('net_off');}
  if(ovStack.includes('settings'))renderSettings();
  if(ovStack.includes('social'))renderSocial();
  renderMenu();
}

/* ---- polling ---- */
let polling=false,tickN=0,firstPoll=true;
function netKick(){firstPoll=true;if(ACC&&Net.tok&&Net.up)poll();}
async function poll(){
  if(polling||!ACC||!Net.tok)return;polling=true;
  const r=await Net.get('/api/poll?ack='+(S.net.adjSeen|0));polling=false;
  if(!r.ok||!ACC)return;
  Net.offset=r.time-Date.now();
  const prev=Net.st;Net.st=r;ACC.pin=!!r.me.pin;
  applyAdj(r.adj);
  if(prev){
    const oldR=new Set(prev.reqIn.map(x=>x.id));for(const p of r.reqIn)if(!oldR.has(p.id)){sfx.ping();toast(tr('req_new',p.name),'ping',3600);}
    const oldF=new Set(prev.friends.map(x=>x.id));for(const p of r.friends)if(!oldF.has(p.id)){sfx.friend();toast(tr('friend_new',p.name),'ok');}
  }else if(firstPoll&&r.reqIn.length){sfx.ping();toast(tr('req_many',r.reqIn.length),'ping',3600);}
  firstPoll=false;
  Duel.onMatch(r.match);
  renderMenu();if(ovStack.includes('social'))renderSocial(true);
}
function netTick(){
  tickN++;
  if(scene==='game'&&!paused&&!document.hidden&&!labMode&&!duelHold)S.stats.time++;
  if(!Net.enabled)return;
  if(!Net.up){if(tickN%15===0)Net.ping().then(r=>{if(r&&r.ok&&ACC&&Net.tok)netKick();});return;}
  if(!ACC||!Net.tok||document.hidden||labMode)return;
  if(Duel.busy()){Duel.progressTick();return;}
  const every=Duel.pending()?1:ovStack.includes('social')?2:scene==='game'?6:4;
  if(tickN%every===0)poll();
  if(tickN%25===0&&netDirty)cloudPush();
}

/* ---- players ---- */
async function loadPlayers(force){
  if(!Net.up||!ACC)return;
  if(!force&&Net.players&&Date.now()-Net.playersT<8000)return;
  const r=await Net.get('/api/players');
  if(r.ok){Net.players=r.players;Net.playersT=Date.now();if(ovStack.includes('social'))renderSocial(true);if(ovStack.includes('owner'))renderOwner(true);}
}
function prow(p,acts,extra){
  return '<div class="prow" data-pid="'+p.id+'" role="button" tabindex="0">'+avX(p,44,{pill:false})+
    '<div class="pinfo"><div class="pl1">'+nmX(p)+(p.title?' '+titleHtml(p.title):'')+'</div><div class="pl2"><span class="dot '+(p.online?'up':'down')+'"></span><span>#'+p.id+'</span>'+(extra||'')+'</div></div><div class="pact">'+(acts||'')+'</div></div>';
}
const bestTag=p=>p.bestNo?'<span class="tag">'+svg('star')+esc(mapNameById(p.best))+'</span>':'';
let soTab='friends',soQ='';
function openSocial(){soTab='friends';renderSocial();poll();loadPlayers(true);}
function renderSocial(soft){
  const box=$('soBody');if(!box)return;
  if(soft&&document.activeElement&&document.activeElement.id==='soQ')return;
  $$('#soTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===soTab));
  const nReq=socialCount(),tb=$('soReqB');if(tb){tb.textContent=nReq||'';tb.style.display=nReq?'':'none';}
  if(!ACC){box.innerHTML='<div class="empty">'+esc(tr('need_account'))+'</div>';return;}
  const y=box.scrollTop;let h='';
  if(!Net.up)h+='<div class="banner"><span class="dot down"></span><span>'+esc(tr('so_offline'))+'</span><button class="btn sm alt" data-act="retry">'+svg('refresh')+esc(tr('retry'))+'</button></div>';
  const st=Net.st||{friends:[],reqIn:[],reqOut:[],match:null};
  if(soTab==='friends'){
    if(!st.friends.length)h+='<div class="empty">'+esc(tr('no_friends'))+'</div>';
    for(const f of st.friends)h+=prow(f,'<button class="btn sm" data-act="duel" data-id="'+f.id+'"'+(f.online&&Net.up?'':' disabled')+'>'+svg('swords')+esc(tr('duel'))+'</button><button class="ibtn sm" data-act="rm" data-id="'+f.id+'" aria-label="remove">'+svg('trash')+'</button>',bestTag(f));
  }else if(soTab==='req'){
    const m=st.match;
    if(m&&m.state==='invited'&&!m.host)h+='<div class="sec"><b>'+esc(tr('duel_invites'))+'</b><div class="invite">'+avX(m.opp,44,{pill:false})+'<div class="pinfo"><div class="pl1">'+nmX(m.opp)+'</div><div class="pl2">'+esc(tr('duel_inv_txt',mapNameById(m.map),fmt(m.stake),fmt(m.stake*2)))+'</div></div><div class="pact"><button class="btn sm" data-act="inv-yes">'+svg('check')+esc(tr('accept'))+'</button><button class="ibtn sm" data-act="inv-no" aria-label="decline">'+svg('x')+'</button></div></div></div>';
    h+='<div class="sec"><b>'+esc(tr('req_in'))+'</b>'+(st.reqIn.length?st.reqIn.map(p=>prow(p,'<button class="btn sm" data-act="acc" data-id="'+p.id+'">'+svg('check')+esc(tr('accept'))+'</button><button class="ibtn sm" data-act="dec" data-id="'+p.id+'" aria-label="decline">'+svg('x')+'</button>')).join(''):'<div class="empty s">'+esc(tr('none_yet'))+'</div>')+'</div>';
    h+='<div class="sec"><b>'+esc(tr('req_out'))+'</b>'+(st.reqOut.length?st.reqOut.map(p=>prow(p,'<button class="btn sm alt" data-act="cancel" data-id="'+p.id+'">'+esc(tr('cancel'))+'</button>')).join(''):'<div class="empty s">'+esc(tr('none_yet'))+'</div>')+'</div>';
  }else{
    const q=soQ.trim().toLowerCase().replace(/^#/,'');
    h+='<div class="sbar">'+svg('search')+'<input type="text" id="soQ" class="lo" value="'+esc(soQ)+'" placeholder="'+esc(tr('search_ph'))+'" autocomplete="off" autocapitalize="none" spellcheck="false"></div>';
    const list=(Net.players||[]).filter(p=>p.id!==ACC.id&&(!q||String(p.id)===q||p.name.toLowerCase().includes(q)));
    if(!Net.players)h+='<div class="empty">'+esc(tr('loading'))+'</div>';
    else if(!list.length)h+='<div class="empty">'+esc(tr('none_found'))+'</div>';
    const fr=new Set(st.friends.map(x=>x.id)),ro=new Set(st.reqOut.map(x=>x.id)),ri=new Set(st.reqIn.map(x=>x.id));
    for(const p of list){
      const a=fr.has(p.id)?'<span class="own">'+svg('check')+esc(tr('friends_tag'))+'</span>':ro.has(p.id)?'<span class="tag">'+esc(tr('pending'))+'</span>':ri.has(p.id)?'<button class="btn sm" data-act="acc" data-id="'+p.id+'">'+svg('check')+esc(tr('accept'))+'</button>':'<button class="btn sm alt" data-act="add" data-id="'+p.id+'">'+svg('plus')+esc(tr('add'))+'</button>';
      h+=prow(p,a,bestTag(p)+'<span class="tag">'+svg('clock')+esc(durStr(p.time))+'</span>');
    }
  }
  box.innerHTML=h;box.scrollTop=y;
}
async function friendAct(act,id){
  const map={add:'request',acc:'accept',dec:'decline',cancel:'cancel',rm:'remove'};
  if(act==='rm'){const f=(Net.st&&Net.st.friends.find(x=>x.id===id))||{name:'#'+id};if(!await confirmBox(tr('friend_rm'),tr('friend_rm_q',f.name),tr('remove'),tr('cancel'),'trash'))return;}
  const r=await Net.post('/api/friend/'+map[act],{id});
  if(!r.ok){sfx.error();toast(tr(errKey(r.error)==='e_server'?'e_server':errKey(r.error)),'err');return;}
  if(act==='add')toast(r.state==='friends'?tr('friend_now'):tr('req_sent'),'ok');
  if(act==='acc'){sfx.friend();toast(tr('friend_now'),'ok');}
  else sfx.ok();
  await poll();renderSocial(true);
}
function soClick(e){
  const a=e.target.closest('[data-act]');
  if(a){
    e.stopPropagation();const act=a.dataset.act,id=+a.dataset.id;
    if(act==='retry'){Net.ping().then(()=>{netKick();loadPlayers(true);});return;}
    if(act==='duel'){const f=Net.st.friends.find(x=>x.id===id);if(f)challengeDialog(f);return;}
    if(act==='inv-yes'){Duel.accept(Net.st.match);return;}
    if(act==='inv-no'){Duel.decline();return;}
    friendAct(act,id);return;
  }
  const r=e.target.closest('[data-pid]');if(r){sfx.click();openPlayer(+r.dataset.pid);}
}
async function openPlayer(id){
  if(!Net.up){toast(tr('e_offline'),'err');return;}
  const r=await Net.get('/api/player?id='+id);
  if(!r.ok){toast(tr('e_server'),'err');return;}
  const p=r.player,self=ACC&&ACC.id===p.id,st=p.stats||{},own=isOwner();
  let h='<div class="pv"><div class="pv-h">'+avX(p,72)+'<div class="pv-n"><div class="pn">'+nmX(p)+'</div>'+(p.title?'<div class="pt">'+titleHtml(p.title)+'</div>':'')+'<div class="pl2"><span class="dot '+(p.online?'up':'down')+'"></span><span>#'+p.id+' · '+esc(p.online?tr('online'):tr('last_seen',agoStr(p.seen)))+'</span></div></div></div>'+
    '<p class="bio-x">'+(p.bio?esc(p.bio):'<em>'+esc(tr('bio_empty'))+'</em>')+'</p>'+
    '<div class="grid2 mini">'+statBox(esc(dateStr(p.joined)),tr('joined'))+statBox(esc(durStr(p.time)),tr('st_time'))+statBox(esc(p.bestNo?mapNameById(p.best):'–'),tr('st_best'))+
    statBox(fmt(st.cuts||0),tr('st_cuts'))+statBox(fmt(st.crumbs||0),tr('st_crumbs'))+statBox(fmt(st.earned||0),tr('st_earned'))+
    statBox(fmt(st.bombs||0),tr('st_bombs'))+statBox(fmt(st.hammers||0),tr('st_hammers'))+statBox(fmt(st.lasers||0),tr('st_lasers'))+
    statBox((p.maps|0)+' / '+MAPS.length,tr('st_maps'))+statBox((p.ms|0)+' / '+MSL.length,tr('st_ms'))+statBox(p.duel.w+' / '+p.duel.l,tr('st_duels'))+'</div>';
  if(own&&p.coins!==undefined){
    h+='<div class="sec owner-sec"><b>'+svg('crown')+' '+esc(tr('owner_view'))+'</b><div class="grid2 mini">'+statBox(fmt(p.coins),tr('coins'))+statBox(p.pin?'PIN ✓':'PIN –',tr('s_account'))+statBox(p.friends,tr('friends'))+statBox(p.duel.won+' / '+p.duel.lost,tr('duel_coins'))+'</div>'+
      '<div class="tags">'+(p.tools||[]).map(t=>'<span class="tag">'+esc(TOOLS[t]?toolName(t):t)+'</span>').join('')+(p.skins||[]).map(s=>'<span class="tag">'+esc(SKINS[s]?tr('s_'+s):s)+'</span>').join('')+'</div>'+
      '<div class="tags">'+Object.keys(p.upg||{}).map(k=>'<span class="tag">'+esc(UPG[k]?tr('u_'+k):k)+' '+p.upg[k]+'/5</span>').join('')+'</div>'+
      ((p.pinLock||p.pwLock)?'<div class="banner"><span class="dot down"></span><span>'+esc(tr('locked_t'))+'</span></div>':'')+'</div>';
  }
  h+='</div>';
  const btns=[{t:tr('close'),cls:'alt',v:null}];
  if(own&&p.id!==1)btns.push({t:svg('key')+esc(tr('unlock_acc')),cls:'alt',keep:true,fn:async()=>{const u=await Net.post('/api/admin/unlock',{id:p.id});toast(u.ok?tr('unlocked_ok'):tr('e_server'),u.ok?'ok':'err');if(u.ok)sfx.ok();}});
  if(!self&&r.friend)btns.push({t:svg('swords')+esc(tr('duel')),v:'duel'});
  else if(!self)btns.push({t:svg('plus')+esc(tr('add')),v:'add'});
  const v=await dialog({title:'',cls:'pviewd',html:h,buttons:btns});
  if(v==='add')friendAct('add',p.id);
  else if(v==='duel'){const f=(Net.st&&Net.st.friends.find(x=>x.id===p.id))||p;challengeDialog(f);}
}

/* ---- challenge dialog: map + stake ---- */
function challengeDialog(f){
  const stakes=[50,100,250,500,1000,2500];
  const html='<div class="chal"><div class="chal-vs">'+avatar(46,{pill:false})+'<b>VS</b>'+avX(f,46,{pill:false})+'</div><div class="chal-n">'+nmX(f)+'</div>'+
    '<label class="fl">'+esc(tr('duel_map'))+'</label><select id="dMap">'+MAPS.map((m,i)=>'<option value="'+m.id+'">'+(i+1)+'. '+esc(mapName(m))+' · '+esc(tr(TIERS[m.d||0][0]))+'</option>').join('')+'</select>'+
    '<label class="fl">'+esc(tr('duel_stake'))+'</label><div class="chips" id="dChips">'+stakes.map((s,i)=>'<button type="button" class="chipb" data-s="'+s+'" data-i="'+i+'x">'+fmt(s)+'</button>').join('')+'</div>'+
    '<input type="number" id="dStake" class="lo" min="10" step="10" value="100" inputmode="numeric"><div class="pot" id="dPot"></div><small class="derr" id="dErr"></small></div>';
  const upd=()=>{const s=Math.floor(+$('dStake').value||0);$('dPot').innerHTML=svg('trophy')+'<span>'+esc(tr('duel_pot',fmt(s*2)))+'</span><small>'+esc(tr('duel_each',fmt(s)))+'</small>';$$('#dChips .chipb').forEach(b=>b.classList.toggle('on',+b.dataset.s===s));};
  dialog({title:tr('duel_new'),icon:'swords',cls:'chald',html,buttons:[{t:tr('cancel'),cls:'alt',v:null},{t:svg('swords')+esc(tr('duel_send')),keep:true,fn:async()=>{
      const stake=Math.floor(+$('dStake').value||0),err=k=>{$('dErr').textContent=tr(k);sfx.error();};
      if(stake<10)return err('e_stake');if(stake>S.coins)return err('e_poor');if(f.coins!==undefined&&f.coins<stake)return err('e_friend_poor');
      const map=$('dMap').value;closeDialog('sent');Duel.invite(f,map,stake);}}],
    onOpen:()=>{
      $$('#dChips .chipb').forEach((b,i)=>{b.onclick=()=>{$('dStake').value=b.dataset.s;sfx.wager(i);upd();};});
      $('dStake').addEventListener('input',upd);upd();
    }});
}

/* ---- duels ---- */
const Duel={
  m:null,mid:0,active:false,ended:false,fin:false,seen:{},started:{},shown:{},waitId:0,req:false,lostTicks:0,
  busy(){return this.active&&!this.ended;},
  pending(){return !!this.m&&(this.m.state==='invited'||this.m.state==='countdown');},
  onMatch(m){
    this.m=m;if(!m)return;const id=m.id;
    if(this.waitId===id&&m.state!=='invited'){this.waitId=0;closeDialog('__x');}
    if(m.state==='invited'){
      if(!m.host&&!this.seen[id]){this.seen[id]=1;sfx.invite();
        if(scene==='game'||dlgRes)toast(tr('duel_inv_toast',m.opp.name),'ping',4200);else this.showInvite(m);}
    }else if(m.state==='countdown'||m.state==='running'){
      if(!this.started[id]){this.started[id]=1;this.begin(m);}else if(this.mid===id)this.update(m);
    }else if(m.state==='done'){
      if(!this.shown[id]&&this.mid===id){this.shown[id]=1;this.result(m);}
      else if(!this.shown[id]){this.shown[id]=1;Net.post('/api/duel/ack');}
    }else if(!this.shown[id]){
      this.shown[id]=1;Net.post('/api/duel/ack');
      toast(tr(m.state==='declined'?'duel_declined':m.state==='canceled'?'duel_canceled':'duel_expired'),'warn');sfx.deny();
    }
  },
  async showInvite(m){
    const v=await dialog({title:tr('duel_invite_t'),icon:'swords',cls:'chald',html:'<div class="chal"><div class="chal-vs">'+avX(m.opp,52,{pill:false})+'<b>VS</b>'+avatar(52,{pill:false})+'</div><div class="chal-n">'+nmX(m.opp)+'</div><p class="mp">'+esc(tr('duel_inv_txt',mapNameById(m.map),fmt(m.stake),fmt(m.stake*2)))+'</p></div>',buttons:[{t:tr('decline'),cls:'alt',v:'no'},{t:svg('check')+esc(tr('accept')),v:'yes'}]});
    if(v==='yes')this.accept(m);else if(v==='no')this.decline();
  },
  async accept(m){
    if(!m)return;
    if(S.coins<m.stake){sfx.error();toast(tr('e_poor'),'err');return;}
    const r=await Net.post('/api/duel/accept',{coins:Math.floor(S.coins)});
    if(!r.ok){sfx.error();toast(tr(errKey(r.error)),'err');return;}
    S.coins-=m.stake;updateCoins();save();Net.offset=r.time-Date.now();this.started[m.id]=1;this.m=r.match;this.begin(r.match);
  },
  async decline(){const r=await Net.post('/api/duel/decline',{});if(r.ok){sfx.back();this.m=null;poll();}},
  async invite(f,map,stake){
    const r=await Net.post('/api/duel/invite',{to:f.id,stake,map,coins:Math.floor(S.coins)});
    if(!r.ok){sfx.error();toast(tr(errKey(r.error)),'err');return false;}
    S.coins-=stake;updateCoins();save();this.m=r.match;this.seen[r.match.id]=1;this.waitId=r.match.id;sfx.wager(5);
    dialog({title:tr('duel_wait_t'),icon:'swords',cls:'chald',dismiss:false,lock:true,html:'<div class="chal"><div class="chal-vs">'+avatar(52,{pill:false})+'<b>VS</b>'+avX(f,52,{pill:false})+'</div><div class="chal-n">'+nmX(f)+'</div><div class="spin"></div><p class="mp">'+esc(tr('duel_wait_x',mapNameById(map),fmt(stake)))+'</p></div>',buttons:[{t:tr('cancel'),cls:'alt',v:'cancel'}]}).then(async v=>{
      if(v==='cancel'&&this.waitId===r.match.id){this.waitId=0;await Net.post('/api/duel/cancel',{});poll();}});
    return true;
  },
  begin(m){
    closeDialog('__x');this.active=true;this.ended=false;this.fin=false;this.mid=m.id;this.lostTicks=0;
    const idx=mapIndex(m.map);
    startMap(idx<0?0:idx,{duel:true});duelHold=true;$('hud').classList.add('induel');
    this.update(m);this.countdown(m);
  },
  countdown(m){
    const el=$('cdown');el.classList.add('show');let last=-1;
    const step=()=>{
      if(!this.active||this.mid!==m.id||this.ended)return el.classList.remove('show');
      const left=m.startAt-Net.now();
      if(left<=0){el.classList.remove('show');duelHold=false;sfx.go();toast(tr('duel_go'),'ok',1400);return;}
      const n=Math.ceil(left/1000);
      if(n!==last){last=n;$('cdNum').textContent=n;el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick');sfx.countdown(Math.min(3,n));}
      requestAnimationFrame(step);
    };step();
  },
  update(m){
    if(!m)return;const o=m.opp;
    $('dhName').innerHTML=nmX(o);$('dhFill').style.width=o.pr+'%';$('dhPct').textContent=Math.floor(o.pr)+'%';
    $('dhPot').innerHTML=svg('trophy')+'<b>'+fmt(m.stake*2)+'</b>';
    const left=Math.max(0,Math.ceil((m.endAt-Net.now())/1000));
    $('dhTime').textContent=m.state==='countdown'?'–':Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
  },
  myPr(){return this.fin?100:Math.min(100,parseFloat($('pgFill').style.width)||0);},
  async progressTick(){
    if(this.req||!this.m)return;this.req=true;
    const r=await Net.post('/api/duel/progress',{pr:this.myPr(),fin:this.fin},5000);this.req=false;
    if(r.ok){this.lostTicks=0;Net.offset=r.time-Date.now();this.onMatch(r.match);this.update(r.match);}
    else if(r.error==='offline'){this.lostTicks++;if(this.lostTicks===6)toast(tr('duel_conn'),'warn');}
    else if(r.error==='not_running'||r.error==='no_match'){this.ended=true;this.active=false;$('hud').classList.remove('induel');show('menu');}
  },
  finish(){if(this.fin||!this.busy())return;this.fin=true;duelHold=true;toast(tr('duel_finished'),'ok',2500);sfx.unlock();this.progressTick();},
  async forfeit(){
    if(!this.busy())return;
    if(!await confirmBox(tr('duel_leave'),tr('duel_leave_q'),tr('duel_leave'),tr('cancel'),'warn'))return;
    const r=await Net.post('/api/duel/forfeit',{});if(r.ok)this.onMatch(r.match);
  },
  leaveSilently(){if(this.busy()){Net.post('/api/duel/forfeit',{});this.ended=true;}this.active=false;$('hud').classList.remove('induel');$('duelHud').classList.remove('show');},
  result(m){
    this.ended=true;duelHold=true;$('cdown').classList.remove('show');
    const win=m.winner===ACC.id,draw=!m.winner;
    if(!win&&!draw)S.stats.duelsLost=(S.stats.duelsLost||0)+1;
    $('deIcon').innerHTML=svg(win?'trophy':draw?'shield':'flag');
    $('deIcon').className='big de-i '+(win?'win':draw?'draw':'lose');
    $('deTitle').textContent=tr(win?'duel_won':draw?'duel_draw':'duel_lost');
    const why=tr('duel_why_'+(m.reason||'finish'));
    $('deTxt').innerHTML='<b>'+(win?'+'+fmt(m.stake*2):draw?'±0':'−'+fmt(m.stake))+'</b> '+esc(tr('coins'))+'<br><small>'+esc(why)+' · '+esc(mapNameById(m.map))+'</small>';
    $('deRematch').style.display=draw||m.opp?'':'none';
    win?sfx.win():draw?sfx.deny():sfx.lose();
    this.last=m;openOverlay('duelEnd');
    Net.post('/api/duel/ack');setTimeout(poll,350);setTimeout(poll,1600);
  },
  rematch(){
    const m=this.last;if(!m)return;const f=(Net.st&&Net.st.friends.find(x=>x.id===m.opp.id))||m.opp;
    this.active=false;$('hud').classList.remove('induel');show('menu');
    setTimeout(()=>challengeDialog(f),200);
  },
  toMenu(){this.active=false;$('hud').classList.remove('induel');$('duelHud').classList.remove('show');show('menu');}
};
function duelFinished(){Duel.finish();}

/* ---- owner panel ---- */
let owTab='players';
function openOwner(){owTab='players';renderOwner();loadPlayers(true);}
function renderOwner(soft){
  const box=$('owBody');if(!box)return;
  $$('#owTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===owTab));
  let h='';
  if(owTab==='players'){
    if(!Net.up)h+='<div class="banner"><span class="dot down"></span><span>'+esc(tr('so_offline'))+'</span></div>';
    const ps=Net.players;
    h+='<small class="hint">'+esc(tr('owner_list_hint',ps?ps.length:0))+'</small>';
    if(!ps)h+='<div class="empty">'+esc(tr('loading'))+'</div>';
    else for(const p of ps){
      h+='<div class="oprow" data-pid="'+p.id+'" role="button" tabindex="0">'+avX(p,42,{pill:false})+'<div class="pinfo"><div class="pl1">'+nmX(p)+(p.title?' '+titleHtml(p.title):'')+'</div><div class="pl2"><span class="dot '+(p.online?'up':'down')+'"></span><span>#'+p.id+'</span><span class="tag">'+svg('clock')+esc(durStr(p.time))+'</span>'+bestTag(p)+'<span class="tag">'+svg('coin')+fmt(p.coins||0)+'</span><span class="tag">'+esc(tr('joined'))+' '+esc(dateStr(p.joined))+'</span></div></div></div>';
    }
  }else{
    h+='<div class="tools">'+
      '<button class="btn" data-ow="lab">'+svg('flask')+'<span>'+esc(tr('lab_open'))+'</span></button>'+
      '<button class="btn alt" data-ow="codes">'+svg('list')+'<span>'+esc(tr('codes_title'))+'</span></button>'+
      '<div class="set"><label>'+esc(tr('lab_map'))+'</label><select id="owMap"><option value="-1">'+esc(tr('field'))+'</option>'+MAPS.map((m,i)=>'<option value="'+i+'">'+(i+1)+'. '+esc(mapName(m))+'</option>').join('')+'</select><button class="btn sm alt" data-ow="testmap">'+svg('play')+esc(tr('lab_test'))+'</button></div>'+
      '<div class="set"><label>'+esc(tr('s_server'))+'</label><div class="hint">'+esc(tr('owner_server',Net.players?Net.players.length:'?'))+'</div></div></div>';
  }
  const y=box.scrollTop;box.innerHTML=h;box.scrollTop=y;
}
function owClick(e){
  const b=e.target.closest('[data-ow]');
  if(b){const a=b.dataset.ow;sfx.click();
    if(a==='lab')startMap(-1,{lab:true});
    else if(a==='codes')openOverlay('codes');
    else if(a==='testmap')startMap(+$('owMap').value,{lab:true});
    return;}
  const r=e.target.closest('[data-pid]');if(r){sfx.click();openPlayer(+r.dataset.pid);}
}

/* ---- lab (owner only): free field with every tool, unlimited objects ---- */
function labUI(){
  const mats=Object.keys(MATS);
  $('labBody').innerHTML='<div class="lrow"><button class="btn sm" data-lab="coins">'+svg('coinplus')+'+1000</button><button class="btn sm alt" data-lab="clear">'+svg('trash')+esc(tr('lab_clear'))+'</button><button class="btn sm alt" data-lab="reset">'+svg('refresh')+esc(tr('lab_reset'))+'</button><button class="btn sm alt" data-lab="slow" id="labSlow">1×</button></div>'+
    '<div class="lrow">'+mats.map(k=>'<button class="trb" data-lab="mat" data-k="'+k+'"><i style="background:'+MATS[k].c+'"></i>'+esc(tr('m_'+k))+'</button>').join('')+'</div>';
}
function labClick(e){
  const b=e.target.closest('[data-lab]');if(!b)return;const a=b.dataset.lab;
  if(a==='coins'){addCoins(1000,false);sfx.pot(8);}
  else if(a==='clear'){for(const p of pieces.slice())removePiece(p);for(const c of crumbs.slice())collectCrumb(c,true);sfx.crumble('stone',600);}
  else if(a==='reset'){startMap(mapIdx,{lab:true});}
  else if(a==='slow'){tScale=tScale===1?.5:tScale===.5?.25:1;b.textContent=(tScale===1?'1':tScale)+'×';sfx.tab();}
  else if(a==='mat'){spawnItem({id:'lab_'+b.dataset.k,mat:b.dataset.k,w:64,h:64});}
}

/* re-render whatever is on screen (after a language change) */
function refreshUI(){
  updateCoins();renderProfChip();renderSettings();renderMenu();progT=0;
  if(scene==='maps')renderMaps();
  if(scene==='game'){renderToolbar();renderTray();}
  if(ovStack.includes('shop'))renderShop();
  if(ovStack.includes('codes'))renderCodes();
  if(ovStack.includes('profile'))renderProfile();
  if(ovStack.includes('social'))renderSocial();
  if(ovStack.includes('owner'))renderOwner();
  labUI();
}

/* ======================================================================
   PART 9 – wiring and boot sequence
   ====================================================================== */
let resetArmed=0;
function buildUI(){
  ['mapsBack','shopBack','setBack','codesBack','profBack','soBack','owBack'].forEach(i=>{$(i).innerHTML=svg('back');});
  $('hShop').innerHTML=svg('cart');$('hSet').innerHTML=svg('gear');$('hHome').innerHTML=svg('home');
  $('dockToggle').innerHTML=svg('chev');$('lEye').innerHTML=svg('eye');$('mOwner').innerHTML=svg('crown');$('labTog').innerHTML=svg('flask');$('lSrv').innerHTML=svg('globe');
  applyLang(false);labUI();

  /* login */
  $('lLogin').onclick=doLogin;$('lReg').onclick=doRegister;$('lGuest').onclick=enterGuest;
  $('lEye').onclick=toggleEye;$('lSrv').onclick=()=>{sfx.click();serverDialog();};
  $('lUser').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('lPass').focus();}});
  $('lPass').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();doLogin();}});
  /* menu */
  $('mPlay').onclick=()=>{sfx.click();show('maps');};
  $('mField').onclick=()=>{sfx.click();startMap(-1);};
  $('mSocial').onclick=()=>{if(!ACC){sfx.deny();toast(tr('need_account'),'warn');return;}sfx.click();openOverlay('social');};
  $('mShop').onclick=()=>{sfx.click();openOverlay('shop');};
  $('mSet').onclick=()=>{sfx.click();openOverlay('settings');};
  $('mOwner').onclick=()=>{sfx.click();openOverlay('owner');};
  $('profChip').onclick=()=>{sfx.click();openOverlay('profile');};
  /* maps */
  $('mapsBack').onclick=()=>{sfx.back();show('menu');};
  $('mapGrid').addEventListener('click',e=>{
    const c=e.target.closest('.mcard');if(!c)return;const i=+c.dataset.m;
    if(mapAvail(i)){sfx.click();startMap(i);}else{sfx.deny();toast(tr('toast_lock'),'warn');}
  });
  /* hud */
  $('hShop').onclick=()=>{sfx.click();openOverlay('shop');};
  $('hSet').onclick=()=>{sfx.click();openOverlay('settings');};
  $('hHome').onclick=()=>{if(Duel.busy()){sfx.click();Duel.forfeit();return;}sfx.back();save();show('menu');};
  $('btnCollect').onclick=collectAll;
  $('dockToggle').onclick=()=>{const d=$('dock'),min=!d.classList.contains('min');d.classList.toggle('min',min);S.settings.hotbar=min?0:1;saveSoon();sfx.dock(!min);};
  $('toolbar').addEventListener('click',e=>{
    const b=e.target.closest('.tbtn');if(!b)return;const t=b.dataset.t;
    if(!hasTool(t)){sfx.deny();toast(tr('tool_shop'),'warn');if(!Duel.busy()){shopTab='tools';openOverlay('shop');}return;}
    setTool(t);
  });
  $('tray').addEventListener('click',e=>{
    const b=e.target.closest('.trb');if(!b)return;const id=b.dataset.it;
    if(id==='_shop'){sfx.click();shopTab='items';openOverlay('shop');return;}
    spawnItem(ITEMS.find(x=>x.id===id));
  });
  $('labTog').onclick=()=>{$('lab').classList.toggle('open');sfx.dock($('lab').classList.contains('open'));};
  $('lab').addEventListener('click',labClick);
  /* complete + duel end */
  $('cMenu').onclick=()=>{sfx.back();show('menu');};
  $('cNext').onclick=()=>{sfx.click();startMap(mapIdx+1);};
  $('deMenu').onclick=()=>{sfx.back();Duel.toMenu();};
  $('deRematch').onclick=()=>{sfx.click();Duel.rematch();};
  /* shop */
  $('shopBack').onclick=()=>{sfx.back();closeOverlay();};
  $('shopList').addEventListener('click',shopClick);
  $('shopTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;shopTab=b.dataset.tab;sfx.tab();renderShop();});
  /* settings */
  $('setBack').onclick=()=>{sfx.back();closeOverlay();};
  $('segL').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sfx.tab();setLang(+b.dataset.l);});
  $('volR').oninput=e=>{S.settings.vol=+e.target.value;if(master)master.gain.value=S.settings.vol;saveSoon();if(gate('vol',90))sfx.slider(S.settings.vol);};
  $('volR').onchange=()=>sfx.click();
  $('segQ').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.settings.quality=+b.dataset.q;applyQuality();resize();save();renderSettings();sfx.tab();});
  $('segS').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.settings.shader=+b.dataset.s;resize();save();renderSettings();sfx.tab();});
  $('segB').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.settings.blur=+b.dataset.v;save();renderSettings();sfx.toggle(!!S.settings.blur);});
  $('segH').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;S.settings.haptic=+b.dataset.v;save();renderSettings();sfx.toggle(!!S.settings.haptic);vib(20);});
  $('codeBtn').onclick=redeem;
  $('codeIn').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();redeem();}});
  $('codesBtn').onclick=()=>{sfx.click();openOverlay('codes');};
  $('srvBtn').onclick=()=>{sfx.click();serverDialog();};
  $('accBtns').addEventListener('click',e=>{
    const b=e.target.closest('[data-ac]');if(!b)return;const a=b.dataset.ac;sfx.click();
    if(a==='pw')changePwFlow();else if(a==='pin')setPinFlow();else if(a==='pinc')changePinFlow();else if(a==='pinr')removePinFlow();
    else if(a==='out')logout();else if(a==='login'){closeAllOverlays();show('login');}
  });
  /* codes */
  $('codesBack').onclick=()=>{sfx.back();closeOverlay();};
  $('codeList').addEventListener('click',e=>{const b=e.target.closest('[data-code]');if(!b)return;const c=b.dataset.code;$('codeIn').value=c;copyText(c);});
  /* profile */
  $('profBack').onclick=()=>{sfx.back();closeOverlay();};
  $('profTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;profTab=b.dataset.t;sfx.tab();renderProfile();});
  $('profBody').addEventListener('click',profClick);
  /* social + owner */
  $('soBack').onclick=()=>{sfx.back();closeOverlay();};
  $('soTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;soTab=b.dataset.t;sfx.tab();renderSocial();if(soTab==='players')loadPlayers(true);});
  $('soBody').addEventListener('click',soClick);
  $('soBody').addEventListener('input',e=>{if(e.target.id==='soQ'){soQ=e.target.value;const pos=e.target.selectionStart;renderSocial();const q=$('soQ');if(q){q.focus();q.setSelectionRange(pos,pos);}}});
  $('owBack').onclick=()=>{sfx.back();closeOverlay();};
  $('owTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;owTab=b.dataset.t;sfx.tab();renderOwner();});
  $('owBody').addEventListener('click',owClick);

  updateCoins();
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){save();if(ac&&ac.state==='running')ac.suspend();}
    else{lastT=performance.now();if(ACC&&Net.up)poll();}
  });
  window.addEventListener('pagehide',save);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||$('dlg').classList.contains('show'))return;
    const top=ovStack[ovStack.length-1];
    if(top&&top!=='complete'&&top!=='duelEnd'){sfx.back();closeOverlay();}
    else if(scene==='maps'){sfx.back();show('menu');}
  });
  /* hardware back button: close dialog / overlay / leave map instead of leaving the page */
  try{
    history.pushState(null,'');
    window.addEventListener('popstate',()=>{
      try{history.pushState(null,'');}catch(_){}
      if($('dlg').classList.contains('show')){closeDialog(null);return;}
      if(ovStack.length){const t=ovStack[ovStack.length-1];if(t!=='complete'&&t!=='duelEnd')closeOverlay();return;}
      if(Duel.busy()){Duel.forfeit();return;}
      if(scene==='game'||scene==='maps')show('menu');
    });
  }catch(_){}
}

/* ---------- Start ---------- */
detectLang();Net.init();
let hasSession=false;
const steps=[
 ['loading_tex',()=>{for(const k in MATS){const c=document.createElement('canvas');c.width=c.height=96;TEX[k](c.getContext('2d'));MATS[k].pat=ctx.createPattern(c,'repeat');}mkPatterns();}],
 ['loading_save',()=>{hasSession=restoreSession();loadSave();fixSave();}],
 ['loading_ui',()=>{buildUI();}],
 ['loading_done',()=>{applyQuality();resize();}]
];
let si=0;
applyLang(false);
(function next(){
  if(si>=steps.length){
    setTimeout(()=>{
      $('loading').classList.remove('show');show(hasSession?'menu':'login');requestAnimationFrame(frame);
      setInterval(netTick,1000);
      Net.ping().then(()=>{if(ACC&&Net.tok)netKick();netChanged();});
      if('serviceWorker' in navigator&&(location.protocol==='http:'||location.protocol==='https:')&&!/^(localhost|127\.)/.test(location.hostname))navigator.serviceWorker.register('sw.js').catch(()=>{});
    },350);return;
  }
  $('ltip').textContent=tr(steps[si][0])+' ...';steps[si][1]();si++;$('lbar').style.width=(si/steps.length*100)+'%';setTimeout(next,320);
})();
}
loadMatter(startGame);

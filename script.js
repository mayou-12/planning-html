/* ========================================= */
/* TIMELINE RH + SHAREPOINT CRONIXDATA */
/* SCRIPT.JS COMPLET */
/* ========================================= */

const planning = {};

let blocEnCours = null;

/* ========================================= */
/* DEMARRAGE */
/* ========================================= */

chargerPlanningSharePoint();

/* ========================================= */
/* CHARGEMENT SHAREPOINT */
/* ========================================= */

async function chargerDepuisSharePoint(){

    try{

        const response =
            await fetch(

                "_api/web/lists/getbytitle('CRONIXDATA')/items?$top=5000",

                {
                    method:"GET",

                    headers:{
                        "Accept":"application/json;odata=verbose"
                    }
                }
            );

        const json =
            await response.json();

        console.log(json);

        return json.d.results;

    }catch(err){

        console.error(err);

        alert("Erreur SharePoint");

        return [];
    }
}

/* ========================================= */
/* CHARGEMENT PLANNING */
/* ========================================= */

async function chargerPlanningSharePoint(){

    const items =
        await chargerDepuisSharePoint();

    console.log(items);

    const tbody =
        document.querySelector("#planning tbody");

    tbody.innerHTML = "";

    const maintenant =
        new Date();

    const annee =
        maintenant.getFullYear();

    const mois =
        maintenant.getMonth();

    const nbJours =
        new Date(annee, mois + 1, 0).getDate();

    /* ====================== */
    /* CREATION DES JOURS */
    /* ====================== */

    for(let i=1;i<=nbJours;i++){

        const date =
        `${annee}-${String(mois+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;

        planning[date] = [];

        creerJour(date);
    }

    /* ====================== */
    /* SHAREPOINT -> TIMELINE */
    /* ====================== */

    items.forEach(x=>{

        if(!x.DAT_DATE)
            return;

        const date =
            x.DAT_DATE.split("T")[0];

        if(!planning[date])
            return;

        planning[date].push({

            idSharePoint:
                x.ID,

            activite:
                x.Activit_x00e9_ || "Présence",

            lieu:
                x.Lieu_du_Travail || "Sur site",

            debut:
                convertirHeureSharePoint(x.Heure_Debut),

            fin:
                convertirHeureSharePoint(x.Heure_Fin)
        });
    });

    /* ====================== */
    /* PRE-REMPLISSAGE */
    /* ====================== */

    Object.keys(planning).forEach(date=>{

        if(planning[date].length === 0){

            const jour =
                new Date(date).getDay();

            if(jour === 0 || jour === 6){

                planning[date].push({

                    activite:"Day Off",

                    lieu:"Sur site",

                    debut:"00:00",

                    fin:"23:59"
                });

            }else{

                planning[date].push({

                    activite:"Présence",

                    lieu:"Sur site",

                    debut:"08:00",

                    fin:"12:00"
                });

                planning[date].push({

                    activite:"Pause",

                    lieu:"Sur site",

                    debut:"12:00",

                    fin:"13:00"
                });

                planning[date].push({

                    activite:"Présence",

                    lieu:"Sur site",

                    debut:"13:00",

                    fin:"17:00"
                });
            }
        }

        afficherBlocs(date);

        calculerTotal(date);
    });

    console.log(planning);
}

/* ========================================= */
/* CONVERTIR HEURE SHAREPOINT */
/* ========================================= */

function convertirHeureSharePoint(dateSP){

    if(!dateSP)
        return "";

    const d =
        new Date(dateSP);

    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

/* ========================================= */
/* CREER JOUR */
/* ========================================= */

function creerJour(date){

    const tbody =
        document.querySelector("#planning tbody");

    const tr =
        document.createElement("tr");

    const jour =
        obtenirJour(date);

    tr.innerHTML = `

        <td>

            <span class="icone"
                  onclick="ajoutRapide('${date}')">

                ➕

            </span>

        </td>

        <td>

            ${jour}

        </td>

        <td>

            ${date}

        </td>

        <td id="total-${date}">

        </td>

        <td>

            <div class="timelineContainer">

                ${genererHeures()}

                <div class="timeline"
                     id="timeline-${date}">

                </div>

            </div>

        </td>
    `;

    tbody.appendChild(tr);
}

/* ========================================= */
/* GENERER HEURES */
/* ========================================= */

function genererHeures(){

    let html =
        `<div class="heures">`;

    for(let h=0;h<24;h++){

        html += `

            <div class="heure">

                ${String(h).padStart(2,"0")}

            </div>
        `;
    }

    html += `</div>`;

    return html;
}

/* ========================================= */
/* AJOUT BLOC */
/* ========================================= */

function ajouterBloc(){

    const date =
        document.getElementById("date").value;

    const activite =
        document.getElementById("activite").value;

    const lieu =
        document.getElementById("lieu").value;

    const debut =
        document.getElementById("debut").value;

    const fin =
        document.getElementById("fin").value;

    if(!date || !debut || !fin){

        alert("Compléter les champs");

        return;
    }

    planning[date].push({

        activite,
        lieu,
        debut,
        fin
    });

    afficherBlocs(date);

    calculerTotal(date);
}

/* ========================================= */
/* AFFICHER BLOCS */
/* ========================================= */

function afficherBlocs(date){

    const timeline =
        document.getElementById(`timeline-${date}`);

    timeline.innerHTML = "";

    planning[date].forEach((bloc,index)=>{

        const div =
            document.createElement("div");

        div.className =
            "bloc";

        const start =
            convertirMinutes(bloc.debut);

        const end =
            convertirMinutes(bloc.fin);

        div.style.left =
            (start / 1440) * 100 + "%";

        div.style.width =
            ((end - start) / 1440) * 100 + "%";

        div.style.background =
            couleur(bloc.activite);

        div.innerHTML = `

            <div>

                <b>${bloc.activite}</b><br>

                ${bloc.debut} - ${bloc.fin}<br>

                ${bloc.lieu}

            </div>
        `;

        div.ondblclick = ()=>{

            ouvrirEdition(date, index);
        };

        timeline.appendChild(div);
    });
}

/* ========================================= */
/* EDITION */
/* ========================================= */

function ouvrirEdition(date,index){

    blocEnCours = {

        date,
        index
    };

    const bloc =
        planning[date][index];

    document.getElementById("modal").style.display =
        "block";

    document.getElementById("modalContent").innerHTML = `

        <h2>

            Modifier activité

        </h2>

        <select id="editActivite">

            ${listeActivites(bloc.activite)}

        </select>

        <select id="editLieu">

            ${listeLieux(bloc.lieu)}

        </select>

        <input type="time"
               id="editDebut"
               value="${bloc.debut}">

        <input type="time"
               id="editFin"
               value="${bloc.fin}">

        <div class="modalButtons">

            <button onclick="sauvegarderEdition()">

                Enregistrer

            </button>

            <button onclick="supprimerBloc()">

                Supprimer

            </button>

            <button onclick="fermerModal()">

                Annuler

            </button>

        </div>
    `;
}

/* ========================================= */
/* SAVE EDITION */
/* ========================================= */

function sauvegarderEdition(){

    const item =
        planning[blocEnCours.date][blocEnCours.index];

    item.activite =
        document.getElementById("editActivite").value;

    item.lieu =
        document.getElementById("editLieu").value;

    item.debut =
        document.getElementById("editDebut").value;

    item.fin =
        document.getElementById("editFin").value;

    afficherBlocs(blocEnCours.date);

    calculerTotal(blocEnCours.date);

    fermerModal();
}

/* ========================================= */
/* DELETE */
/* ========================================= */

function supprimerBloc(){

    planning[blocEnCours.date]
    .splice(blocEnCours.index,1);

    afficherBlocs(blocEnCours.date);

    calculerTotal(blocEnCours.date);

    fermerModal();
}

/* ========================================= */
/* TOTAL */
/* ========================================= */

function calculerTotal(date){

    let total = 0;

    planning[date].forEach(x=>{

        if(x.activite !== "Pause"){

            total +=
            convertirMinutes(x.fin)
            -
            convertirMinutes(x.debut);
        }
    });

    total =
        total / 60;

    document.getElementById(`total-${date}`)
    .innerHTML =
        total.toFixed(2) + "h";
}

/* ========================================= */
/* UTILS */
/* ========================================= */

function convertirMinutes(h){

    if(!h)
        return 0;

    const p =
        h.split(":");

    return Number(p[0]) * 60 +
           Number(p[1]);
}

function obtenirJour(date){

    const jours = [

        "Dim",
        "Lun",
        "Mar",
        "Mer",
        "Jeu",
        "Ven",
        "Sam"
    ];

    return jours[
        new Date(date).getDay()
    ];
}

function couleur(act){

    const map = {

        "Présence":"#107C10",
        "Pause":"#666",
        "Day Off":"#999",
        "Congé":"#C50F1F",
        "RTT":"#0078D4",
        "Alternance Ecole":"#5C2D91",
        "Maladie":"#D83B01",
        "Absence":"#A80000",
        "Grève":"#8764B8",
        "Férié":"#FFB900",
        "Départ":"#605E5C",
        "Récupération":"#00B294",
        "Récupération A-1":"#004E8C"
    };

    return map[act] || "#444";
}

function listeActivites(selected){

    const liste = [

        "Présence",
        "Pause",
        "Day Off",
        "Congé",
        "RTT",
        "Alternance Ecole",
        "Maladie",
        "Absence",
        "Grève",
        "Férié",
        "Départ",
        "Récupération",
        "Récupération A-1"
    ];

    return liste.map(x=>`

        <option
            ${x===selected?"selected":""}>

            ${x}

        </option>

    `).join("");
}

function listeLieux(selected){

    const liste = [

        "Sur site",
        "Télétravail",
        "Déplacement"
    ];

    return liste.map(x=>`

        <option
            ${x===selected?"selected":""}>

            ${x}

        </option>

    `).join("");
}

function fermerModal(){

    document.getElementById("modal").style.display =
        "none";
}

function ajoutRapide(date){

    document.getElementById("date").value =
        date;
}
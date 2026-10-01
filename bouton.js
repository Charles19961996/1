// 1. Sélection des éléments HTML
const inputPrenom = document.getElementById('prenom');
const inputNom = document.getElementById('nom');
const btnAjouter = document.getElementById('btnAjouter');
const corpsTableau = document.getElementById('corpsTableau');

// 2. Charger les élèves déjà enregistrés au démarrage
let listeEleves = JSON.parse(localStorage.getItem('eleves')) || [];
afficherEleves();

// 3. Événement lors du clic sur le bouton Ajouter
btnAjouter.addEventListener('click', () => {
    const prenom = inputPrenom.value.trim();
    const nom = inputNom.value.trim();

    if (prenom === "" || nom === "") {
        alert("Veuillez remplir le nom et le prénom !");
        return;
    }

    listeEleves.push({ prenom: prenom, nom: nom });
    localStorage.setItem('eleves', JSON.stringify(listeEleves));

    afficherEleves();
    inputPrenom.value = "";
    inputNom.value = "";
});

// 4. Fonction pour afficher la liste dans le tableau HTML
function afficherEleves() {
    corpsTableau.innerHTML = ""; 

    if (listeEleves.length === 0) {
        // Ajusté à colspan="3" car nous avons maintenant 3 colonnes
        corpsTableau.innerHTML = `<tr><td colspan="3" class="vide">Aucun élève dans la liste</td></tr>`;
        return;
    }

    // On parcourt les élèves avec leur numéro de position (index)
    listeEleves.forEach((eleve, index) => {
        const ligne = document.createElement('tr');
        
        // On crée la structure de la ligne en ajoutant le bouton de suppression à la fin
        ligne.innerHTML = `
            <td>${eleve.prenom}</td>
            <td>${eleve.nom}</td>
            <td><button class="btn-supprimer" onclick="supprimerEleve(${index})">❌ Supprimer</button></td>
        `;
        corpsTableau.appendChild(ligne);
    });
}

// NOUVEAUTÉ : Fonction pour retirer un élève précis de la liste
window.supprimerEleve = function(index) {
    if (confirm(`Voulez-vous vraiment retirer ${listeEleves[index].prenom} de la liste ?`)) {
        // Enlève l'élément ciblé du tableau JavaScript
        listeEleves.splice(index, 1);
        
        // Met à jour la mémoire du navigateur
        localStorage.setItem('eleves', JSON.stringify(listeEleves));
        
        // Rafraîchit l'affichage à l'écran
        afficherEleves();
    }
}

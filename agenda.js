document.addEventListener('DOMContentLoaded', function() {
  // 1) On récupère l'élément du calendrier et les champs internes du popup.
  //    Ces références sont essentielles car elles permettent de lire/écrire
  //    le titre, la date, l'heure de début, l'heure de fin et le commentaire.
  const calendarEl = document.getElementById('calendar');

  const modal = document.getElementById('eventModal');
  const modalNomEvenement = document.getElementById('modalNomEvenement');
  const secondEleveContainer = document.getElementById('secondEleveContainer');
  const modalDeuxiemeEleve = document.getElementById('modalDeuxiemeEleve');
  const modalDateEvenement = document.getElementById('modalDateEvenement');
  const modalDebutHeure = document.getElementById('modalDebutHeure');
  const modalFinHeure = document.getElementById('modalFinHeure');
  const modalDescriptionEvenement = document.getElementById('modalDescriptionEvenement');
  const btnSaveEvent = document.getElementById('saveEventBtn');
  const btnCancelEvent = document.getElementById('cancelEventBtn');

  // 2) Fonction de conversion: transforme une Date JavaScript en format YYYY-MM-DD,
  //    compatible avec un champ <input type="date">.
  function formatDateToInput(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  // 3) Fonction de conversion inverse pour les heures au format HH:mm.
  function formatTimeToInput(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function getElevesFromStorage() {
    try {
      const donnees = JSON.parse(localStorage.getItem('eleves'));
      return Array.isArray(donnees) ? donnees : [];
    } catch (error) {
      return [];
    }
  }

  function getNomCompletEleve(eleve) {
    if (!eleve) return '';
    return [eleve.prenom, eleve.nom].filter(Boolean).join(' ').trim();
  }

  function populateNomEvenementOptions() {
    const eleves = getElevesFromStorage();
    modalNomEvenement.innerHTML = '<option value="">Choisir un élève</option>';
    modalDeuxiemeEleve.innerHTML = '<option value="">Aucun autre élève</option>';

    eleves.forEach((eleve) => {
      const nomComplet = getNomCompletEleve(eleve);
      if (!nomComplet) return;

      const option = document.createElement('option');
      option.value = nomComplet;
      option.textContent = nomComplet;
      modalNomEvenement.appendChild(option);

      modalDeuxiemeEleve.appendChild(option.cloneNode(true));
    });
  }

  function getNextElevNumber() {
    const evenements = JSON.parse(localStorage.getItem('agenda_evenements')) || [];
    const pattern = /^elev(\d+)$/i;
    let max = 0;

    evenements.forEach((evenement) => {
      const titre = String(evenement.title || '');
      const match = titre.match(pattern);
      if (match) {
        const numero = Number(match[1]);
        if (numero > max) max = numero;
      }
    });

    return max + 1;
  }

  function resolveEventTitle() {
    const premierEleve = modalNomEvenement.value;
    if (!premierEleve) return '';

    const deuxiemeEleve = modalDeuxiemeEleve.value;
    if (!deuxiemeEleve) return premierEleve;

    return `${premierEleve}, ${deuxiemeEleve}`;
  }

  // 4) Fonction pour générer des horaires par défaut simples : 09:00 à 10:00.
  function getDefaultEventTimes(date) {
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);

    const end = new Date(date);
    end.setHours(10, 0, 0, 0);

    return {
      start: formatTimeToInput(start),
      end: formatTimeToInput(end)
    };
  }

  // 5) Fonction de fusion: combine une date et une heure en une chaîne ISO simple,
  function combineDateAndTime(dateString, timeString) {
    if (!dateString || !timeString) return null;
    return `${dateString}T${timeString}`;
  }

  // 5) Ajout d'un événement dans le calendrier et stockage local.
  //    On crée un objet avec title/start/end, puis on l'ajoute à FullCalendar
  //    et à localStorage pour qu'il reste présent après rechargement.
  function addEvenementToCalendar(title, start, end, description = '') {
    const nouvelEvenement = {
      title: title,
      start: start,
      end: end,
      extendedProps: {
        description: description
      }
    };

    calendar.addEvent(nouvelEvenement);
    evenementsSauvegardes.push(nouvelEvenement);
    localStorage.setItem('agenda_evenements', JSON.stringify(evenementsSauvegardes));
  }

  // 6) Validation métier: on vérifie qu'un événement a bien une date,
  //    une heure de début et une heure de fin, puis que la fin est bien après le début.
  function validateEventDates(start, end) {
    if (!start || !end) {
      return 'Veuillez choisir la date et les heures de début et de fin.';
    }

    if (new Date(end) <= new Date(start)) {
      return 'L\'heure de fin doit être après l\'heure de début.';
    }

    return null;
  }

  // 6) Ouvre le popup avec une date et des heures par défaut.
  function openModal(date = new Date()) {
    const defaultTimes = getDefaultEventTimes(date);
    populateNomEvenementOptions();
    modalNomEvenement.value = '';
    modalDateEvenement.value = formatDateToInput(date);
    modalDebutHeure.value = defaultTimes.start;
    modalFinHeure.value = defaultTimes.end;
    modalDescriptionEvenement.value = '';
    modalDeuxiemeEleve.value = '';
    secondEleveContainer.classList.add('hidden');

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modalNomEvenement.focus();
  }

  // 7) Fermeture du popup: remet le formulaire à zéro et masque la modale.
  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    modalNomEvenement.value = '';
    modalDeuxiemeEleve.value = '';
    secondEleveContainer.classList.add('hidden');
    modalDateEvenement.value = '';
    modalDebutHeure.value = '';
    modalFinHeure.value = '';
    modalDescriptionEvenement.value = '';
  }

  // Récupération sécurisée des données de la mémoire locale
  let evenementsSauvegardes = JSON.parse(localStorage.getItem('agenda_evenements')) || [];

  // Création de l'instance avec la version globale compatible CDN
  // 8) Création du calendrier FullCalendar.
  //    L'option selectable: true active la sélection de créneaux; on utilise ensuite
  //    le callback select pour ouvrir le popup au moment où l'utilisateur clique sur le calendrier.
  const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'timeGridWeek',
      locale: 'fr',
      slotMinTime: '07:00:00',
      slotMaxTime: '20:00:00',
      firstDay: 1,
      allDaySlot: false,
      headerToolbar: false,
      events: evenementsSauvegardes,
      selectable: true,

      // 9) Callback exécuté quand l'utilisateur clique sur une case du calendrier.
      select: function(info) {
          const dateDebut = new Date(info.start);
          openModal(dateDebut);
          calendar.unselect();
      },

      eventClick: function(info) {
          const details = info.event.extendedProps.description ? `\n\nDétail : ${info.event.extendedProps.description}` : '';
          if (confirm(`Supprimer le cours "${info.event.title}" ?${details}`)) {
              info.event.remove();
              evenementsSauvegardes = evenementsSauvegardes.filter(evt => {
                  return evt.start !== info.event.startStr || evt.title !== info.event.title;
              });
              localStorage.setItem('agenda_evenements', JSON.stringify(evenementsSauvegardes));
          }
      }
  });

  // 10) Enregistrement du formulaire du popup.
  //    On lit la valeur de chaque champ, on vérifie qu'ils sont remplis,
  //    puis on transforme date + heure en chaîne exploitable par FullCalendar.
  function enregistrerEvenementDepuisModal() {
      let titre = resolveEventTitle();
      const dateEvt = modalDateEvenement.value;
      const heureDebut = modalDebutHeure.value;
      const heureFin = modalFinHeure.value;
      const description = modalDescriptionEvenement.value.trim();

      const debut = combineDateAndTime(dateEvt, heureDebut);
      const fin = combineDateAndTime(dateEvt, heureFin);

        if (!titre) {
          alert('Veuillez choisir un élève ou ajouter un autre élève.');
          return;
      }

          if (modalDeuxiemeEleve.value === 'AUTRE_ELEVE') {
            titre = `${titre}, elev${getNextElevNumber()}`;
          }

      if (!dateEvt || !heureDebut || !heureFin) {
          alert('Veuillez choisir la date et les heures de début et de fin.');
          return;
      }

      const erreur = validateEventDates(debut, fin);
      if (erreur) {
          alert(erreur);
          return;
      }

      addEvenementToCalendar(titre, debut, fin, description);
      closeModal();
  }

  // 11) Les boutons du popup sont reliés à la logique de sauvegarde / fermeture.
  btnSaveEvent.addEventListener('click', enregistrerEvenementDepuisModal);
  btnCancelEvent.addEventListener('click', closeModal);

  modalNomEvenement.addEventListener('change', function() {
    const premierEleveSelectionne = Boolean(modalNomEvenement.value);
    secondEleveContainer.classList.toggle('hidden', !premierEleveSelectionne);
    modalDeuxiemeEleve.value = '';
  });

  modal.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Lance le rendu immédiat
  calendar.render();
});

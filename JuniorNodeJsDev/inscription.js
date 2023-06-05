const btnRetourAuth = document.getElementById('btnRetourAuth');

btnRetourAuth.addEventListener('click', () => {
    location.href ='/authentification';
});

const formInscription = document.getElementById('formInscription')
const nom = document.getElementById('nom');
const prenom = document.getElementById('prenom');
const courriel = document.getElementById('courriel');
const mot_de_passe = document.getElementById('mot_de_passe');
const confirmer_mot_de_passe = document.getElementById('confirmer_mot_de_passe');
const selectTypeUtilisateur = document.getElementById('selectTypeUtilisateur');
const messageErreurInscription = document.getElementById('messageErreurInscription');

// Configuration de la validation des inputs du formulaire d'inscription
const validerFormInscription = () => {
    if(nom.validity.valid && prenom.validity.valid && courriel.validity.valid && mot_de_passe.validity.valid
        && confirmer_mot_de_passe.validity.valid && selectTypeUtilisateur.validity.valid) {
            messageErreurInscription.innerText = '';
    } else {
        if(nom.validity.valueMissing) {
            messageErreurInscription.innerText = 'Veuillez entrer un nom valide.';
        } else if(nom.validity.tooShort) {
            messageErreurInscription.innerText = 'Le nom entré est trop court. Un nom composé au moins de 2 lettres est requis.'
        } else if(nom.validity.tooLong) {
            messageErreurInscription.innerText = 'Le nom entré est trop long. Un nom ne peut pas dépasser 50 lettres.'
        } else if(prenom.validity.valueMissing) {
            messageErreurInscription.innerText = 'Veuillez entrer un prénom valide.';
        } else if(prenom.validity.tooShort) {
            messageErreurInscription.innerText = 'Le prénom entré est trop court. Un nom composé au moins de 2 lettres est requis.'
        } else if(prenom.validity.tooLong) {
            messageErreurInscription.innerText = 'Le prénom entré est trop long. Un nom ne peut pas dépasser 50 lettres.'
        } else if(courriel.validity.valueMissing) {
            messageErreurInscription.innerText = 'Veuillez entrer un courriel valide.';
        } else if(courriel.validity.tooShort) {
            messageErreurInscription.innerText = 'Le courriel entré semble invalide. Veuillez réessayer.'
        } else if(courriel.validity.tooLong) {
            messageErreurInscription.innerText = 'Le courriel entré semble invalide. Veuillez réessayer.'
        } else if(mot_de_passe.validity.valueMissing) {
            messageErreurInscription.innerText = 'Veuillez entrer un mot de passe valide.';
        } else if(mot_de_passe.validity.tooShort) {
            messageErreurInscription.innerText = 'Le mot de passe entré doit compter 10 caractères au minimum.'
        } else if(mot_de_passe.validity.tooLong) {
            messageErreurInscription.innerText = 'Le mot de passe entré ne doit pas compter plus de 60 caractères.'
        } else if(confirmer_mot_de_passe.validity.valueMissing) {
            messageErreurInscription.innerText = 'Veuillez entrer un mot de passe valide dans le champ de confirmation.';
        } else if(confirmer_mot_de_passe.validity.tooShort) {
            messageErreurInscription.innerText = 'Le du mot de passe confirmé doit compter 10 caractères au minimum.'
        } else if(confirmer_mot_de_passe.validity.tooLong) {
            messageErreurInscription.innerText = 'Le mot de passe confirmé ne doit pas compter plus de 60 caractères.'
        } else if(selectTypeUtilisateur.validity.valueMissing) {
            messageErreurInscription.innerText = `Veuillez entrer un type d'utilisateur valide.`;
        } 
        messageErreurInscription.style.color = 'red';
    };
};

// Ajout d'événements pour la validation des inputs du formulaire d'inscription
nom.addEventListener('input', validerFormInscription);
nom.addEventListener('blur', validerFormInscription);
prenom.addEventListener('input', validerFormInscription);
prenom.addEventListener('blur', validerFormInscription);
courriel.addEventListener('input', validerFormInscription);
courriel.addEventListener('blur', validerFormInscription);
mot_de_passe.addEventListener('input', validerFormInscription);
mot_de_passe.addEventListener('blur', validerFormInscription);
confirmer_mot_de_passe.addEventListener('input', validerFormInscription);
confirmer_mot_de_passe.addEventListener('blur', validerFormInscription);
selectTypeUtilisateur.addEventListener('input', validerFormInscription);
selectTypeUtilisateur.addEventListener('blur', validerFormInscription);
formInscription.addEventListener('submit', validerFormInscription);

// Inscription
formInscription.addEventListener('submit', async(e) => {
    e.preventDefault();
    if(formInscription.checkValidity()) {

        if(mot_de_passe.value !== confirmer_mot_de_passe.value) {
            messageErreurInscription.textContent = 'Les deux mots de passe entrés ne sont pas identiques. Veuillez réessayer.'
        } else {
            messageErreurInscription.textContent = '';
        let id_type_utilisateur;
        if(selectTypeUtilisateur.value === '2') {
            id_type_utilisateur = 2
        } else if(selectTypeUtilisateur.value === '3') {
            id_type_utilisateur = 3
        };
        
        let data = {
            nom : nom.value,
            prenom : prenom.value,
            courriel : courriel.value,
            mot_de_passe : mot_de_passe.value,
            id_type_utilisateur : id_type_utilisateur,
            id_groupe : 0,
            created_by : 0
        }
        
        let reponse = await fetch('/inscription', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)        
        });

        if(reponse.ok) {
            formInscription.style.display = 'none';
            messageErreurInscription.innerText = `Un lien de confirmation vous a été envoyé sur votre courriel. Veuillez cliquer dessus pour confirmer votre inscription`;
        } else if(reponse.status === 409) {
            messageErreurInscription.innerText = `Il y'a déjà un utilisateur enregistré avec ce courriel\nVeuillez en utiliser un autre ou connectez-vous.`;
        } else if(reponse.status === 400) {
            messageErreurInscription.innerText = (`Le format des données entrées n'est pas autorisé.\nVeuillez réessayer.`);
        }
        }

        
    }
});
// Aller chercher les configurations de l'application
import 'dotenv/config';

// Importer les fichiers et librairies
import express, { json, response, urlencoded } from 'express';
import expressHandlebars from 'express-handlebars';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import crypto from 'crypto';
import cspOption from './csp-options.js';
import memorystore from 'memorystore';
import nodemailer from 'nodemailer';
import session from 'express-session';
import passport from 'passport';
import './configAuthentication.js';

// Importer les méthodes 
import { listerMatieres, ajouterMatiere, supprimerMatiere, modifierMatiere, trouverMatiereID, trouverThemesLiesAuneMatiere } from './model/BDD_matiere.js';
import { listerThemes, ajouterTheme, supprimerTheme, modifierTheme, trouverThemeID, trouverThemesDuneMatiere } from './model/BDD_theme.js';
import { listerQuestions, ajouterQuestion, supprimerQuestion, modifierQuestion, trouverQuestionParId, listerQuestionsDuneMatiere, listerQuestionsDunTheme } from './model/BDD_question.js';
import { listerGroupes, ajouterGroupe, supprimerGroupe, modifierGroupe, trouverGroupeID, trouverUtilisateursLiesAunGroupe } from './model/BDD_groupe.js';
import { addUtilisateur, listerUtilisateurs, trouverEtudiant, listerUtilisateursAvecGroupe, trouverEtudiantParId, modifierUtilisateur, supprimerUtilisateur, trouverEtudiantParToken, modifierUtilisateurStatutVerifie, modifierNomUtilisateurParLuiMeme, modifierPrenomUtilisateurParLuiMeme, modifierMotDePasse} from './model/BDD_utilisateur.js';
import { ajouterQuiz, listerQuizs, trouverQuizParNom, trouverQuizParId, supprimerQuiz } from './model/BDD_quiz.js';
import { listerQuestionsDunQuiz, ajouterQuestionAunQuiz, nbQuestionsQuiz, listerQuestionDunQuiz } from './model/BDD_questions_quiz.js';
import { ajouterAffectationQuiz, supprimerAffectationQuiz, listerQuizsAffectes, trouverQuizAffectationID } from './model/BDD_quiz_affectation.js';
import { ajouterAssociationQuizEtudiant, modifierNoteAssociationQuizEtudiant, modifierAssoQuizEtudiantQuitte, supprimerAssociationQuizEtudiant, listerAssociationQuizEtudiant, listerAssociationQuizAffectation, modifierStatutAssociationQuizEtudiant, modifierResultatAssociationQuizEtudiant, listerDetails } from './model/BDD_association_quiz_etudiant.js';
import { ajouterDetailsResultatsQuiz, recupererDetailsResultatsQuiz, supprimerDetailsResultatsQuiz, recupererDetailsResultatsEtudiant, trouverIdQuizDuneAssociationQE } from './model/BDD_details_resultats_quiz.js'
import { champValide } from './model/dataValidation.js';
import { connexionValidation, inscriptionValidation } from './model/authenticationValidation.js';

// Création de la base de données de session
const MemoryStore = memorystore(session);

// Création du serveur
const app = express();
app.engine('handlebars', expressHandlebars());
app.set('view engine', 'handlebars');
app.enable('trust proxy');

// Ajout de middlewares
app.use(helmet(cspOption));
app.use(compression());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(session({
    cookie: { maxAge: 1800000 },
    name: process.env.npm_package_name,
    store: new MemoryStore({ checkPeriod: 1800000 }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static('public'));

//****************************************************\\
//*************** GESTION DES MATIÈRES ***************\\
//****************************************************\\
// #region
// Ajout d'une nouvelle matière
app.post('/matieres', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let intitule = req.body.intitule;
        if(!champValide(intitule)) {
            res.sendStatus(404);
        } else {
            await ajouterMatiere(intitule);
            res.status(201).end();
        }
    }
});

// Récupérer et afficher les matières
app.get('/matieres', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let matieres = await listerMatieres();
        res.render('matieres', {
            title : 'Gestion des matières',
            contenu : matieres,
            styles : ['/css/matieres.css'],
            scripts : ['/js/matieres.js'],
            titreSection: 'Gérer les matières',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

//Récupérer la liste des matières
app.get('/matieres_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let matieres = await listerMatieres();
        res.status(200).json(matieres);
    }
});

// Modifier une matière
app.put('/matieres', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let id = req.body.id_matiere;
        let intitule = req.body.intitule;
        await modifierMatiere(id, intitule);
        res.status(201).end();
    }
});

// Trouver une matière
app.get('/matieres/:intitule', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let intitule = req.params.intitule;
        let matiere = await trouverMatiereID(`${intitule}`);
        res.status(200).json(matiere);
    }
});

// Supprimer une matière
app.delete('/matieres', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let intitule = req.body.intitule;
        await supprimerMatiere(intitule);
        res.status(201).end();
    }
});

// Récupérer la liste des thèmes rattachés à une matière
app.get('/matiere_themes_rattaches/:id_matiere', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_matiere = req.params.id_matiere;
        let data = await trouverThemesLiesAuneMatiere(id_matiere);
        res.status(200).json(data);
    }
});
// #endregion

//****************************************************\\
//*************** GESTION DES THÈMES *****************\\
//****************************************************\\
// #region
// Ajout d'un thème
app.post('/themes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let intitule = req.body.intitule;
        let id_matiere = req.body.id_matiere
        if(!champValide(intitule)) {
            res.sendStatus(404);
        } else {
            await ajouterTheme(id_matiere, intitule);
            res.status(201).end();
        }
    }
});

// Lister les thèmes
app.get('/themes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let themes = await listerThemes();
        res.render('themes', {
            title : 'Gestion des thèmes',
            contenu : themes,
            styles : ['/css/themes.css'],
            scripts : ['/js/themes.js'],
            titreSection: 'Gérer les thèmes',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

// Mettre à jour les thèmes avec un array passé comme argument depuis JS
app.post('/themes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let themes = req.body.liste
        res.render('themes', {
            title : 'Gestion des thèmes',
            contenu : themes,
            styles : ['/css/themes.css'],
            scripts : ['/js/themes.js'],
            titreSection: 'Gérer les thèmes',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

//Récupérer la liste des thèmes
app.get('/themes_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let themes = await listerThemes();
        res.status(200).json(themes)
    }
});

// Modifier un thème
app.put('/themes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let id_theme = req.body.id_theme;
        let intitule = req.body.intitule;
        await modifierTheme(id_theme, intitule);
        res.status(201).end();
    }
});

// Trouver un thème
app.get('/themes/:intitule', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let intitule = req.params.intitule;
        let theme = await trouverThemeID(intitule);
        res.status(200).json(theme);
    }
});

// Supprimer un thème
app.delete('/themes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1) {
        res.sendStatus(403);
    } else {
        let id_theme = req.body.id_theme;
        await supprimerTheme(id_theme);
        res.status(201).end();
    }
});

// Trouver les thèmes rattachés à une matière
app.get('/themes_rattaches_a_une_matiere/:id_matiere', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_matiere = req.params.id_matiere
        let themes = await trouverThemesLiesAuneMatiere(id_matiere);
        res.status(200).json(themes);
    }
});
// #endregion

//****************************************************\\
//************** GESTION DES GROUPES *****************\\
//****************************************************\\
// #region

// Lister les groupes et rendering de la page
app.get('/groupes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let groupes = await listerGroupes(req.user.id_utilisateur);
        res.render('groupes', {
            title : 'Gestion des groupes',
            contenu : groupes,
            styles : ['/css/groupes.css'],
            scripts : ['/js/groupes.js'],
            titreSection: 'Gérer les groupes',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

//Récupérer la liste des groupes
app.get('/groupes_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let groupes = await listerGroupes(req.user.id_utilisateur);
        res.status(200).json(groupes)
    }
});

// Ajouter un groupe
app.post('/groupes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let intitule = req.body.intitule;
        let id_professeur = req.user.id_utilisateur;
        let date_creation = Date.now();
        if(!champValide(intitule)) {
            res.sendStatus(404);
        } else {
            await ajouterGroupe(intitule, id_professeur, date_creation);
            res.status(201).end();
        }
    }
});

// Trouver un groupe
app.get('/groupes/:intitule', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let intitule = req.params.intitule;
        let groupe = await trouverGroupeID(intitule);
        res.status(200).json(groupe);
    }
});

// Supprimer un groupe
app.delete('/groupes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_groupe = req.body.id_groupe;
        await supprimerGroupe(id_groupe);
        res.status(201).end();
    }
});

// Modifier un groupe
app.put('/groupes', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_groupe = req.body.id_groupe;
        let intitule = req.body.intitule;
        await modifierGroupe(id_groupe[0].id_groupe, intitule);
        res.status(201).end();
    }
});

// Récupérer la liste des étudiants rattachés à un groupe
app.get('/groupe_etudiants_rattaches/:id_groupe', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_groupe = req.params.id_groupe;
        let data = await trouverUtilisateursLiesAunGroupe(id_groupe);
        res.status(200).json(data);
    }
});
// #endregion

//****************************************************\\
//***** GESTION INSCRIPTION / AUTHENTIFICATION *******\\
//****************************************************\\
// #region

//Nodemailer config
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'aheddar90@gmail.com',
        pass: 'zkxwcklgybxqboqp'
    },
    tls: {
        rejectUnauthorized: false
    }
});

let user;
//Vérification du courriel par le token
app.get('/verify-email', async(req, res) => {
    try {
        const token = req.query.token;
        user = await trouverEtudiantParToken(token);
        if(user) {
            if(user.isverified === 0) {
                user.courriel_token = null;
                user.isverified = 1;
                await modifierUtilisateurStatutVerifie(user.id_utilisateur, user.courriel_token, user.isverified);
                res.redirect('/changementInitialMdp');
            } else if(user.isverified === 1) {
                res.redirect('/authentification');
            }
        } else {
            res.redirect('/inscription');
        }
    } catch(error) {
    }
});

//Vérification du courriel par le token
app.get('/verify-email-self', async(req, res) => {
    try {
        const token = req.query.token;
        const user = await trouverEtudiantParToken(token);
        if(user) {
            if(user.isverified === 0) {
                user.courriel_token = null;
                user.isverified = 1;
                await modifierUtilisateurStatutVerifie(user.id_utilisateur, user.courriel_token, user.isverified);
                res.redirect('/authentification');
            } else if(user.isverified === 1) {
                res.redirect('/authentification');
            }
        } else {
            res.redirect('/inscription');
        }
    } catch(error) {
    }
});

// Inscription nouvel utilisateur
app.post('/inscription', async(req, res, next) => {
    if(inscriptionValidation(req.body)) {
        let isverified = 0;
        let courriel_token = crypto.randomBytes(64).toString('hex');
        try {
            await addUtilisateur(req.body.nom, req.body.prenom, 
                req.body.courriel, req.body.mot_de_passe, req.body.id_type_utilisateur,
                req.body.id_groupe, req.body.created_by, courriel_token, isverified);
                //send verification mail to new user
                let mailOptions = {
                    from: ' "CitéQuiz" <aheddar90@gmail.com> ',
                    to : req.body.courriel,
                    subject: 'CitéQuiz - Confirmez votre inscription',
                    html: `<p>Bonjour ${req.body.prenom},</p>
                            <p>Merci d'avoir rejoint la communauté CitéQuiz, votre plateforme de quizs !</p>
                            <p> Veuillez cliquer sur le lien ci-dessous pour confirmer votre inscription :</p>
                            <p>
                                <a href="http://${req.headers.host}/verify-email-self?token=${courriel_token}">Confirmer mon inscription.</a>
                            </p>
                            <p>À très bientôt !</p>
                            `
                };
                transporter.sendMail(mailOptions, function(error, info) {
                    if(error) {
                        //console.log(error)
                    } else {
                        //console.log('ca ne marche pas')
                    }
                })
                res.sendStatus(201);
        } catch(error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                res.sendStatus(409);
            }
            else {
                next(error);
            }
        }
    } 
    else {
        res.sendStatus(400);
    }
}
);

// Connexion - Authentification
app.post('/connexion', (req, res, next) => {
    if(connexionValidation(req.body)) {
        passport.authenticate('local', (error, utilisateur, info) => {
            //console.log(utilisateur)
            if(error) {
                next(error);
            } else if(!utilisateur) {
                res.status(401).json(info)
            } else if(utilisateur.isverified === 0) {
                res.status(404).json()
            } else {
                req.logIn(utilisateur, (error) => {
                    if(error) {
                        next(error)
                    }
                    res.json({
                       user:req.user
                    });
                }); 
            }
        })(req, res, next);
    } else {
        res.sendStatus(400)
    }
});

// Déconnexion
app.post('/deconnexion', (req, res, next) => {
    req.logout((error) => {
        if(error) {
            next(error);
        } else {
            res.redirect('/');
        }
    });
});
// #endregion

//****************************************************\\
//*********** GESTION DES UTILISATEURS ***************\\
//****************************************************\\
// #region

// Lister les étudiants
app.get('/etudiants', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let etudiants = await listerUtilisateursAvecGroupe(req.user.id_utilisateur);
        res.render('etudiants', {
            title : 'Gestion des étudiants',
            contenu: etudiants,
            styles : ['/css/etudiants.css'],
            scripts : ['/js/etudiants.js'],
            titreSection: 'Gérer les étudiants',
            acceptCookie: req.session.accept,
            user: req.user
        });
    };
});

// Rendering de la page Ajout Étudiant
app.get('/ajoutEtudiant', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        res.render('ajoutEtudiant', {
            title : 'Gestion des étudiants',
            styles : ['/css/ajoutEtudiant.css'],
            scripts : ['/js/ajoutEtudiant.js'],
            titreSection: 'Ajouter un étudiant',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

// Ajout d'un nouvel étudiant
app.post('/ajoutEtudiant', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let isverified = 0;
        let courriel_token = crypto.randomBytes(64).toString('hex');
        let nom = req.body.nom;
        let prenom = req.body.prenom;
        let courriel = req.body.courriel;
        let motDePasse = "123@bcCde";
        let id_type_utilisateur = 3;
        let id_groupe = req.body.id_groupe;
        let created_by = req.body.created_by;
        //let created_by = req.user.id_utilisateur;
        try {
            await addUtilisateur(nom, prenom, courriel, motDePasse, id_type_utilisateur, id_groupe, created_by, courriel_token, isverified);
            let mailOptions = {
                from: ' "CitéQuiz" <aheddar90@gmail.com> ',
                to : courriel,
                subject: 'CitéQuiz - Confirmez votre inscription',
                html: `<p>Bonjour ${prenom},</p>
                        <p>Merci d'avoir rejoint la communauté CitéQuiz, votre plateforme de quizs !</p>
                        <p> Veuillez cliquer sur le lien ci-dessous pour confirmer votre inscription :</p>
                        <p>
                            <a href="http://${req.headers.host}/verify-email?token=${courriel_token}">Confirmer mon inscription.</a>
                        </p>
                        <p>À très bientôt !</p>
                        `
            };
            transporter.sendMail(mailOptions, function(error, info) {
                if(error) {
                    //console.log(error)
                } else {
                    //console.log('ca ne marche pas')
                }
            })
            res.sendStatus(201);
        } catch(error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                res.sendStatus(409);
            }
            else {
                next(error);
            }
        }
    }
});

//Réinitialiser un mot de passe oublié : Envoi courriel
// Ajout d'un nouvel étudiant
app.post('/mdpOublie', async(req, res, next) => {
    let courriel_token = crypto.randomBytes(64).toString('hex');
    let courriel = req.body.courriel;
    try {
        let id_utilisateur = (await trouverEtudiant(courriel))[0].id_utilisateur;
        let setToken = await modifierUtilisateurStatutVerifie(id_utilisateur, courriel_token, 1);

        //res.status(200).json(id_utilisateur1)
        let mailOptions = {
            from: ' "CitéQuiz" <aheddar90@gmail.com> ',
            to : courriel,
            subject: 'CitéQuiz - Réinitialiation du mot de passe',
            html: `<p>Bonjour,</p>
                    <p> Veuillez cliquer sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
                    <p>
                        <a href="http://${req.headers.host}/verify-email-mdpOublie?token=${courriel_token}">Réinitialiser mon mot de passe.</a>
                    </p>
                    <p>Si vous n'êtes pas à l'origine de cette demande, veuillez l'ignorer.</p>
                    <p>À très bientôt !</p>
                    `
        };
        transporter.sendMail(mailOptions, function(error, info) {
            if(error) {
                //console.log(error)
            } else {
                //console.log('ca ne marche pas')
            }
        })
        res.sendStatus(201);
    } catch(error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            res.sendStatus(409);
        }
        else {
            next(error);
        }
    }
});


//Vérification du courriel par le token
app.get('/verify-email-mdpOublie', async(req, res) => {
    try {
        const token = req.query.token;
        user = await trouverEtudiantParToken(token);
        if(user) {
            res.redirect('/changementInitialMdp')
        } else {
            res.redirect('/inscription');
        }
    } catch(error) {
    }
});

// Lister les utilisateurs
app.get('/listerUtilisateurs_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let utilisateurs = await listerUtilisateurs();
        res.status(200).json(utilisateurs);
    }
});

//Trouver un étudiant par le biais de son adresse courriel
app.get('/trouverEtudiant/:courriel', async(req, res) => {
    // if(!req.user) {
    //     res.sendStatus(401);
    // } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
    //     res.sendStatus(403);
    // } else {
        let courriel = req.params.courriel;
        let data = await trouverEtudiant(courriel);
        res.status(200).json(data)
    //}
});

//Lister les utilisateurs avec leur groupe d'affectation
app.get('/listerUtilisateurs_data_groupe', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let utilisateurs = await listerUtilisateursAvecGroupe(req.user.id_utilisateur);
        res.status(200).json(utilisateurs);
    }
});

//Touver un utilisateur avec son id
app.get('/trouverEtudiantParId/:id', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id = req.params.id;
        let data = await trouverEtudiantParId(id);
        res.status(200).json(data)
    }
});

// Modifier un utilisateur - étudiant / par un professeur
app.put('/etudiants', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_utilisateur = req.body.id_utilisateur;
        let nom = req.body.nom;
        let prenom = req.body.prenom;
        let id_groupe = req.body.id_groupe;
        await modifierUtilisateur(id_utilisateur, nom, prenom, id_groupe);
        res.status(201).end();
    }
});

// Modifier le nom d'un utilisateur - étudiant / par lui-même
app.put('/modificationProfil_nom', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_utilisateur = req.user.id_utilisateur;
        let nom = req.body.nom;
        await modifierNomUtilisateurParLuiMeme(id_utilisateur, nom);
        res.status(201).end();
    }
});

// Modifier le prénom d'un utilisateur - étudiant / par lui-même
app.put('/modificationProfil_prenom', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_utilisateur = req.user.id_utilisateur;
        let prenom = req.body.prenom
        await modifierPrenomUtilisateurParLuiMeme(id_utilisateur, prenom);
        res.status(201).end();
    }
});

// Modifier le MDP d'un utilisateur - étudiant / par lui-même
app.put('/modificationProfil_mdp', async(req, res) => {
    console.log(user)
    if(!user) {
        res.sendStatus(401);
    } else {
        let id_utilisateur = user.id_utilisateur;
        let mot_de_passe = req.body.mot_de_passe
        await modifierMotDePasse(id_utilisateur, mot_de_passe);
        res.status(201).end();
    }
});

// Supprimer un étudiant par un prof/évaluateur
app.delete('/etudiants', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id = req.body.id;
        await supprimerUtilisateur(id);
        res.status(201).end();
    }
});

// Désactiver compte (auto-désactivation)
app.delete('/desactivation', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id = req.user.id_utilisateur;
        await supprimerUtilisateur(id);
        res.status(201).end();
    }
});
// #endregion

//****************************************************\\
//************** Gestion des questions ***************\\
//****************************************************\\
// #region

// Rendering de la page Questions
app.get('/questions', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let questions = await listerQuestions();
        res.render('questions', {
            title : 'Gestion des questions',
            contenu: questions,
            styles : ['/css/questions.css'],
            scripts : ['/js/questions.js'],
            titreSection: 'Gérer les questions',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

// Rendering de la page Ajout Question
app.get('/ajoutQuestion', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        res.render('ajoutQuestion', {
            title : 'Gestion des questions',
            styles : ['/css/ajoutQuestion.css'],
            scripts : ['/js/ajoutQuestion.js'],
            titreSection: 'Ajouter une question',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

// Ajout d'une nouvelle question
app.post('/ajoutQuestion', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_matiere = req.body.id_matiere;
        let id_theme = req.body.id_theme;
        let nom_de_quiz = req.body.nom_de_quiz;
        let contenu_question = req.body.contenu_question;
        let reponse_option_1 = req.body.reponse_option_1;
        let reponse_option_2 = req.body.reponse_option_2;
        let reponse_option_3 = req.body.reponse_option_3;
        let reponse_correcte = req.body.reponse_correcte;
        await ajouterQuestion(id_matiere, id_theme, nom_de_quiz, contenu_question, reponse_option_1, reponse_option_2, reponse_option_3, reponse_correcte);
        res.status(201).end();
    }
});

// Lister les questions
app.get('/listerQuestions_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let questions = await listerQuestions();
        res.status(200).json(questions);
    }
});

//Touver une question avec son id
app.get('/trouverQuestionParId/:id', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id = req.params.id;
        let data = await trouverQuestionParId(id);
        res.status(200).json(data)
    }
});

// Modifier une question
app.put('/questions', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_question = req.body.id_question;
        let id_matiere = req.body.id_matiere;
        let id_theme = req.body.id_theme;
        let contenu_question = req.body.contenu_question;
        let reponse_option_1 = req.body.reponse_option_1;
        let reponse_option_2 = req.body.reponse_option_2;
        let reponse_option_3 = req.body.reponse_option_3;
        let reponse_correcte = req.body.reponse_correcte;
        let nom_de_quiz = req.body.nom_de_quiz;
        await modifierQuestion(id_question, id_matiere, id_theme, nom_de_quiz, contenu_question, reponse_option_1, reponse_option_2, reponse_option_3, reponse_correcte);
        res.status(201).end();
    };
});

// Supprimer une question
app.delete('/questions', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id = req.body.id;
        await supprimerQuestion(id);
        res.status(201).end();
    }
});

//Touver les questions d'une matière
app.get('/trouverQuestionParMatiere/:matiere', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let matiere = req.params.matiere;
        let data = await listerQuestionsDuneMatiere(matiere);
        res.status(200).json(data)
    }
});

//Touver les questions d'un thème
app.get('/trouverQuestionParTheme/:theme', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let theme = req.params.theme;
        let data = await listerQuestionsDunTheme(theme);
        res.status(200).json(data)
    }
});
// #endregion

//****************************************************\\
//***************** GESTION DES QUIZ *****************\\
//****************************************************\\
// #region

//Rendering de la page quiz
app.get('/quiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let data = await listerQuizs(req.user.id_utilisateur);
        res.render('quiz', {
            title : 'Gestion des quizs',
            contenu : data,
            styles : ['/css/quiz.css'],
            scripts : ['/js/quiz.js'],
            titreSection: 'Gérer les quizs',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

//Lister les quizs
app.get('/quiz_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let data = await listerQuizs(req.user.id_utilisateur);
        res.status(200).json(data);
    }
});

//Rendering de la page ajoutQuiz
app.get('/ajoutQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let data = await listerQuestions();
        res.render('ajoutQuiz', {
            title : 'Ajouter un quiz',
            contenu : data,
            styles : ['/css/ajoutQuiz.css'],
            scripts : ['/js/ajoutQuiz.js'],
            titreSection: 'Gérer les quizs',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

//Ajouter un quiz
app.post('/ajoutQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let nom = req.body.nom;
        let date_creation = Date.now();
        let created_by = req.user.id_utilisateur;
        await ajouterQuiz(nom, date_creation, created_by);
        res.status(201).end();
    }
});

//Trouver un quiz par son nom
app.get('/ajoutQuiz/:nom', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let nom = req.params.nom;
        let data = await trouverQuizParNom(nom);
        res.status(200).json(data);
    }
});

//Trouver un quiz par son nom
app.get('/trouverQuiz/:id', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id = req.params.id;
        let data = await trouverQuizParId(id);
        res.status(200).json(data);
    }
});

// Supprimer un quiz
app.delete('/quiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id = req.body.id;
        await supprimerQuiz(id);
        res.status(201).end();
    }
});

//Rendering de la page affecterQuiz
app.get('/affecterQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        res.render('affecterQuiz', {
            title : 'Affecter un quiz',
            styles : ['/css/affecterQuiz.css'],
            scripts : ['/js/affecterQuiz.js'],
            titreSection: 'Assigner un quiz',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

//Rendering de la page resultats
app.get('/resultats', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        res.render('resultats', {
            title : 'Résultats des quiz',
            styles : ['/css/resultats.css'],
            scripts : ['/js/resultats.js'],
            titreSection: 'Résultats des quiz',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});
// #endregion

//****************************************************\\
//**** Gestion de l'association questions - quiz *****\\
//****************************************************\\
// #region

//Lister les questions - quizs
app.get('/questions_quiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let data = await listerQuestionsDunQuiz();
        res.status(200).json(data);
    }
});

//Ajouter une question à un quiz
app.post('/ajoutQuestionsQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_quiz = req.body.id_quiz;
        let id_question = req.body.id_question;
        await ajouterQuestionAunQuiz(id_quiz, id_question);
        res.status(201).end();
    }
});

//Retourner le nombre de questions affectées à un quiz
app.get('/questions_quiz/:id_quiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_quiz = req.params.id_quiz;
        let data = await nbQuestionsQuiz(id_quiz);
        res.status(200).json(data);
    }
});

//Retourner les questions affectées à un quiz
app.get('/questions_quiz_data/:id_quiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_quiz = req.params.id_quiz;
        let data = await listerQuestionDunQuiz(id_quiz);
        res.status(200).json(data);   
    }
});

// #endregion

//****************************************************\\
//******** Gestion de l'affectation des quiz *********\\
//****************************************************\\
// #region

//Ajouter une affectation de quiz
app.post('/ajoutAffectationQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_quiz = req.body.id_quiz;
        let id_groupe = req.body.id_groupe;
        let date_debut = req.body.date_debut;
        let date_fin = req.body.date_fin;
        let heure_debut = req.body.heure_debut;
        let heure_desactivation = req.body.heure_desactivation;
        let duree = req.body.duree;
        let nom = req.body.nom;
        await ajouterAffectationQuiz(id_quiz, id_groupe, date_debut, date_fin, heure_debut, 
            heure_desactivation, duree, nom);
        res.status(201).end();
    }
});

//Trouver une affectation quiz en cherchant avec le nom
app.get('/trouverAffectationQuizParNom/:nom', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let nom = req.params.nom;
        let data = await trouverQuizAffectationID(nom);
        res.status(200).json(data)
    }
});

//Lister les quizs affectés à un professeur
app.get('/quizAffectes_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let data = await listerQuizsAffectes(req.user.id_utilisateur);
        res.status(200).json(data);
    }
});

//Supprimer les quizs affectés
app.delete('/supprimerAffectationQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        await supprimerAffectationQuiz();
        res.status(201).end();
    }
});

// #endregion

//****************************************************\\
//***** Gestion de l'association Etudiant - Quiz *****\\
//****************************************************\\
// #region

//Ajouter une affectation de quiz
app.post('/ajoutAssociationQuizEtudiant', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id_quiz_affectation = req.body.id_quiz_affectation;
        let id_utilisateur = req.body.id_utilisateur;
        let statut = req.body.statut;
        let resultat = req.body.resultat;
        await ajouterAssociationQuizEtudiant(id_quiz_affectation, id_utilisateur, statut, resultat);
        res.status(201).end();
    }
});

//Lister les quizs
app.get('/associationQuizEtudiant_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_utilisateur = req.user?.id_utilisateur;
        let data = await listerAssociationQuizEtudiant(id_utilisateur);
        res.status(200).json(data);
    }
});

//Lister les quizs en se basant sur l'id d'affectation
app.get('/associationQuizBaseId_data/:id', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let data = await listerAssociationQuizAffectation(req.params.id);
        res.status(200).json(data);
    }
});

// Modifier une association quiz - étudiant
app.put('/modifierStatutAssociationQuizEtudiant', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_association_quiz_etudiant = req.body.id_association_quiz_etudiant;
        let statut = req.body.statut;
        await modifierStatutAssociationQuizEtudiant(id_association_quiz_etudiant, statut);
        res.status(201).end();
    };
});

// Modifier la note d'une association quiz - étudiant
app.put('/modifierNoteAssociationQuizEtudiant', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_association_quiz_etudiant = req.body.id_association_quiz_etudiant;
        let resultat = req.body.resultat;
        await modifierNoteAssociationQuizEtudiant(resultat, id_association_quiz_etudiant);
        res.status(201).end();
    };
});

//Lister les détails d'une association quiz-affectation
app.get('/associationQuizEtudiantAffectation_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_utilisateur = req.user?.id_utilisateur;
        let id_quiz_affectation = req.query.id_quiz_affectation;
        let statut = req.query.statut;
        if(statut === 'null') {
            let data = await listerDetails(id_quiz_affectation);
            res.status(200).json(data);
        } else {
            let data = await listerDetails(id_quiz_affectation, statut);
            res.status(200).json(data);
        }
    }
});

// Modifier une association quiz - étudiant
app.put('/modifierResultatAssociationQuizEtudiant', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_association_quiz_etudiant = req.body.id_association_quiz_etudiant;
        let resultat = req.body.resultat;
        let temps_restant = req.body.temps_restant;
        let date = Date.now();
        await modifierResultatAssociationQuizEtudiant(resultat, date, id_association_quiz_etudiant, temps_restant);
        res.status(201).end();
    };
});

// Modifier une association quiz - étudiant
app.put('/modifierAssoQuizEtudiantQuitte', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_association_quiz_etudiant = req.body.id_association_quiz_etudiant;
        let temps_restant = req.body.temps_restant;
        let date = Date.now();
        await modifierAssoQuizEtudiantQuitte(date, id_association_quiz_etudiant, temps_restant);
        res.status(201).end();
    };
});


// Supprimer une association quiz - étudiant
app.delete('/associationQuizEtudiant_data', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        let id = req.body.id;
        await supprimerAssociationQuizEtudiant(id);
        res.status(201).end();
    }
});

// #endregion

//****************************************************\\
//***** Gestion des détails réponses au quiz *********\\
//****************************************************\\
// #region

//Ajouter les réponses aux questions d'un quiz
app.post('/ajouterDetailsResultatsQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id_etudiant = req.user.id_utilisateur;
        let id_quiz = req.body.id_quiz;
        let id_question = req.body.id_question;
        let reponse_correcte = req.body.reponse_correcte;
        let reponse_cochee = req.body.reponse_cochee;
        let id_association_quiz_etudiant = req.body.id_association_quiz_etudiant;
        let resultat = 0;
        if((Number(reponse_correcte)) === (Number(reponse_cochee))) {
            resultat = 1;
        } else {
            resultat = 0;
        }
        await ajouterDetailsResultatsQuiz(id_etudiant, id_quiz, id_question, reponse_correcte, reponse_cochee, resultat, id_association_quiz_etudiant);
        res.status(201).end();
    }
});

//Trouver les détails des résultats d'un quiz complété
app.get('/recupererDetailsResultatsQuiz/:id', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id = req.params.id;
        let data = await recupererDetailsResultatsQuiz(id);
        res.status(200).json(data)
    }
});

// Supprimer un résultat question
app.delete('/supprimerDetailsResultatsQuiz', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        //let id = req.params.id;
        await supprimerDetailsResultatsQuiz();
        res.status(201).end();
    }
});

//Trouver les résultats de tous les quizs d'un étudiant
app.get('/recupererDetailsResultatsEtudiant', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id = req.user.id_utilisateur;
        let data = await recupererDetailsResultatsEtudiant(id);
        res.status(200).json(data)
    }
});

//Trouver l'Id du quiz associé à un id d'association Quiz Étudiant'
app.get('/trouverIdQuizDuneAssociationQE/:id', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else {
        let id = req.params.id;
        let data = await trouverIdQuizDuneAssociationQE(id);
        res.status(200).json(data)
    }
});


// #endregion

//****************************************************\\
//*************** Rendering des pages ****************\\
//****************************************************\\
// #region

app.get('/inscription', async(req, res) => {
    res.render('inscription', {
        title : 'Inscription',
        styles : ['/css/inscription.css'],
        scripts : ['/js/inscription.js'],
        acceptCookie: req.session.accept,
        user: req.user
    });
});

app.get('/tdbProfesseur', async(req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 1 && req.user.id_type_utilisateur !== 2) {
        res.sendStatus(403);
    } else {
        res.render('tdbProfesseur', {
            title : 'Tableau de bord',
            styles : ['/css/tdbProfesseur.css'],
            scripts : ['/js/tdbProfesseur.js'],
            studentImage : '/images/student.png',
            quizImage: '/images/quiz.png',
            imageResultats: '/images/results.png',
            imgChart1: '/images/chart1.png',
            imgChart2: '/images/chart2.png',
            titreSection: 'Mon tableau de bord',
            acceptCookie: req.session.accept,
            user: req.user
        });
    }
});

app.get('/', (req, res) => {
    res.render('home', {
        title: 'Page d\'accueil',
        styles : ['/css/home.css'],
        scripts : ['/js/home.js'],
        videoAnim: '/images/anim.mp4',
        imgAnim: '/images/teste_tes_connaissances.gif',
        acceptCookie: req.session.accept,
        user: req.user
    });
});

app.get('/authentification', (req, res) => {
    res.render('authentification', {
        title: 'Authentification',
        styles : ['/css/authentification.css'],
        scripts : ['/js/authentification.js'],
        acceptCookie: req.session.accept,
        user: req.user
    }); 
});

app.get('/tdbEtudiant', (req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 3) {
        res.sendStatus(403);
    } else {
        res.render('tdbEtudiant', {
            title: 'Tableau de bord',
            styles : ['/css/tdbEtudiant.css'],
            scripts : ['/js/tdbEtudiant.js'],
            titreSection: 'Mon tableau de bord',
            acceptCookie: req.session.accept,
            user: req.user
        }); 
    }
});

app.get('/quizEtudiant', (req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 3) {
        res.sendStatus(403);
    } else {
        res.render('quizEtudiant', {
            title: 'Quizs',
            styles : ['/css/quizEtudiant.css'],
            scripts : ['/js/quizEtudiant.js'],
            titreSection: 'Mes quizs',
            acceptCookie: req.session.accept,
            user: req.user
        }); 
    }
});

app.get('/quizLibre', (req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 3) {
        res.sendStatus(403);
    } else {
        res.render('quizLibre', {
            title: 'Quizs',
            styles : ['/css/quizEtudiant.css'],
            scripts : ['/js/quizLibre.js'],
            titreSection: 'Mes quizs',
            acceptCookie: req.session.accept,
            user: req.user
        }); 
    }
});

app.get('/profilEtudiant', (req, res) => {
    if(!req.user) {
        res.sendStatus(401);
    } else if(req.user.id_type_utilisateur !== 3) {
        res.sendStatus(403);
    } else {
        res.render('profilEtudiant', {
            title: 'Gestion de profil',
            styles : ['/css/profilEtudiant.css'],
            scripts : ['/js/profilEtudiant.js'],
            titreSection: 'Gérer mon profil',
            user: req.user
        }); 
    }
});

app.get('/changementInitialMdp', (req, res) => {
    res.render('changementInitialMdp', {
        title: 'Création de mot de passe',
        styles : ['/css/changementInitialMdp.css'],
        scripts : ['/js/changementInitialMdp.js'],
        titreSection: 'Créer un mot de passe',
        user: req.user
    }); 
});

app.get('/motDePasseOublie', (req, res) => {
    res.render('motDePasseOublie', {
        title: 'Création de mot de passe',
        styles : ['/css/motDePasseOublie.css'],
        scripts : ['/js/motDePasseOublie.js'],
        titreSection: 'Initialiser le mot de passe',
        user: req.user
    }); 
});

// #endregion

//Gestion des cookies
app.post('/accept', (req, res) => {
    req.session.accept = true;
    res.status(200).end();
})

// Renvoyer une erreur 404 pour les routes non définies
app.use(function (request, response) {
    // Renvoyer simplement une chaîne de caractère indiquant que la page n'existe pas
    response.status(404).send(request.originalUrl + ' not found.');
});

// Démarrage du serveur
app.listen(process.env.PORT);
console.info(`Serveurs démarré:`);
console.info(`http://localhost:${ process.env.PORT }`);

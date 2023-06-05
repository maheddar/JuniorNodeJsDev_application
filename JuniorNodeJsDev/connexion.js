import { existsSync } from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Vérification si la BDD existe au démarrage du serveur
const BDD_EXISTE = !existsSync(process.env.DB_FILE);

// Création de la BDD
const createDataBase = async(connectionPromise) => {
    let connection = await connectionPromise;

    await connection.exec(
        `
        CREATE TABLE IF NOT EXISTS matiere(
            id_matiere INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            intitule TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS theme(
            id_theme INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            id_matiere INTEGER NOT NULL,
            intitule TEXT NOT NULL UNIQUE,
            CONSTRAINT fk_matiere
                FOREIGN KEY(id_matiere)
                REFERENCES matiere(id_matiere)
                ON DELETE SET NULL
                ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS question(
            id_question INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
            id_matiere INTEGER NOT NULL,
            id_theme INTEGER NOT NULL,
            nom_de_quiz TEXT,
            contenu_question TEXT NOT NULL,
            reponse_option_1 TEXT NOT NULL,
            reponse_option_2 TEXT NOT NULL,
            reponse_option_3 TEXT NOT NULL,
            reponse_correcte INTEGER NOT NULL,
                CONSTRAINT fk_theme
                    FOREIGN KEY(id_theme)
                    REFERENCES theme(id_theme)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE,
                CONSTRAINT fk_matiere
                    FOREIGN KEY(id_matiere)
                    REFERENCES matiere(id_matiere)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS type_utilisateur(
            id_type_utilisateur INTEGER PRIMARY KEY NOT NULL,
            intitule_type_utilisateur TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS groupe(
            id_groupe INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            intitule TEXT NOT NULL,
            id_professeur INTEGER NOT NULL,
            date_creation STRFTIME NOT NULL
        );

        CREATE TABLE IF NOT EXISTS utilisateur(
            id_utilisateur INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            nom TEXT NOT NULL,
            prenom TEXT NOT NULL,
            courriel TEXT NOT NULL UNIQUE,
            mot_de_passe TEXT NOT NULL,
            id_type_utilisateur INTEGER NOT NULL,
            id_groupe INTEGER,
            created_by INTEGER NOT NULL,
            courriel_token TEXT,
            isverified INTEGER NOT NULL,
                CONSTRAINT fk_type_utilisateur
                    FOREIGN KEY(id_type_utilisateur)
                    REFERENCES type_utilisateur(id_type_utilisateur)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE,
                CONSTRAINT fk_id_groupe
                    FOREIGN KEY(id_groupe)
                    REFERENCES groupe(id_groupe)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz(
            id_quiz INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            nom TEXT NOT NULL,
            date_creation STRFTIME NOT NULL,
            created_by INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS questions_quiz(
            id_question_quiz INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            id_quiz INTEGER NOT NULL,
            id_question INTEGER NOT NULL,
                CONSTRAINT fk_quiz
                    FOREIGN KEY(id_quiz)
                    REFERENCES quiz(id_quiz)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE,
                CONSTRAINT fk_question
                    FOREIGN KEY(id_question)
                    REFERENCES question(id_question)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quiz_affectation(
            id_quiz_affectation INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            id_quiz INTEGER NOT NULL,
            id_groupe INTEGER NOT NULL,
            date_debut STRFTIME NOT NULL,
            date_fin STRFTIME NOT NULL,
            heure_debut SFRTIME NOT NULL,
            heure_desactivation SFRTIME NOT NULL,
            duree INT NOT NULL, 
            nom TEXT NOT NULL,
                CONSTRAINT fk_quiz
                    FOREIGN KEY(id_quiz)
                    REFERENCES quiz(id_quiz)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE,
                CONSTRAINT fk_groupe
                    FOREIGN KEY(id_groupe)
                    REFERENCES groupe(id_groupe)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE
                );

        CREATE TABLE IF NOT EXISTS association_quiz_etudiant(
            id_association_quiz_etudiant INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            id_quiz_affectation INTEGER NOT NULL,
            id_utilisateur INTEGER NOT NULL,
            statut INTEGER NOT NULL,
            date_completion SFRTIME,
            resultat DOUBLE,
            temps_restant INTEGER,
                CONSTRAINT fk_quiz_affectation
                    FOREIGN KEY(id_quiz_affectation)
                    REFERENCES quiz_affectation(id_quiz_affectation)
                    ON DELETE SET NULL
                    ON UPDATE CASCADE,
                CONSTRAINT fk_utilisateur
                    FOREIGN KEY(id_utilisateur)
                    REFERENCES utilisateur(id_utilisateur)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
        );

        CREATE TABLE IF NOT EXISTS details_resultats_quiz(
            id_resultat INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            id_association_quiz_etudiant INTEGER NOT NULL,
            id_etudiant INTEGER NOT NULL,
            id_quiz INTEGER NOT NULL,
            id_question INTEGER NOT NULL,
            reponse_correcte INTEGER NOT NULL,
            reponse_cochee INTEGER NOT NULL,
            resultat INTEGER NOT NULL,
                CONSTRAINT fk_association_quiz_etudiant
                    FOREIGN KEY(id_association_quiz_etudiant)
                    REFERENCES association_quiz_etudiant(id_association_quiz_etudiant)
                    ON DELETE CASCADE
                    ON UPDATE CASCADE
        );

        INSERT INTO type_utilisateur (id_type_utilisateur, intitule_type_utilisateur) VALUES 
            (1, 'Admin'),
            (2, 'Professeur'),
            (3, 'Etudiant');

        INSERT INTO matiere (intitule) VALUES
            ('Informatique'), ('Mathématiques'), ('Physique'), ('Chimie'), ('Biologie'), ('Sciences'), ('Histoire'),
            ('Géographie'), ('Économie'), ('Science politique'), ('Psychologie'), ('Sociologie'), ('Philosophie');
        
        INSERT INTO theme (id_matiere, intitule) VALUES 
            (1, 'Programmation'), (1, 'Développement web'), (1, 'Développement mobile'), 
            (1, 'Algorithmique'), (1, 'Structures de données'), (1, 'Réseaux et communication'), 
            (1, 'Systèmes exploitation'), (1, 'Sécurité informatique'), (1, 'Intelligence artificielle'), 
            (1, 'Bases de données'), 
            (2, 'Algèbre'), (2, 'Géométrie'), (2, 'Trigonométrie'), (2, 'Probabilités '), (2, 'Statistiques'), 
            (3, 'Mécanique'), (3, 'Magnétisme'), (3, 'Thermodynamique'), (3, 'Optique'),
            (4, 'Chimie générale'), (4, 'Chimie organique'), (4, 'Chimie inorganique'), (4, 'Chimie physique'),
            (4, 'Biochimie'), 
            (5, 'Biologie cellulaire'), (5, 'Génétique'), (5, 'Écologie'), (5, 'Botanique'), (5, 'Zoologie'), (5, 'Anatomie et physiologie'), 
            (6, 'Géologie'), (6, 'Météorologie'), (6, 'Océanographie'), (6, 'Astronomie'), 
            (7, 'Histoire locale'), (7, 'Histoire nationale'), (7, 'Histoire mondiale'), (7, 'Civilisations'),
            (8, 'Cartographie'), (8, 'Géographie humaine'), (8, 'Géographie physique'),
            (9, 'Microéconomie'), (9, 'Macroéconomie'), (9, 'Économie internationale'), (9, 'Économie politique'),
            (10, 'Systèmes politiques'), (10, 'Relations internationales'), (10, 'Institutions politiques'),
            (11, 'Psychologie générale'), (11, 'Psychologie du développement'), (11, 'Psychologie sociale'), (11, 'Psychologie cognitive'),
            (12, 'Sociologie générale'), (12, 'Sociologie des organisations'), (12, 'Sociologie de la famille'), (12, 'Sociologie urbaine'),
            (13, 'Éthique'), (13, 'Logique'), (13, 'Métaphysique'), (13, 'Philosophie politique')
            `
    );
    return connection;
}

// Base de données dans un fichier
let connectionPromise = open({
    filename: process.env.DB_FILE,
    driver: sqlite3.Database
});

if(BDD_EXISTE) {
    connectionPromise = createDataBase(connectionPromise);
}

export default connectionPromise;
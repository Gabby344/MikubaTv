/**
 * Fichier : setup.js
 * Description : Configuration de Firebase et fonctions de manipulation de la base de données pour Mikuba TV.
 */

// ----------------------------------------------------
// ÉTAPE 1 : CONFIGURATION ET INITIALISATION DE FIREBASE
// ----------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyAiMnvIMBqn2VqSQsFpb-Ajx5VORVd0JoA",
    authDomain: "danicakakudji.firebaseapp.com",
    projectId: "danicakakudji",
    storageBucket: "danicakakudji.appspot.com",
    messagingSenderId: "409346091245",
    appId: "1:409346091245:web:6674becbc81d97c292c4e4"
};

// Vérifier si Firebase est déjà initialisé
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Référence à la Realtime Database
const database = firebase.database(); 

// ----------------------------------------------------
// ÉTAPE 2 : FONCTIONS D'AFFICHAGE (Réutilisées du HTML)
// ----------------------------------------------------

/**
 * Construit et insère une carte d'actualité (article) dans le DOM.
 */
function insertNewsCard(article, containerId, isMajor = false) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Conteneur introuvable: ${containerId}`);
        return;
    }

    const imageHeight = isMajor ? '500px' : '200px'; 
    
    // Assurer que les propriétés existent pour éviter des erreurs
    const title = article.title || 'Titre manquant';
    const summary = article.summary || 'Résumé non disponible.';
    const category = article.category ? article.category.toUpperCase() : 'GENERAL';
    const date = article.date || 'Date inconnue';
    const imageUrl = article.imageUrl || 'https://via.placeholder.com/300x200/CCCCCC/666666?text=Image+Manquante';
    const link = article.link || '#';

    const cardHTML = `
        <img src="${imageUrl}" alt="${title}" style="height: ${imageHeight};">
        <div class="card-content">
            <p style="font-size: 0.8em; color: var(--primary-color); font-weight: bold;">${category}</p>
            <p style="font-size: 0.75em; color: gray; margin-bottom: 5px;">${date}</p>
            <h3>${title}</h3>
            <p>${summary}</p>
            <a href="${link}" target="_blank">Lire le reportage →</a>
        </div>
    `;

    if (isMajor) {
        container.innerHTML = cardHTML;
    } else {
        const newArticle = document.createElement('article');
        newArticle.classList.add('news-card');
        newArticle.innerHTML = cardHTML;
        container.appendChild(newArticle);
    }
}

// ----------------------------------------------------
// ÉTAPE 3 : FONCTION DE CHARGEMENT PRINCIPALE (Exportée)
// ----------------------------------------------------

/**
 * Charge les actualités depuis Firebase Realtime Database et les affiche sur la page.
 */
function loadNews() {
    // Tente de charger les 4 articles les plus récents stockés sous la référence 'articles'
    const newsRef = database.ref('articles').limitToLast(4); 

    newsRef.once('value', (snapshot) => {
        const articles = [];
        snapshot.forEach((childSnapshot) => {
            articles.push(childSnapshot.val());
        });

        articles.reverse(); // S'assurer que le plus récent est le premier

        // 1. Article Majeur (le plus récent)
        const majorArticle = articles[0];
        const majorContainer = document.getElementById('major-news-container');
        if (majorArticle) {
            insertNewsCard(majorArticle, 'major-news-container', true);
        } else {
             if (majorContainer) majorContainer.querySelector('h3').textContent = 'Pas d\'actualité principale (Ajoutez des données dans /articles sur Firebase).';
        }
        
        // 2. Articles Secondaires (les 3 suivants)
        const secondaryArticles = articles.slice(1, 4);
        const secondaryContainer = document.getElementById('secondary-news-container');
        if (secondaryContainer) secondaryContainer.innerHTML = ''; // Nettoyer le message de chargement
        
        if (secondaryArticles.length > 0) {
             secondaryArticles.forEach(article => {
                insertNewsCard(article, 'secondary-news-container', false);
            });
        } else {
            if (secondaryContainer) secondaryContainer.innerHTML = '<p style="padding: 20px; font-style: italic; color: #777;">Ajoutez d\'autres articles à votre base de données pour les afficher ici.</p>';
        }
        
        // Simulation des Tendances (Remplir la sidebar)
        const trendingList = document.querySelector('.trending-list');
        if (trendingList) {
            trendingList.innerHTML = `
                <li class="trending-item"><a href="#">Interview exclusive sur l'économie du Lualaba</a></li>
                <li class="trending-item"><a href="#">Les temps forts de la semaine sportive</a></li>
                <li class="trending-item"><a href="#">Replay : L'émission "Droit de Parler"</a></li>
                <li class="trending-item"><a href="#">Galerie Photo : Événement culturel de Kolwezi</a></li>
            `;
        }

    }, (error) => {
        console.error("Erreur de connexion Firebase:", error);
        // Afficher l'erreur dans l'article principal si possible
        const majorContainer = document.getElementById('major-news-container');
        if (majorContainer) majorContainer.querySelector('h3').textContent = 'Erreur: Impossible de charger les actualités Firebase. Vérifiez votre connexion et les règles de sécurité.';
    });
}

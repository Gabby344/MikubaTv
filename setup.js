/**
 * Fichier : setup.js
 * Description : Configuration de Firebase et fonctions de manipulation de la base de données pour Mikuba TV.
 * Contient : loadNews(), loadArticle(), insertNewsCard(), displayArticleError().
 */

// ----------------------------------------------------
// ÉTAPE 1 : CONFIGURATION ET INITIALISATION DE FIREBASE
// ----------------------------------------------------
// REMPLACEZ CES CLÉS PAR VOS CLÉS DE PROJET FIREBASE RÉELLES !
const firebaseConfig = {
    apiKey: "AIzaSyAiMnvIMBqn2VqSQsFpb-Ajx5VORVd0JoA",
    authDomain: "danicakakudji.firebaseapp.com",
    projectId: "danicakakudji",
    storageBucket: "danicakakudji.appspot.com",
    messagingSenderId: "409346091245",
    appId: "1:409346091245:web:6674becbc81d97c292c4e4"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const database = firebase.database(); 

// ----------------------------------------------------
// FONCTIONS UTILITAIRES POUR L'AFFICHAGE
// ----------------------------------------------------

/**
 * Construit et insère une carte d'actualité (article) pour la page d'accueil.
 * @param {object} article - Les données de l'article.
 * @param {string} articleId - L'ID de l'article dans Firebase.
 * @param {string} containerId - L'ID du conteneur HTML (major-news-container ou secondary-news-container).
 * @param {boolean} isMajor - Vrai si c'est l'article principal.
 */
function insertNewsCard(article, articleId, containerId, isMajor = false) {
    const container = document.getElementById(containerId);
    if (!container) return; 

    // Assure l'existence des propriétés pour éviter des erreurs
    const title = article.title || 'Titre manquant';
    const summary = article.summary || 'Résumé non disponible.';
    const category = article.category ? article.category.toUpperCase() : 'GENERAL';
    const date = article.date || 'Date inconnue';
    const imageUrl = article.imageUrl || 'https://via.placeholder.com/900x500/CCCCCC/666666?text=Image+Manquante';
    const link = `article.html?id=${articleId}`; // Lien dynamique

    const imageHeight = isMajor ? '550px' : '220px'; 
    
    const cardHTML = `
        <img src="${imageUrl}" alt="${title}" style="height: ${imageHeight};">
        <div class="card-content">
            <p style="font-size: 0.8em; color: var(--primary-color); font-weight: bold;">${category}</p>
            <p style="font-size: 0.75em; color: gray; margin-bottom: 5px;">${date}</p>
            <h3>${title}</h3>
            <p>${summary}</p>
            <a href="${link}">Lire le reportage →</a>
        </div>
    `;

    if (isMajor) {
        // Remplace le contenu SKELETON du conteneur principal
        container.innerHTML = cardHTML;
        container.setAttribute('onclick', `window.location.href='${link}'`);
    } else {
        // Ajoute une nouvelle carte au conteneur secondaire
        const newArticle = document.createElement('article');
        newArticle.classList.add('news-card');
        newArticle.setAttribute('onclick', `window.location.href='${link}'`);
        newArticle.innerHTML = cardHTML;
        container.appendChild(newArticle);
    }
}

/**
 * Affiche un message d'erreur dans le conteneur principal de l'article.
 * (Utilisé par article.html)
 */
function displayArticleError(message) {
    const container = document.getElementById('article-content-container');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; margin-top: 50px; color: var(--primary-color);">
            <h2 style="font-size: 2em; border-bottom: none;">📰 Erreur de Chargement</h2>
            <p style="font-size: 1.1em; margin-top: 20px;">${message}</p>
            <p style="margin-top: 30px;"><a href="index.html">Retour à la page d'accueil</a></p>
        </div>
    `;
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = "Erreur - Mikuba TV";
}


// ----------------------------------------------------
// FONCTIONS DE CHARGEMENT DE DONNÉES
// ----------------------------------------------------

/**
 * Charge les actualités pour la page d'accueil (index.html).
 */
function loadNews() {
    const newsRef = database.ref('articles').limitToLast(4); 
    const majorContainer = document.getElementById('major-news-container');
    const secondaryContainer = document.getElementById('secondary-news-container');
    const trendingList = document.getElementById('trending-list');


    newsRef.once('value', (snapshot) => {
        const articles = [];
        snapshot.forEach((childSnapshot) => {
            articles.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        articles.reverse(); 

        // 1. Gère l'Article Majeur
        const majorArticle = articles[0];
        if (majorArticle) {
            insertNewsCard(majorArticle, majorArticle.id, 'major-news-container', true);
        } else {
             if (majorContainer) majorContainer.innerHTML = '<div class="card-content"><h3>Pas d\'actualité principale</h3><p>Veuillez ajouter des données dans /articles sur Firebase.</p></div>';
        }
        
        // 2. Gère les Articles Secondaires
        const secondaryArticles = articles.slice(1, 4);
        
        // **IMPORTANT : Vider le conteneur des Skeletons AVANT d'insérer les données réelles**
        if (secondaryContainer) secondaryContainer.innerHTML = ''; 
        
        if (secondaryArticles.length > 0) {
             secondaryArticles.forEach(article => {
                insertNewsCard(article, article.id, 'secondary-news-container', false);
            });
        } else {
            if (secondaryContainer) secondaryContainer.innerHTML = '<p style="padding: 20px; grid-column: 1 / -1; font-style: italic; color: #777;">Aucun article secondaire trouvé.</p>';
        }
        
        // 3. Gère les Tendances (Simulation rapide)
        if (trendingList) {
            trendingList.innerHTML = `
                <li class="trending-item"><a href="#">Interview exclusive : L'économie du Lualaba sous la loupe.</a></li>
                <li class="trending-item"><a href="#">Sports : Les temps forts de la semaine et les prochains défis.</a></li>
                <li class="trending-item"><a href="#">Replay : L'émission populaire "Droit de Parler" est en ligne.</a></li>
                <li class="trending-item"><a href="#">Galerie Photo : Les images marquantes de l'événement culturel de Kolwezi.</a></li>
            `;
        }


    }, (error) => {
        console.error("Erreur de connexion Firebase:", error);
        if (majorContainer) majorContainer.innerHTML = '<div class="card-content"><h3>Erreur de connexion</h3><p style="color:red;">Impossible de charger les actualités depuis Firebase.</p></div>';
        if (secondaryContainer) secondaryContainer.innerHTML = '<p style="padding: 20px; grid-column: 1 / -1; color: red;">Erreur de chargement des articles.</p>';
        if (trendingList) trendingList.innerHTML = '<li>Erreur de chargement.</li>';
    });
}

/**
 * Charge un article unique pour la page de détail (article.html).
 */
function loadArticle(articleId) {
    const articleRef = database.ref('articles/' + articleId);
    const container = document.getElementById('article-content-container');

    articleRef.once('value', (snapshot) => {
        const article = snapshot.val();
        
        if (!article) {
            displayArticleError(`Article avec l'ID '${articleId}' introuvable dans la base de données.`);
            return;
        }

        // Mettre à jour le titre de la page
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = `${article.title} - Mikuba TV`;

        // Utilise le corps formaté HTML de l'article
        const articleContent = article.body || '<p>Le corps complet de l\'article n\'est pas disponible. Veuillez vérifier les données dans Firebase.</p>';

        const articleHTML = `
            <div class="article-header">
                <h1>${article.title}</h1>
                <div class="article-meta">
                    <span class="category">${article.category || 'Général'}</span>
                    <span>Par ${article.author || 'Rédaction Mikuba TV'}</span>
                    <span>Publié le ${article.date || 'Date inconnue'}</span>
                </div>
            </div>
            
            <figure class="article-cover">
                <img src="${article.imageUrl || 'https://via.placeholder.com/900x500/CCCCCC/666666?text=Image+Manquante'}" alt="Image de couverture pour ${article.title}">
            </figure>
            
            <div class="article-body">
                ${articleContent}
            </div>
        `;
        
        if (container) container.innerHTML = articleHTML;
        
    }, (error) => {
        console.error("Erreur de chargement Firebase:", error);
        displayArticleError("Erreur de connexion à la base de données Firebase.");
    });
}

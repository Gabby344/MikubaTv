/**
 * Fichier : setup.js
 * Description : Configuration de Firebase et fonctions de manipulation de la base de données pour Mikuba TV.
 * Contient : Initialisation Firebase, fonctions de publication, loadNews(), loadArticle(), insertNewsCard(), displayArticleError().
 */

// ----------------------------------------------------
// ÉTAPE 1 : CONFIGURATION ET INITIALISATION DE FIREBASE
// ----------------------------------------------------
// (Vos clés Firebase sont conservées ici)
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
// NOUVEAU : FONCTION DE PUBLICATION (Pour admin.html)
// ----------------------------------------------------

/**
 * Publie un nouvel article sur Firebase.
 * Cette fonction doit être appelée par le formulaire dans admin.html.
 * @param {object} articleData - L'objet contenant toutes les données de l'article.
 */
function publishArticle(articleData) {
    // 1. Ajouter le timestamp et la date formatée pour l'ordre et l'affichage
    const now = new Date();
    articleData.timestamp = now.getTime(); // Pour le tri (le plus récent)
    articleData.date = now.toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // 2. Assurer que le titre et le corps sont des chaînes (pour la robustesse)
    articleData.title = articleData.title ? String(articleData.title).trim() : 'Article sans titre';
    articleData.body = articleData.body || ''; 
    articleData.summary = articleData.summary || '';

    // 3. Écrire dans la collection 'articles'
    const newArticleRef = database.ref('articles').push();
    newArticleRef.set(articleData)
        .then(() => {
            console.log("Article publié avec succès ! ID:", newArticleRef.key);
            alert("Article publié avec succès !");
            // Optionnel : Rediriger ou vider le formulaire si nécessaire
            // document.getElementById('admin-form').reset(); 
        })
        .catch((error) => {
            console.error("Erreur de publication:", error);
            alert("Erreur lors de la publication de l'article : " + error.message);
        });
}


// ----------------------------------------------------
// FONCTIONS UTILITAIRES POUR L'AFFICHAGE (Pas de changement majeur)
// ----------------------------------------------------

/**
 * Construit et insère une carte d'actualité (article) pour la page d'accueil.
 * NOTE : L'attribut 'alt' sur l'image utilise le titre pour l'accessibilité.
 * @param {object} article - Les données de l'article.
 * @param {string} articleId - L'ID de l'article dans Firebase.
 * @param {string} containerId - L'ID du conteneur HTML.
 * @param {boolean} isMajor - Vrai si c'est l'article principal.
 */
function insertNewsCard(article, articleId, containerId, isMajor = false) {
    const container = document.getElementById(containerId);
    if (!container) return; 

    const title = article.title || 'Titre manquant';
    const summary = article.summary || 'Résumé non disponible.';
    const category = article.category ? article.category.toUpperCase() : 'GENERAL';
    const date = article.date || 'Date inconnue';
    // Utilisation de l'image de substitution s'il n'y a pas d'URL
    const imageUrl = article.imageUrl && article.imageUrl.startsWith('http') ? article.imageUrl : 'https://via.placeholder.com/900x500/CCCCCC/666666?text=Image+Manquante';
    const link = `article.html?id=${articleId}`; 

    const imageHeight = isMajor ? '550px' : '220px'; 
    
    const cardHTML = `
        <img src="${imageUrl}" alt="Image de couverture pour : ${title}" style="height: ${imageHeight};" loading="lazy">
        <div class="card-content">
            <p style="font-size: 0.8em; color: var(--primary-color); font-weight: bold;">${category}</p>
            <p style="font-size: 0.75em; color: gray; margin-bottom: 5px;">${date}</p>
            <h3>${title}</h3>
            <p>${summary}</p>
            <span style="display: block; margin-top: 10px; font-weight: 500; color: var(--accent-color);">Lire le reportage →</span>
        </div>
    `;

    if (isMajor) {
        container.innerHTML = cardHTML;
        container.setAttribute('onclick', `window.location.href='${link}'`);
    } else {
        const newArticle = document.createElement('article');
        newArticle.classList.add('news-card');
        newArticle.setAttribute('onclick', `window.location.href='${link}'`);
        newArticle.innerHTML = cardHTML;
        container.appendChild(newArticle);
    }
}

/**
 * Affiche un message d'erreur sur la page article.html
 */
function displayArticleError(message) {
    // (Pas de changement)
    const container = document.getElementById('article-content-container');
    if (!container) return;
    // ... (votre code d'affichage de l'erreur) ...
    container.innerHTML = `
        <div style="text-align: center; margin-top: 50px; color: var(--primary-color);">
            <h2 style="font-size: 2em; border-bottom: none;">📰 Erreur de Chargement</h2>
            <p style="font-size: 1.1em; margin-top: 20px;">${message}</p>
            <p style="margin-top: 30px;"><a href="index.html">Retour à la page d'accueil</a></p>
        </div>
    `;
    const pageTitle = document.querySelector('title'); // Plus robuste que getElementById
    if (pageTitle) pageTitle.textContent = "Erreur - Mikuba TV";
}


// ----------------------------------------------------
// FONCTIONS DE CHARGEMENT DE DONNÉES (index.html et article.html)
// ----------------------------------------------------

/**
 * Charge les actualités pour la page d'accueil (index.html).
 */
function loadNews() {
    // Cherche les 10 derniers articles (plus sûr que 4 pour les tendances)
    const newsRef = database.ref('articles').orderByChild('timestamp').limitToLast(10); 
    const majorContainer = document.getElementById('major-news-container');
    const secondaryContainer = document.getElementById('secondary-news-container');
    const trendingList = document.getElementById('trending-list');

    // Vider le conteneur secondaire des skeletons (Bonne pratique)
    if (secondaryContainer) secondaryContainer.innerHTML = ''; 

    newsRef.once('value', (snapshot) => {
        const articles = [];
        snapshot.forEach((childSnapshot) => {
            // Utiliser le spread operator pour fusionner ID et données
            articles.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        articles.reverse(); // Le plus récent est en position [0]

        // 1. Gère l'Article Majeur
        const majorArticle = articles[0];
        if (majorArticle) {
            insertNewsCard(majorArticle, majorArticle.id, 'major-news-container', true);
        } else {
            if (majorContainer) majorContainer.innerHTML = '<div class="card-content"><h3>Pas d\'actualité principale</h3><p>Veuillez ajouter des données via admin.html.</p></div>';
        }
        
        // 2. Gère les Articles Secondaires (Articles 1, 2, 3)
        const secondaryArticles = articles.slice(1, 4); // Prend les 3 suivants
        
        if (secondaryArticles.length > 0) {
            secondaryArticles.forEach(article => {
                insertNewsCard(article, article.id, 'secondary-news-container', false);
            });
        } else if (articles.length > 0) {
            if (secondaryContainer) secondaryContainer.innerHTML = '<p style="padding: 20px; grid-column: 1 / -1; font-style: italic; color: #777;">Seul un article principal est disponible.</p>';
        } else {
             if (secondaryContainer) secondaryContainer.innerHTML = '<p style="padding: 20px; grid-column: 1 / -1; font-style: italic; color: #777;">Aucun article disponible.</p>';
        }
        
        // 3. Gère les Tendances (Maintenant dynamiques!)
        if (trendingList) {
            trendingList.innerHTML = ''; 
            const trendingArticles = articles.slice(0, Math.min(5, articles.length)); // Top 5
            
            if (trendingArticles.length > 0) {
                trendingArticles.forEach(article => {
                    const link = `article.html?id=${article.id}`;
                    trendingList.innerHTML += `
                        <li class="trending-item">
                            <a href="${link}" title="${article.title}">${article.title}</a>
                        </li>
                    `;
                });
            } else {
                 trendingList.innerHTML = '<li>Aucun article récent à afficher.</li>';
            }
        }

    }, (error) => {
        console.error("Erreur de connexion Firebase:", error);
        // Affichage des erreurs
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

        // Mettre à jour le titre de la page pour le SEO/UX
        const pageTitle = document.querySelector('title');
        if (pageTitle) pageTitle.textContent = `${article.title} - Mikuba TV`;

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

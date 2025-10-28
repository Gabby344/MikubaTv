/**
 * Fichier : setup.js
 * Description : Configuration de Firebase et fonctions de manipulation de la base de données pour Mikuba TV.
 */

// ----------------------------------------------------
// ÉTAPE 1 : CONFIGURATION ET INITIALISATION DE FIREBASE
// ----------------------------------------------------

const firebaseConfig = {
    // 🔑 CLÉS MISES À JOUR AVEC VOS VRAIES VALEURS
    apiKey: "AIzaSyCQWUPt2d5RaPvPfSqgi4oU-VxMpL6STvQ",
    authDomain: "shekinahmukeni-74b9d.firebaseapp.com",
    projectId: "shekinahmukeni-74b9d",
    storageBucket: "shekinahmukeni-74b9d.firebasestorage.app", 
    messagingSenderId: "351153147633",
    appId: "1:351153147633:web:c82d85f1ad9a79d6ed6350"
};

// Vérification et Initialisation de l'application Firebase (v8 format)
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialisé avec succès pour le projet shekinahmukeni !");
    } catch (e) {
        console.error("Erreur critique lors de l'initialisation de Firebase:", e);
    }
}

// Référence à la base de données Realtime
const database = typeof firebase !== 'undefined' ? firebase.database() : null; 

// ----------------------------------------------------
// FONCTION DE PUBLICATION (Pour admin.html)
// ----------------------------------------------------

/**
 * Publie un nouvel article sur Firebase.
 */
function publishArticle(articleData, btn, form, statusMessage) {
    
    if (!database) {
        statusMessage.textContent = '❌ Erreur: Base de données non connectée. Vérifiez les clés API et les CDN.';
        statusMessage.classList.add('error');
        statusMessage.style.display = 'block';
        return;
    }

    // 1. Gestion de l'état UI - Démarrage
    btn.disabled = true;
    btn.textContent = 'Envoi en cours...';
    statusMessage.style.display = 'none';
    statusMessage.classList.remove('success', 'error');

    // 2. Ajout des métadonnées
    articleData.timestamp = firebase.database.ServerValue.TIMESTAMP;
    const now = new Date();
    articleData.date = now.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric' 
    }).replace(/\//g, '-'); 
    
    // 3. Écrire dans la collection 'articles'
    database.ref('articles').push(articleData)
        .then(() => {
            // Succès
            console.log("Article publié avec succès !");
            statusMessage.textContent = '✅ Article publié avec succès ! Redirection vers index.html en cours...';
            statusMessage.classList.add('success');
            form.reset(); 
            
            // Redirection après publication pour UX
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 2000); 
        })
        .catch((error) => {
            // Erreur
            console.error("Erreur de publication:", error);
            statusMessage.textContent = `❌ Erreur lors de la publication : ${error.message || 'Problème de connexion ou de permissions.'}`;
            statusMessage.classList.add('error');
        })
        .finally(() => {
            // Finalisation
            statusMessage.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Publier l\'Article';
        });
}

// ----------------------------------------------------
// FONCTIONS UTILITAIRES POUR L'AFFICHAGE (index.html, article.html)
// ----------------------------------------------------

/**
 * Insère une carte d'article dans le conteneur spécifié (pour index.html).
 */
function insertNewsCard(article, articleId, containerId, isMajor = false) {
    const container = document.getElementById(containerId);
    if (!container) return; 

    const title = article.title || 'Titre manquant';
    const summary = article.summary || 'Résumé non disponible.';
    const category = article.category ? article.category.toUpperCase() : 'GÉNÉRAL';
    const date = article.date || 'Date inconnue'; 
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
        container.classList.add('major-news-card'); 
    } else {
        const newArticle = document.createElement('article');
        newArticle.classList.add('news-card');
        newArticle.setAttribute('onclick', `window.location.href='${link}'`);
        newArticle.innerHTML = cardHTML;
        container.appendChild(newArticle);
    }
}

/**
 * Affiche un message d'erreur clair dans la zone de l'article (pour article.html).
 */
function displayArticleError(message) {
    const container = document.getElementById('article-content-container');
    if (!container) return;
    
    // Supprime tout le contenu actuel (y compris le skeleton)
    container.innerHTML = `
        <div style="text-align: center; margin-top: 50px; color: var(--primary-color);">
            <h2 style="font-size: 2em; border-bottom: none; font-weight: 700;">📰 Erreur de Chargement</h2>
            <p style="font-size: 1.1em; margin-top: 20px;">${message}</p>
            <p style="margin-top: 30px;"><a href="index.html">Retour à la page d'accueil</a></p>
        </div>
    `;
    const pageTitle = document.querySelector('title');
    if (pageTitle) pageTitle.textContent = "Erreur - Mikuba TV";
}

/**
 * Charge les articles de la base de données pour la page d'accueil (index.html).
 */
function loadNews() {
    if (!database) return;
    const newsRef = database.ref('articles').orderByChild('timestamp').limitToLast(10); 
    const majorContainer = document.getElementById('major-news-container');
    const secondaryContainer = document.getElementById('secondary-news-container');
    const trendingList = document.getElementById('trending-list');

    if (secondaryContainer) secondaryContainer.innerHTML = ''; 

    newsRef.once('value', (snapshot) => {
        const articles = [];
        snapshot.forEach((childSnapshot) => {
            articles.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        articles.reverse(); 

        const majorArticle = articles[0];
        if (majorArticle) {
            if (majorContainer) majorContainer.innerHTML = '';
            insertNewsCard(majorArticle, majorArticle.id, 'major-news-container', true);
        } else {
            if (majorContainer) majorContainer.innerHTML = '<div class="card-content"><h3>Pas d\'actualité principale</h3><p>Veuillez ajouter des données via admin.html.</p></div>';
        }
        
        const secondaryArticles = articles.slice(1, 4); 
        
        if (secondaryArticles.length > 0) {
             if (secondaryContainer) secondaryContainer.innerHTML = ''; 
             secondaryArticles.forEach(article => {
                 insertNewsCard(article, article.id, 'secondary-news-container', false);
             });
        } else if (articles.length > 0) {
            if (secondaryContainer) secondaryContainer.innerHTML = '<p style="padding: 20px; grid-column: 1 / -1; font-style: italic; color: #777;">Seul un article principal est disponible.</p>';
        } else {
            if (secondaryContainer) secondaryContainer.innerHTML = '<p style="padding: 20px; grid-column: 1 / -1; font-style: italic; color: #777;">Aucun article disponible.</p>';
        }
        
        if (trendingList) {
            trendingList.innerHTML = ''; 
            const trendingArticles = articles.slice(0, Math.min(5, articles.length));
            
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
    });
}

/**
 * Charge un article spécifique par ID (pour article.html).
 */
function loadArticle(articleId) {
    if (!database) {
        displayArticleError("Erreur de connexion à la base de données Firebase.");
        return;
    }
    
    const articleRef = database.ref('articles/' + articleId);
    const container = document.getElementById('article-content-container');

    articleRef.once('value', (snapshot) => {
        const article = snapshot.val();
        
        if (!article) {
            displayArticleError(`Article avec l'ID '${articleId}' introuvable dans la base de données.`);
            return;
        }
        
        // 1. Mise à jour du titre de la page
        const pageTitle = document.querySelector('title');
        if (pageTitle) pageTitle.textContent = `${article.title} - Mikuba TV`;

        const articleContent = article.body || '<p>Le corps complet de l\'article n\'est pas disponible. Veuillez vérifier les données dans Firebase.</p>';
        const defaultImage = 'https://via.placeholder.com/900x500/CCCCCC/666666?text=Image+Manquante';
        
        // 2. Construction du HTML final
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
                <img src="${article.imageUrl || defaultImage}" alt="Image de couverture pour ${article.title}">
            </figure>
            
            <div class="article-body">
                ${articleContent}
            </div>
        `;
        
        // 3. Injection du contenu final (écrase le skeleton dans article.html)
        if (container) {
            container.innerHTML = articleHTML;
        }
        
    }, (error) => {
        console.error("Erreur de chargement Firebase:", error);
        displayArticleError("Erreur de connexion à la base de données Firebase.");
    });
}

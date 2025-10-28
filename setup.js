/**
 * Fichier : setup.js
 * Description : Fonctions de manipulation de la base de données Realtime pour Mikuba TV.
 *
 * ATTENTION: Ce fichier suppose que les CDN de Firebase (v8) ont été chargés et
 * que firebase.initializeApp(config) a été appelé dans le fichier HTML.
 */

// Référence à la base de données Realtime
// Nous vérifions si l'objet 'firebase' est disponible globalement (méthode v8 CDN)
const database = (typeof firebase !== 'undefined' && firebase.apps.length) ? firebase.database() : null;

// Vérification de la connexion après chargement de Firebase dans le HTML
document.addEventListener('DOMContentLoaded', () => {
    if (!database) {
        console.error("Erreur critique: La base de données Realtime n'a pas pu être initialisée. Vérifiez les CDN et l'initialisation.");
        // Un message d'erreur sera affiché dans le HTML via un autre script
    }
});


// ----------------------------------------------------
// FONCTION DE PUBLICATION (Pour admin.html)
// ----------------------------------------------------

/**
 * Publie un nouvel article sur Firebase.
 */
function publishArticle(articleData, btn, form, statusMessage) {

    if (!database) {
        statusMessage.textContent = '❌ Erreur: Base de données non connectée.';
        statusMessage.classList.add('error');
        statusMessage.style.display = 'block';
        return;
    }

    // 1. Gestion de l'état UI - Démarrage
    btn.disabled = true;
    btn.textContent = 'Envoi en cours...';
    statusMessage.style.display = 'none';
    statusMessage.classList.remove('text-green-600', 'text-red-600');

    // 2. Ajout des métadonnées
    articleData.timestamp = firebase.database.ServerValue.TIMESTAMP;
    const now = new Date();
    articleData.date = now.toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).replace(/\//g, '-');

    // 3. Écrire dans le nœud 'articles'
    database.ref('articles').push(articleData)
        .then(() => {
            // Succès
            console.log("Article publié avec succès !");
            statusMessage.textContent = '✅ Article publié avec succès !';
            statusMessage.classList.add('text-green-600');
            form.reset();
            
            // Redirection après publication pour UX (si nécessaire, sinon laisser l'admin sur place)
            // setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        })
        .catch((error) => {
            // Erreur
            console.error("Erreur de publication:", error);
            statusMessage.textContent = `❌ Erreur lors de la publication : ${error.message || 'Problème de connexion ou de permissions.'}`;
            statusMessage.classList.add('text-red-600');
        })
        .finally(() => {
            // Finalisation
            statusMessage.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Publier l\'Article';
        });
}

// ----------------------------------------------------
// FONCTIONS UTILITAIRES POUR L'AFFICHAGE (index.html)
// ----------------------------------------------------

// Les styles Tailwind gèrent l'esthétique, on garde la logique d'injection

/**
 * Insère une carte d'article dans le conteneur spécifié (pour index.html).
 */
function createNewsCardHTML(article, articleId, isMajor = false) {
    const title = article.title || 'Titre manquant';
    const summary = article.summary || 'Résumé non disponible.';
    const category = (article.category || 'GÉNÉRAL').toUpperCase();
    const date = article.date || 'Date inconnue';
    const imageUrl = article.imageUrl && article.imageUrl.startsWith('http') ? article.imageUrl : 'https://placehold.co/900x500/CCCCCC/666666?text=Image+Manquante';
    const link = `article.html?id=${articleId}`; // Lien vers la page de détail (non fournie)

    // Logique d'affichage en grille Tailwind
    return `
        <div data-article-id="${articleId}" class="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-[1.005] cursor-pointer" onclick="window.location.href='${link}'">
            <img src="${imageUrl}" alt="Couverture : ${title}" 
                 class="w-full h-48 ${isMajor ? 'md:h-64' : 'h-48'} object-cover bg-gray-200"
                 onerror="this.onerror=null;this.src='https://placehold.co/300x180/E0E0E0/666666?text=Image+Indisponible'">

            <div class="p-5">
                <p class="text-xs font-bold text-gray-500 mb-2 flex justify-between items-center">
                    <span class="uppercase text-red-700">${category}</span>
                    <span class="text-gray-400">${date}</span>
                </p>
                <h3 class="text-xl font-extrabold text-gray-900 mb-2 line-clamp-2">${title}</h3>
                <p class="text-sm text-gray-600 line-clamp-3">${summary}</p>
                <div class="mt-4 text-blue-600 font-semibold flex items-center">
                    Lire la suite
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
            </div>
        </div>
    `;
}

/**
 * Charge les articles de la base de données pour la page d'accueil (index.html).
 */
function loadNews() {
    const articlesContainer = document.getElementById('articles-container');
    const statusMessageGlobal = document.getElementById('status-message-global');
    const mainContent = document.getElementById('main-content');
    
    if (!database) {
        statusMessageGlobal.textContent = '❌ Erreur Critique! Base de données non connectée. (RTDB)';
        statusMessageGlobal.className = 'p-6 bg-red-100 text-red-700 rounded-xl font-bold mt-8';
        return;
    }

    // Récupérer les 10 derniers articles triés par timestamp
    const newsRef = database.ref('articles').orderByChild('timestamp').limitToLast(10);

    // Utilisation de .on() pour les mises à jour en temps réel (Realtime Database)
    newsRef.on('value', (snapshot) => {
        let articles = [];
        snapshot.forEach((childSnapshot) => {
            articles.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });

        // Les données arrivent triées par timestamp (ascendant par défaut), on inverse pour le plus récent en premier
        articles.reverse();

        // Stockage pour un éventuel modal/détail si on implémente article.html
        window.currentArticles = articles;

        // Vider le conteneur
        articlesContainer.innerHTML = '';
        
        // Affichage
        if (articles.length === 0) {
            articlesContainer.innerHTML = `
                <p class="col-span-full text-center text-lg text-gray-500 p-10 bg-white rounded-xl shadow">
                    Aucun article n'a été publié pour le moment. Publiez-en un via admin.html.
                </p>
            `;
        } else {
            articles.forEach(article => {
                articlesContainer.innerHTML += createNewsCardHTML(article, article.id);
            });
        }
        
        // Cacher le message de chargement et afficher le contenu principal
        statusMessageGlobal.classList.add('hidden');
        mainContent.classList.remove('hidden');

    }, (error) => {
        console.error("Erreur de connexion Firebase RTDB:", error);
        statusMessageGlobal.textContent = '❌ Erreur de lecture de la base de données. Vérifiez les règles de sécurité.';
        statusMessageGlobal.className = 'p-6 bg-red-100 text-red-700 rounded-xl font-bold mt-8';
    });
}

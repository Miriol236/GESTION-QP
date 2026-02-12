<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Config pour autoriser les requêtes cross-origin depuis ton front-end SPA
    | en développement et en production.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'], // toutes les méthodes HTTP

    // Autoriser uniquement les origines exactes, pas *
    'allowed_origins' => [
        'http://localhost:2025',
        'http://127.0.0.1:2025',
        'http://localhost:8000', // utile si React fait appel à localhost:8000
    ],

    'allowed_origins_patterns' => [], // inutile ici

    'allowed_headers' => ['*'], // tous les headers
    'exposed_headers' => ['Content-Disposition'], // utile pour les fichiers Excel/PDF

    'max_age' => 0, // pas de cache des preflight requests

    'supports_credentials' => true, // obligatoire pour Sanctum
];
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
    'allowed_origins' => [
        'http://localhost',
        'http://127.0.0.1:2025',
        'http://localhost:2025',
    ], // vide si on utilise allowed_origins_patterns
    'allowed_origins_patterns' => [        
        'https://quotes-parts.oni-car.com',
        'https://*.oni-car.com', // support sous-domaines
    ],

    'allowed_headers' => ['*'], // tous les headers
    'exposed_headers' => [],

    'max_age' => 0, // pas de cache des preflight requests

    'supports_credentials' => true, // obligatoire pour Sanctum

];
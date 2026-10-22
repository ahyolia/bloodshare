<?php

// 📖 L'app s'authentifie par token Bearer (pas de cookie) : pas de
//    supports_credentials ni de SANCTUM_STATEFUL_DOMAINS à régler pour le CORS.
//    En local, toutes les origines restent autorisées (Expo web, ngrok, IP LAN).
//    En production, CORS_ALLOWED_ORIGINS liste les domaines du front, séparés
//    par des virgules (ex. https://aima-forum.netlify.app).

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', '*'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];

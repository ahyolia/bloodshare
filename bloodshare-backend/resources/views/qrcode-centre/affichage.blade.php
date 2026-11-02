<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    {{-- 📖 Rechargement juste après le changement de QR (toutes les 30 s) : pas de JavaScript,
         la page reste fiable sur une vieille tablette laissée allumée au centre. --}}
    <meta http-equiv="refresh" content="{{ $rechargement }}">
    <title>QR Code du centre — Aïma</title>
    <link rel="icon" href="{{ asset('images/branding/favicon-aima.png') }}">
    <style>
        :root { --fond: #FFF4F1; --texte: #2B1A24; --accent: #A83B24; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2rem;
            padding: 1.5rem;
            background: var(--fond);
            color: var(--texte);
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            text-align: center;
        }
        .logo { height: 3rem; }
        .qr {
            background: #fff;
            padding: 1.5rem;
            border-radius: 1.5rem;
            border: 3px solid var(--accent);
        }
        .qr svg { display: block; width: min(70vw, 60vh); height: auto; }
        h1 { margin: 0; font-size: clamp(1.5rem, 4vw, 2.5rem); }
        p { margin: 0.5rem 0 0; font-size: clamp(1rem, 2.5vw, 1.25rem); opacity: 0.8; }
    </style>
</head>
<body>
    <img class="logo" src="{{ asset('images/branding/logo-aima.svg') }}" alt="Aïma">

    <div class="qr">{!! $svg !!}</div>

    <div>
        <h1>Scanne ce QR Code avec l'app Aïma</h1>
        <p>pour valider ton don. Le code change toutes les 30 secondes.</p>
    </div>
</body>
</html>

<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    {{-- 📖 Rendu par dompdf : CSS simple uniquement (pas de flex ni de variables). --}}
    <style>
        @page { margin: 2.5cm 2cm; }
        body { font-family: DejaVu Sans, sans-serif; color: #2B1A24; text-align: center; }
        h1 { font-size: 26pt; margin: 0 0 1cm; }
        .qr { width: 12cm; height: 12cm; border: 3px solid #A83B24; padding: 0.5cm; }
        .consigne { font-size: 16pt; margin-top: 1cm; }
        .note { font-size: 11pt; margin-top: 1.5cm; color: #A83B24; }
    </style>
</head>
<body>
    <h1>{{ $titre }}</h1>

    <img class="qr" src="data:image/png;base64,{{ $png }}" alt="QR Code">

    <p class="consigne">{{ $consigne }}</p>

    @if ($note)
        <p class="note">{{ $note }}</p>
    @endif
</body>
</html>

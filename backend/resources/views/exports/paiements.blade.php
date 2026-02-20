<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>
    Etat des paiements
    @if(isset($echLibelle))
        — {{ $echLibelle }}
    @endif

    @if(isset($regieLibelle))
        — {{ $regieLibelle }}
    @endif
</title>

<style>

body {
    font-family: DejaVu Sans, sans-serif;
    font-size: 9px;
}

/* =============================
   HEADER PREMIERE PAGE
=============================*/
.first-page-header {
    width: 100%;
    margin-bottom: 10px;
    font-weight: bold;
    font-size: 10px;
    overflow: hidden;
}

.header-block {
    display: inline-block;
    width: 25%;
    vertical-align: top;
    text-align: center;
}

.header-left { float: left; }
.header-right { float: right; }

.separator {
    letter-spacing: 2px;
}

/* =============================
   TITRE
=============================*/
.title-box {
    border: 2px solid #000;
    padding: 6px 12px;
    text-align: center;
    font-size: 14px;
    font-weight: bold;
    margin: 8px auto 12px auto;
    border-radius: 6px;
    background: #f5f5f5;
    width: 60%;
}

/* =============================
   TABLE
=============================*/
table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
}

thead {
    display: table-header-group;
}

tr {
    page-break-inside: avoid;
}

th, td {
    border: 1px solid #444;
    padding: 4px;
}

th {
    background: #efefef;
}

/* Totaux */
.total-row {
    font-weight: bold;
    background: #f0f0f0;
}

/* =============================
   FOOTER
=============================*/
@page {
    footer: html_pageFooter;
}

.page-footer {
    width: 100%;
    font-size: 9px;
    font-weight: bold;
    overflow: hidden;
    border-top: 2px solid #000;
    padding-top: 4px;
}

.footer-block {
    display: inline-block;
    width: 30%;
    vertical-align: top;
}

.footer-block2 {
    display: inline-block;
    width: 35%;
    vertical-align: top;
}

.footer-left { float: left; text-align:left; }
.footer-center { text-align:center; }
.footer-right { float: right; text-align:right; }

</style>
</head>

<body>

<!-- =============================
 HEADER - PAGE 1
=============================-->
<div class="first-page-header" style="display:flex; justify-content: space-between;">

    <div class="header-block header-left">
        MINISTERE DES FINANCES ET DU BUDGET<br>
        <span class="separator">_-_-_-_-_-_-_-_</span><br>
        DIRECTION DE CABINET
    </div>

    <div class="header-block header-right">
        REPUBLIQUE CENTRAFRICAINE<br>
        <span class="separator">_-_-_-_-_-_-_-_</span><br>
        Unité – Dignité – Travail
    </div>

</div>

<!-- =============================
 LOGO CENTRÉ
=============================-->
<div style="text-align:center; margin-bottom:15px;">
    <img src="{{ public_path('images/armoirie.png') }}" alt="Armoirie" style="height:90px;">
</div>

<!-- =============================
 TITRE
=============================-->
<div class="title-box">

    ETAT DES PAIEMENTS DES QUOTES-PARTS

    <br>

    <span style="font-size:11px;">
        {{ $echLibelle ?? '—' }}

        @if($regieLibelle)
            &nbsp; | &nbsp; {{ $regieLibelle }}
        @endif
    </span>

</div>

<!-- =============================
 CONTENU PAR FONCTION
=============================-->

@foreach($paiementsParFonction as $fonction => $bloc)

<h3 style="margin:10px 0 4px 0; font-weight:bold;">
    Fonction : {{ $fonction }}
</h3>

<table>

<thead>
<tr>
    <th>CODE</th>
    <th>BENEFICIAIRE</th>
    <th>TYPE</th>
    <th>BANQUE</th>
    <th>GUICHET</th>
    <th>N° COMPTE</th>
    <th>CLE RIB</th>
    <th>MONTANT BRUT</th>
    <th>MONTANT NET</th>
</tr>
</thead>

<tbody>

@foreach($bloc['rows'] as $p)
<tr>
    <td style="text-align:center">{{ $p->BEN_CODE }}</td>
    <td style="width:200px;">{{ $p->BENEFICIAIRE }}</td>
    <td style="text-align:center">{{ $p->TYPE_BENEFICIAIRE }}</td>
    <td>{{ $p->BNQ_LIBELLE }}</td>
    <td>{{ $p->GUI_CODE }}</td>
    <td>{{ $p->NUMCPT }}</td>
    <td style="text-align:center; width:80px;">
        {{ $p->CLE_RIB }}
    </td>
    <td style="text-align:right">{{ number_format($p->BRUT,0,',',' ') }}</td>
    <td style="text-align:right">{{ number_format($p->NET,0,',',' ') }}</td>
</tr>
@endforeach

<tr class="total-row">
    <td style="font-weight:bold" colspan="7">
        TOTAL ({{ count($bloc['rows']) }}) {{ $fonction }}
    </td>
    <td style="text-align:right; font-weight:bold">{{ number_format($bloc['total_brut'],0,',',' ') }}</td>
    <td style="text-align:right; font-weight:bold">{{ number_format($bloc['total_net'],0,',',' ') }}</td>
</tr>

</tbody>
</table>

@endforeach

<!-- =============================
 TOTAL GENERAL
=============================-->

<table>
    <tr class="total-row">
        <td style="font-weight:bold; border: 1px solid #444; padding: 4px;">EFFECTIF TOTAL DES BENEFICIAIRES</td>
        <td style="font-weight:bold; text-align:right; border: 1px solid #444; padding: 4px;">{{ $totauxGlobaux['effectif'] }}</td>
    </tr>
    <tr class="total-row">
        <td style="font-weight:bold; border: 1px solid #444; padding: 4px;">TOTAL MONTANT BRUT</td>
        <td style="font-weight:bold; text-align:right; border: 1px solid #444; padding: 4px;">{{ number_format($totauxGlobaux['brut'],0,',',' ') }}</td>
    </tr>
    <tr class="total-row">
        <td style="font-weight:bold; border: 1px solid #444; padding: 4px;">TOTAL MONTANT NET</td>
        <td style="font-weight:bold; text-align:right; border: 1px solid #444; padding: 4px;">{{ number_format($totauxGlobaux['net'],0,',',' ') }}</td>
    </tr>
</table>

<!--=========================
 QR CODE
========================= -->
<!-- QR Code -->
<!-- QR Code après le total général -->
<div style="margin-top:15px; text-align:left;">
    <barcode code="
        ETAT DES PAIEMENTS DES QUOTES-PARTS
        Échéance : {{ $echLibelle ?? '-' }}
        Régie : {{ $regieLibelle ?? 'TOUTES' }}
        Total général ({{ $totauxGlobaux['effectif'] }} bénéficiaire(s))
        Montant Brut : {{ number_format($totauxGlobaux['brut'],0,',',' ') }}
        Montant Net : {{ number_format($totauxGlobaux['net'],0,',',' ') }}
    " type="QR" size="1.5" error="M" />
</div>

<!-- =============================
 FOOTER
=============================-->
<htmlpagefooter name="pageFooter">
<div class="page-footer">

    <div class="footer-block footer-left">
        © Office National d'Informatique
    </div>

    <div class="footer-block2 footer-center">
        ETAT DES PAIEMENTS DES QUOTES-PARTS

        @if(isset($echLibelle))
            — {{ $echLibelle }}
        @endif
    </div>

    <div class="footer-block footer-right">
        Imprimé le {DATE d/m/Y} | Page {PAGENO}/{nb}
    </div>

</div>
</htmlpagefooter>

</body>
</html>

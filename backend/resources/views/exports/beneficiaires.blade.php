<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Liste des bénéficiaires</title>

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
    width: 40%;
}

/* =============================
   TABLE
=============================*/
table {
    width: 100%;
    border-collapse: collapse;
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

.page-footer {
    width: 100%;
    font-size: 9px;
    font-weight: bold;
    overflow: hidden;
}

.footer-block {
    display: inline-block;
    width: 32%;
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
    LISTE DES BENEFICIAIRES DES QUOTES-PARTS
</div>

<!-- =============================
 TABLEAU
=============================-->
<table>

<thead>
<tr>
    <th>CODE</th>
    <th>MAT.</th>
    <th>BENEFICIAIRE</th>
    <th>SEXE</th>
    <th>TYPE</th>
    <th>FONCTION</th>
    <th>GRADE</th>
    <th>BANQUE</th>
    <th>GUICHET</th>
    <th>N° COMPTE - CLE RIB</th>
</tr>
</thead>

<tbody>
@foreach($beneficiaires as $b)
<tr>
    <td>{{ $b->CODE }}</td>
    <td class="center">{{ $b->MATRICULE }}</td>
    <td>{{ $b->BENEFICIAIRE }}</td>
    <td class="center">{{ $b->SEXE }}</td>
    <td>{{ $b->TYPE_BENEFICIAIRE }}</td>
    <td>{{ $b->FONCTION }}</td>
    <td>{{ $b->GRADE }}</td>
    <td>{{ $b->BANQUE }}</td>
    <td class="center">{{ $b->GUICHET }}</td>
    <td>{{ $b->NUMERO_DE_COMPTE }}</td>
</tr>
@endforeach
</tbody>

</table>

<!-- =============================
 FOOTER TOUTES PAGES
=============================-->
<htmlpagefooter name="pageFooter">
<div class="page-footer">

    <div class="footer-block footer-left">
        © Office National d'Informatique
    </div>
    
    <div class="footer-block footer-center">
        LISTE DES BENEFICIAIRES DES QUOTES-PARTS
    </div>


    <div class="footer-block footer-right">
        Imprimer le {DATE d/m/Y} | Page {PAGENO}/{nb}
    </div>

</div>
</htmlpagefooter>

</body>
</html>
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Domicilier;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;
use Dompdf\Dompdf;
use App\Models\Mouvement;
use App\Models\HistoriquesValidation;
use App\Models\Echeance;
use App\Models\Beneficiaire;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DomicilierController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'BEN_CODE' => 'required|string|exists:t_beneficiaires,BEN_CODE',
            'BNQ_CODE' => 'required|string|exists:t_banques,BNQ_CODE',
            'GUI_ID' => 'required|string|exists:t_guichets,GUI_ID',
            'DOM_NUMCPT' => 'nullable|string|max:30',
            'DOM_STATUT' => 'nullable|boolean',
            'DOM_FICHIER'=> 'required|file|mimes:pdf,jpg,jpeg,png|max:2048'
        ],[
            'DOM_FICHIER.required' => 'Veuillez joindre le fichier du RIB.',
        ]);

        $exists = false;

        if (!empty($request->DOM_NUMCPT)) {
            $exists = Domicilier::where('BNQ_CODE', $request->BNQ_CODE)
                ->where('GUI_ID', $request->GUI_ID)
                ->where('DOM_NUMCPT', $request->DOM_NUMCPT)
                ->exists();
        }

        if ($exists) {
            return response()->json([
                'message' => 'Ce RIB existe déjà.'
            ], 409);
        }

        // Récupération des infos banque + guichet
        $banque = DB::table('t_banques')->where('BNQ_CODE', $request->BNQ_CODE)->first();
        $guichet = DB::table('t_guichets')->where('GUI_ID', $request->GUI_ID)->first();

        if (!$banque || !$guichet) {
            return response()->json(['message' => 'Banque ou guichet introuvable.'], 404);
        }

        // Codes sur 5 chiffres
        $codeBanque  = str_pad($banque->BNQ_CODE ?? '00000', 5, '0', STR_PAD_LEFT);
        $codeGuichet = str_pad($guichet->GUI_CODE ?? '00000', 5, '0', STR_PAD_LEFT);

        // Numéro de compte original
        $numCompte = strtoupper(trim($request->DOM_NUMCPT));
        $containsLetters = preg_match('/[A-Z]/', $numCompte);
        $onlyDigits = preg_replace('/\D/', '', $numCompte);

        // Calcul clé RIB (si applicable)
        $ribKey = null;
        if (!$containsLetters && strlen($onlyDigits) >= 11) {
            $ribBase = $codeBanque . $codeGuichet . $onlyDigits . "00";

            if (!function_exists('bcmod')) {
                function bcmod($x, $y)
                {
                    $take = 5;
                    $mod = '';
                    do {
                        $a = (int)$mod . substr($x, 0, $take);
                        $x = substr($x, $take);
                        $mod = $a % $y;
                    } while (strlen($x));
                    return (int)$mod;
                }
            }

            $reste = bcmod($ribBase, '97');
            $cleRib = 97 - intval($reste);
            $ribKey = str_pad($cleRib, 2, '0', STR_PAD_LEFT);
        }

        $fichierPath = null;

        if ($request->hasFile('DOM_FICHIER')) {
            $fichier = $request->file('DOM_FICHIER');

            // Stockage direct du fichier quel que soit son type (PDF, JPG, PNG)
            $originalName = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $fichier->getClientOriginalName());
            $filename = time() . '_' . $originalName;
            $fichierPath = $fichier->storeAs('domiciliations/rib', $filename, 'public');
        }

        DB::beginTransaction();
        try {          

            //  Créer le nouveau compte (toujours actif)
            $domiciliation = new Domicilier();
            $domiciliation->DOM_NUMCPT = $numCompte;
            $domiciliation->DOM_RIB = $ribKey;
            $domiciliation->DOM_STATUT = 0; 
            $domiciliation->DOM_DATE_CREER = now();
            $domiciliation->DOM_CREER_PAR = auth()->check()
                ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                : 'SYSTEM';
            $domiciliation->BEN_CODE = $request->BEN_CODE;
            $domiciliation->BNQ_CODE = $request->BNQ_CODE;
            $domiciliation->GUI_ID = $request->GUI_ID;
            $domiciliation->DOM_FICHIER = $fichierPath;
            $domiciliation->save();

            DB::commit();

            return response()->json([
                'message' => 'Nouveau RIB enregistré avec succès. Veuillez le soumettre à l\'approbation.',
                'DOM_CODE' => $domiciliation->DOM_CODE,
                'DOM_RIB' => $ribKey,
                'DOM_STATUT' => 'Active',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de l\'enregistrement.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function showByBeneficiaire($BEN_CODE)
    {
        $data = Domicilier::where('BEN_CODE', $BEN_CODE)
            ->join('t_banques', 't_banques.BNQ_CODE', '=', 't_domiciliers.BNQ_CODE')
            ->join('t_guichets', 't_guichets.GUI_ID', '=', 't_domiciliers.GUI_ID')
            ->select(
                't_domiciliers.*',
                't_banques.BNQ_CODE',
                't_banques.BNQ_LIBELLE',
                't_guichets.GUI_CODE',
                't_guichets.GUI_NOM'
            )
            ->orderByDesc('t_domiciliers.DOM_STATUT')
            ->get();

        return response()->json($data);
    }

    /**
     *  Modifier une domiciliation existante
     */
    public function update(Request $request, $DOM_CODE)
    {
        $domiciliation = Domicilier::find($DOM_CODE);

        $request->validate([
            'BNQ_CODE' => 'required|string|exists:t_banques,BNQ_CODE',
            'GUI_ID'   => 'required|string|exists:t_guichets,GUI_ID',
            'DOM_NUMCPT' => 'nullable|string|max:30',
            'DOM_FICHIER'=> 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

         //  Vérification doublon seulement si DOM_NUMCPT renseigné
        $exists = false;
        if (!empty($request->DOM_NUMCPT)) {
            $exists = Domicilier::where('BNQ_CODE', $request->BNQ_CODE)
                ->where('GUI_ID', $request->GUI_ID)
                ->where('DOM_NUMCPT', $request->DOM_NUMCPT)
                ->where('DOM_CODE', '!=', $DOM_CODE) // on ignore l’enregistrement courant
                ->exists();
        }

        if ($exists) {
            return response()->json([
                'message' => 'Ce RIB existe déjà.'
            ], 409);
        }

        // --- Contrôle : RIB déjà approuvé ---
        if ($domiciliation->DOM_STATUT == 2) {
            return response()->json(['message' => 'Impossible de modifier un RIB déjà approuvé'], 400);
        }

        $dom = Domicilier::where('DOM_CODE', $DOM_CODE)->first();
        if (!$dom) {
            return response()->json(['message' => 'RIB introuvable'], 404);
        }

        //  Récupération de la banque et du guichet
        $banque = DB::table('t_banques')->where('BNQ_CODE', $request->BNQ_CODE)->first();
        $guichet = DB::table('t_guichets')->where('GUI_ID', $request->GUI_ID)->first();

        if (!$banque || !$guichet) {
            return response()->json(['message' => 'Banque ou guichet introuvable.'], 404);
        }

        //  Codes sur 5 chiffres
        $codeBanque  = str_pad($banque->BNQ_CODE ?? '00000', 5, '0', STR_PAD_LEFT);
        $codeGuichet = str_pad($guichet->GUI_CODE ?? '00000', 5, '0', STR_PAD_LEFT);

        //  Numéro de compte saisi (on garde les caractères spéciaux pour l’affichage)
        $numCompte = null;

        if ($request->filled('DOM_NUMCPT')) {
            $numCompte = strtoupper(trim($request->DOM_NUMCPT));
        }

        // Vérifie s'il contient des lettres
        $containsLetters = preg_match('/[A-Z]/', $numCompte);

        // Extrait uniquement les chiffres pour le calcul (mais on garde le format original pour l’enregistrement)
        $onlyDigits = preg_replace('/\D/', '', $numCompte);

        $ribKey = null;

        // Calcul RIB si :
        // - pas de lettres
        // - le numéro contient au moins 11 chiffres (pas obligé que ce soit exactement 11)
        $ribKey = $dom->DOM_RIB; // conserver l’ancien par défaut

        if ($request->filled('DOM_NUMCPT')) {
            $containsLetters = preg_match('/[A-Z]/', $numCompte);
            $onlyDigits = preg_replace('/\D/', '', $numCompte);

            if (!$containsLetters && strlen($onlyDigits) >= 11) {
                $ribBase = $codeBanque . $codeGuichet . $onlyDigits . "00";
                $reste = bcmod($ribBase, '97');
                $cleRib = 97 - intval($reste);
                $ribKey = str_pad($cleRib, 2, '0', STR_PAD_LEFT);
            } else {
                $ribKey = null;
            }
        }

        // Gestion du fichier DOM_FICHIER sans conversion
        $fichierPath = $dom->DOM_FICHIER;

        if ($request->hasFile('DOM_FICHIER')) {
            $fichier = $request->file('DOM_FICHIER');
            $originalName = preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $fichier->getClientOriginalName());
            $filename = time().'_'.$originalName;
            $fichierPath = $fichier->storeAs('domiciliations/rib', $filename, 'public');
        }

        $derniereVersion = ($domiciliation->DOM_VERSION ?? 0) + 1;

        //  Mise à jour
        $dom->update([
            'BNQ_CODE'   => $request->BNQ_CODE,
            'GUI_ID'     => $request->GUI_ID,
            'DOM_NUMCPT' => $request->DOM_NUMCPT,
            'DOM_DATE_MODIFIER' => now(),
            'DOM_MODIFIER_PAR' => auth()->check() ? auth()->user()->UTI_NOM." ".auth()->user()->UTI_PRENOM : 'SYSTEM',
            'DOM_VERSION' => $derniereVersion,
            'DOM_RIB'    => $ribKey,
            'DOM_FICHIER'=> $fichierPath,
        ]);

        return response()->json([
            'message' => 'RIB mis à jour avec succès',
            'DOM_CODE' => $dom->DOM_CODE,
            'DOM_RIB' => $ribKey,
            'DOM_FICHIER' => $dom->DOM_FICHIER,
            'DOM_STATUT' => $dom->DOM_STATUT
        ]);
    }

    /**
     *  Supprimer une domiciliation
     */
    public function destroy($DOM_CODE)
    {
        $dom = Domicilier::where('DOM_CODE', $DOM_CODE)->first();
        if (!$dom) {
            return response()->json(['message' => 'RIB introuvable'], 404);
        }

        // --- Contrôle : RIB déjà approuvé ---
        if ($dom->DOM_STATUT == 2) {
            return response()->json(['message' => 'Impossible de supprimer un RIB déjà approuvé'], 400);
        }

        try {
            $dom->delete();
            return response()->json(['message' => 'RIB supprimé avec succès']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Impossible de supprimer ce RIB : ' . $e->getMessage()], 409);
        }
    }

    public function telechargerRib($DOM_CODE)
    {
        $domiciliation = Domicilier::find($DOM_CODE);

        if (!$domiciliation || !$domiciliation->DOM_FICHIER) {
            return response()->json([
                'message' => 'Fichier RIB introuvable.'
            ], 404);
        }

        $path = $domiciliation->DOM_FICHIER;

        // Vérifie l'existence du fichier
        if (!Storage::disk('public')->exists($path)) {
            return response()->json([
                'message' => 'Le fichier n’existe plus sur le serveur.'
            ], 404);
        }

        // Nom réel du fichier pour l'utilisateur
        $filename = basename($path);

        return Storage::disk('public')->download($path, $filename);
    }

    private function generateMvtCode($regCode)
    {
        $echeance = DB::table('t_echeances')
            ->where('ECH_STATUT', 1)
            ->first();

        if (!$echeance) {
            throw new \Exception('Aucune échéance active.');
        }

        $echCode = $echeance->ECH_CODE;

        $lastNumber = DB::table('t_mouvements')
            ->where('MVT_CODE', 'like', $echCode . $regCode . '%')
            ->select(DB::raw("MAX(RIGHT(MVT_CODE,5)) as max_num"))
            ->value('max_num');

        $nextNumber = str_pad(((int)$lastNumber + 1), 5, '0', STR_PAD_LEFT);

        return $echCode . $regCode . $nextNumber;
    }


    public function validerDomicilier(Request $request, $id = null)
    {
        $user = Auth::user();
        $now = Carbon::now();

        // Récupération du niveau de validation
        $nivValeur = DB::table('t_niveau_validations')
            ->join('t_groupes', 't_groupes.NIV_CODE', '=', 't_niveau_validations.NIV_CODE')
            ->where('t_groupes.GRP_CODE', $user->GRP_CODE)
            ->value('NIV_VALEUR');

        if ($id) {
            // ===== VALIDATION UNIQUE =====
            $domiciliation = Domicilier::with(['banque', 'guichet'])
                ->where('DOM_CODE', $id)
                ->first();

            if (!$domiciliation) {
                return response()->json(['message' => 'RIB introuvable.'], 404);
            }

            $beneficiaire = Beneficiaire::where('BEN_CODE', $domiciliation->BEN_CODE)->first();

            // Vérifier si un autre compte du même bénéficiaire est déjà en cours
            $autreEnCours = Domicilier::where('BEN_CODE', $domiciliation->BEN_CODE)
                ->where('DOM_STATUT', 1)
                ->where('DOM_CODE', '!=', $domiciliation->DOM_CODE)
                ->exists();

            if ($autreEnCours) {
                return response()->json([
                    'message' => 'Un autre RIB de ce bénéficiaire est déjà en cours d’approbation.'
                ], 400);
            }

            if ($domiciliation->DOM_STATUT == 1) {
                return response()->json(['message' => 'Ce RIB de ce bénéficiaire est déjà en cours d\'approbation.'], 400);
            }

            if ($domiciliation->DOM_STATUT == 2) {
                return response()->json(['message' => 'Ce RIB de ce bénéficiaire a déjà été approuvé.'], 400);
            }

            DB::transaction(function () use ($domiciliation, $beneficiaire, $user, $nivValeur, $now) {

                $domiciliation->DOM_STATUT = 1;
                $domiciliation->save();

                $mvtCode = $this->generateMvtCode($user->REG_CODE);

                Mouvement::create([
                    'MVT_CODE'          => $mvtCode,
                    'MVT_DOM_CODE'      => $domiciliation->DOM_CODE,
                    'MVT_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'MVT_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'MVT_BNQ_CODE'      => $domiciliation->BNQ_CODE,
                    'MVT_BNQ_LIBELLE'   => $domiciliation->banque?->BNQ_LIBELLE,
                    'MVT_GUI_CODE'      => $domiciliation->guichet?->GUI_CODE,
                    'MVT_GUI_NOM'       => $domiciliation->guichet?->GUI_NOM,
                    'MVT_NUMCPT'        => $domiciliation->DOM_NUMCPT,
                    'MVT_CLE_RIB'       => $domiciliation->DOM_RIB,
                    'MVT_DATE'          => $now->toDateString(),
                    'MVT_HEURE'         => $now->toTimeString(),
                    'MVT_NIV'           => $nivValeur,
                    'MVT_UTI_CODE'      => $user->UTI_CODE,
                    'MVT_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'TYP_CODE'          => '20250003', 
                ]);

                HistoriquesValidation::create([
                    'VAL_CODE'          => $mvtCode,
                    'VAL_DOM_CODE'      => $domiciliation->DOM_CODE,
                    'VAL_BEN_CODE'      => $beneficiaire->BEN_CODE,
                    'VAL_BEN_NOM_PRE'   => $beneficiaire->BEN_NOM. " " .$beneficiaire->BEN_PRENOM,
                    'VAL_BNQ_CODE'      => $domiciliation->BNQ_CODE,
                    'VAL_BNQ_LIBELLE'   => $domiciliation->banque?->BNQ_LIBELLE,
                    'VAL_GUI_CODE'      => $domiciliation->guichet?->GUI_CODE,
                    'VAL_GUI_NOM'       => $domiciliation->guichet?->GUI_NOM,
                    'VAL_NUMCPT'        => $domiciliation->DOM_NUMCPT,
                    'VAL_CLE_RIB'       => $domiciliation->DOM_RIB,
                    'VAL_DATE'          => $now->toDateString(),
                    'VAL_HEURE'         => $now->toTimeString(),
                    'VAL_NIV'           => $nivValeur,
                    'VAL_UTI_CODE'      => $user->UTI_CODE,
                    'VAL_CREER_PAR'     => $user->UTI_NOM." ".$user->UTI_PRENOM,
                    'MVT_CODE'          => $mvtCode,
                ]);
            });

            return response()->json(['message' => "Transmission à l'approbation réussie."]);
        }
    }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\Domicilier;

class DomicilierController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'BEN_CODE' => 'required|string|exists:t_beneficiaires,BEN_CODE',
            'BNQ_CODE' => 'required|string|exists:t_banques,BNQ_CODE',
            'GUI_ID' => 'required|string|exists:t_guichets,GUI_ID',
            'DOM_NUMCPT' => 'nullable|string|max:30',
            'DOM_STATUT' => 'nullable|boolean'
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
                'message' => 'Ces informations bancaires existent déjà.'
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

        DB::beginTransaction();
        try {
            //  Désactiver les anciens comptes actifs du même bénéficiaire
            Domicilier::where('BEN_CODE', $request->BEN_CODE)
                ->where('DOM_STATUT', true)
                ->update(['DOM_STATUT' => false]);

            //  Créer le nouveau compte (toujours actif)
            $domiciliation = new Domicilier();
            $domiciliation->DOM_NUMCPT = $numCompte;
            $domiciliation->DOM_RIB = $ribKey;
            $domiciliation->DOM_STATUT = true; // toujours activé pour le nouveau
            $domiciliation->DOM_DATE_CREER = now();
            $domiciliation->DOM_CREER_PAR = auth()->check()
                ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                : 'SYSTEM';
            $domiciliation->BEN_CODE = $request->BEN_CODE;
            $domiciliation->BNQ_CODE = $request->BNQ_CODE;
            $domiciliation->GUI_ID = $request->GUI_ID;
            $domiciliation->save();

            DB::commit();

            return response()->json([
                'message' => 'Nouvelle domiciliation enregistrée et activée avec succès.',
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
                'message' => 'Ces informations bancaires existent déjà.'
            ], 409);
        }

        $dom = Domicilier::where('DOM_CODE', $DOM_CODE)->first();
        if (!$dom) {
            return response()->json(['message' => 'Domiciliation introuvable'], 404);
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
        $numCompte = strtoupper(trim($request->DOM_NUMCPT));

        // Vérifie s'il contient des lettres
        $containsLetters = preg_match('/[A-Z]/', $numCompte);

        // Extrait uniquement les chiffres pour le calcul (mais on garde le format original pour l’enregistrement)
        $onlyDigits = preg_replace('/\D/', '', $numCompte);

        $ribKey = null;

        // Calcul RIB si :
        // - pas de lettres
        // - le numéro contient au moins 11 chiffres (pas obligé que ce soit exactement 11)
        if (!$containsLetters && strlen($onlyDigits) >= 11) {

            // Construction de la base pour le calcul
            $ribBase = $codeBanque . $codeGuichet . $onlyDigits . "00";

            // Fonction bcmod manuelle si non disponible
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

            // Calcul de la clé RIB
            $reste = bcmod($ribBase, '97');
            $cleRib = 97 - intval($reste);
            $ribKey = str_pad($cleRib, 2, '0', STR_PAD_LEFT);
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
        ]);

        return response()->json([
            'message' => 'Domiciliation mise à jour avec succès',
            'DOM_CODE' => $dom->DOM_CODE,
            'DOM_RIB' => $ribKey,
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
            return response()->json(['message' => 'Domiciliation introuvable'], 404);
        }

        try {
            $dom->delete();
            return response()->json(['message' => 'Domiciliation supprimée avec succès']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Impossible de supprimer cette domiciliation : ' . $e->getMessage()], 409);
        }
    }

    public function toggleStatus($id)
    {
        //  Récupérer la domiciliation
        $domiciliation = Domicilier::find($id);

        if (!$domiciliation) {
            return response()->json([
                'message' => 'Domiciliation introuvable.'
            ], 404);
        }

        DB::beginTransaction();
        try {
            if ($domiciliation->DOM_STATUT) {
                //  Si elle est active => on la désactive
                $domiciliation->DOM_STATUT = false;
            } else {
                //  Si elle est inactive => on l’active
                $domiciliation->DOM_STATUT = true;

                // Désactiver toutes les autres du même bénéficiaire
                Domicilier::where('BEN_CODE', $domiciliation->BEN_CODE)
                    ->where('DOM_CODE', '!=', $domiciliation->DOM_CODE)
                    ->update(['DOM_STATUT' => false]);
            }

            // Mettre à jour les informations de modification
            $domiciliation->DOM_DATE_MODIFIER = now();
            $domiciliation->DOM_MODIFIER_PAR = auth()->check()
                ? auth()->user()->UTI_NOM . ' ' . auth()->user()->UTI_PRENOM
                : 'SYSTEM';
            $domiciliation->DOM_VERSION = ($domiciliation->DOM_VERSION ?? 0) + 1;

            $domiciliation->save();
            DB::commit();

            return response()->json([
                'message' => $domiciliation->DOM_STATUT
                    ? 'Domiciliation activée avec succès.'
                    : 'Domiciliation désactivée avec succès.',
                'DOM_CODE' => $domiciliation->DOM_CODE,
                'DOM_STATUT' => $domiciliation->DOM_STATUT ? 'Active' : 'Inactive',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors du changement de statut.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}